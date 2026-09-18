import { randomBytes } from 'crypto';
import { type AdminUserNote, type Subscription, type User, type UserProfile } from 'wasp/entities';
import { createProviderId, createUser, findAuthIdentity, sanitizeAndSerializeProviderData } from 'wasp/server/auth';
import { createPasswordResetLink, sendPasswordResetEmail } from 'wasp/server/auth/email/utils';
import { HttpError, prisma } from 'wasp/server';
import {
  type AddUserNote,
  type DeleteUserNote,
  type GetUserActivitySummary,
  type GetUserDetail,
  type GetUserNotes,
  type GetUserSubscriptions,
  type GetUsersOverviewStats,
  type GrantUserSubscription,
  type InviteUser,
  type RevokeUserSubscription,
  type SendUserPasswordReset,
  type ToggleUserDisabled,
  type UpdateUserProfileByAdmin,
  type UpdateUserTags,
} from 'wasp/server/operations';
import * as z from 'zod';
import { getInviteEmailContent, getPasswordResetEmailContent } from '../../../auth/email-and-pass/emails';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';
import { PaymentPlanId, paymentPlans } from '../../../payment/plans';

// Matches the fromField declared inline for email auth in main.wasp.
const EMAIL_FROM_FIELD = { name: 'LicenseDent', email: 'support@licensedent.com' };

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

// --- Subscriptions ---------------------------------------------------------

export type SubscriptionWithExam = Subscription & {
  examAccess: { id: string; name: string; flagEmoji: string | null } | null;
  expiresAt: Date;
  isActive: boolean;
};

const getUserSubscriptionsInputSchema = z.object({ userId: z.string().nonempty() });
type GetUserSubscriptionsInput = z.infer<typeof getUserSubscriptionsInputSchema>;

export const getUserSubscriptions: GetUserSubscriptions<GetUserSubscriptionsInput, SubscriptionWithExam[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { userId } = ensureArgsSchemaOrThrowHttpError(getUserSubscriptionsInputSchema, rawArgs);

  const subscriptions = await context.entities.Subscription.findMany({
    where: { userId },
    include: { examAccess: { select: { id: true, name: true, flagEmoji: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  return subscriptions.map((s) => {
    const expiresAt = new Date(s.createdAt.getTime() + s.durationDays * 24 * 60 * 60 * 1000);
    return { ...s, expiresAt, isActive: expiresAt.getTime() > now };
  });
};

const grantUserSubscriptionInputSchema = z.object({
  userId: z.string().nonempty(),
  planType: z.nativeEnum(PaymentPlanId),
  examId: z.string().nonempty().nullable().optional(),
});
type GrantUserSubscriptionInput = z.infer<typeof grantUserSubscriptionInputSchema>;

// Duration/all-exams-access always come from the real payment plan config
// (payment/plans.ts) rather than admin-entered numbers, so a manually granted
// pass behaves identically to one a student actually bought.
export const grantUserSubscription: GrantUserSubscription<GrantUserSubscriptionInput, Subscription> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { userId, planType, examId } = ensureArgsSchemaOrThrowHttpError(grantUserSubscriptionInputSchema, rawArgs);

  const plan = paymentPlans[planType];
  if (plan.effect.kind !== 'access') {
    throw new HttpError(400, `Plan ${planType} is not a grantable access plan`);
  }

  // Resolved server-side, same pattern as generateCheckoutSession -- for implied-exam
  // plans (e.g. Ireland Pathway) the exam is fixed by the plan itself, not admin-picked,
  // and any examId the admin form happens to send for one is ignored rather than trusted.
  let resolvedExamId: string | null = null;
  if (!plan.effect.allExamsAccess) {
    if (plan.effect.impliedExamCode) {
      const impliedExam = await context.entities.Exam.findFirst({ where: { code: plan.effect.impliedExamCode } });
      if (!impliedExam) {
        throw new HttpError(500, `Implied exam with code "${plan.effect.impliedExamCode}" not found.`);
      }
      resolvedExamId = impliedExam.id;
    } else {
      if (!examId) {
        throw new HttpError(400, 'This plan is scoped to a single exam — pick which exam to grant access to');
      }
      resolvedExamId = examId;
    }
  }

  const created = await context.entities.Subscription.create({
    data: {
      userId,
      planType,
      durationDays: plan.effect.durationDays,
      allExamsAccess: plan.effect.allExamsAccess,
      examAccessId: resolvedExamId,
    },
  });

  await logAdminAction(context, {
    action: 'user.grantSubscription',
    entityType: 'User',
    entityId: userId,
    details: { planType, durationDays: plan.effect.durationDays, examId: resolvedExamId },
  });

  return created;
};

const revokeUserSubscriptionInputSchema = z.object({ subscriptionId: z.string().nonempty() });
type RevokeUserSubscriptionInput = z.infer<typeof revokeUserSubscriptionInputSchema>;

export const revokeUserSubscription: RevokeUserSubscription<RevokeUserSubscriptionInput, void> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { subscriptionId } = ensureArgsSchemaOrThrowHttpError(revokeUserSubscriptionInputSchema, rawArgs);

  const sub = await context.entities.Subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) {
    throw new HttpError(404, 'Subscription not found');
  }

  await context.entities.Subscription.delete({ where: { id: subscriptionId } });

  await logAdminAction(context, {
    action: 'user.revokeSubscription',
    entityType: 'User',
    entityId: sub.userId,
    details: { planType: sub.planType, subscriptionId },
  });
};

// --- Enable / disable --------------------------------------------------------

const toggleUserDisabledInputSchema = z.object({
  id: z.string().nonempty(),
  isDisabled: z.boolean(),
  reason: z.string().trim().max(500).nonempty().optional(),
});
type ToggleUserDisabledInput = z.infer<typeof toggleUserDisabledInputSchema>;

export const toggleUserDisabled: ToggleUserDisabled<ToggleUserDisabledInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id, isDisabled, reason } = ensureArgsSchemaOrThrowHttpError(toggleUserDisabledInputSchema, rawArgs);

  if (context.user!.id === id && isDisabled) {
    throw new HttpError(400, "You can't disable your own account");
  }

  const before = await context.entities.User.findUniqueOrThrow({ where: { id } });
  await context.entities.User.update({ where: { id }, data: { isDisabled } });

  // Setting isDisabled alone only blocks the NEXT login (onBeforeLoginHook) --
  // a session opened before the disable stays valid until it naturally
  // expires otherwise. Kill every session tied to this user's Auth record so
  // "disabled" actually means signed out immediately, matching what the
  // admin UI already tells the admin will happen. Session isn't one of our
  // own schema.prisma entities (Wasp's auth feature injects it), so this
  // uses the raw prisma client rather than context.entities.
  if (isDisabled) {
    await prisma.session.deleteMany({ where: { auth: { userId: id } } });
  }

  await logAdminAction(context, {
    action: isDisabled ? 'user.disable' : 'user.enable',
    entityType: 'User',
    entityId: id,
    details: { email: before.email, ...(reason ? { reason } : {}) },
  });
};

// --- Invite ------------------------------------------------------------------

const inviteUserInputSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().nonempty().nullable().optional(),
  isAdmin: z.boolean().optional(),
});
type InviteUserInput = z.infer<typeof inviteUserInputSchema>;

// Creates a real, loggable-in account (not a pending "invite" row) with a
// throwaway random password the recipient never sees, then emails them a
// password-reset-style link so they set their own password -- same mechanism
// "Forgot password" uses, just triggered by an admin instead of the user.
export const inviteUser: InviteUser<InviteUserInput, Pick<User, 'id' | 'email'>> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { email, username, isAdmin } = ensureArgsSchemaOrThrowHttpError(inviteUserInputSchema, rawArgs);

  const providerId = createProviderId('email', email);
  const existing = await findAuthIdentity(providerId);
  if (existing) {
    throw new HttpError(400, 'A user with this email already exists');
  }

  const throwawayPassword = randomBytes(32).toString('hex');
  const providerData = await sanitizeAndSerializeProviderData<'email'>({
    hashedPassword: throwawayPassword,
    isEmailVerified: true,
    emailVerificationSentAt: null,
    passwordResetSentAt: null,
  });

  const user = await createUser(providerId, providerData, {
    email,
    username: username || email,
    isAdmin: isAdmin ?? false,
  } as any);

  const passwordResetLink = await createPasswordResetLink(email, '/password-reset');
  try {
    await sendPasswordResetEmail(email, {
      from: EMAIL_FROM_FIELD,
      to: email,
      ...getInviteEmailContent({ passwordResetLink }),
    });
  } catch (e) {
    console.error('Failed to send invite email:', e);
    throw new HttpError(500, 'Account was created but the invite email failed to send. Ask them to use "Forgot password" to log in.');
  }

  await logAdminAction(context, {
    action: 'user.invite',
    entityType: 'User',
    entityId: user.id,
    details: { email },
  });

  return { id: user.id, email };
};

// --- Send password reset (for locked-out / support requests) ---------------

const sendUserPasswordResetInputSchema = z.object({ userId: z.string().nonempty() });
type SendUserPasswordResetInput = z.infer<typeof sendUserPasswordResetInputSchema>;

export const sendUserPasswordReset: SendUserPasswordReset<SendUserPasswordResetInput, void> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { userId } = ensureArgsSchemaOrThrowHttpError(sendUserPasswordResetInputSchema, rawArgs);

  const user = await context.entities.User.findUniqueOrThrow({ where: { id: userId } });
  if (!user.email) {
    throw new HttpError(400, 'This user has no email on file');
  }

  const passwordResetLink = await createPasswordResetLink(user.email, '/password-reset');
  await sendPasswordResetEmail(user.email, {
    from: EMAIL_FROM_FIELD,
    to: user.email,
    ...getPasswordResetEmailContent({ passwordResetLink }),
  });

  await logAdminAction(context, {
    action: 'user.sendPasswordReset',
    entityType: 'User',
    entityId: userId,
    details: { email: user.email },
  });
};

// --- Activity summary --------------------------------------------------------

export type UserActivitySummary = {
  totalAttempts: number;
  correctAttempts: number;
  mockExamsSubmitted: number;
  lastActiveAt: Date | null;
  recentAttempts: { id: string; questionStem: string; isCorrect: boolean; createdAt: Date }[];
  recentMockExams: { id: string; status: string; correctCount: number | null; durationMinutes: number | null; createdAt: Date }[];
};

const getUserActivitySummaryInputSchema = z.object({ userId: z.string().nonempty() });
type GetUserActivitySummaryInput = z.infer<typeof getUserActivitySummaryInputSchema>;

export const getUserActivitySummary: GetUserActivitySummary<GetUserActivitySummaryInput, UserActivitySummary> =
  async (rawArgs, context) => {
    ensureAdmin(context.user);
    const { userId } = ensureArgsSchemaOrThrowHttpError(getUserActivitySummaryInputSchema, rawArgs);

    const [totalAttempts, correctAttempts, mockExamsSubmitted, lastAttempt, lastMock, user, recentAttempts, recentMockExams] =
      await Promise.all([
        context.entities.UserAttempt.count({ where: { userId } }),
        context.entities.UserAttempt.count({ where: { userId, isCorrect: true } }),
        context.entities.MockExamAttempt.count({ where: { userId, status: 'submitted' } }),
        context.entities.UserAttempt.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        context.entities.MockExamAttempt.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        context.entities.User.findUnique({ where: { id: userId }, select: { lastLoginAt: true } }),
        context.entities.UserAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, isCorrect: true, createdAt: true, question: { select: { stem: true } } },
        }),
        context.entities.MockExamAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, status: true, correctCount: true, durationMinutes: true, createdAt: true },
        }),
      ]);

    const candidateDates = [lastAttempt?.createdAt, lastMock?.createdAt, user?.lastLoginAt].filter(
      (d): d is Date => !!d
    );
    const lastActiveAt = candidateDates.length > 0 ? new Date(Math.max(...candidateDates.map((d) => d.getTime()))) : null;

    return {
      totalAttempts,
      correctAttempts,
      mockExamsSubmitted,
      lastActiveAt,
      recentAttempts: recentAttempts.map((a) => ({
        id: a.id,
        questionStem: a.question.stem,
        isCorrect: a.isCorrect,
        createdAt: a.createdAt,
      })),
      recentMockExams,
    };
  };

// --- User detail (header + profile tab) --------------------------------------

export type UserDetail = Pick<
  User,
  'id' | 'email' | 'username' | 'isAdmin' | 'isDisabled' | 'createdAt' | 'lastLoginAt' | 'loginCount' | 'tags'
> & {
  profile: Pick<
    UserProfile,
    'fullName' | 'country' | 'address' | 'qualification' | 'yearsOfExperience' | 'targetExamDate' | 'examId'
  > & { exam: { id: string; name: string } | null } | null;
};

const getUserDetailInputSchema = z.object({ userId: z.string().nonempty() });
type GetUserDetailInput = z.infer<typeof getUserDetailInputSchema>;

export const getUserDetail: GetUserDetail<GetUserDetailInput, UserDetail> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { userId } = ensureArgsSchemaOrThrowHttpError(getUserDetailInputSchema, rawArgs);

  const user = await context.entities.User.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      isDisabled: true,
      createdAt: true,
      lastLoginAt: true,
      loginCount: true,
      tags: true,
      profile: {
        select: {
          fullName: true,
          country: true,
          address: true,
          qualification: true,
          yearsOfExperience: true,
          targetExamDate: true,
          examId: true,
          exam: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
};

// --- Internal admin notes -----------------------------------------------------

export type UserNote = AdminUserNote & { admin: Pick<User, 'id' | 'email' | 'username'> };

const getUserNotesInputSchema = z.object({ userId: z.string().nonempty() });
type GetUserNotesInput = z.infer<typeof getUserNotesInputSchema>;

export const getUserNotes: GetUserNotes<GetUserNotesInput, UserNote[]> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { userId } = ensureArgsSchemaOrThrowHttpError(getUserNotesInputSchema, rawArgs);

  return context.entities.AdminUserNote.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { admin: { select: { id: true, email: true, username: true } } },
  });
};

const addUserNoteInputSchema = z.object({ userId: z.string().nonempty(), body: z.string().trim().min(1).max(2000) });
type AddUserNoteInput = z.infer<typeof addUserNoteInputSchema>;

export const addUserNote: AddUserNote<AddUserNoteInput, UserNote> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { userId, body } = ensureArgsSchemaOrThrowHttpError(addUserNoteInputSchema, rawArgs);

  const note = await context.entities.AdminUserNote.create({
    data: { userId, adminId: context.user!.id, body },
    include: { admin: { select: { id: true, email: true, username: true } } },
  });

  await logAdminAction(context, {
    action: 'user.addNote',
    entityType: 'User',
    entityId: userId,
    details: { noteId: note.id },
  });

  return note;
};

const deleteUserNoteInputSchema = z.object({ noteId: z.string().nonempty() });
type DeleteUserNoteInput = z.infer<typeof deleteUserNoteInputSchema>;

export const deleteUserNote: DeleteUserNote<DeleteUserNoteInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { noteId } = ensureArgsSchemaOrThrowHttpError(deleteUserNoteInputSchema, rawArgs);

  const note = await context.entities.AdminUserNote.findUnique({ where: { id: noteId } });
  if (!note) {
    throw new HttpError(404, 'Note not found');
  }

  await context.entities.AdminUserNote.delete({ where: { id: noteId } });

  await logAdminAction(context, {
    action: 'user.deleteNote',
    entityType: 'User',
    entityId: note.userId,
    details: { noteId },
  });
};

// --- Tags / segments -----------------------------------------------------------

const updateUserTagsInputSchema = z.object({
  userId: z.string().nonempty(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
});
type UpdateUserTagsInput = z.infer<typeof updateUserTagsInputSchema>;

export const updateUserTags: UpdateUserTags<UpdateUserTagsInput, Pick<User, 'id' | 'tags'>> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { userId, tags } = ensureArgsSchemaOrThrowHttpError(updateUserTagsInputSchema, rawArgs);

  const uniqueTags = [...new Set(tags)];
  const updated = await context.entities.User.update({
    where: { id: userId },
    data: { tags: uniqueTags },
    select: { id: true, tags: true },
  });

  await logAdminAction(context, {
    action: 'user.updateTags',
    entityType: 'User',
    entityId: userId,
    details: { tags: uniqueTags },
  });

  return updated;
};

// --- Admin-edited profile -------------------------------------------------------

const updateUserProfileByAdminInputSchema = z.object({
  userId: z.string().nonempty(),
  fullName: z.string().trim().max(200).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  qualification: z.string().trim().max(200).nullable().optional(),
  yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
  targetExamDate: z.coerce.date().nullable().optional(),
  examId: z.string().nonempty().nullable().optional(),
});
type UpdateUserProfileByAdminInput = z.infer<typeof updateUserProfileByAdminInputSchema>;

export const updateUserProfileByAdmin: UpdateUserProfileByAdmin<UpdateUserProfileByAdminInput, UserProfile> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { userId, ...fields } = ensureArgsSchemaOrThrowHttpError(updateUserProfileByAdminInputSchema, rawArgs);

  const updated = await context.entities.UserProfile.upsert({
    where: { userId },
    create: { userId, ...fields },
    update: fields,
  });

  await logAdminAction(context, {
    action: 'user.updateProfile',
    entityType: 'User',
    entityId: userId,
    details: fields,
  });

  return updated;
};

// --- Users overview stats (table stat cards) ------------------------------------

export type UsersOverviewStats = {
  totalUsers: number;
  newLast7Days: number;
  activeToday: number;
  disabledCount: number;
  adminCount: number;
};

export const getUsersOverviewStats: GetUsersOverviewStats<void, UsersOverviewStats> = async (_args, context) => {
  ensureAdmin(context.user);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalUsers, newLast7Days, activeToday, disabledCount, adminCount] = await Promise.all([
    context.entities.User.count(),
    context.entities.User.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    context.entities.User.count({ where: { lastLoginAt: { gte: startOfToday } } }),
    context.entities.User.count({ where: { isDisabled: true } }),
    context.entities.User.count({ where: { isAdmin: true } }),
  ]);

  return { totalUsers, newLast7Days, activeToday, disabledCount, adminCount };
};
