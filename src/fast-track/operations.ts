import { type Exam, type FastTrackApplication } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type ApproveFastTrackApplication,
  type CreateFastTrackApplication,
  type GetFastTrackApplications,
  type GetMyFastTrackApplication,
  type RejectFastTrackApplication,
} from 'wasp/server/operations';
import * as z from 'zod';
import { grantUserSubscription } from '../admin/dashboards/users/operations';
import { PaymentPlanId } from '../payment/plans';
import { logAdminAction } from '../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser(user: { id: string } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Log in to apply');
  }
  return user;
}

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

const APPLICATION_PENDING_OR_APPROVED = ['pending', 'approved'] as const;

// --- Applicant side ---------------------------------------------------------

const createInputSchema = z.object({
  examId: z.string().nonempty(),
  city: z.string().trim().min(1, 'City is required').max(120),
  experience: z.string().trim().min(1, 'Tell us a bit about your experience').max(2000),
  whyThisExam: z.string().trim().min(1, "Tell us why you're sitting this exam").max(2000),
});
type CreateInput = z.infer<typeof createInputSchema>;

// One free Fast Track pilot slot per user -- someone already pending or
// already approved can't submit a second application. A previously rejected
// applicant CAN re-apply (e.g. with a different exam or more detail).
export const createFastTrackApplication: CreateFastTrackApplication<CreateInput, FastTrackApplication> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const { examId, city, experience, whyThisExam } = ensureArgsSchemaOrThrowHttpError(createInputSchema, rawArgs);

  const existing = await context.entities.FastTrackApplication.findFirst({
    where: { userId: user.id, status: { in: [...APPLICATION_PENDING_OR_APPROVED] } },
  });
  if (existing) {
    throw new HttpError(400, "You've already got an application on file for this.");
  }

  const exam = await context.entities.Exam.findUnique({ where: { id: examId } });
  if (!exam) {
    throw new HttpError(400, 'Pick a real exam from the list.');
  }

  return context.entities.FastTrackApplication.create({
    data: { userId: user.id, examId, city, experience, whyThisExam },
  });
};

export type MyFastTrackApplication = FastTrackApplication & {
  exam: Pick<Exam, 'id' | 'code' | 'name' | 'flagEmoji'>;
};

export const getMyFastTrackApplication: GetMyFastTrackApplication<void, MyFastTrackApplication | null> = async (
  _args,
  context
) => {
  const user = ensureUser(context.user);
  return context.entities.FastTrackApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { exam: { select: { id: true, code: true, name: true, flagEmoji: true } } },
  });
};

// --- Admin side --------------------------------------------------------------

const listInputSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(50),
});
type ListInput = z.infer<typeof listInputSchema>;

export type FastTrackApplicationWithRelations = FastTrackApplication & {
  user: { id: string; username: string | null; email: string | null };
  exam: { id: string; code: string | null; name: string; flagEmoji: string | null };
};

export const getFastTrackApplications: GetFastTrackApplications<ListInput, FastTrackApplicationWithRelations[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { status, skip, take } = ensureArgsSchemaOrThrowHttpError(listInputSchema, rawArgs);

  return context.entities.FastTrackApplication.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { select: { id: true, username: true, email: true } },
      exam: { select: { id: true, code: true, name: true, flagEmoji: true } },
    },
    // Pending first (the actual queue), newest of each group first.
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    skip,
    take,
  });
};

const applicationIdInputSchema = z.object({ applicationId: z.string().nonempty() });
type ApplicationIdInput = z.infer<typeof applicationIdInputSchema>;

// Approving IS the grant: creates a real Subscription via the exact same
// grantUserSubscription logic admin comps already use (source: admin_grant,
// duration/allExamsAccess from payment/plans.ts -- never admin-entered), so
// this pilot slot is indistinguishable from a paid Fast Track purchase to
// every downstream access check (see payment/access.ts).
export const approveFastTrackApplication: ApproveFastTrackApplication<ApplicationIdInput, FastTrackApplication> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { applicationId } = ensureArgsSchemaOrThrowHttpError(applicationIdInputSchema, rawArgs);

  const application = await context.entities.FastTrackApplication.findUnique({ where: { id: applicationId } });
  if (!application) {
    throw new HttpError(404, 'Application not found');
  }
  if (application.status !== 'pending') {
    throw new HttpError(400, 'This application was already reviewed');
  }

  await grantUserSubscription(
    { userId: application.userId, planType: PaymentPlanId.FastTrack, examId: application.examId },
    context
  );

  const updated = await context.entities.FastTrackApplication.update({
    where: { id: applicationId },
    data: { status: 'approved', reviewedById: context.user!.id, reviewedAt: new Date() },
  });

  await logAdminAction(context, {
    action: 'fastTrackApplication.approve',
    entityType: 'FastTrackApplication',
    entityId: applicationId,
    details: { userId: application.userId, examId: application.examId },
  });

  return updated;
};

export const rejectFastTrackApplication: RejectFastTrackApplication<ApplicationIdInput, FastTrackApplication> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { applicationId } = ensureArgsSchemaOrThrowHttpError(applicationIdInputSchema, rawArgs);

  const application = await context.entities.FastTrackApplication.findUnique({ where: { id: applicationId } });
  if (!application) {
    throw new HttpError(404, 'Application not found');
  }
  if (application.status !== 'pending') {
    throw new HttpError(400, 'This application was already reviewed');
  }

  const updated = await context.entities.FastTrackApplication.update({
    where: { id: applicationId },
    data: { status: 'rejected', reviewedById: context.user!.id, reviewedAt: new Date() },
  });

  await logAdminAction(context, {
    action: 'fastTrackApplication.reject',
    entityType: 'FastTrackApplication',
    entityId: applicationId,
  });

  return updated;
};
