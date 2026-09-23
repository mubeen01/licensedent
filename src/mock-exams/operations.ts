import { type Question } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type GetExamReadiness,
  type GetMockExamAttempt,
  type GetMockExamResults,
  type GetMockExams,
  type GetMockTestMeta,
  type GetReadinessScore,
  type SaveMockExamAnswer,
  type StartMockExamAttempt,
  type SubmitMockExamAttempt,
} from 'wasp/server/operations';
import * as z from 'zod';
import { computeStreak } from '../dashboard/streak';
import { resolveOptionalImageUrl } from '../file-upload/s3Utils';
import { getAccessibleExamIds, getEffectiveAccess, getEffectiveAccessForExam, requireActivePlan } from '../payment/access';
import { PaymentPlanId } from '../payment/plans';
import { orderOptions, shuffle, type Option } from '../server/shuffleUtils';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

// Mock Exams doesn't expose an exam switcher -- all 9 Gulf exams share the same
// underlying question bank, so `examId` stays optional and defaults to the base
// exam rather than making a student pick between identical content.
//
// PRD-002 Phase I4: when the caller's own access resolves to exactly one exam
// (e.g. an Ireland Pathway subscriber), default to THAT exam instead of
// `general_dentist` -- a no-op for every Gulf plan (identical content either
// way), but the difference between a single-exam-only user correctly seeing
// their own exam's mocks (Ireland now has 5 real MockTest rows, PRD-003)
// versus silently seeing an inaccessible Gulf exam's full mock list.
// SECURITY: an explicit `examId` is only honored if it's one the caller can
// actually access -- otherwise any authenticated user could POST
// `{ examId: <the other exam's id> }` directly and read that exam's mock
// test list, bypassing exam scoping entirely regardless of what the UI sends.
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

// Total mock-exam attempts a user may ever start, keyed by their current plan --
// counts across all mock exams, not per-mock-test. Even the Extended ("all exams")
// plan gets a hard ceiling rather than true unlimited, per explicit instruction.
const MOCK_EXAM_ATTEMPT_CAPS: Record<PaymentPlanId, number> = {
  [PaymentPlanId.FastTrack]: 20,
  [PaymentPlanId.Standard]: 60,
  [PaymentPlanId.Extended]: 150,
  // A real Ireland Mock Exam surface now exists (5 MockTest rows scoped to
  // the IDC exam, drawing from its 140 published questions) -- 60 matches
  // Standard's cap. (Pricing was later rebalanced so Ireland Pathway ($650)
  // is now priced above Extended ($500), but the cap itself was never tied
  // to that ordering, so it's left as-is.)
  [PaymentPlanId.IrelandPathway]: 60,
};

// Reads the REAL Subscription model (same source getEffectiveAccess/Billing/
// the dashboard all use), not the legacy User.subscriptionPlan/subscriptionStatus
// fields -- those are only ever written by the Stripe/LemonSqueezy webhook
// paths, never by an admin's manual grantUserSubscription, so any manually-
// granted plan (confirmed for the Ireland Pathway test account: an active,
// unexpired Subscription row, but null User.subscriptionPlan) silently always
// got capped at 0 attempts despite Billing/the dashboard correctly showing an
// active plan. Real bug, not Ireland-specific -- affects any admin-granted
// account on any plan.
async function getMockExamAttemptCap(userId: string, entities: Parameters<typeof getEffectiveAccess>[1]): Promise<number> {
  const access = await getEffectiveAccess(userId, entities);
  if (!access.active || !access.planType) return 0;
  return MOCK_EXAM_ATTEMPT_CAPS[access.planType] ?? 0;
}

// Mocks 1-10 are all open together. Mock 11 unlocks once every one of 1-10
// has a submitted attempt; from there each mock N unlocks once mock N-1 has
// a submitted attempt -- one at a time, not another batch of 10.
const FIRST_BATCH_SIZE = 10;

function computeUnlockedOrders(mockTestsByOrder: { order: number; hasSubmitted: boolean }[]): Set<number> {
  const submittedOrders = new Set(mockTestsByOrder.filter((mt) => mt.hasSubmitted).map((mt) => mt.order));
  const unlocked = new Set<number>();
  for (const mt of mockTestsByOrder) {
    if (mt.order <= FIRST_BATCH_SIZE) {
      unlocked.add(mt.order);
    } else if (mt.order === FIRST_BATCH_SIZE + 1) {
      const firstBatchAllDone = Array.from({ length: FIRST_BATCH_SIZE }, (_, i) => i + 1).every((o) =>
        submittedOrders.has(o)
      );
      if (firstBatchAllDone) unlocked.add(mt.order);
    } else if (submittedOrders.has(mt.order - 1)) {
      unlocked.add(mt.order);
    }
  }
  return unlocked;
}

/* -------------------------------------------------------------------------- */
/*  LIST  (powers the mock-exam tabs)                                          */
/* -------------------------------------------------------------------------- */

type MockExamSummary = {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  questionCount: number;
  examName: string;
  inProgressAttemptId: string | null;
  attemptsUsed: number;
  attemptsCap: number;
  submittedAttempts: { id: string; correctCount: number; totalQuestions: number; submittedAt: Date | null }[];
};

const getMockExamsInputSchema = z.object({ examId: z.string().nonempty().optional() });
type GetMockExamsInput = z.infer<typeof getMockExamsInputSchema>;

export const getMockExams: GetMockExams<GetMockExamsInput, MockExamSummary[]> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getMockExamsInputSchema, rawArgs);
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);
  const examId = await resolveExamId(context.entities.Exam, args.examId, accessibleExamIds);
  const attemptsCap = await getMockExamAttemptCap(user.id, context.entities);
  // Global count across ALL mock exams (the cap isn't per-mock-test), so every
  // tab reports the same "used" number even once more mock exams exist.
  const attemptsUsed = await context.entities.MockExamAttempt.count({ where: { userId: user.id } });

  const mockTests = await context.entities.MockTest.findMany({
    where: { isActive: true, examId },
    include: {
      exam: { select: { name: true } },
      attempts: {
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, correctCount: true, submittedAt: true, items: { select: { id: true } } },
      },
    },
    orderBy: { order: 'asc' },
  });

  const unlockedOrders = computeUnlockedOrders(
    mockTests.map((mt) => ({ order: mt.order, hasSubmitted: mt.attempts.some((a) => a.status === 'submitted') }))
  );

  return mockTests
    .filter((mt) => unlockedOrders.has(mt.order))
    .map((mt) => ({
      id: mt.id,
      order: mt.order,
      title: mt.title,
      durationMinutes: mt.durationMinutes,
      questionCount: mt.questionCount,
      examName: mt.exam.name,
      inProgressAttemptId: mt.attempts.find((a) => a.status === 'in_progress')?.id ?? null,
      attemptsUsed,
      attemptsCap,
      submittedAttempts: mt.attempts
        .filter((a) => a.status === 'submitted')
        .map((a) => ({
          id: a.id,
          correctCount: a.correctCount ?? 0,
          totalQuestions: a.items.length,
          submittedAt: a.submittedAt,
        })),
    }));
};

/* -------------------------------------------------------------------------- */
/*  META  (for the pre-exam instructions page, before an attempt exists)       */
/* -------------------------------------------------------------------------- */

const getMockTestMetaInputSchema = z.object({ mockTestId: z.string().nonempty() });
type GetMockTestMetaInput = z.infer<typeof getMockTestMetaInputSchema>;

type MockTestMeta = {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  examName: string;
};

export const getMockTestMeta: GetMockTestMeta<GetMockTestMetaInput, MockTestMeta> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getMockTestMetaInputSchema, rawArgs);

  const mockTest = await context.entities.MockTest.findUnique({
    where: { id: args.mockTestId },
    include: { exam: { select: { name: true } } },
  });
  if (!mockTest || !mockTest.isActive) {
    throw new HttpError(404, 'Mock exam not found');
  }

  // Backend audit fix (2026-09-23): this was auth-only -- any signed-in user
  // (including one with no plan, or a plan scoped to a different exam) could
  // read any mock test's title/duration/question count by ID, the same
  // per-exam access startMockExamAttempt already enforces below.
  requireActivePlan(await getEffectiveAccessForExam(user.id, mockTest.examId, context.entities), 'This mock exam');

  return {
    id: mockTest.id,
    title: mockTest.title,
    durationMinutes: mockTest.durationMinutes,
    questionCount: mockTest.questionCount,
    examName: mockTest.exam.name,
  };
};

/* -------------------------------------------------------------------------- */
/*  START (or resume) AN ATTEMPT                                               */
/*  Draws a fresh random sample from the exam's *current* published bank --    */
/*  same "fetch IDs, shuffle in-app" approach as practice mode, so this stays  */
/*  cheap as the bank grows into the thousands. Snapshotted into              */
/*  MockExamAttemptItem so the set never shifts mid-attempt.                   */
/* -------------------------------------------------------------------------- */

const startMockExamAttemptInputSchema = z.object({ mockTestId: z.string().nonempty() });
type StartMockExamAttemptInput = z.infer<typeof startMockExamAttemptInputSchema>;

export const startMockExamAttempt: StartMockExamAttempt<StartMockExamAttemptInput, { attemptId: string }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(startMockExamAttemptInputSchema, rawArgs);

  const mockTest = await context.entities.MockTest.findUnique({ where: { id: args.mockTestId } });
  if (!mockTest || !mockTest.isActive) {
    throw new HttpError(404, 'Mock exam not found');
  }

  // PRD-002 Phase I3: the attempt-count cap below has always applied, but
  // nothing ever checked that the user's plan actually covers *this* mock
  // exam's exam -- a Fast Track pass scoped to one exam could silently start
  // attempts for any other exam's mocks too. Real per-exam enforcement, not
  // just a client-side hide.
  requireActivePlan(
    await getEffectiveAccessForExam(user.id, mockTest.examId, context.entities),
    'This mock exam'
  );

  const siblingMockTests = await context.entities.MockTest.findMany({
    where: { isActive: true, examId: mockTest.examId },
    include: { attempts: { where: { userId: user.id, status: 'submitted' }, select: { id: true }, take: 1 } },
  });
  const unlockedOrders = computeUnlockedOrders(
    siblingMockTests.map((mt) => ({ order: mt.order, hasSubmitted: mt.attempts.length > 0 }))
  );
  if (!unlockedOrders.has(mockTest.order)) {
    throw new HttpError(403, 'This mock exam is locked until you finish the ones before it');
  }

  const existing = await context.entities.MockExamAttempt.findFirst({
    where: { userId: user.id, mockTestId: mockTest.id, status: 'in_progress' },
  });
  if (existing) {
    return { attemptId: existing.id };
  }

  // Cap only gates STARTING a new attempt -- resuming an in-progress one (above)
  // never counts against it twice.
  const attemptsCap = await getMockExamAttemptCap(user.id, context.entities);
  const attemptsUsed = await context.entities.MockExamAttempt.count({ where: { userId: user.id } });
  if (attemptsUsed >= attemptsCap) {
    throw new HttpError(403, 'You have reached your plan\'s mock exam attempt limit');
  }

  const matchingQuestions = await context.entities.Question.findMany({
    where: { status: 'published', exams: { some: { id: mockTest.examId } }, subject: { isActive: true } },
    select: { id: true, options: true },
  });
  if (matchingQuestions.length === 0) {
    throw new HttpError(400, 'No published questions are available for this exam yet');
  }

  // PRD-002 I8.3: real Fisher-Yates for question order (previously a known-
  // biased `.sort(() => Math.random() - 0.5)`), plus a per-question option
  // shuffle persisted onto each item -- option order was never shuffled at
  // all before this. See src/server/shuffleUtils.ts.
  const shuffled = shuffle(matchingQuestions).slice(0, mockTest.questionCount);

  const attempt = await context.entities.MockExamAttempt.create({
    data: {
      userId: user.id,
      mockTestId: mockTest.id,
      durationMinutes: mockTest.durationMinutes,
      items: {
        create: shuffled.map((q, i) => ({
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
/*  TAKING an attempt (answer-blind, resumable)                                */
/* -------------------------------------------------------------------------- */

type AttemptQuestionView = {
  order: number;
  questionId: string;
  stem: string;
  options: Question['options'];
  imageUrl: string | null;
  subjectName: string;
  selectedKey: string | null;
  markedForReview: boolean;
};

type MockExamAttemptView = {
  attemptId: string;
  mockTestTitle: string;
  status: 'in_progress' | 'submitted';
  durationMinutes: number;
  createdAt: Date;
  items: AttemptQuestionView[];
};

const getMockExamAttemptInputSchema = z.object({ attemptId: z.string().nonempty() });
type GetMockExamAttemptInput = z.infer<typeof getMockExamAttemptInputSchema>;

export const getMockExamAttempt: GetMockExamAttempt<GetMockExamAttemptInput, MockExamAttemptView> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getMockExamAttemptInputSchema, rawArgs);

  const attempt = await context.entities.MockExamAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
      mockTest: { select: { title: true } },
      items: {
        orderBy: { order: 'asc' },
        include: { question: { include: { subject: { select: { name: true } } } } },
      },
    },
  });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }

  return {
    attemptId: attempt.id,
    mockTestTitle: attempt.mockTest.title,
    status: attempt.status,
    durationMinutes: attempt.durationMinutes,
    createdAt: attempt.createdAt,
    items: await Promise.all(
      attempt.items.map(async (item) => ({
        order: item.order,
        questionId: item.questionId,
        stem: item.question.stem,
        options: orderOptions(item.question.options as unknown as Option[], item.optionOrder),
        imageUrl: await resolveOptionalImageUrl(item.question.imageUrl),
        subjectName: item.question.subject.name,
        selectedKey: item.selectedKey,
        markedForReview: item.markedForReview,
      }))
    ),
  };
};

/* -------------------------------------------------------------------------- */
/*  AUTOSAVE an answer (no correctness feedback -- real exam behavior)         */
/* -------------------------------------------------------------------------- */

const saveMockExamAnswerInputSchema = z.object({
  attemptId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  selectedKey: z.string().nullable(),
  markedForReview: z.boolean(),
});
type SaveMockExamAnswerInput = z.infer<typeof saveMockExamAnswerInputSchema>;

export const saveMockExamAnswer: SaveMockExamAnswer<SaveMockExamAnswerInput, { ok: true }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(saveMockExamAnswerInputSchema, rawArgs);

  const attempt = await context.entities.MockExamAttempt.findUnique({ where: { id: args.attemptId } });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }
  if (attempt.status !== 'in_progress') {
    throw new HttpError(400, 'This attempt has already been submitted');
  }

  await context.entities.MockExamAttemptItem.update({
    where: { attemptId_questionId: { attemptId: args.attemptId, questionId: args.questionId } },
    data: { selectedKey: args.selectedKey, markedForReview: args.markedForReview },
  });

  return { ok: true };
};

/* -------------------------------------------------------------------------- */
/*  SUBMIT (grade once, on demand)                                             */
/* -------------------------------------------------------------------------- */

const submitMockExamAttemptInputSchema = z.object({ attemptId: z.string().nonempty() });
type SubmitMockExamAttemptInput = z.infer<typeof submitMockExamAttemptInputSchema>;

export const submitMockExamAttempt: SubmitMockExamAttempt<
  SubmitMockExamAttemptInput,
  { correctCount: number; totalQuestions: number }
> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(submitMockExamAttemptInputSchema, rawArgs);

  const attempt = await context.entities.MockExamAttempt.findUnique({
    where: { id: args.attemptId },
    include: { items: { include: { question: { select: { correctKey: true } } } } },
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

  await context.entities.MockExamAttempt.update({
    where: { id: attempt.id },
    data: { status: 'submitted', submittedAt: new Date(), correctCount },
  });

  return { correctCount, totalQuestions: attempt.items.length };
};

/* -------------------------------------------------------------------------- */
/*  RESULTS (correct answers + explanations, only once submitted)              */
/* -------------------------------------------------------------------------- */

type ResultItem = {
  order: number;
  stem: string;
  options: Question['options'];
  imageUrl: string | null;
  subjectName: string;
  selectedKey: string | null;
  correctKey: string;
  explanation: string;
  isCorrect: boolean;
  markedForReview: boolean;
};

type MockExamResultsView = {
  mockTestTitle: string;
  submittedAt: Date | null;
  correctCount: number;
  totalQuestions: number;
  items: ResultItem[];
};

const getMockExamResultsInputSchema = z.object({ attemptId: z.string().nonempty() });
type GetMockExamResultsInput = z.infer<typeof getMockExamResultsInputSchema>;

export const getMockExamResults: GetMockExamResults<GetMockExamResultsInput, MockExamResultsView> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getMockExamResultsInputSchema, rawArgs);

  const attempt = await context.entities.MockExamAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
      mockTest: { select: { title: true } },
      items: {
        orderBy: { order: 'asc' },
        include: { question: { include: { subject: { select: { name: true } } } } },
      },
    },
  });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }
  if (attempt.status !== 'submitted') {
    throw new HttpError(400, 'This attempt has not been submitted yet');
  }

  return {
    mockTestTitle: attempt.mockTest.title,
    submittedAt: attempt.submittedAt,
    correctCount: attempt.correctCount ?? 0,
    totalQuestions: attempt.items.length,
    items: await Promise.all(attempt.items.map(async (item) => ({
      order: item.order,
      stem: item.question.stem,
      options: orderOptions(item.question.options as unknown as Option[], item.optionOrder),
      imageUrl: await resolveOptionalImageUrl(item.question.imageUrl),
      subjectName: item.question.subject.name,
      selectedKey: item.selectedKey,
      // Guaranteed non-null: only published questions are ever drawn into an attempt.
      correctKey: item.question.correctKey!,
      explanation: item.question.explanation!,
      isCorrect: !!item.selectedKey && item.selectedKey === item.question.correctKey,
      markedForReview: item.markedForReview,
    }))),
  };
};

/* -------------------------------------------------------------------------- */
/*  LICENSING-EXAM READINESS                                                   */
/*  "Ready" = passed (>=95%) at least 8 of the first 10 mock exams. A mock     */
/*  counts as passed if ANY submitted attempt on it hit the threshold -- a     */
/*  student isn't penalized for a rough first try if a retake clears the bar.  */
/* -------------------------------------------------------------------------- */

const READY_PASS_COUNT = 8;
const READY_SCORE_THRESHOLD = 0.95;

type ExamReadiness = {
  ready: boolean;
  passedCount: number;
  totalConsidered: number;
};

const getExamReadinessInputSchema = z.object({ examId: z.string().nonempty().optional() });
type GetExamReadinessInput = z.infer<typeof getExamReadinessInputSchema>;

export const getExamReadiness: GetExamReadiness<GetExamReadinessInput, ExamReadiness> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getExamReadinessInputSchema, rawArgs);
  const accessibleExamIds = await getAccessibleExamIds(user.id, context.entities);
  const examId = await resolveExamId(context.entities.Exam, args.examId, accessibleExamIds);

  const firstBatch = await context.entities.MockTest.findMany({
    where: { isActive: true, examId, order: { lte: FIRST_BATCH_SIZE } },
    select: {
      order: true,
      attempts: {
        where: { userId: user.id, status: 'submitted' },
        select: { correctCount: true, items: { select: { id: true } } },
      },
    },
  });

  let passedCount = 0;
  for (const mt of firstBatch) {
    const passedThisOne = mt.attempts.some((a) => {
      const total = a.items.length;
      return total > 0 && (a.correctCount ?? 0) / total >= READY_SCORE_THRESHOLD;
    });
    if (passedThisOne) passedCount += 1;
  }

  return { ready: passedCount >= READY_PASS_COUNT, passedCount, totalConsidered: firstBatch.length };
};

/* -------------------------------------------------------------------------- */
/*  READINESS SCORE                                                            */
/*  A transparent 0-100 blend of three real signals -- never an opaque         */
/*  "AI-predicted" number. Weighted: 50% mock-exam accuracy, 30% subject       */
/*  coverage (subjects with real depth of practice), 20% consistency          */
/*  (current streak). Surfaced with its breakdown on the dashboard so it       */
/*  never reads as a black box.                                               */
/* -------------------------------------------------------------------------- */

const SUBJECT_COVERAGE_THRESHOLD_ATTEMPTS = 20;
const STREAK_TARGET_DAYS = 14;

type ReadinessScore = {
  score: number;
  breakdown: {
    mockAccuracyPct: number;
    subjectCoveragePct: number;
    streakPct: number;
  };
};

export const getReadinessScore: GetReadinessScore<void, ReadinessScore> = async (_args, context) => {
  const user = ensureUser(context.user);

  const [submittedMocks, activeSubjectCount, activityAttempts, mockActivity] = await Promise.all([
    context.entities.MockExamAttempt.findMany({
      where: { userId: user.id, status: 'submitted' },
      select: { correctCount: true, items: { select: { id: true } } },
    }),
    context.entities.Subject.count({ where: { isActive: true } }),
    context.entities.UserAttempt.findMany({ where: { userId: user.id }, select: { createdAt: true, question: { select: { subjectId: true } } } }),
    context.entities.MockExamAttempt.findMany({
      where: { userId: user.id },
      select: { createdAt: true, submittedAt: true },
    }),
  ]);

  const mockAccuracyPct =
    submittedMocks.length > 0
      ? Math.round(
          (submittedMocks.reduce((sum, m) => {
            const total = m.items.length;
            return sum + (total > 0 ? (m.correctCount ?? 0) / total : 0);
          }, 0) /
            submittedMocks.length) *
            100
        )
      : 0;

  const attemptsPerSubject = new Map<string, number>();
  for (const a of activityAttempts) {
    attemptsPerSubject.set(a.question.subjectId, (attemptsPerSubject.get(a.question.subjectId) ?? 0) + 1);
  }
  const subjectsWithCoverage = Array.from(attemptsPerSubject.values()).filter(
    (count) => count >= SUBJECT_COVERAGE_THRESHOLD_ATTEMPTS
  ).length;
  const subjectCoveragePct =
    activeSubjectCount > 0 ? Math.round((subjectsWithCoverage / activeSubjectCount) * 100) : 0;

  const { currentStreakDays } = computeStreak([
    ...activityAttempts.map((a) => a.createdAt),
    ...mockActivity.flatMap((m) => [m.createdAt, ...(m.submittedAt ? [m.submittedAt] : [])]),
  ]);
  const streakPct = Math.round(Math.min(currentStreakDays / STREAK_TARGET_DAYS, 1) * 100);

  const score = Math.round(0.5 * mockAccuracyPct + 0.3 * subjectCoveragePct + 0.2 * streakPct);

  return { score, breakdown: { mockAccuracyPct, subjectCoveragePct, streakPct } };
};
