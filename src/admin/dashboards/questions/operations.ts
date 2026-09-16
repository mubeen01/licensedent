import { type Exam, type ImportBatch, type Question, type QuestionVersion, type Subject } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import {
  type ApproveQuestion,
  type BulkQuestionAction,
  type CreateSubject,
  type DeleteQuestion,
  type DeleteSubject,
  type DraftAiSuggestion,
  type DraftAiSuggestionsForSubject,
  type GetExamsForAdmin,
  type GetImportBatches,
  type GetQuestionBankStats,
  type GetQuestionById,
  type GetQuestionImageUploadUrl,
  type GetQuestionsForReview,
  type GetQuestionVersions,
  type GetReviewerActivityStats,
  type GetSubjectsForExam,
  type GetSubjectsForReview,
  type ImportQuestionsFromText,
  type RejectQuestion,
  type SearchQuestions,
  type SetQuestionImage,
  type UnpublishQuestion,
  type UpdateReviewQuestion,
  type UpdateSubject,
} from 'wasp/server/operations';
import * as z from 'zod';
import { getQuestionImageUploadSignedURL, resolveOptionalImageUrl } from '../../../file-upload/s3Utils';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';
import { AI_SUGGESTION_SOURCE, suggestAnswerAndExplanation, suggestExplanationOnly, type SuggestedTags } from './aiSuggest';
import { isDuplicate, normalizeStem, parseQuestionsFromText, similarity } from './importParsing';
import { hasIncompleteOptions } from './optionValidation';

// Import-time dedup (importParsing.ts's DUPLICATE_SIMILARITY_THRESHOLD, 0.95)
// only catches near-exact re-imports. A slightly-reworded re-import of a
// subject that's already been imported before -- easy to do by accident once
// several source PDFs for the same subject overlap -- can land just under
// that bar and slip in as a brand-new 'pending' row, which looks exactly like
// an already-published question "coming back" into the review queue even
// though the original is untouched. This lower bar flags those for a human
// to glance at and reject, without being so loose it flags genuinely
// different questions on the same topic.
const POSSIBLE_DUPLICATE_THRESHOLD = 0.85;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

// Shared by the import-time auto-draft (capped, best-effort) and the two
// on-demand actions below. Never writes to correctKey/explanation -- only
// suggestedCorrectKey/suggestedExplanation, per the saved AI-assist policy:
// a human dentist must review and explicitly approve before anything goes
// live. Reuses the same style/prompt as the standalone Python batch tool
// (D:\Dental\tools\pdf_import\ai_suggest_answers.py) so drafts read
// consistently regardless of which path produced them.
async function draftSuggestionForQuestion(
  context: { entities: { Question: { update: (args: any) => Promise<unknown> } } },
  question: Question
): Promise<'suggested' | 'declined' | 'error'> {
  const options = question.options as unknown as { key: string; text: string }[];
  // Everything the model drafted -- including the tag suggestions
  // (difficulty/High-Yield/Case-Based) -- lands ONLY in the suggested*
  // columns. Nothing confirmed is written here: like correctKey/explanation,
  // tags become real only when a reviewer explicitly accepts them ("Use this
  // suggestion" / "Accept AI suggestions" / the Difficulty + checkbox fields
  // in the review card). Keeps the whole AI-assist path behind one rule:
  // AI drafts, a human makes it real.
  try {
    if (question.correctKey) {
      const suggestion = await suggestExplanationOnly(question.stem, options, question.correctKey);
      if (!suggestion) return 'declined';
      await context.entities.Question.update({
        where: { id: question.id },
        data: {
          suggestedExplanation: suggestion.explanation,
          suggestedDifficulty: suggestion.difficulty,
          suggestedIsHighYield: suggestion.isHighYield,
          suggestedIsCaseBased: suggestion.isCaseBased,
          suggestionSource: AI_SUGGESTION_SOURCE,
          suggestedAt: new Date(),
        },
      });
      return 'suggested';
    } else {
      const suggestion = await suggestAnswerAndExplanation(question.stem, options);
      if (!suggestion) return 'declined';
      await context.entities.Question.update({
        where: { id: question.id },
        data: {
          suggestedCorrectKey: suggestion.correctKey,
          suggestedExplanation: suggestion.explanation,
          suggestedDifficulty: suggestion.difficulty,
          suggestedIsHighYield: suggestion.isHighYield,
          suggestedIsCaseBased: suggestion.isCaseBased,
          suggestionSource: AI_SUGGESTION_SOURCE,
          suggestedAt: new Date(),
        },
      });
      return 'suggested';
    }
  } catch (e) {
    console.error(`draftSuggestionForQuestion failed for question ${question.id}:`, e);
    return 'error';
  }
}

type ImportBatchWithProgress = ImportBatch & {
  remainingCount: number;
};

export const getImportBatches: GetImportBatches<void, ImportBatchWithProgress[]> = async (_args, context) => {
  ensureAdmin(context.user);

  const batches = await context.entities.ImportBatch.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const remainingCounts = await prisma.question.groupBy({
    by: ['importBatchId'],
    where: { status: { in: ['pending', 'flagged'] } },
    _count: { _all: true },
  });
  const remainingByBatch = new Map(remainingCounts.map((r) => [r.importBatchId, r._count._all]));

  return batches.map((batch) => ({
    ...batch,
    remainingCount: remainingByBatch.get(batch.id) ?? 0,
  }));
};

type SubjectWithProgress = {
  id: string;
  name: string;
  isActive: boolean;
  remainingCount: number;
  publishedCount: number;
  totalCount: number;
  // Split by status, not one combined number -- a subject can easily have
  // untagged content sitting in "To review" while everything already
  // published is fully tagged (or vice versa), and a single blended count
  // reads as "your published content needs tagging" even when it doesn't.
  needsTaggingUnreviewedCount: number;
  needsTaggingPublishedCount: number;
  // Pending/flagged questions with no AI suggestion drafted yet -- same
  // candidate set "Draft AI suggestions for this subject" pulls from, so
  // this number is the direct "how many are left" answer for that button,
  // and should visibly count down to 0 as you click it.
  needsAiDraftCount: number;
};

export const getSubjectsForReview: GetSubjectsForReview<void, SubjectWithProgress[]> = async (_args, context) => {
  ensureAdmin(context.user);

  const subjects = await context.entities.Subject.findMany({ orderBy: { name: 'asc' } });

  const counts = await prisma.question.groupBy({
    by: ['subjectId', 'status'],
    _count: { _all: true },
  });
  const remainingByCounts = new Map<string, number>();
  const publishedByCounts = new Map<string, number>();
  const totalBySubject = new Map<string, number>();
  for (const c of counts) {
    totalBySubject.set(c.subjectId, (totalBySubject.get(c.subjectId) ?? 0) + c._count._all);
    if (c.status === 'pending' || c.status === 'flagged') {
      remainingByCounts.set(c.subjectId, (remainingByCounts.get(c.subjectId) ?? 0) + c._count._all);
    }
    if (c.status === 'published') {
      publishedByCounts.set(c.subjectId, (publishedByCounts.get(c.subjectId) ?? 0) + c._count._all);
    }
  }

  // Separate from the status groupBy above (and grouped by status too, for
  // the same reason the combined count above was misleading) -- content
  // published before difficulty/High-Yield/Case-Based existed, or imported
  // since without a reviewer setting them yet, is "needs tagging" whether
  // it's already live or still pending, but which one matters for which tab.
  const taggingCounts = await prisma.question.groupBy({
    by: ['subjectId', 'status'],
    where: { difficulty: null },
    _count: { _all: true },
  });
  const needsTaggingUnreviewedBySubject = new Map<string, number>();
  const needsTaggingPublishedBySubject = new Map<string, number>();
  for (const c of taggingCounts) {
    if (c.status === 'pending' || c.status === 'flagged') {
      needsTaggingUnreviewedBySubject.set(c.subjectId, (needsTaggingUnreviewedBySubject.get(c.subjectId) ?? 0) + c._count._all);
    }
    if (c.status === 'published') {
      needsTaggingPublishedBySubject.set(c.subjectId, (needsTaggingPublishedBySubject.get(c.subjectId) ?? 0) + c._count._all);
    }
  }

  const aiDraftCounts = await prisma.question.groupBy({
    by: ['subjectId'],
    where: { status: { in: ['pending', 'flagged'] }, suggestedExplanation: null },
    _count: { _all: true },
  });
  const needsAiDraftBySubject = new Map(aiDraftCounts.map((c) => [c.subjectId, c._count._all]));

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    isActive: s.isActive,
    remainingCount: remainingByCounts.get(s.id) ?? 0,
    publishedCount: publishedByCounts.get(s.id) ?? 0,
    totalCount: totalBySubject.get(s.id) ?? 0,
    needsTaggingUnreviewedCount: needsTaggingUnreviewedBySubject.get(s.id) ?? 0,
    needsTaggingPublishedCount: needsTaggingPublishedBySubject.get(s.id) ?? 0,
    needsAiDraftCount: needsAiDraftBySubject.get(s.id) ?? 0,
  }));
};

export type QuestionBankStats = {
  totalQuestions: number;
  totalPublished: number;
  totalPending: number;
  totalFlagged: number;
  totalRejected: number;
  totalNeedsTagging: number;
  publishedLast7Days: number;
  subjectCount: number;
};

// Powers the "how much content actually exists" answer in two places: a rich
// stat-card header on the Question Review page, and a Question Bank section
// on the admin analytics Dashboard -- one query, reused, so the two numbers
// can never drift apart.
export const getQuestionBankStats: GetQuestionBankStats<void, QuestionBankStats> = async (_args, context) => {
  ensureAdmin(context.user);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [statusCounts, totalNeedsTagging, publishedLast7Days, subjectCount] = await Promise.all([
    prisma.question.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.question.count({ where: { difficulty: null } }),
    prisma.question.count({ where: { status: 'published', verifiedAt: { gte: sevenDaysAgo } } }),
    context.entities.Subject.count(),
  ]);

  const byStatus = new Map(statusCounts.map((c) => [c.status, c._count._all]));
  const totalPublished = byStatus.get('published') ?? 0;
  const totalPending = byStatus.get('pending') ?? 0;
  const totalFlagged = byStatus.get('flagged') ?? 0;
  const totalRejected = byStatus.get('rejected') ?? 0;

  return {
    totalQuestions: totalPublished + totalPending + totalFlagged,
    totalPublished,
    totalPending,
    totalFlagged,
    totalRejected,
    totalNeedsTagging,
    publishedLast7Days,
    subjectCount,
  };
};

// How many questions the CURRENT admin personally approved or rejected --
// not a team-wide total -- today and over the trailing 7 days. Mirrors the
// student dashboard's streak/XP formula in spirit (a plain, documented count,
// never an opaque "AI-scored" number) but scoped per-reviewer so it reads as
// "your progress," which is what actually motivates working the queue down.
export type ReviewerActivityStats = {
  reviewedToday: number;
  approvedToday: number;
  rejectedToday: number;
  reviewedThisWeek: number;
};

export const getReviewerActivityStats: GetReviewerActivityStats<void, ReviewerActivityStats> = async (
  _args,
  context
) => {
  ensureAdmin(context.user);
  const userId = context.user!.id;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Trailing 7-day window, not calendar week -- avoids a "reset to 0" cliff
  // every Monday that would make a Sunday-night review session look wasted.
  const startOfWindow = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [approvedToday, rejectedToday, approvedThisWeek, rejectedThisWeek] = await Promise.all([
    context.entities.Question.count({ where: { verifiedById: userId, verifiedAt: { gte: startOfToday } } }),
    context.entities.Question.count({ where: { rejectedById: userId, rejectedAt: { gte: startOfToday } } }),
    context.entities.Question.count({ where: { verifiedById: userId, verifiedAt: { gte: startOfWindow } } }),
    context.entities.Question.count({ where: { rejectedById: userId, rejectedAt: { gte: startOfWindow } } }),
  ]);

  return {
    reviewedToday: approvedToday + rejectedToday,
    approvedToday,
    rejectedToday,
    reviewedThisWeek: approvedThisWeek + rejectedThisWeek,
  };
};

// QuestionVersion rows have existed since the Part 3 versioning work (see
// updateReviewQuestion's snapshot-before-overwrite below) but nothing in the
// UI ever surfaced them -- an edit to already-live content left a real trail
// in the database that no one could actually see. This is a plain read of
// that trail, newest first.
export type QuestionVersionWithEditor = QuestionVersion & {
  editedBy: { username: string | null; email: string | null } | null;
};

const getQuestionVersionsInputSchema = z.object({ questionId: z.string().nonempty() });
type GetQuestionVersionsInput = z.infer<typeof getQuestionVersionsInputSchema>;

export const getQuestionVersions: GetQuestionVersions<GetQuestionVersionsInput, QuestionVersionWithEditor[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { questionId } = ensureArgsSchemaOrThrowHttpError(getQuestionVersionsInputSchema, rawArgs);
  return context.entities.QuestionVersion.findMany({
    where: { questionId },
    orderBy: { createdAt: 'desc' },
    include: { editedBy: { select: { username: true, email: true } } },
  });
};

// Jump-to-question for search results and other cross-list navigation --
// getQuestionsForReview is scoped to one subject/batch + status tab + page,
// so a search hit from a different subject/tab/page can't just be found in
// whatever's already loaded. This fetches exactly one question by id instead.
export const getQuestionById: GetQuestionById<
  { id: string },
  (Question & { possibleDuplicateOfPublished?: boolean }) | null
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);
  const question = await context.entities.Question.findUnique({ where: { id } });
  if (!question) return null;
  return { ...question, imageUrl: await resolveOptionalImageUrl(question.imageUrl) };
};

// Full-text jump-to-question across the ENTIRE bank (every subject, every
// status) -- the subject/batch sidebar only ever browses one slice at a
// time, so finding a specific known question (e.g. a student complaint
// referencing exact wording) otherwise means guessing which subject it's
// filed under. Stem-only (not options/explanation) keeps results relevant --
// searching those too tends to surface unrelated questions that merely share
// a common clinical term in the explanation text.
export type QuestionSearchResult = {
  id: string;
  stem: string;
  status: string;
  subjectId: string;
  subjectName: string;
};

const searchQuestionsInputSchema = z.object({
  query: z.string().trim().min(2),
  limit: z.number().int().min(1).max(50).default(20),
});
type SearchQuestionsInput = z.infer<typeof searchQuestionsInputSchema>;

export const searchQuestions: SearchQuestions<SearchQuestionsInput, QuestionSearchResult[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { query, limit } = ensureArgsSchemaOrThrowHttpError(searchQuestionsInputSchema, rawArgs);
  const matches = await context.entities.Question.findMany({
    where: { stem: { contains: query, mode: 'insensitive' } },
    select: { id: true, stem: true, status: true, subjectId: true, subject: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return matches.map((m) => ({
    id: m.id,
    stem: m.stem,
    status: m.status,
    subjectId: m.subjectId,
    subjectName: m.subject.name,
  }));
};

const createSubjectInputSchema = z.object({ name: z.string().trim().nonempty() });
type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

// New subjects land under the base "general_dentist" exam -- the same
// content-owning exam every real subject already belongs to (exam-specific
// scoping happens via the Question.exams M2M, not Subject.examId, so there's
// no reason to ask which of the 9 branded exams a subject belongs to here).
export const createSubject: CreateSubject<CreateSubjectInput, Subject> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { name } = ensureArgsSchemaOrThrowHttpError(createSubjectInputSchema, rawArgs);

  const baseExam = await context.entities.Exam.findFirst({ where: { slug: 'general_dentist' } });
  if (!baseExam) {
    throw new HttpError(500, 'No default exam configured');
  }

  const existing = await context.entities.Subject.findFirst({ where: { name, examId: baseExam.id } });
  if (existing) {
    throw new HttpError(400, `A subject named "${name}" already exists.`);
  }

  const created = await context.entities.Subject.create({ data: { name, examId: baseExam.id } });
  await logAdminAction(context, { action: 'subject.create', entityType: 'Subject', entityId: created.id, details: { name } });
  return created;
};

// isActive is the archive/unarchive toggle -- an archived subject stays fully
// manageable here in the admin queue (rename, reassign/delete its questions)
// but is filtered out of every student-facing query (see getPracticeSubjects,
// getPracticeQuestions, startMockExamAttempt). Folded into this one action
// (matching the Exam.isActive pattern) rather than a separate archive action,
// since it's really just one more field on the same row update.
const updateSubjectInputSchema = z
  .object({
    id: z.string().nonempty(),
    name: z.string().trim().nonempty().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.isActive !== undefined, { message: 'Nothing to update' });
type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>;

export const updateSubject: UpdateSubject<UpdateSubjectInput, Subject> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id, name, isActive } = ensureArgsSchemaOrThrowHttpError(updateSubjectInputSchema, rawArgs);

  const before = await context.entities.Subject.findUniqueOrThrow({ where: { id } });
  const updated = await context.entities.Subject.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  if (name !== undefined && name !== before.name) {
    await logAdminAction(context, {
      action: 'subject.rename',
      entityType: 'Subject',
      entityId: id,
      details: { from: before.name, to: name },
    });
  }
  if (isActive !== undefined && isActive !== before.isActive) {
    await logAdminAction(context, {
      action: isActive ? 'subject.unarchive' : 'subject.archive',
      entityType: 'Subject',
      entityId: id,
      details: { name: updated.name },
    });
  }

  return updated;
};

// moveToSubjectId is optional: when the subject is empty, plain delete works
// as before. When it still has questions, the caller (the admin UI's
// move-then-delete modal) must say where those questions go -- reassignment
// and deletion happen in one transaction so a subject is never left with its
// questions moved but itself still standing (or vice versa).
const deleteSubjectInputSchema = z.object({
  id: z.string().nonempty(),
  moveToSubjectId: z.string().nonempty().optional(),
});
type DeleteSubjectInput = z.infer<typeof deleteSubjectInputSchema>;

export const deleteSubject: DeleteSubject<DeleteSubjectInput, { id: string }> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id, moveToSubjectId } = ensureArgsSchemaOrThrowHttpError(deleteSubjectInputSchema, rawArgs);

  const subject = await context.entities.Subject.findUniqueOrThrow({ where: { id } });
  const questionCount = await context.entities.Question.count({ where: { subjectId: id } });
  if (questionCount > 0 && !moveToSubjectId) {
    throw new HttpError(
      400,
      `This subject still has ${questionCount} question${questionCount === 1 ? '' : 's'} -- move or delete them first.`
    );
  }

  if (moveToSubjectId) {
    if (moveToSubjectId === id) {
      throw new HttpError(400, 'Cannot move questions to the subject being deleted.');
    }
    const target = await context.entities.Subject.findUnique({ where: { id: moveToSubjectId } });
    if (!target) {
      throw new HttpError(400, 'Target subject not found.');
    }
  }

  await prisma.$transaction([
    ...(questionCount > 0
      ? [context.entities.Question.updateMany({ where: { subjectId: id }, data: { subjectId: moveToSubjectId! } })]
      : []),
    context.entities.Subject.delete({ where: { id } }),
  ]);

  await logAdminAction(context, {
    action: 'subject.delete',
    entityType: 'Subject',
    entityId: id,
    details: { name: subject.name, movedQuestionCount: questionCount, movedToSubjectId: moveToSubjectId ?? null },
  });

  return { id };
};

const getQuestionsForReviewInputSchema = z
  .object({
    importBatchId: z.string().nonempty().optional(),
    subjectId: z.string().nonempty().optional(),
    // 'unreviewed' = the review queue (pending/flagged); 'published' = the
    // "Published" tab, so a mistake found after publishing can still be
    // corrected (or deleted) instead of being stuck live forever; 'rejected'
    // = questions turned away during review, kept (with a reason) instead
    // of being hard-deleted, so patterns in what's getting rejected can
    // actually be seen.
    status: z.enum(['unreviewed', 'published', 'rejected']).default('unreviewed'),
    // Narrows to questions with no difficulty set yet -- lets a reviewer
    // working through a backfill (tagging content that predates
    // difficulty/High-Yield/Case-Based) see only what's left, so each save
    // removes that question from view instead of leaving it to scroll past.
    needsTagging: z.boolean().optional().default(false),
    // Same candidate set "Draft AI suggestions for this subject" pulls from
    // -- lets a reviewer see exactly which questions the bulk button will
    // hit next (and watch them disappear from this filtered view as they
    // get drafted), instead of guessing based on what's on the current page.
    missingAiDraft: z.boolean().optional().default(false),
    // 'oldest' (default) preserves original import order. 'newest' surfaces
    // the most recently added content first -- useful right after a big
    // import. 'brokenFirst' pushes questions with no correct answer set yet
    // to the top of the page, ahead of ones only missing a tag -- the
    // reviewer's time goes to the questions that need the most work first
    // instead of whatever happened to be imported first.
    sortBy: z.enum(['oldest', 'newest', 'brokenFirst']).optional().default('oldest'),
    skip: z.number().int().min(0).default(0),
    take: z.number().int().min(1).max(100).default(20),
  })
  .refine((v) => !!v.importBatchId || !!v.subjectId, {
    message: 'Either importBatchId or subjectId is required',
  });
type GetQuestionsForReviewInput = z.infer<typeof getQuestionsForReviewInputSchema>;

type QuestionForReview = Question & { possibleDuplicateOfPublished: boolean; duplicateOfQuestionId: string | null };

export const getQuestionsForReview: GetQuestionsForReview<GetQuestionsForReviewInput, QuestionForReview[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getQuestionsForReviewInputSchema, rawArgs);

  const questions = await context.entities.Question.findMany({
    where: {
      ...(args.subjectId ? { subjectId: args.subjectId } : { importBatchId: args.importBatchId }),
      status:
        args.status === 'published'
          ? 'published'
          : args.status === 'rejected'
            ? 'rejected'
            : { in: ['pending', 'flagged'] },
      ...(args.needsTagging ? { difficulty: null } : {}),
      ...(args.missingAiDraft ? { suggestedExplanation: null } : {}),
    },
    orderBy:
      args.sortBy === 'newest'
        ? { createdAt: 'desc' }
        : args.sortBy === 'brokenFirst'
          ? [{ correctKey: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }]
          : { createdAt: 'asc' },
    skip: args.skip,
    take: args.take,
  });

  // Flag pending/flagged questions that read as a near-duplicate of something
  // already published in the same subject -- see POSSIBLE_DUPLICATE_THRESHOLD
  // above for why import-time dedup alone doesn't always catch these. Keeps
  // *which* published question matched (not just a yes/no) so the review
  // card can show it side-by-side instead of a warning with nothing to check
  // it against.
  let publishedCandidatesBySubject = new Map<string, { id: string; norm: string }[]>();
  if (args.status === 'unreviewed' && questions.length > 0) {
    const subjectIds = [...new Set(questions.map((q) => q.subjectId))];
    const published = await context.entities.Question.findMany({
      where: { subjectId: { in: subjectIds }, status: 'published' },
      select: { id: true, subjectId: true, stem: true },
    });
    publishedCandidatesBySubject = published.reduce((acc, p) => {
      const list = acc.get(p.subjectId) ?? [];
      list.push({ id: p.id, norm: normalizeStem(p.stem) });
      acc.set(p.subjectId, list);
      return acc;
    }, new Map<string, { id: string; norm: string }[]>());
  }

  // imageUrl stores an S3 key (private bucket), not a usable URL -- resolve to
  // a fresh signed URL for display, only for the rows that actually have one.
  return Promise.all(
    questions.map(async (q) => {
      const candidates = publishedCandidatesBySubject.get(q.subjectId) ?? [];
      const stemNorm = normalizeStem(q.stem);
      const match = candidates.find((c) => similarity(stemNorm, c.norm) >= POSSIBLE_DUPLICATE_THRESHOLD);
      return {
        ...q,
        imageUrl: await resolveOptionalImageUrl(q.imageUrl),
        possibleDuplicateOfPublished: !!match,
        duplicateOfQuestionId: match?.id ?? null,
      };
    })
  );
};

const optionSchema = z.object({ key: z.string(), text: z.string() });

const updateReviewQuestionInputSchema = z.object({
  id: z.string().nonempty(),
  stem: z.string().optional(),
  options: z.array(optionSchema).optional(),
  correctKey: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  // Lets a reviewer retag a question pulled in via a "mixed subject" import
  // (dumped into the exam's "Unsorted" bucket) to its real subject.
  subjectId: z.string().nonempty().optional(),
  // Content tags for Quiz Builder filtering (Phase 3) -- confirmed values,
  // distinct from suggestedDifficulty/suggestedIsHighYield/suggestedIsCaseBased.
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  isHighYield: z.boolean().optional(),
  isCaseBased: z.boolean().optional(),
});
type UpdateReviewQuestionInput = z.infer<typeof updateReviewQuestionInputSchema>;

export const updateReviewQuestion: UpdateReviewQuestion<UpdateReviewQuestionInput, Question> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { id, ...data } = ensureArgsSchemaOrThrowHttpError(updateReviewQuestionInputSchema, rawArgs);

  const existing = await context.entities.Question.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Question not found');
  }

  // A published question may not be SAVED into a state that would break
  // students mid-session: the same invariants Approve enforces must hold for
  // the POST-SAVE state (explicit nulls in `data` count as clearing the
  // field). The escape hatch for "I want to strip this question down for a
  // rewrite" is Unpublish -> edit -> Approve again, not a live null.
  // Checked BEFORE the version snapshot so a refused save leaves no snapshot.
  if (existing.status === 'published') {
    const nextOptions = (data.options !== undefined
      ? (data.options as unknown as { key: string; text: string }[])
      : (existing.options as unknown as { key: string; text: string }[]));
    const nextCorrectKey = data.correctKey !== undefined ? data.correctKey : existing.correctKey;
    const nextExplanation = data.explanation !== undefined ? data.explanation : existing.explanation;
    const nextDifficulty = data.difficulty !== undefined ? data.difficulty : existing.difficulty;
    if (!nextCorrectKey || !nextOptions.some((o) => o.key === nextCorrectKey)) {
      throw new HttpError(
        400,
        'A published question can\'t be saved without a valid correct answer. Unpublish it first if you need to rewrite it.'
      );
    }
    if (nextExplanation === null || nextExplanation.trim().length === 0) {
      throw new HttpError(400, 'A published question can\'t be saved without an explanation. Unpublish it first if you need to rewrite it.');
    }
    if (hasIncompleteOptions(nextOptions)) {
      throw new HttpError(
        400,
        'A published question can\'t be saved with a blank or placeholder option -- remove or fill it, or unpublish first.'
      );
    }
    if (nextDifficulty === null) {
      throw new HttpError(400, 'A published question can\'t be saved without a difficulty tag. Unpublish it first if you need to rewrite it.');
    }
  }

  // Editing content that's already live is a correction, not a first draft --
  // snapshot what was published before overwriting it, so nothing is silently lost.
  if (existing.status === 'published') {
    await prisma.questionVersion.create({
      data: {
        questionId: existing.id,
        stem: existing.stem,
        options: existing.options as unknown as object,
        correctKey: existing.correctKey,
        explanation: existing.explanation,
        editedById: context.user!.id,
      },
    });
  }

  return context.entities.Question.update({
    where: { id },
    data,
  });
};

const approveQuestionInputSchema = z.object({ id: z.string().nonempty() });
type ApproveQuestionInput = z.infer<typeof approveQuestionInputSchema>;

export const approveQuestion: ApproveQuestion<ApproveQuestionInput, Question> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(approveQuestionInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  // Approve publishes as "human-verified" -- so it only publishes content the
  // reviewer has set in the REAL fields. An AI suggestion is never promoted
  // implicitly: it lives in suggested* columns and only becomes publishable
  // after the reviewer explicitly clicks "Use this suggestion" (single) or
  // "Accept AI suggestions" (bulk), which copies it into these fields first.
  // Brand policy: "Human-Verified — Never AI-guessed" means the verifier's
  // explicit act, not an auto-fallthrough at approve time.
  const options = question.options as unknown as { key: string; text: string }[];
  if (!question.correctKey || !options.some((o) => o.key === question.correctKey)) {
    throw new HttpError(
      400,
      question.suggestedCorrectKey
        ? 'Set a correct answer before approving -- an AI suggestion is shown on this question; review it explicitly with "Use this suggestion" first (AI drafts are never auto-published)'
        : 'Cannot approve a question without a valid correct answer selected'
    );
  }
  if (!question.explanation || question.explanation.trim().length === 0) {
    throw new HttpError(
      400,
      question.suggestedExplanation
        ? 'Add an explanation before approving -- an AI suggestion is shown on this question; review it explicitly with "Use this suggestion" first (AI drafts are never auto-published)'
        : 'Cannot approve a question without an explanation'
    );
  }
  if (hasIncompleteOptions(options)) {
    throw new HttpError(400, 'Cannot approve a question with a blank or placeholder option -- fix or remove it first');
  }
  if (question.difficulty === null) {
    throw new HttpError(400, 'Cannot approve a question with no difficulty tag set');
  }

  const [updated] = await prisma.$transaction([
    context.entities.Question.update({
      where: { id },
      data: {
        status: 'published',
        verifiedById: context.user!.id,
        verifiedAt: new Date(),
      },
    }),
    ...(question.importBatchId
      ? [
          context.entities.ImportBatch.update({
            where: { id: question.importBatchId },
            data: { totalReviewed: { increment: 1 }, totalPublished: { increment: 1 } },
          }),
        ]
      : []),
  ]);

  return updated;
};

const unpublishQuestionInputSchema = z.object({ id: z.string().nonempty() });
type UnpublishQuestionInput = z.infer<typeof unpublishQuestionInputSchema>;

// The Published tab previously only offered Save or hard-Delete -- nothing
// for "this needs more work before staying live." Delete is destructive
// (wipes attempt history/notes/mock-exam records) and wrong for that case;
// this instead pulls it back into the "To review" queue as 'pending', same
// as any other unapproved question, so it goes through Approve again (with
// the same correct-answer/explanation/incomplete-option guards) before it
// can go live a second time. Doesn't touch content or QuestionVersion
// history -- purely a status change, reversible by just approving again.
// Also doubles as "restore" for a rejected question -- same destination
// status, just clearing the rejection fields instead of the verified ones.
export const unpublishQuestion: UnpublishQuestion<UnpublishQuestionInput, Question> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(unpublishQuestionInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }
  if (question.status !== 'published' && question.status !== 'rejected') {
    throw new HttpError(400, 'Only published or rejected questions can be sent back to review');
  }

  const updated = await context.entities.Question.update({
    where: { id },
    data: {
      status: 'pending',
      verifiedById: null,
      verifiedAt: null,
      rejectedById: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  });

  await logAdminAction(context, {
    action: 'question.unpublish',
    entityType: 'Question',
    entityId: id,
    details: { subjectId: question.subjectId },
  });

  return updated;
};

const rejectQuestionInputSchema = z.object({ id: z.string().nonempty() });
type RejectQuestionInput = z.infer<typeof rejectQuestionInputSchema>;

// Previously hard-deleted the row -- the moment a reviewer rejected a
// question (wrong answer key, too few options, etc.), the content was gone
// for good with no way to look back at what got rejected. Now it's a status
// change: the row stays and shows up in the "Rejected" tab instead of
// vanishing. Still leaves the review queue immediately, still one click (no
// reason prompt -- that turned out to just add friction).
export const rejectQuestion: RejectQuestion<RejectQuestionInput, { id: string }> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(rejectQuestionInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  await prisma.$transaction([
    context.entities.Question.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedById: context.user!.id,
        rejectedAt: new Date(),
      },
    }),
    ...(question.importBatchId
      ? [
          context.entities.ImportBatch.update({
            where: { id: question.importBatchId },
            data: { totalReviewed: { increment: 1 } },
          }),
        ]
      : []),
  ]);

  return { id };
};

const deleteQuestionInputSchema = z.object({ id: z.string().nonempty() });
type DeleteQuestionInput = z.infer<typeof deleteQuestionInputSchema>;

// For a question that's already live (published) and turns out to be wrong --
// distinct from rejectQuestion, which is for never-published pending/flagged
// rows with no student history. This one hard-deletes a real, possibly-used
// question, so every dependent row (edit history, a student's note, their
// attempt record, a mock-exam item snapshot) must go first in the same
// transaction or the FK constraints on Question would reject the delete.
export const deleteQuestion: DeleteQuestion<DeleteQuestionInput, { id: string }> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(deleteQuestionInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  // Every Question child relation must be cleared in the same transaction or
  // Postgres blocks the delete with P2003 (all FKs are Restrict-by-default).
  await prisma.$transaction([
    context.entities.QuestionVersion.deleteMany({ where: { questionId: id } }),
    context.entities.QuestionNote.deleteMany({ where: { questionId: id } }),
    context.entities.UserAttempt.deleteMany({ where: { questionId: id } }),
    context.entities.MockExamAttemptItem.deleteMany({ where: { questionId: id } }),
    context.entities.ReviewSchedule.deleteMany({ where: { questionId: id } }),
    context.entities.CustomQuizAttemptItem.deleteMany({ where: { questionId: id } }),
    context.entities.Question.delete({ where: { id } }),
    ...(question.status === 'published' && question.importBatchId
      ? [
          context.entities.ImportBatch.update({
            where: { id: question.importBatchId },
            data: { totalPublished: { decrement: 1 } },
          }),
        ]
      : []),
  ]);

  return { id };
};

const MAX_BULK_QUESTION_IDS = 200;

const bulkQuestionActionInputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS) }),
  z.object({
    action: z.literal('reject'),
    questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS),
  }),
  // Permanently deletes -- published questions (wipes attempt/notes/mock-exam
  // history too) or already-rejected ones (nothing else to wipe).
  z.object({ action: z.literal('delete'), questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS) }),
  // Sends published questions back to "To review", or restores rejected ones
  // back into it -- same destination status, just different fields cleared.
  z.object({ action: z.literal('unpublish'), questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS) }),
  z.object({
    action: z.literal('move'),
    questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS),
    targetSubjectId: z.string().nonempty(),
  }),
  // Selection is already bounded by what's on screen (page size 20), so no
  // extra sub-cap here beyond the shared MAX_BULK_QUESTION_IDS -- each is a
  // real, sequential OpenAI call though, so a 20-30 question selection can
  // take a while; the frontend shows a spinner state for that.
  z.object({ action: z.literal('draftAi'), questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS) }),
  // Copies each selected question's suggestedCorrectKey/suggestedExplanation/
  // suggestedDifficulty/suggestedIsHighYield/suggestedIsCaseBased into the
  // real, editable fields -- the exact same thing "Use this suggestion" +
  // Save does for one card, just applied to the whole selection at once so a
  // batch of AI-drafted questions can go straight to a bulk Approve after.
  // Still just fills in the fields; still requires a real Approve afterward,
  // which still enforces the same correct-answer/explanation/incomplete-
  // option guards -- this never publishes anything by itself.
  z.object({ action: z.literal('acceptAiSuggestions'), questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS) }),
  // Sets difficulty/High-Yield/Case-Based on every selected question in one
  // call, regardless of status -- the 1,160-question tagging backlog was
  // previously only fixable one question at a time. Unlike every other bulk
  // action there's no status gate: tagging is independent of review state,
  // so this works the same on unreviewed and already-published questions.
  // Only the fields actually provided are changed; omitting a field leaves
  // it untouched rather than clearing it.
  z.object({
    action: z.literal('tag'),
    questionIds: z.array(z.string().nonempty()).min(1).max(MAX_BULK_QUESTION_IDS),
    difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
    isHighYield: z.boolean().optional(),
    isCaseBased: z.boolean().optional(),
  }),
]).refine(
  // Zod's discriminatedUnion members must be plain ZodObjects -- .refine()
  // can't live inside the array (breaks the discriminant's type inference),
  // so this validates the 'tag' variant's "at least one field set" rule
  // from outside the union instead.
  (v) => v.action !== 'tag' || v.difficulty !== undefined || v.isHighYield !== undefined || v.isCaseBased !== undefined,
  { message: 'Nothing to tag -- set a difficulty or check High-Yield/Case-Based first' }
);
type BulkQuestionActionInput = z.infer<typeof bulkQuestionActionInputSchema>;

type BulkQuestionActionResult = {
  action: 'approve' | 'reject' | 'delete' | 'move' | 'draftAi' | 'acceptAiSuggestions' | 'unpublish' | 'tag';
  attempted: number;
  succeeded: number;
  skipped: { id: string; reason: string }[];
};

// Same skeleton for every branch: load the selected rows, sort into
// eligible/skipped (mirroring the single-question operations' own gates so
// bulk can never do something a single call wouldn't allow), batch the writes
// -- including per-ImportBatch counter updates, grouped since a selection can
// span multiple batches -- into one transaction, then one audit-log entry for
// the whole call (not one per question, see logAdminAction call sites above).
export const bulkQuestionAction: BulkQuestionAction<BulkQuestionActionInput, BulkQuestionActionResult> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(bulkQuestionActionInputSchema, rawArgs);

  const questions = await context.entities.Question.findMany({ where: { id: { in: args.questionIds } } });
  const found = new Map(questions.map((q) => [q.id, q]));
  const skipped: { id: string; reason: string }[] = [];
  for (const id of args.questionIds) {
    if (!found.has(id)) skipped.push({ id, reason: 'not found' });
  }

  function incrementByBatch(eligible: Question[], field: 'totalReviewed' | 'totalPublished', amount: 1 | -1) {
    const counts = new Map<string, number>();
    for (const q of eligible) {
      if (q.importBatchId) counts.set(q.importBatchId, (counts.get(q.importBatchId) ?? 0) + 1);
    }
    return [...counts.entries()].map(([batchId, count]) =>
      context.entities.ImportBatch.update({ where: { id: batchId }, data: { [field]: { increment: count * amount } } })
    );
  }

  function summaryDetails(eligible: Question[]) {
    const ids = eligible.map((q) => q.id);
    return {
      attempted: args.questionIds.length,
      succeeded: ids.length,
      questionIds: ids.slice(0, 50),
      questionIdsTruncated: ids.length > 50 ? ids.length - 50 : 0,
    };
  }

  if (args.action === 'approve') {
    // Same policy as single approveQuestion: only content already in the REAL
    // fields can be published by a bulk Approve. An unapplied AI suggestion no
    // longer qualifies -- the skip reason names the exact extra step ("Accept
    // AI suggestions" with the rows selected does it in one click, which is
    // the intended draft-then-approve workflow).
    const eligible = questions.filter((q) => {
      if (q.status !== 'pending' && q.status !== 'flagged') {
        skipped.push({ id: q.id, reason: 'already published' });
        return false;
      }
      const options = q.options as unknown as { key: string; text: string }[];
      if (!q.correctKey || !options.some((o) => o.key === q.correctKey)) {
        skipped.push({
          id: q.id,
          reason: q.suggestedCorrectKey
            ? 'AI answer unconfirmed -- run "Accept AI suggestions" on this selection first'
            : 'missing correct answer',
        });
        return false;
      }
      if (!q.explanation || q.explanation.trim().length === 0) {
        skipped.push({
          id: q.id,
          reason: q.suggestedExplanation
            ? 'AI explanation unconfirmed -- run "Accept AI suggestions" on this selection first'
            : 'missing explanation',
        });
        return false;
      }
      if (hasIncompleteOptions(options)) {
        skipped.push({ id: q.id, reason: 'incomplete option' });
        return false;
      }
      if (q.difficulty === null) {
        skipped.push({ id: q.id, reason: 'missing tags' });
        return false;
      }
      return true;
    });

    if (eligible.length > 0) {
      await prisma.$transaction([
        ...eligible.map((q) =>
          context.entities.Question.update({
            where: { id: q.id },
            data: {
              status: 'published',
              verifiedById: context.user!.id,
              verifiedAt: new Date(),
            },
          })
        ),
        ...incrementByBatch(eligible, 'totalReviewed', 1),
        ...incrementByBatch(eligible, 'totalPublished', 1),
      ]);
    }

    await logAdminAction(context, {
      action: 'question.bulkApprove',
      entityType: 'Question',
      entityId: '(bulk)',
      details: summaryDetails(eligible),
    });

    return { action: 'approve', attempted: args.questionIds.length, succeeded: eligible.length, skipped };
  }

  if (args.action === 'reject') {
    const eligible = questions.filter((q) => {
      if (q.status !== 'pending' && q.status !== 'flagged') {
        skipped.push({ id: q.id, reason: 'already published' });
        return false;
      }
      return true;
    });

    if (eligible.length > 0) {
      await prisma.$transaction([
        context.entities.Question.updateMany({
          where: { id: { in: eligible.map((q) => q.id) } },
          data: {
            status: 'rejected',
            rejectedById: context.user!.id,
            rejectedAt: new Date(),
          },
        }),
        ...incrementByBatch(eligible, 'totalReviewed', 1),
      ]);
    }

    await logAdminAction(context, {
      action: 'question.bulkReject',
      entityType: 'Question',
      entityId: '(bulk)',
      details: summaryDetails(eligible),
    });

    return { action: 'reject', attempted: args.questionIds.length, succeeded: eligible.length, skipped };
  }

  if (args.action === 'delete') {
    const eligible = questions.filter((q) => {
      if (q.status !== 'published' && q.status !== 'rejected') {
        skipped.push({ id: q.id, reason: 'not published or rejected' });
        return false;
      }
      return true;
    });

    if (eligible.length > 0) {
      const ids = eligible.map((q) => q.id);
      // Only rows that were actually published ever counted toward
      // totalPublished -- a rejected row never did, so it must be excluded
      // here or this would decrement the batch's published count for
      // content that was never live.
      const eligiblePublished = eligible.filter((q) => q.status === 'published');
      await prisma.$transaction([
        // Same all-child-relations rule as the single delete above (P2003
        // otherwise), including ReviewSchedule and CustomQuizAttemptItem,
        // which exist for any question ever answered in practice or a timed
        // custom quiz.
        context.entities.QuestionVersion.deleteMany({ where: { questionId: { in: ids } } }),
        context.entities.QuestionNote.deleteMany({ where: { questionId: { in: ids } } }),
        context.entities.UserAttempt.deleteMany({ where: { questionId: { in: ids } } }),
        context.entities.MockExamAttemptItem.deleteMany({ where: { questionId: { in: ids } } }),
        context.entities.ReviewSchedule.deleteMany({ where: { questionId: { in: ids } } }),
        context.entities.CustomQuizAttemptItem.deleteMany({ where: { questionId: { in: ids } } }),
        context.entities.Question.deleteMany({ where: { id: { in: ids } } }),
        ...incrementByBatch(eligiblePublished, 'totalPublished', -1),
      ]);
    }

    await logAdminAction(context, {
      action: 'question.bulkDelete',
      entityType: 'Question',
      entityId: '(bulk)',
      details: summaryDetails(eligible),
    });

    return { action: 'delete', attempted: args.questionIds.length, succeeded: eligible.length, skipped };
  }

  if (args.action === 'unpublish') {
    const eligible = questions.filter((q) => {
      if (q.status !== 'published' && q.status !== 'rejected') {
        skipped.push({ id: q.id, reason: 'not published or rejected' });
        return false;
      }
      return true;
    });

    if (eligible.length > 0) {
      await context.entities.Question.updateMany({
        where: { id: { in: eligible.map((q) => q.id) } },
        data: {
          status: 'pending',
          verifiedById: null,
          verifiedAt: null,
          rejectedById: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      });
    }

    await logAdminAction(context, {
      action: 'question.bulkUnpublish',
      entityType: 'Question',
      entityId: '(bulk)',
      details: summaryDetails(eligible),
    });

    return { action: 'unpublish', attempted: args.questionIds.length, succeeded: eligible.length, skipped };
  }

  if (args.action === 'draftAi') {
    const eligible = questions.filter((q) => {
      if (q.status !== 'pending' && q.status !== 'flagged') {
        skipped.push({ id: q.id, reason: 'already published' });
        return false;
      }
      return true;
    });

    let suggested = 0;
    for (const question of eligible) {
      const outcome = await draftSuggestionForQuestion(context, question);
      if (outcome === 'suggested') suggested += 1;
      else skipped.push({ id: question.id, reason: outcome === 'declined' ? 'AI declined' : 'AI request failed' });
    }

    await logAdminAction(context, {
      action: 'question.bulkDraftAi',
      entityType: 'Question',
      entityId: '(bulk)',
      details: { attempted: args.questionIds.length, succeeded: suggested },
    });

    return { action: 'draftAi', attempted: args.questionIds.length, succeeded: suggested, skipped };
  }

  if (args.action === 'acceptAiSuggestions') {
    const eligible = questions.filter((q) => {
      if (q.status !== 'pending' && q.status !== 'flagged') {
        skipped.push({ id: q.id, reason: 'already published' });
        return false;
      }
      if (!q.suggestedExplanation) {
        skipped.push({ id: q.id, reason: 'no AI suggestion yet' });
        return false;
      }
      return true;
    });

    if (eligible.length > 0) {
      await prisma.$transaction(
        eligible.map((q) =>
          context.entities.Question.update({
            where: { id: q.id },
            data: {
              correctKey: q.suggestedCorrectKey ?? q.correctKey,
              explanation: q.suggestedExplanation,
              difficulty: q.suggestedDifficulty ?? q.difficulty,
              isHighYield: q.suggestedIsHighYield ?? q.isHighYield,
              isCaseBased: q.suggestedIsCaseBased ?? q.isCaseBased,
            },
          })
        )
      );
    }

    await logAdminAction(context, {
      action: 'question.bulkAcceptAiSuggestions',
      entityType: 'Question',
      entityId: '(bulk)',
      details: summaryDetails(eligible),
    });

    return { action: 'acceptAiSuggestions', attempted: args.questionIds.length, succeeded: eligible.length, skipped };
  }

  if (args.action === 'tag') {
    if (questions.length > 0) {
      await context.entities.Question.updateMany({
        where: { id: { in: questions.map((q) => q.id) } },
        data: {
          ...(args.difficulty !== undefined ? { difficulty: args.difficulty } : {}),
          ...(args.isHighYield !== undefined ? { isHighYield: args.isHighYield } : {}),
          ...(args.isCaseBased !== undefined ? { isCaseBased: args.isCaseBased } : {}),
        },
      });
    }

    await logAdminAction(context, {
      action: 'question.bulkTag',
      entityType: 'Question',
      entityId: '(bulk)',
      details: {
        ...summaryDetails(questions),
        difficulty: args.difficulty,
        isHighYield: args.isHighYield,
        isCaseBased: args.isCaseBased,
      },
    });

    return { action: 'tag', attempted: args.questionIds.length, succeeded: questions.length, skipped };
  }

  // args.action === 'move'
  const target = await context.entities.Subject.findUnique({ where: { id: args.targetSubjectId } });
  if (!target) {
    throw new HttpError(400, 'Target subject not found.');
  }

  if (questions.length > 0) {
    await context.entities.Question.updateMany({
      where: { id: { in: questions.map((q) => q.id) } },
      data: { subjectId: args.targetSubjectId },
    });
  }

  await logAdminAction(context, {
    action: 'question.bulkMove',
    entityType: 'Question',
    entityId: '(bulk)',
    details: { ...summaryDetails(questions), targetSubjectId: args.targetSubjectId },
  });

  return { action: 'move', attempted: args.questionIds.length, succeeded: questions.length, skipped };
};

/* -------------------------------------------------------------------------- */
/*  ADMIN QUESTION IMPORT (PDF/TXT upload)                                     */
/*  Text extraction happens client-side (extractFileText.ts); this only ever   */
/*  receives already-extracted plain text. Parsing heuristics live in          */
/*  importParsing.ts, ported from the standalone Python pipeline in            */
/*  D:\Dental\tools\pdf_import so both behave the same way on the same text.   */
/* -------------------------------------------------------------------------- */

export const getExamsForAdmin: GetExamsForAdmin<void, Exam[]> = async (_args, context) => {
  ensureAdmin(context.user);
  return context.entities.Exam.findMany({ orderBy: { name: 'asc' } });
};

const getSubjectsForExamInputSchema = z.object({ examId: z.string().nonempty() });
type GetSubjectsForExamInput = z.infer<typeof getSubjectsForExamInputSchema>;

export const getSubjectsForExam: GetSubjectsForExam<GetSubjectsForExamInput, Subject[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getSubjectsForExamInputSchema, rawArgs);
  return context.entities.Subject.findMany({ where: { examId: args.examId }, orderBy: { name: 'asc' } });
};

const importQuestionsFromTextInputSchema = z
  .object({
    examId: z.string().nonempty(),
    subjectMode: z.enum(['single', 'mixed']),
    // Single mode: exactly one of these two identifies the target subject.
    subjectId: z.string().nonempty().optional(),
    newSubjectName: z.string().trim().nonempty().optional(),
    fileName: z.string().nonempty(),
    text: z.string().nonempty(),
    // Advanced options (all optional, all default to today's behavior so
    // existing callers/tests that don't pass them are unaffected).
    skipAiSuggestions: z.boolean().optional(),
    duplicateThreshold: z.number().min(0.5).max(1).optional(),
  })
  .refine((v) => v.subjectMode !== 'single' || !!v.subjectId || !!v.newSubjectName, {
    message: 'Pick an existing subject or provide a new subject name for a single-subject import',
  });
type ImportQuestionsFromTextInput = z.infer<typeof importQuestionsFromTextInputSchema>;

type ImportSummary = {
  batchId: string;
  totalDetected: number;
  inserted: number;
  pendingCount: number;
  flaggedCount: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  subjectName: string;
  subjectId: string;
  aiSuggested: number;
  aiDeclined: number;
  aiErrors: number;
  aiSkippedCap: number;
  aiSkipped: boolean;
};

// Safety cap: a big source file can produce a lot of flagged questions, and
// each one is a real, billed OpenAI call made synchronously inside this one
// request. Cap it rather than let one upload silently rack up an unbounded
// bill or time out the request; the rest stay flagged with their raw hints,
// reviewable/AI-suggestible individually later.
const MAX_AI_SUGGESTIONS_PER_IMPORT = 60;

export const importQuestionsFromText: ImportQuestionsFromText<ImportQuestionsFromTextInput, ImportSummary> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(importQuestionsFromTextInputSchema, rawArgs);

  const exam = await context.entities.Exam.findUnique({ where: { id: args.examId } });
  if (!exam) {
    throw new HttpError(404, 'Exam not found');
  }

  const { parsed, flagged } = parseQuestionsFromText(args.text, args.fileName);
  const allEntries = [
    ...parsed.map((entry) => ({ entry, status: 'pending' as const })),
    ...flagged.map((entry) => ({ entry, status: 'flagged' as const })),
  ];

  if (allEntries.length === 0) {
    throw new HttpError(400, 'No question blocks were detected in this file — check the extracted text.');
  }

  // Mixed-subject files land in a shared "Unsorted" bucket per exam; real
  // per-question subject tagging is a manual, human step done during review
  // (see subjectId on updateReviewQuestion), not automated here.
  let subjectId: string;
  if (args.subjectMode === 'single') {
    subjectId = args.subjectId ?? (await context.entities.Subject.create({
      data: { name: args.newSubjectName!, examId: args.examId },
    })).id;
  } else {
    const existingUnsorted = await context.entities.Subject.findFirst({
      where: { name: 'Unsorted', examId: args.examId },
    });
    subjectId = existingUnsorted
      ? existingUnsorted.id
      : (await context.entities.Subject.create({ data: { name: 'Unsorted', examId: args.examId } })).id;
  }
  const subject = await context.entities.Subject.findUniqueOrThrow({ where: { id: subjectId } });

  const existingQuestions = await context.entities.Question.findMany({ select: { stem: true } });
  const existingNorms = existingQuestions.map((q) => normalizeStem(q.stem));

  const batch = await context.entities.ImportBatch.create({
    data: {
      fileName: args.fileName,
      subjectName: subject.name,
      totalParsed: allEntries.length,
      status: 'review_pending',
    },
  });

  let inserted = 0;
  let pendingCount = 0;
  let flaggedCount = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;
  const flaggedQuestionIds: string[] = [];

  for (const { entry, status } of allEntries) {
    const stem = entry.stem.trim();
    if (!stem || entry.options.length < 1) {
      skippedInvalid += 1;
      continue;
    }

    const norm = normalizeStem(stem);
    if (isDuplicate(norm, existingNorms, args.duplicateThreshold)) {
      skippedDuplicate += 1;
      continue;
    }

    const created = await context.entities.Question.create({
      data: {
        stem,
        options: entry.options as unknown as object,
        correctKey: entry.correctKey,
        explanation: entry.explanation,
        sourceRef: entry.sourceRef,
        status,
        subject: { connect: { id: subjectId } },
        importBatch: { connect: { id: batch.id } },
        exams: { connect: { id: args.examId } },
      },
    });

    existingNorms.push(norm);
    inserted += 1;
    if (status === 'pending') {
      pendingCount += 1;
    } else {
      flaggedCount += 1;
      // Only worth an AI draft once the explanation is what's actually
      // missing/thin — a question missing its stem or with <2 options is a
      // parsing failure, not something the model can usefully guess at.
      if (stem && entry.options.length >= 2) {
        flaggedQuestionIds.push(created.id);
      }
    }
  }

  // AI-drafts a correctKey+explanation (or explanation-only, if the hint
  // already gave a confirmed-looking key) for flagged questions — written
  // ONLY to suggestedCorrectKey/suggestedExplanation, never to the real
  // correctKey/explanation the approve-guard trusts. See the saved AI-assist
  // policy: always surfaced as "AI-suggested, unconfirmed" in the review
  // queue, a human dentist must confirm before it can be approved.
  let aiSuggested = 0;
  let aiDeclined = 0;
  let aiErrors = 0;
  const aiSkipped = args.skipAiSuggestions === true;
  const aiSkippedCap = aiSkipped ? 0 : Math.max(0, flaggedQuestionIds.length - MAX_AI_SUGGESTIONS_PER_IMPORT);
  const idsForAi = aiSkipped ? [] : flaggedQuestionIds.slice(0, MAX_AI_SUGGESTIONS_PER_IMPORT);

  for (const questionId of idsForAi) {
    const question = await context.entities.Question.findUnique({ where: { id: questionId } });
    if (!question) continue;
    const outcome = await draftSuggestionForQuestion(context, question);
    if (outcome === 'suggested') aiSuggested += 1;
    else if (outcome === 'declined') aiDeclined += 1;
    else aiErrors += 1;
  }

  return {
    batchId: batch.id,
    totalDetected: allEntries.length,
    inserted,
    pendingCount,
    flaggedCount,
    skippedDuplicate,
    skippedInvalid,
    subjectName: subject.name,
    subjectId: subject.id,
    aiSuggested,
    aiDeclined,
    aiErrors,
    aiSkippedCap,
    aiSkipped,
  };
};

/* -------------------------------------------------------------------------- */
/*  ON-DEMAND AI DRAFTING (single question + bulk-per-subject)                 */
/*  Import-time drafting is automatic but capped at 60/import and only runs    */
/*  once. These let a reviewer come back later -- one question at a time while */
/*  working the review queue, or a whole subject's remaining backlog in one    */
/*  click (still capped per call, same reasoning as the import cap: a paced,  */
/*  human-reviewed queue, never an unchecked bulk-generate).                   */
/* -------------------------------------------------------------------------- */

const draftAiSuggestionInputSchema = z.object({ id: z.string().nonempty() });
type DraftAiSuggestionInput = z.infer<typeof draftAiSuggestionInputSchema>;

export const draftAiSuggestion: DraftAiSuggestion<DraftAiSuggestionInput, Question> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(draftAiSuggestionInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  const outcome = await draftSuggestionForQuestion(context, question);
  if (outcome === 'declined') {
    throw new HttpError(422, "The model wasn't confident enough to draft an answer for this one -- it needs a human.");
  }
  if (outcome === 'error') {
    throw new HttpError(502, 'AI request failed -- try again in a moment.');
  }

  return context.entities.Question.findUniqueOrThrow({ where: { id } });
};

const MAX_AI_SUGGESTIONS_PER_BULK_CALL = 30;

// Accepts either scope -- a subject (picked from the sidebar) or an import
// batch (picked from "Recent imports", the natural next step right after
// uploading a file). Previously subject-only, which meant reviewing a fresh
// import via its batch entry had no whole-batch auto-draft at all -- only
// the page-scoped "Draft AI for selected" (20 at a time), forcing a click
// per page for anything bigger.
const draftAiSuggestionsForSubjectInputSchema = z
  .object({
    subjectId: z.string().nonempty().optional(),
    importBatchId: z.string().nonempty().optional(),
  })
  .refine((v) => !!v.subjectId || !!v.importBatchId, {
    message: 'Either subjectId or importBatchId is required',
  });
type DraftAiSuggestionsForSubjectInput = z.infer<typeof draftAiSuggestionsForSubjectInputSchema>;

type BulkDraftSummary = {
  attempted: number;
  suggested: number;
  declined: number;
  errors: number;
  remainingAfterThisCall: number;
};

export const draftAiSuggestionsForSubject: DraftAiSuggestionsForSubject<
  DraftAiSuggestionsForSubjectInput,
  BulkDraftSummary
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { subjectId, importBatchId } = ensureArgsSchemaOrThrowHttpError(draftAiSuggestionsForSubjectInputSchema, rawArgs);
  const scope = subjectId ? { subjectId } : { importBatchId };

  // Only questions genuinely missing a draft -- never re-draft/overwrite an
  // existing suggestion (that's what the per-question "Regenerate" is for,
  // a distinct, explicit action) and never touch anything already published.
  const candidates = await context.entities.Question.findMany({
    where: {
      ...scope,
      status: { in: ['pending', 'flagged'] },
      suggestedExplanation: null,
    },
    orderBy: { createdAt: 'asc' },
    take: MAX_AI_SUGGESTIONS_PER_BULK_CALL,
  });

  let suggested = 0;
  let declined = 0;
  let errors = 0;
  for (const question of candidates) {
    const outcome = await draftSuggestionForQuestion(context, question);
    if (outcome === 'suggested') suggested += 1;
    else if (outcome === 'declined') declined += 1;
    else errors += 1;
  }

  const remainingAfterThisCall = await context.entities.Question.count({
    where: { ...scope, status: { in: ['pending', 'flagged'] }, suggestedExplanation: null },
  });

  return { attempted: candidates.length, suggested, declined, errors, remainingAfterThisCall };
};

/* -------------------------------------------------------------------------- */
/*  QUESTION IMAGES (admin-only)                                               */
/*  A question with no image stays a normal text-only MCQ -- imageUrl is only  */
/*  ever set when an admin explicitly uploads one here, never defaulted.       */
/* -------------------------------------------------------------------------- */

const getQuestionImageUploadUrlInputSchema = z.object({
  questionId: z.string().nonempty(),
  fileName: z.string().nonempty(),
  fileType: z.enum(ALLOWED_IMAGE_TYPES),
});
type GetQuestionImageUploadUrlInput = z.infer<typeof getQuestionImageUploadUrlInputSchema>;

export const getQuestionImageUploadUrl: GetQuestionImageUploadUrl<
  GetQuestionImageUploadUrlInput,
  { s3UploadUrl: string; s3UploadFields: Record<string, string>; key: string }
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getQuestionImageUploadUrlInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id: args.questionId } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  return getQuestionImageUploadSignedURL(args);
};

const setQuestionImageInputSchema = z.object({
  questionId: z.string().nonempty(),
  // The S3 key returned by getQuestionImageUploadUrl once the upload succeeds,
  // or null to remove the image and revert to a normal text-only MCQ.
  key: z.string().nonempty().nullable(),
});
type SetQuestionImageInput = z.infer<typeof setQuestionImageInputSchema>;

export const setQuestionImage: SetQuestionImage<SetQuestionImageInput, { imageUrl: string | null }> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(setQuestionImageInputSchema, rawArgs);

  const question = await context.entities.Question.findUnique({ where: { id: args.questionId } });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  await context.entities.Question.update({
    where: { id: args.questionId },
    data: { imageUrl: args.key },
  });

  return { imageUrl: await resolveOptionalImageUrl(args.key) };
};
