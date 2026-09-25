import { HttpError } from 'wasp/server';
import { type OnAfterEmailVerifiedHook, type OnBeforeLoginHook } from 'wasp/server/auth';
import { sendEmail } from '../email/send';
import { welcomeTemplate } from '../email/templates';

export const onBeforeLoginHook: OnBeforeLoginHook = async ({ user, prisma }) => {
  if (user.isDisabled) {
    throw new HttpError(403, 'This account has been disabled. Contact support if you think this is a mistake.');
  }
  // Fire-and-forget: a stalled write here shouldn't ever block a real login.
  prisma.user
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date(), loginCount: { increment: 1 } } })
    .catch((e) => {
      console.error('Failed to stamp lastLoginAt', e);
    });
};

// PRD-008 Phase 3: the immediate "your account is ready" email, sent exactly
// once, right after the address is actually confirmed (not at signup, so an
// unverified/never-completed signup never gets it). Best-effort: a mail
// failure here must never turn a successful verification into an error page.
export const onAfterEmailVerified: OnAfterEmailVerifiedHook = async ({ email, user, prisma }) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { fullName: true, exam: { select: { name: true } } },
    });
    await sendEmail({
      db: prisma,
      to: email,
      userId: user.id,
      category: 'transactional',
      template: 'welcome',
      dedupeKey: `welcome:${user.id}`,
      render: () => welcomeTemplate({ email, name: profile?.fullName ?? user.username, examName: profile?.exam?.name ?? null }),
    });
  } catch (err) {
    console.error('[email] welcome send failed:', err);
  }
};
