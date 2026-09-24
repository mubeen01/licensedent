import { HttpError } from 'wasp/server';
import {
  type GetLessonPartQuizAttempt,
  type GetLessonPartQuizResults,
  type GetLessons,
  type SaveLessonPartQuizAnswer,
  type StartLessonPartQuizAttempt,
  type SubmitLessonPartQuizAttempt,
} from 'wasp/server/operations';
import * as z from 'zod';
import { resolveOptionalImageUrl } from '../file-upload/s3Utils';
import { getAccessibleExamIds, getEffectiveAccessForExam } from '../payment/access';
import { orderOptions, shuffle, type Option } from '../server/shuffleUtils';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

// Lessons live on one exam per market: IDC Ireland (a standalone pack) or
// the shared Gulf pool `general_dentist` (the Gulf-180 video lessons). The 9
// branded Gulf exams have no Lesson rows of their own. Since 2026-09-24 (RAID
// I-03) a plan for ANY Gulf exam (e.g. DHA-only Fast Track) covers the Gulf
// lessons, the same way it covers the shared Gulf question bank.
//
// Resolution:
//  - an explicit `examId` is honoured only if the caller can access it
//    (SECURITY: otherwise any user could POST IDC's id and read Ireland's
//    lesson list); a Gulf exam id maps to general_dentist;
//  - a caller whose access is standalone-only (IDC Pathway) gets that exam;
//  - everyone else (Gulf plans, Extended, free users) gets general_dentist.
//    Free users see the list with every part locked and no notes or video
//    (see lessonAccessFor below), never another market's content.
type LessonExamRow = { id: string; slug: string; standalonePackOnly: boolean };

async function resolveLessonExam(
  examEntity: {
    findFirst: (args: any) => Promise<LessonExamRow | null>;
    findMany: (args: any) => Promise<LessonExamRow[]>;
  },
  requestedExamId: string | undefined,
  accessibleExamIds: string[]
): Promise<LessonExamRow> {
  const select = { id: true, slug: true, standalonePackOnly: true };
  const accessible = accessibleExamIds.length
    ? await examEntity.findMany({ where: { id: { in: accessibleExamIds } }, select })
    : [];
  const gulfPool = await examEntity.findFirst({ where: { slug: 'general_dentist' }, select });
  if (!gulfPool) throw new HttpError(500, 'No default exam configured for Lessons');

  const requested = requestedExamId ? accessible.find((e) => e.id === requestedExamId) : undefined;
  if (requested) return requested.standalonePackOnly ? requested : gulfPool;

  const standalone = accessible.filter((e) => e.standalonePackOnly);
  if (standalone.length > 0 && standalone.length === accessible.length) return standalone[0];
  return gulfPool;
}

// Does the caller have a live plan covering this lesson exam? Standalone
// exams need a plan for that exam; the Gulf pool is covered by a plan for
// any Gulf exam (single-exam or allExamsAccess).
async function lessonAccessFor(
  userId: string,
  lessonExam: LessonExamRow,
  entities: Parameters<typeof getAccessibleExamIds>[1]
): Promise<boolean> {
  if (lessonExam.standalonePackOnly) {
    return (await getEffectiveAccessForExam(userId, lessonExam.id, entities)).active;
  }
  const accessibleExamIds = await getAccessibleExamIds(userId, entities);
  if (accessibleExamIds.length === 0) return false;
  const gulfExams = await entities.Exam.findMany({ where: { standalonePackOnly: false }, select: { id: true } });
  return gulfExams.some((e) => accessibleExamIds.includes(e.id));
}

// Part 1 of a Lesson is always unlocked; Part N+1 unlocks only once Part N
// has been passed (a submitted attempt scoring >= the lesson's
// passThresholdPercent). Deliberately simpler than mock-exams'
// computeUnlockedOrders -- no "first batch of 10" special case, since a
// Lesson's parts are a short, strictly sequential ladder.
function computeUnlockedPartOrders(partsByOrder: { order: number; passed: boolean }[]): Set<number> {
  const sorted = [...partsByOrder].sort((a, b) => a.order - b.order);
  const unlocked = new Set<number>();
  let priorPassed = true;
  for (const part of sorted) {
    if (priorPassed) unlocked.add(part.order);
    priorPassed = part.passed;
  }
  return unlocked;
}

function bestPercentOf(attempts: { correctCount: number | null; items: { id: string }[] }[]): number | null {
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => Math.round(((a.correctCount ?? 0) / Math.max(1, a.items.length)) * 100)));
}

/* -------------------------------------------------------------------------- */
/*  LIST (Lessons -> Parts, with lock/pass state for the current user)         */
/* -------------------------------------------------------------------------- */

const getLessonsInputSchema = z.object({ examId: z.string().nonempty().optional() });
type GetLessonsInput = z.infer<typeof getLessonsInputSchema>;

type LessonPartSummary = {
  id: string;
  order: number;
  title: string;
  youtubeId: string | null;
  durationMinutes: number | null;
  notesMarkdown: string | null;
  questionCount: number;
  isLocked: boolean;
  lockReason: 'plan' | 'previous-part' | null;
  bestPercent: number | null;
  passed: boolean;
  inProgressAttemptId: string | null;
};

type LessonSummary = {
  id: string;
  title: string;
  order: number;
  passThresholdPercent: number;
  // false = no live plan covers this lesson's exam: every part is locked and
  // notes/video are withheld (the list itself is a preview for the upsell).
  hasAccess: boolean;
  parts: LessonPartSummary[];
};

export const getLessons: GetLessons<GetLessonsInput, LessonSummary[]> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getLessonsInputSchema, rawArgs);
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);
  const lessonExam = await resolveLessonExam(context.entities.Exam, args.examId, accessibleExamIds);
  const hasAccess = await lessonAccessFor(user.id, lessonExam, context.entities);

  const lessons = await context.entities.Lesson.findMany({
    where: { isActive: true, examId: lessonExam.id },
    orderBy: { order: 'asc' },
    include: {
      parts: {
        orderBy: { order: 'asc' },
        include: {
          questions: { where: { status: 'published' }, select: { id: true } },
          attempts: {
            where: { userId: user.id },
            select: { id: true, status: true, correctCount: true, items: { select: { id: true } } },
          },
        },
      },
    },
  });

  return lessons.map((lesson) => {
    const partsComputed = lesson.parts.map((part) => {
      const submitted = part.attempts.filter((a) => a.status === 'submitted');
      const bestPercent = bestPercentOf(submitted);
      const passed = bestPercent !== null && bestPercent >= lesson.passThresholdPercent;
      const inProgress = part.attempts.find((a) => a.status === 'in_progress') ?? null;
      return { part, bestPercent, passed, inProgress };
    });
    const unlockedOrders = computeUnlockedPartOrders(partsComputed.map((p) => ({ order: p.part.order, passed: p.passed })));

    return {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      passThresholdPercent: lesson.passThresholdPercent,
      hasAccess,
      parts: partsComputed.map(({ part, bestPercent, passed, inProgress }) => ({
        id: part.id,
        order: part.order,
        title: part.title,
        youtubeId: hasAccess ? part.youtubeId : null,
        durationMinutes: part.durationMinutes,
        notesMarkdown: hasAccess ? part.notesMarkdown : null,
        questionCount: part.questions.length,
        isLocked: !hasAccess || !unlockedOrders.has(part.order),
        lockReason: !hasAccess ? ('plan' as const) : !unlockedOrders.has(part.order) ? ('previous-part' as const) : null,
        bestPercent,
        passed,
        inProgressAttemptId: inProgress?.id ?? null,
      })),
    };
  });
};

/* -------------------------------------------------------------------------- */
/*  START (or resume) a Part's quiz attempt                                    */
/* -------------------------------------------------------------------------- */

const startLessonPartQuizAttemptInputSchema = z.object({ lessonPartId: z.string().nonempty() });
type StartLessonPartQuizAttemptInput = z.infer<typeof startLessonPartQuizAttemptInputSchema>;

export const startLessonPartQuizAttempt: StartLessonPartQuizAttempt<
  StartLessonPartQuizAttemptInput,
  { attemptId: string }
> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(startLessonPartQuizAttemptInputSchema, rawArgs);

  const part = await context.entities.LessonPart.findUnique({
    where: { id: args.lessonPartId },
    include: { lesson: { include: { exam: { select: { id: true, slug: true, standalonePackOnly: true } } } } },
  });
  if (!part || !part.lesson.isActive) {
    throw new HttpError(404, 'Lesson part not found');
  }

  if (!(await lessonAccessFor(user.id, part.lesson.exam, context.entities))) {
    throw new HttpError(403, 'This lesson needs an active plan. Pick one on the Pricing page -- access starts instantly.');
  }

  // Server-side lock check (not just a client-side hide) -- recompute this
  // lesson's unlock ladder fresh rather than trusting whatever getLessons
  // last returned to the client.
  const siblingParts = await context.entities.LessonPart.findMany({
    where: { lessonId: part.lessonId },
    select: {
      order: true,
      attempts: {
        where: { userId: user.id, status: 'submitted' },
        select: { correctCount: true, items: { select: { id: true } } },
      },
    },
  });
  const unlockedOrders = computeUnlockedPartOrders(
    siblingParts.map((p) => {
      const bestPercent = bestPercentOf(p.attempts);
      return { order: p.order, passed: bestPercent !== null && bestPercent >= part.lesson.passThresholdPercent };
    })
  );
  if (!unlockedOrders.has(part.order)) {
    throw new HttpError(403, 'This lesson part is locked until you pass the one before it');
  }

  const existing = await context.entities.LessonPartQuizAttempt.findFirst({
    where: { userId: user.id, lessonPartId: part.id, status: 'in_progress' },
  });
  if (existing) {
    return { attemptId: existing.id };
  }

  const questions = await context.entities.Question.findMany({
    where: { status: 'published', lessonParts: { some: { id: part.id } } },
    select: { id: true, options: true },
  });
  if (questions.length === 0) {
    throw new HttpError(400, 'No published questions are attached to this lesson part yet');
  }

  const shuffledQuestions = shuffle(questions);

  const attempt = await context.entities.LessonPartQuizAttempt.create({
    data: {
      userId: user.id,
      lessonPartId: part.id,
      items: {
        create: shuffledQuestions.map((q, i) => ({
          questionId: q.id,
          order: i,
          optionOrder: shuffle((q.options as unknown as Option[]).map((o) => o.key)),
        })),
      },
    },
  });

  return { attemptId: attempt.id };
};

/* -------------------------------------------------------------------------- */
/*  TAKING an attempt                                                          */
/* -------------------------------------------------------------------------- */

type LessonPartQuizQuestionView = {
  order: number;
  questionId: string;
  stem: string;
  options: Option[];
  imageUrl: string | null;
  selectedKey: string | null;
};

type LessonPartQuizAttemptView = {
  attemptId: string;
  lessonTitle: string;
  partTitle: string;
  status: 'in_progress' | 'submitted';
  items: LessonPartQuizQuestionView[];
};

const getLessonPartQuizAttemptInputSchema = z.object({ attemptId: z.string().nonempty() });
type GetLessonPartQuizAttemptInput = z.infer<typeof getLessonPartQuizAttemptInputSchema>;

export const getLessonPartQuizAttempt: GetLessonPartQuizAttempt<
  GetLessonPartQuizAttemptInput,
  LessonPartQuizAttemptView
> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getLessonPartQuizAttemptInputSchema, rawArgs);

  const attempt = await context.entities.LessonPartQuizAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
      lessonPart: { include: { lesson: { select: { title: true } } } },
      items: {
        orderBy: { order: 'asc' },
        include: { question: { select: { stem: true, options: true, imageUrl: true } } },
      },
    },
  });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }

  return {
    attemptId: attempt.id,
    lessonTitle: attempt.lessonPart.lesson.title,
    partTitle: attempt.lessonPart.title,
    status: attempt.status,
    items: await Promise.all(
      attempt.items.map(async (item) => ({
        order: item.order,
        questionId: item.questionId,
        stem: item.question.stem,
        options: orderOptions(item.question.options as unknown as Option[], item.optionOrder),
        imageUrl: await resolveOptionalImageUrl(item.question.imageUrl),
        selectedKey: item.selectedKey,
      }))
    ),
  };
};

/* -------------------------------------------------------------------------- */
/*  AUTOSAVE an answer                                                         */
/* -------------------------------------------------------------------------- */

const saveLessonPartQuizAnswerInputSchema = z.object({
  attemptId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  selectedKey: z.string().nullable(),
});
type SaveLessonPartQuizAnswerInput = z.infer<typeof saveLessonPartQuizAnswerInputSchema>;

export const saveLessonPartQuizAnswer: SaveLessonPartQuizAnswer<SaveLessonPartQuizAnswerInput, { ok: true }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(saveLessonPartQuizAnswerInputSchema, rawArgs);

  const attempt = await context.entities.LessonPartQuizAttempt.findUnique({ where: { id: args.attemptId } });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }
  if (attempt.status !== 'in_progress') {
    throw new HttpError(400, 'This attempt has already been submitted');
  }

  await context.entities.LessonPartQuizAttemptItem.update({
    where: { attemptId_questionId: { attemptId: args.attemptId, questionId: args.questionId } },
    data: { selectedKey: args.selectedKey },
  });

  return { ok: true };
};

/* -------------------------------------------------------------------------- */
/*  SUBMIT (grade once, on demand)                                             */
/* -------------------------------------------------------------------------- */

const submitLessonPartQuizAttemptInputSchema = z.object({ attemptId: z.string().nonempty() });
type SubmitLessonPartQuizAttemptInput = z.infer<typeof submitLessonPartQuizAttemptInputSchema>;

export const submitLessonPartQuizAttempt: SubmitLessonPartQuizAttempt<
  SubmitLessonPartQuizAttemptInput,
  { correctCount: number; totalQuestions: number; percent: number; passed: boolean }
> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(submitLessonPartQuizAttemptInputSchema, rawArgs);

  const attempt = await context.entities.LessonPartQuizAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
      items: { include: { question: { select: { correctKey: true } } } },
      lessonPart: { include: { lesson: { select: { passThresholdPercent: true } } } },
    },
  });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }
  if (attempt.status !== 'in_progress') {
    throw new HttpError(400, 'This attempt has already been submitted');
  }

  const correctCount = attempt.items.filter(
    (item) => !!item.selectedKey && item.selectedKey === item.question.correctKey
  ).length;
  const totalQuestions = attempt.items.length;
  const percent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const passed = percent >= attempt.lessonPart.lesson.passThresholdPercent;

  await context.entities.LessonPartQuizAttempt.update({
    where: { id: attempt.id },
    data: { status: 'submitted', submittedAt: new Date(), correctCount },
  });

  return { correctCount, totalQuestions, percent, passed };
};

/* -------------------------------------------------------------------------- */
/*  RESULTS                                                                    */
/* -------------------------------------------------------------------------- */

type LessonPartQuizResultItem = {
  order: number;
  stem: string;
  options: Option[];
  imageUrl: string | null;
  selectedKey: string | null;
  correctKey: string;
  explanation: string;
  isCorrect: boolean;
};

type LessonPartQuizResultsView = {
  lessonTitle: string;
  partTitle: string;
  passThresholdPercent: number;
  submittedAt: Date | null;
  correctCount: number;
  totalQuestions: number;
  percent: number;
  passed: boolean;
  items: LessonPartQuizResultItem[];
};

const getLessonPartQuizResultsInputSchema = z.object({ attemptId: z.string().nonempty() });
type GetLessonPartQuizResultsInput = z.infer<typeof getLessonPartQuizResultsInputSchema>;

export const getLessonPartQuizResults: GetLessonPartQuizResults<
  GetLessonPartQuizResultsInput,
  LessonPartQuizResultsView
> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getLessonPartQuizResultsInputSchema, rawArgs);

  const attempt = await context.entities.LessonPartQuizAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
      lessonPart: { include: { lesson: { select: { title: true, passThresholdPercent: true } } } },
      items: {
        orderBy: { order: 'asc' },
        include: {
          question: { select: { stem: true, options: true, imageUrl: true, correctKey: true, explanation: true } },
        },
      },
    },
  });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }
  if (attempt.status !== 'submitted') {
    throw new HttpError(400, 'This attempt has not been submitted yet');
  }

  const totalQuestions = attempt.items.length;
  const correctCount = attempt.correctCount ?? 0;
  const percent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);

  return {
    lessonTitle: attempt.lessonPart.lesson.title,
    partTitle: attempt.lessonPart.title,
    passThresholdPercent: attempt.lessonPart.lesson.passThresholdPercent,
    submittedAt: attempt.submittedAt,
    correctCount,
    totalQuestions,
    percent,
    passed: percent >= attempt.lessonPart.lesson.passThresholdPercent,
    items: await Promise.all(
      attempt.items.map(async (item) => ({
        order: item.order,
        stem: item.question.stem,
        options: orderOptions(item.question.options as unknown as Option[], item.optionOrder),
        imageUrl: await resolveOptionalImageUrl(item.question.imageUrl),
        selectedKey: item.selectedKey,
        // Guaranteed non-null: only published questions are ever drawn into an attempt.
        correctKey: item.question.correctKey!,
        explanation: item.question.explanation!,
        isCorrect: !!item.selectedKey && item.selectedKey === item.question.correctKey,
      }))
    ),
  };
};
