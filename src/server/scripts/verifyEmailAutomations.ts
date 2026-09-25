import type { PrismaClient } from '@prisma/client';
import { runDailyEmailAutomations } from '../../email/automations';
import { sendEmail } from '../../email/send';
import { fastTrackDecisionTemplate, planActivatedTemplate, welcomeTemplate } from '../../email/templates';

/**
 * PRD-008 Phase 3 live check: runs the real daily automations job function
 * directly against the dev DB (same entities shape the cron job gets from
 * Wasp), then reports what it decided to do. Safe to rerun -- dedupe keys
 * mean a second run only shows genuinely new milestones (if any), and dev
 * mode (EMAIL_SEND_MODE unset) never delivers to a real inbox regardless.
 *
 *   wasp db seed verifyEmailAutomations
 */
export async function verifyEmailAutomations(prisma: PrismaClient) {
  const entities = {
    User: prisma.user,
    Subscription: prisma.subscription,
    UserAttempt: prisma.userAttempt,
    MockExamAttempt: prisma.mockExamAttempt,
    ReviewSchedule: prisma.reviewSchedule,
  };

  const before = await prisma.emailLog.count();
  const counters = await runDailyEmailAutomations(undefined, { entities });
  const after = await prisma.emailLog.count();

  console.log('[verify-email-automations] counters (status: "sent" only):', counters);
  console.log('[verify-email-automations] EmailLog rows before/after:', before, after);

  const newRows = await prisma.emailLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.max(after - before, 0),
    select: { template: true, category: true, status: true, toEmail: true, dedupeKey: true, error: true },
  });
  console.log('[verify-email-automations] new EmailLog rows:\n' + JSON.stringify(newRows, null, 2));

  // The cron job above never exercises the three EVENT-triggered sends
  // (immediate welcome on email verification, plan-activated from the
  // Stripe webhook, Fast Track decision on approve/reject) -- they call the
  // same sendEmail()/template pair directly from their own hook/webhook/
  // action, not from this job. Smoke-test that pairing here against a real
  // user, using a "verify-" dedupe prefix that can never collide with a
  // real send, then delete the rows it creates so this stays safe to rerun.
  const anyUser = await prisma.user.findFirst({ where: { email: { not: null } }, select: { id: true, email: true } });
  if (anyUser?.email) {
    const stamp = Date.now();
    const results = await Promise.all([
      sendEmail({
        db: prisma,
        to: anyUser.email,
        userId: anyUser.id,
        category: 'transactional',
        template: 'welcome',
        dedupeKey: `verify-welcome:${stamp}`,
        render: () => welcomeTemplate({ email: anyUser.email!, name: null, examName: 'DHA' }),
      }),
      sendEmail({
        db: prisma,
        to: anyUser.email,
        userId: anyUser.id,
        category: 'transactional',
        template: 'plan-activated',
        dedupeKey: `verify-plan-activated:${stamp}`,
        render: () =>
          planActivatedTemplate({
            email: anyUser.email!,
            planName: 'Standard',
            examLabel: 'DHA',
            validUntil: new Date(Date.now() + 90 * 86400000),
            amountPaid: '$200',
          }),
      }),
      sendEmail({
        db: prisma,
        to: anyUser.email,
        userId: anyUser.id,
        category: 'transactional',
        template: 'fast-track-decision',
        dedupeKey: `verify-fast-track:${stamp}`,
        render: () => fastTrackDecisionTemplate({ email: anyUser.email!, name: null, approved: true }),
      }),
    ]);
    console.log('[verify-email-automations] event-triggered send smoke test:', JSON.stringify(results));
    await prisma.emailLog.deleteMany({ where: { dedupeKey: { startsWith: `verify-`, endsWith: `:${stamp}` } } });
  } else {
    console.log('[verify-email-automations] no user with an email found -- skipped event-triggered smoke test');
  }
}
