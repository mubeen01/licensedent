import { HttpError } from 'wasp/server';
import {
  type CompleteOnboarding,
  type GetMyOnboardingProfile,
  type UpdateTargetExamDate,
} from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

// Server-side backstop for the client's <input type="date" min={...}> --
// "days remaining" (dashboard study plan / readiness score) is meaningless
// for a past date. A native date input sends a plain "YYYY-MM-DD" string,
// which JS parses as UTC midnight regardless of the browser's timezone, so
// comparing against UTC "today" here matches that exactly; the extra
// 1-day allowance just absorbs the gap between the client's *local* "today"
// (what the min attribute uses) and the server's UTC "today" for students
// in timezones behind UTC, without weakening the actual guarantee (catching
// obviously-wrong dates like last year).
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const targetExamDateSchema = z.coerce.date().refine(
  (date) => {
    const now = new Date();
    const startOfTodayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return date.getTime() >= startOfTodayUTC - MS_PER_DAY;
  },
  { message: 'Target exam date cannot be in the past' }
);

type MyOnboardingExam = {
  id: string;
  name: string;
  code: string | null;
  flagEmoji: string | null;
  authorityLabel: string | null;
  colorGradient: string | null;
};

export type MyOnboardingProfile = {
  fullName: string | null;
  country: string | null;
  address: string | null;
  qualification: string | null;
  yearsOfExperience: number | null;
  targetExamDate: string | null;
  completedAt: string | null;
  exam: MyOnboardingExam | null;
} | null;

// Serves two consumers: the onboarding gate in src/client/App.tsx (checks
// completedAt) and the dashboard's personalization (exam/fullName/
// targetExamDate). Returns null rather than throwing when the user hasn't
// onboarded yet -- absence of a row IS "not onboarded", since the only writer
// is the one-shot completeOnboarding action below.
export const getMyOnboardingProfile: GetMyOnboardingProfile<void, MyOnboardingProfile> = async (
  _args,
  context
) => {
  const user = ensureUser(context.user);

  const profile = await context.entities.UserProfile.findUnique({
    where: { userId: user.id },
    include: {
      exam: {
        select: { id: true, name: true, code: true, flagEmoji: true, authorityLabel: true, colorGradient: true },
      },
    },
  });

  if (!profile) return null;

  return {
    fullName: profile.fullName,
    country: profile.country,
    address: profile.address,
    qualification: profile.qualification,
    yearsOfExperience: profile.yearsOfExperience,
    targetExamDate: profile.targetExamDate?.toISOString() ?? null,
    completedAt: profile.completedAt?.toISOString() ?? null,
    exam: profile.exam,
  };
};

const completeOnboardingInputSchema = z.object({
  examId: z.string().nonempty(),
  targetExamDate: targetExamDateSchema,
  fullName: z.string().trim().min(1).max(200),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
  qualification: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  address: z.string().trim().max(500).optional(),
});
type CompleteOnboardingInput = z.infer<typeof completeOnboardingInputSchema>;

// One-shot: the whole 3-step wizard collects everything client-side (plus a
// localStorage draft so a refresh mid-wizard doesn't lose typed data) and
// calls this exactly once, on final submit. Upsert-by-userId makes it safe to
// retry (a double-click) and, later, safe to re-run from an "edit my info"
// entry point without any schema change.
export const completeOnboarding: CompleteOnboarding<CompleteOnboardingInput, { ok: true }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(completeOnboardingInputSchema, rawArgs);

  const exam = await context.entities.Exam.findUnique({ where: { id: args.examId } });
  if (!exam || !exam.isActive) {
    throw new HttpError(404, 'Selected exam not found or no longer active');
  }

  const data = {
    examId: args.examId,
    targetExamDate: args.targetExamDate,
    fullName: args.fullName,
    yearsOfExperience: args.yearsOfExperience,
    qualification: args.qualification,
    country: args.country,
    address: args.address || null,
    completedAt: new Date(),
  };

  await context.entities.UserProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return { ok: true };
};

const updateTargetExamDateInputSchema = z.object({ targetExamDate: targetExamDateSchema });
type UpdateTargetExamDateInput = z.infer<typeof updateTargetExamDateInputSchema>;

// Lets a student change their exam date after onboarding -- until this, the
// only writer of targetExamDate was the one-shot completeOnboarding above,
// so it was stuck forever once set. Feeds the dashboard's study plan card.
export const updateTargetExamDate: UpdateTargetExamDate<UpdateTargetExamDateInput, { ok: true }> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateTargetExamDateInputSchema, rawArgs);

  await context.entities.UserProfile.update({
    where: { userId: user.id },
    data: { targetExamDate: args.targetExamDate },
  });

  return { ok: true };
};
