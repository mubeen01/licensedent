import { type Question } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type GetCustomQuizMatchCount,
  type GetCustomQuizQuestions,
  type GetDueReviewCount,
  type GetDueReviewQuestions,
  type GetMyMarkedQuestions,
  type GetPracticeSubjects,
  type GetPracticeQuestions,
  type SaveQuestionNote,
  type SubmitAnswer,
} from 'wasp/server/operations';
import * as z from 'zod';
import { resolveOptionalImageUrl } from '../file-upload/s3Utils';
import {
  type ExamAwareAccessEntities,
  getAccessibleExamIds,
  getEffectiveAccess,
  requireActivePlan,
  requirePracticeSlotToday,
  requireQuizBuilderPlan,
} from '../payment/access';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

// Practice mode doesn't expose an exam switcher -- all 9 Gulf exams share the
// same underlying question bank, so there's nothing for a student to actually
// choose between day-to-day. `examId` stays optional (and the M2M-based
// filtering below still works) so a future caller *could* scope to a specific
// exam without another schema/API change.
//
// PRD-002 Phase I4: when the caller's own access resolves to exactly one exam
// (e.g. an Ireland Pathway subscriber), default to THAT exam instead of
// `general_dentist` -- for every Gulf plan this is a no-op (identical content
// either way, confirmed all Gulf exams share one pool), but for a genuinely
// single-exam-only user it's the difference between correctly seeing their
// own exam's subjects and silently seeing an inaccessible Gulf exam's.
//
// SECURITY: an explicit `examId` is only ever honored if it's one the caller
// can actually access. No client currently sends this arg (no exam switcher
// exists yet), but the operation is a network-callable endpoint regardless of
// what the UI does -- without this check, any authenticated user could POST
// `{ examId: <the other exam's id> }` directly and read that exam's subject
// list/counts, bypassing the whole point of exam scoping.
async function resolveExamId(
  examEntity: { findFirst: (args: any) => Promise<{ id: string } | null> },
  examId?: string,
  accessibleExamIds?: string[]
) {
  if (examId && accessibleExamIds?.includes(examId)) return examId;
  if (accessibleExamIds?.length === 1) return accessibleExamIds[0];
  const base = await examEntity.findFirst({ where: { slug: 'general_dentist' } });
  if (!base) throw new HttpError(500, 'No default exam configured');
  return base.id;
}

type PracticeSubject = {
  id: string;
  name: string;
  publishedCount: number;
};

const getPracticeSubjectsInputSchema = z.object({ examId: z.string().nonempty().optional() });
type GetPracticeSubjectsInput = z.infer<typeof getPracticeSubjectsInputSchema>;

// Subjects aren't duplicated per exam -- the same Subject/Question rows can be
// tagged (via Question.exams, the M2M built for this) to multiple exams, so a
// subject qualifies for a given exam if it has published questions tagged to
// that exam, regardless of which exam originally "owns" the Subject row.
export const getPracticeSubjects: GetPracticeSubjects<GetPracticeSubjectsInput, PracticeSubject[]> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getPracticeSubjectsInputSchema, rawArgs);
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);
  const examId = await resolveExamId(context.entities.Exam, args.examId, accessibleExamIds);

  const subjects = await context.entities.Subject.findMany({
    where: { isActive: true, questions: { some: { status: 'published', exams: { some: { id: examId } } } } },
    include: {
      _count: {
        select: { questions: { where: { status: 'published', exams: { some: { id: examId } } } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  return subjects
    .map((s) => ({ id: s.id, name: s.name, publishedCount: s._count.questions }))
    .filter((s) => s.publishedCount > 0);
};

const getPracticeQuestionsInputSchema = z.object({
  subjectIds: z.array(z.string().nonempty()).min(1),
  count: z.number().int().min(1).max(50).default(10),
});
type GetPracticeQuestionsInput = z.infer<typeof getPracticeQuestionsInputSchema>;

// Answer-blind shape: never send correctKey/explanation until after submit,
// so a student can't just read the network response instead of answering.
// note/markedImportant are the student's own -- never blind, they wrote them.
type PracticeQuestion = Pick<Question, 'id' | 'stem' | 'options' | 'imageUrl' | 'subjectId'> & {
  subjectName: string;
  note: string | null;
  markedImportant: boolean;
};

// Minimal entity surface for buildPracticeQuestions -- deliberately NOT pinned
// to any one operation's generated context type (it used to be pinned to
// GetPracticeQuestions's, which meant adding an entity to THAT operation's
// main.wasp.ts registration silently forced the same entity onto every OTHER
// caller of this shared helper, including unrelated ones like Quiz Builder's
// getCustomQuizQuestions -- PRD-002 Phase I3 hit exactly this).
type PracticeQuestionEntities = {
  Question: {
    findMany(args: {
      where: { id: { in: string[] } };
      select: {
        id: true;
        stem: true;
        options: true;
        imageUrl: true;
        subjectId: true;
        subject: { select: { name: true } };
      };
    }): Promise<Array<Pick<Question, 'id' | 'stem' | 'options' | 'imageUrl' | 'subjectId'> & { subject: { name: string } }>>;
  };
  QuestionNote: {
    findMany(args: {
      where: { userId: string; questionId: { in: string[] } };
      select: { questionId: true; note: true; markedImportant: true };
    }): Promise<Array<{ questionId: string; note: string | null; markedImportant: boolean }>>;
  };
};

// Shared by getPracticeQuestions (subject-based draw), getDueReviewQuestions
// (spaced-repetition draw), and getCustomQuizQuestions (Quiz Builder draw) --
// all three just need to turn a fixed, already-chosen list of question ids
// into the same answer-blind shape, with the student's own notes/star and a
// freshly signed image URL attached.
async function buildPracticeQuestions(
  idsInOrder: string[],
  userId: string,
  context: { entities: PracticeQuestionEntities }
): Promise<PracticeQuestion[]> {
  const [questions, notes] = await Promise.all([
    context.entities.Question.findMany({
      where: { id: { in: idsInOrder } },
      select: {
        id: true,
        stem: true,
        options: true,
        imageUrl: true,
        subjectId: true,
        subject: { select: { name: true } },
      },
    }),
    context.entities.QuestionNote.findMany({
      where: { userId, questionId: { in: idsInOrder } },
      select: { questionId: true, note: true, markedImportant: true },
    }),
  ]);
  const notesByQuestionId = new Map(notes.map((n) => [n.questionId, n]));

  // imageUrl stores an S3 key (private bucket), not a usable URL -- resolve to
  // a fresh signed URL here, only for the rows that actually have one.
  const byId = new Map(
    await Promise.all(
      questions.map(async ({ subject, ...q }) => {
        const imageUrl = await resolveOptionalImageUrl(q.imageUrl);
        const existingNote = notesByQuestionId.get(q.id);
        return [
          q.id,
          {
            ...q,
            imageUrl,
            subjectName: subject.name,
            note: existingNote?.note ?? null,
            markedImportant: existingNote?.markedImportant ?? false,
          },
        ] as const;
      })
    )
  );
  return idsInOrder.map((id) => byId.get(id)!).filter(Boolean);
}

export const getPracticeQuestions: GetPracticeQuestions<GetPracticeQuestionsInput, PracticeQuestion[]> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const access = await getEffectiveAccess(user.id, context.entities);
  // D1 free cap: a free user with no draws left today gets an upsell-friendly
  // 403 instead of silently empty content.
  requirePracticeSlotToday(access);
  const args = ensureArgsSchemaOrThrowHttpError(getPracticeQuestionsInputSchema, rawArgs);

  // PRD-002 Phase I3 + fix: paid users only ever draw from exams their
  // plan(s) actually cover (e.g. a Fast Track pass for one exam no longer
  // silently unlocks every other exam's content). Free users used to be
  // unrestricted by exam entirely -- that was safe back when every exam
  // shared one Gulf pool, but now that Ireland-tagged questions can live on
  // the same shared Subject rows (see getPracticeSubjects' comment above),
  // an unfiltered free draw could hand a Gulf free user Ireland-tagged
  // questions or vice versa. Free users now get the exact same single-exam
  // fallback getPracticeSubjects already resolves them to (general_dentist,
  // the shared Gulf pool) -- keeping the subject list and the question draw
  // scoped to the same exam always, never unfiltered.
  const accessibleExamIds = access.active
    ? await getAccessibleExamIds(user.id, context.entities)
    : [await resolveExamId(context.entities.Exam)];

  // Fetching matching IDs and shuffling in-app (rather than ORDER BY RANDOM()
  // in SQL) so this stays cheap as the published question count grows --
  // see build-plan's Step 5 note on random-at-scale.
  const matchingIds = await context.entities.Question.findMany({
    where: {
      status: 'published',
      subjectId: { in: args.subjectIds },
      subject: { isActive: true },
      exams: { some: { id: { in: accessibleExamIds } } },
    },
    select: { id: true },
  });

  const shuffled = [...matchingIds].sort(() => Math.random() - 0.5).slice(0, args.count);
  const idsInOrder = shuffled.map((q) => q.id);

  return buildPracticeQuestions(idsInOrder, user.id, context);
};

const submitAnswerInputSchema = z.object({
  questionId: z.string().nonempty(),
  selectedKey: z.string().nonempty(),
  markedForReview: z.boolean().default(false),
});
type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

type SubmitAnswerResult = {
  isCorrect: boolean;
  correctKey: string;
  explanation: string;
};

export const submitAnswer: SubmitAnswer<SubmitAnswerInput, SubmitAnswerResult> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(submitAnswerInputSchema, rawArgs);

  // Authoritative D1 free cap: this is where the counted UserAttempt row is
  // written, so the "0 left today" block must live here even if a stale
  // getPracticeQuestions response is still in the client.
  const access = await getEffectiveAccess(user.id, context.entities);
  requirePracticeSlotToday(access);

  const question = await context.entities.Question.findUnique({
    where: { id: args.questionId },
    include: { exams: { select: { id: true } } },
  });
  if (!question || question.status !== 'published') {
    throw new HttpError(404, 'Question not found or not available for practice');
  }

  // Cross-exam guard: getPracticeQuestions only ever hands out ids already
  // scoped to the caller's accessible exam(s), but this action takes a raw
  // questionId directly -- without re-checking here, any authenticated user
  // could submit an arbitrary id from the OTHER exam's pool (Gulf vs Ireland)
  // and this would happily hand back its correctKey/explanation, bypassing
  // the exam boundary entirely regardless of what the draw step filtered.
  const accessibleExamIds = access.active
    ? await getAccessibleExamIds(user.id, context.entities)
    : [await resolveExamId(context.entities.Exam)];
  if (!question.exams.some((e) => accessibleExamIds.includes(e.id))) {
    throw new HttpError(404, 'Question not found or not available for practice');
  }

  // Guaranteed non-null for published questions by the approve-question guard.
  const correctKey = question.correctKey!;
  const explanation = question.explanation!;

  const isCorrect = args.selectedKey === correctKey;

  await context.entities.UserAttempt.create({
    data: {
      userId: user.id,
      questionId: question.id,
      selectedKey: args.selectedKey,
      isCorrect,
      markedForReview: args.markedForReview,
    },
  });

  await scheduleNextReview(context, user.id, question.id, isCorrect);

  return { isCorrect, correctKey, explanation };
};

/* -------------------------------------------------------------------------- */
/*  SMART REVIEW  (spaced repetition, SM-2-lite)                              */
/*  Every practice answer reschedules that question's ReviewSchedule: correct  */
/*  answers push dueAt further out each time (growing by easeFactor), wrong    */
/*  answers reset it to due *immediately* (same-day relearn), not tomorrow --  */
/*  otherwise a student who just missed a question in practice would see      */
/*  nothing in Smart Review until the next day, defeating the point.          */
/*  Deliberately simplified from full SM-2 (no quality grades 0-5, just       */
/*  right/wrong) since practice mode only ever gives a binary result.        */
/* -------------------------------------------------------------------------- */

const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.8;

async function scheduleNextReview(
  context: Parameters<SubmitAnswer<SubmitAnswerInput, SubmitAnswerResult>>[1],
  userId: string,
  questionId: string,
  isCorrect: boolean
) {
  const existing = await context.entities.ReviewSchedule.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  const prevInterval = existing?.intervalDays ?? 1;
  const prevEase = existing?.easeFactor ?? 2.5;
  const prevRepetitions = existing?.repetitions ?? 0;

  let repetitions: number;
  let intervalDays: number;
  let easeFactor: number;

  if (isCorrect) {
    repetitions = prevRepetitions + 1;
    intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(prevInterval * prevEase);
    easeFactor = Math.min(MAX_EASE_FACTOR, prevEase + 0.05);
  } else {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(MIN_EASE_FACTOR, prevEase - 0.2);
  }

  // Wrong answers are due now (immediate relearn); correct answers are due
  // after intervalDays, per the growing SM-2-lite schedule above.
  const dueAt = new Date();
  if (isCorrect) {
    dueAt.setDate(dueAt.getDate() + intervalDays);
  }

  await context.entities.ReviewSchedule.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: { userId, questionId, repetitions, intervalDays, easeFactor, dueAt },
    update: { repetitions, intervalDays, easeFactor, dueAt },
  });
}

/* -------------------------------------------------------------------------- */
/*  QUESTION NOTES  ("mark as important" + notepad, persists across retries)   */
/* -------------------------------------------------------------------------- */

const saveQuestionNoteInputSchema = z.object({
  questionId: z.string().nonempty(),
  note: z.string().max(4000).nullable(),
  markedImportant: z.boolean(),
});
type SaveQuestionNoteInput = z.infer<typeof saveQuestionNoteInputSchema>;

export const saveQuestionNote: SaveQuestionNote<SaveQuestionNoteInput, { ok: true }> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(saveQuestionNoteInputSchema, rawArgs);

  // Backend audit fix (2026-09-23): previously accepted any questionId with
  // no check at all -- a valid own-user note, but for a draft/unpublished
  // question or one belonging to an exam this user has no access to. No
  // content was ever leaked back (a note is write-only from the client's own
  // perspective), but there's no reason to let a note attach to a question
  // outside what this user can legitimately see, same exam-scoping every
  // other read in this file already enforces.
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);
  const question = await context.entities.Question.findFirst({
    where: { id: args.questionId, status: 'published', exams: { some: { id: { in: accessibleExamIds } } } },
    select: { id: true },
  });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  const trimmedNote = args.note?.trim() || null;

  // An empty, unmarked note is nothing to keep around -- delete rather than
  // accumulate rows for every question a student ever glanced at.
  if (!trimmedNote && !args.markedImportant) {
    await context.entities.QuestionNote.deleteMany({
      where: { userId: user.id, questionId: args.questionId },
    });
    return { ok: true };
  }

  await context.entities.QuestionNote.upsert({
    where: { userId_questionId: { userId: user.id, questionId: args.questionId } },
    create: { userId: user.id, questionId: args.questionId, note: trimmedNote, markedImportant: args.markedImportant },
    update: { note: trimmedNote, markedImportant: args.markedImportant },
  });

  return { ok: true };
};

type MarkedQuestion = {
  questionId: string;
  stem: string;
  options: Question['options'];
  imageUrl: string | null;
  subjectName: string;
  note: string | null;
  markedImportant: boolean;
  correctKey: string;
  explanation: string;
  updatedAt: Date;
};

export const getMyMarkedQuestions: GetMyMarkedQuestions<void, MarkedQuestion[]> = async (_args, context) => {
  const user = ensureUser(context.user);
  // D1: My Reviews is an active-plan feature (1.3). Marks/notes written during
  // free practice are preserved and become visible with any plan.
  requireActivePlan(await getEffectiveAccess(user.id, context.entities), 'My Reviews');
  // PRD-002 Phase I3: a mark/note from a since-lapsed or other-exam plan stays
  // saved (per the comment above) but only surfaces here while it's within an
  // exam the user's CURRENT plan(s) actually cover.
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);

  const notes = await context.entities.QuestionNote.findMany({
    where: {
      userId: user.id,
      OR: [{ markedImportant: true }, { NOT: { note: null } }],
      question: { exams: { some: { id: { in: accessibleExamIds } } } },
    },
    orderBy: { updatedAt: 'desc' },
    include: { question: { include: { subject: { select: { name: true } } } } },
  });

  return Promise.all(
    notes
      .filter((n) => n.question.status === 'published')
      .map(async (n) => ({
        questionId: n.questionId,
        stem: n.question.stem,
        options: n.question.options,
        imageUrl: await resolveOptionalImageUrl(n.question.imageUrl),
        subjectName: n.question.subject.name,
        note: n.note,
        markedImportant: n.markedImportant,
        // Guaranteed non-null: only published questions can be marked from practice.
        correctKey: n.question.correctKey!,
        explanation: n.question.explanation!,
        updatedAt: n.updatedAt,
      }))
  );
};

const getDueReviewQuestionsInputSchema = z.object({
  count: z.number().int().min(1).max(50).default(20),
});
type GetDueReviewQuestionsInput = z.infer<typeof getDueReviewQuestionsInputSchema>;

export const getDueReviewQuestions: GetDueReviewQuestions<GetDueReviewQuestionsInput, PracticeQuestion[]> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  // D1: Smart Review is an active-plan feature.
  requireActivePlan(await getEffectiveAccess(user.id, context.entities), 'Smart Review');
  const args = ensureArgsSchemaOrThrowHttpError(getDueReviewQuestionsInputSchema, rawArgs);
  // PRD-002 Phase I3: only resurface reviews for exams the user's current
  // plan(s) actually cover.
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);

  const due = await context.entities.ReviewSchedule.findMany({
    where: {
      userId: user.id,
      dueAt: { lte: new Date() },
      question: { status: 'published', exams: { some: { id: { in: accessibleExamIds } } } },
    },
    orderBy: { dueAt: 'asc' },
    take: args.count,
    select: { questionId: true },
  });

  return buildPracticeQuestions(due.map((d) => d.questionId), user.id, context);
};

export const getDueReviewCount: GetDueReviewCount<void, number> = async (_args, context) => {
  const user = ensureUser(context.user);
  // Routed through the helper (1.3) but 0 rather than 403: this powers the
  // dashboard badge for EVERY logged-in user, and free users don't have Smart
  // Review access (the page itself upsells; getDueReviewQuestions 403s).
  const access = await getEffectiveAccess(user.id, context.entities);
  if (!access.active) return 0;
  // PRD-002 Phase I3: same exam scoping as getDueReviewQuestions, so the
  // dashboard badge count matches what that query would actually return.
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);
  return context.entities.ReviewSchedule.count({
    where: {
      userId: user.id,
      dueAt: { lte: new Date() },
      question: { status: 'published', exams: { some: { id: { in: accessibleExamIds } } } },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  CUSTOM QUIZ BUILDER (Phase 1 -- practice-mode, data-driven filters)       */
/*  Extended-plan perk (gated client-side by hasExtendedPlanAccess, same as   */
/*  Video Lectures). `include` filters are OR'd together -- a question        */
/*  matches if ANY checked condition is true; if none are checked, that       */
/*  clause is skipped entirely (unrestricted by activity). Subject selection  */
/*  is always an AND on top of that. Shared by getCustomQuizMatchCount and    */
/*  getCustomQuizQuestions now, and by Phase 2's startCustomQuizAttempt       */
/*  later, so the "what counts as a match" rule only lives in one place.     */
/* -------------------------------------------------------------------------- */

// Quiz Builder is an Extended/IDC-Pathway-plan perk (PRD-002 Phase I8.2 --
// see requireQuizBuilderPlan for why Ireland is included but Fast
// Track/Standard aren't). The client already hides it behind an
// effective-access hook (QuizBuilderPage.tsx), but that's UI-only -- this
// server-side enforcement (through the shared access.ts helpers, so a
// REVOKED/EXPIRED plan also stops working immediately) stops a free or
// lapsed account from calling these operations directly for real content.
// Returns the caller's accessible exam ids (already computed as part of the
// gate check) so callers don't re-derive them. `context` is deliberately
// typed against the minimal ExamAwareAccessEntities surface, not pinned to
// any one operation's generated context type -- this is shared by
// getCustomQuizMatchCount/getCustomQuizQuestions here AND by
// startCustomQuizAttempt in quiz-builder/operations.ts, each with their own
// separate main.wasp.ts entity list (see PracticeQuestionEntities above for
// why pinning to one operation's type is a trap for a shared helper).
export async function ensureQuizBuilderAccess(
  userId: string,
  context: { entities: ExamAwareAccessEntities }
): Promise<string[]> {
  requireQuizBuilderPlan(await getEffectiveAccess(userId, context.entities));
  return getAccessibleExamIds(userId, context.entities);
}

export const customQuizFiltersSchema = z.object({
  subjectIds: z.array(z.string().nonempty()).default([]),
  // Phase 3: a separate AND-level filter, same as subjectIds -- "only easy
  // questions" narrows the pool, it doesn't compete with the OR'd `include`
  // activity filters below. Empty = no restriction (untagged questions still
  // included, since most of the bank predates tagging).
  difficulties: z.array(z.enum(['easy', 'medium', 'hard'])).default([]),
  include: z
    .object({
      previouslyWrong: z.boolean().optional(),
      neverAttempted: z.boolean().optional(),
      bookmarked: z.boolean().optional(),
      recentlyAdded: z.boolean().optional(),
      // Phase 3 tags -- OR'd in alongside the activity filters above, same
      // grouping the original mockup used ("Include: ...High Yield...Case
      // Based..." all as one checkbox list).
      highYield: z.boolean().optional(),
      caseBased: z.boolean().optional(),
      imageOnly: z.boolean().optional(),
    })
    .default({}),
});
export type CustomQuizFilters = z.infer<typeof customQuizFiltersSchema>;

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

// PRD-002 Phase I8.2: accessibleExamIds narrows the pool to exams the
// caller's plan(s) actually cover -- same `Question.exams` M2M relation Phase
// I3 wired into practice mode/mock exams, applied here so an IDC Pathway
// subscriber's Quiz Builder only ever draws Ireland-tagged questions, not the
// shared Gulf pool.
export function buildCustomQuizWhere(filters: CustomQuizFilters, userId: string, accessibleExamIds: string[]) {
  const where: Record<string, unknown> = {
    status: 'published',
    subject: { isActive: true },
    exams: { some: { id: { in: accessibleExamIds } } },
  };
  if (filters.subjectIds.length > 0) {
    where.subjectId = { in: filters.subjectIds };
  }
  if (filters.difficulties.length > 0) {
    where.difficulty = { in: filters.difficulties };
  }

  const orConditions: Record<string, unknown>[] = [];
  if (filters.include.previouslyWrong) {
    orConditions.push({ userAttempts: { some: { userId, isCorrect: false } } });
  }
  if (filters.include.neverAttempted) {
    orConditions.push({ userAttempts: { none: { userId } } });
  }
  if (filters.include.bookmarked) {
    orConditions.push({ notes: { some: { userId, markedImportant: true } } });
  }
  if (filters.include.recentlyAdded) {
    orConditions.push({ createdAt: { gte: new Date(Date.now() - SIX_MONTHS_MS) } });
  }
  if (filters.include.highYield) {
    orConditions.push({ isHighYield: true });
  }
  if (filters.include.caseBased) {
    orConditions.push({ isCaseBased: true });
  }
  if (filters.include.imageOnly) {
    orConditions.push({ imageUrl: { not: null } });
  }
  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  return where;
}

// Minimal entity surface (same "don't pin a shared helper to one operation's
// generated context type" reasoning as PracticeQuestionEntities above) --
// startCustomQuizAttempt in quiz-builder/operations.ts calls this too, with
// its own separate main.wasp.ts entity list.
type CustomQuizQuestionEntities = {
  Question: {
    findMany(args: { where: Record<string, unknown>; select: { id: true } }): Promise<Array<{ id: string }>>;
  };
};

export async function resolveCustomQuizQuestionIds(
  filters: CustomQuizFilters,
  userId: string,
  accessibleExamIds: string[],
  context: { entities: CustomQuizQuestionEntities }
): Promise<string[]> {
  const matches = await context.entities.Question.findMany({
    where: buildCustomQuizWhere(filters, userId, accessibleExamIds),
    select: { id: true },
  });
  return matches.map((m) => m.id);
}

const getCustomQuizMatchCountInputSchema = z.object({ filters: customQuizFiltersSchema });
type GetCustomQuizMatchCountInput = z.infer<typeof getCustomQuizMatchCountInputSchema>;

// Powers the live "N matching questions" readout on the builder screen as the
// student adjusts filters, before committing to "Generate Quiz".
export const getCustomQuizMatchCount: GetCustomQuizMatchCount<GetCustomQuizMatchCountInput, number> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const accessibleExamIds = await ensureQuizBuilderAccess(user.id, context);
  const args = ensureArgsSchemaOrThrowHttpError(getCustomQuizMatchCountInputSchema, rawArgs);
  return context.entities.Question.count({ where: buildCustomQuizWhere(args.filters, user.id, accessibleExamIds) });
};

const getCustomQuizQuestionsInputSchema = z.object({
  filters: customQuizFiltersSchema,
  count: z.number().int().min(1).max(200).default(20),
});
type GetCustomQuizQuestionsInput = z.infer<typeof getCustomQuizQuestionsInputSchema>;

export const getCustomQuizQuestions: GetCustomQuizQuestions<GetCustomQuizQuestionsInput, PracticeQuestion[]> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const accessibleExamIds = await ensureQuizBuilderAccess(user.id, context);
  const args = ensureArgsSchemaOrThrowHttpError(getCustomQuizQuestionsInputSchema, rawArgs);

  const matchingIds = await resolveCustomQuizQuestionIds(args.filters, user.id, accessibleExamIds, context);
  const shuffled = [...matchingIds].sort(() => Math.random() - 0.5).slice(0, args.count);

  return buildPracticeQuestions(shuffled, user.id, context);
};
