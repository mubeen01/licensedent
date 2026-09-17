import { type Question } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type GetCustomQuizAttempt,
  type GetCustomQuizResults,
  type SaveCustomQuizAnswer,
  type StartCustomQuizAttempt,
  type SubmitCustomQuizAttempt,
} from 'wasp/server/operations';
import * as z from 'zod';
import { resolveOptionalImageUrl } from '../file-upload/s3Utils';
import { customQuizFiltersSchema, ensureQuizBuilderAccess, resolveCustomQuizQuestionIds } from '../questions/operations';
import { orderOptions, shuffle, type Option } from '../server/shuffleUtils';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

/* -------------------------------------------------------------------------- */
/*  CUSTOM QUIZ BUILDER (Phase 2 -- timed/exam-mode engine)                   */
/*  Mirrors mock-exams/operations.ts's start/save/submit/get/results shape    */
/*  almost exactly, but against an ad-hoc question set (resolved via Quiz     */
/*  Builder's own filters) instead of a fixed MockTest. No attempt cap here   */
/*  (unlike mock exams) -- not asked for, and Quiz Builder is already gated   */
/*  to the Extended/IDC Pathway plans (PRD-002 I8.2). Answers here do NOT     */
/*  write to UserAttempt/ReviewSchedule, same as Mock Exams -- see the        */
/*  schema.prisma comment on CustomQuizAttempt for why.                      */
/* -------------------------------------------------------------------------- */

const startCustomQuizAttemptInputSchema = z.object({
  filters: customQuizFiltersSchema,
  count: z.number().int().min(1).max(200),
  durationMinutes: z.number().int().min(1).max(600).nullable(),
});
type StartCustomQuizAttemptInput = z.infer<typeof startCustomQuizAttemptInputSchema>;

export const startCustomQuizAttempt: StartCustomQuizAttempt<StartCustomQuizAttemptInput, { attemptId: string }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const accessibleExamIds = await ensureQuizBuilderAccess(user.id, context);
  const args = ensureArgsSchemaOrThrowHttpError(startCustomQuizAttemptInputSchema, rawArgs);

  const matchingIds = await resolveCustomQuizQuestionIds(args.filters, user.id, accessibleExamIds, context);
  if (matchingIds.length === 0) {
    throw new HttpError(400, 'No questions match these filters');
  }
  // PRD-002 I8.3: real Fisher-Yates (previously a known-biased
  // `.sort(() => Math.random() - 0.5)`), plus a per-question option shuffle
  // persisted onto each item -- option order was never shuffled at all
  // before this. See src/server/shuffleUtils.ts.
  const chosenIds = shuffle(matchingIds).slice(0, args.count);
  const chosenQuestions = await context.entities.Question.findMany({
    where: { id: { in: chosenIds } },
    select: { id: true, options: true },
  });
  const optionsByQuestionId = new Map(chosenQuestions.map((q) => [q.id, q.options as unknown as Option[]]));

  const attempt = await context.entities.CustomQuizAttempt.create({
    data: {
      userId: user.id,
      durationMinutes: args.durationMinutes,
      items: {
        create: chosenIds.map((questionId, i) => ({
          questionId,
          order: i,
          optionOrder: shuffle((optionsByQuestionId.get(questionId) ?? []).map((o) => o.key)),
        })),
      },
    },
  });

  return { attemptId: attempt.id };
};

/* -------------------------------------------------------------------------- */
/*  TAKING an attempt (answer-blind, resumable) -- same shape as Mock Exams   */
/* -------------------------------------------------------------------------- */

type CustomQuizAttemptQuestionView = {
  order: number;
  questionId: string;
  stem: string;
  options: Question['options'];
  imageUrl: string | null;
  subjectName: string;
  selectedKey: string | null;
  markedForReview: boolean;
};

type CustomQuizAttemptView = {
  attemptId: string;
  status: 'in_progress' | 'submitted';
  durationMinutes: number | null;
  createdAt: Date;
  items: CustomQuizAttemptQuestionView[];
};

const getCustomQuizAttemptInputSchema = z.object({ attemptId: z.string().nonempty() });
type GetCustomQuizAttemptInput = z.infer<typeof getCustomQuizAttemptInputSchema>;

export const getCustomQuizAttempt: GetCustomQuizAttempt<GetCustomQuizAttemptInput, CustomQuizAttemptView> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getCustomQuizAttemptInputSchema, rawArgs);

  const attempt = await context.entities.CustomQuizAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
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
/*  AUTOSAVE an answer (no correctness feedback until submit)                 */
/* -------------------------------------------------------------------------- */

const saveCustomQuizAnswerInputSchema = z.object({
  attemptId: z.string().nonempty(),
  questionId: z.string().nonempty(),
  selectedKey: z.string().nullable(),
  markedForReview: z.boolean(),
});
type SaveCustomQuizAnswerInput = z.infer<typeof saveCustomQuizAnswerInputSchema>;

export const saveCustomQuizAnswer: SaveCustomQuizAnswer<SaveCustomQuizAnswerInput, { ok: true }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(saveCustomQuizAnswerInputSchema, rawArgs);

  const attempt = await context.entities.CustomQuizAttempt.findUnique({ where: { id: args.attemptId } });
  if (!attempt || attempt.userId !== user.id) {
    throw new HttpError(404, 'Attempt not found');
  }
  if (attempt.status !== 'in_progress') {
    throw new HttpError(400, 'This attempt has already been submitted');
  }

  await context.entities.CustomQuizAttemptItem.update({
    where: { attemptId_questionId: { attemptId: args.attemptId, questionId: args.questionId } },
    data: { selectedKey: args.selectedKey, markedForReview: args.markedForReview },
  });

  return { ok: true };
};

/* -------------------------------------------------------------------------- */
/*  SUBMIT (grade once, on demand)                                            */
/* -------------------------------------------------------------------------- */

const submitCustomQuizAttemptInputSchema = z.object({ attemptId: z.string().nonempty() });
type SubmitCustomQuizAttemptInput = z.infer<typeof submitCustomQuizAttemptInputSchema>;

export const submitCustomQuizAttempt: SubmitCustomQuizAttempt<
  SubmitCustomQuizAttemptInput,
  { correctCount: number; totalQuestions: number }
> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(submitCustomQuizAttemptInputSchema, rawArgs);

  const attempt = await context.entities.CustomQuizAttempt.findUnique({
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

  await context.entities.CustomQuizAttempt.update({
    where: { id: attempt.id },
    data: { status: 'submitted', submittedAt: new Date(), correctCount },
  });

  return { correctCount, totalQuestions: attempt.items.length };
};

/* -------------------------------------------------------------------------- */
/*  RESULTS (correct answers + explanations, only once submitted)             */
/* -------------------------------------------------------------------------- */

type CustomQuizResultItem = {
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

type CustomQuizResultsView = {
  submittedAt: Date | null;
  correctCount: number;
  totalQuestions: number;
  items: CustomQuizResultItem[];
};

const getCustomQuizResultsInputSchema = z.object({ attemptId: z.string().nonempty() });
type GetCustomQuizResultsInput = z.infer<typeof getCustomQuizResultsInputSchema>;

export const getCustomQuizResults: GetCustomQuizResults<GetCustomQuizResultsInput, CustomQuizResultsView> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getCustomQuizResultsInputSchema, rawArgs);

  const attempt = await context.entities.CustomQuizAttempt.findUnique({
    where: { id: args.attemptId },
    include: {
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
    submittedAt: attempt.submittedAt,
    correctCount: attempt.correctCount ?? 0,
    totalQuestions: attempt.items.length,
    items: await Promise.all(
      attempt.items.map(async (item) => ({
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
      }))
    ),
  };
};
