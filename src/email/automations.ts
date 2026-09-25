// PRD-008 Phase 3: the one daily cron job that drives every time-based email.
// Each automation below queries its own candidates and calls sendEmail()
// directly (which uses wasp/server's own prisma, not context.entities --
// see send.ts) -- consent, suppression and dedupe all happen inside it, so
// this file only ever needs to decide WHO is eligible and WHICH dedupeKey
// makes that send idempotent across reruns.
//
// Two dedupe-key shapes are used on purpose:
//  - user-scoped, no date (`welcome-series-2:<userId>`, `free-to-paid-3d:<userId>`):
//    the eligibility check is "at least N days since X", so a missed run just
//    catches up on the next one -- it will never send twice.
//  - instance-scoped (`inactive-3d:<userId>:<lastActivityIso>`,
//    `plan-expiring-7d:<subscriptionId>`): the eligibility check is a
//    threshold that stays true for a while (days inactive keeps climbing;
//    days-left-on-a-subscription keeps falling), so the dedupe key freezes
//    the *instance* of that milestone -- a new inactive stretch or a new
//    subscription gets its own key.
import type { PrismaClient } from '@prisma/client';
import { sendEmail } from './send';
import { createNotification } from '../notifications/operations';
import {
  freeToPaidTemplate,
  inactivityTemplate,
  planExpiredTemplate,
  planExpiringTemplate,
  weeklyDigestTemplate,
  welcomeSeriesTemplate,
} from './templates';
import { effectiveExpiryOf } from '../payment/access';
import { prettyPaymentPlanName, PaymentPlanId } from '../payment/plans';

type JobEntities = {
  User: PrismaClient['user'];
  Subscription: PrismaClient['subscription'];
  UserAttempt: PrismaClient['userAttempt'];
  MockExamAttempt: PrismaClient['mockExamAttempt'];
  ReviewSchedule: PrismaClient['reviewSchedule'];
  Notification: PrismaClient['notification'];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

function displayName(profile: { fullName: string | null } | null, username: string | null): string | null {
  return profile?.fullName ?? username ?? null;
}

type Counters = Record<
  | 'welcomeSeries'
  | 'freeToPaid'
  | 'planExpiring7d'
  | 'planExpiring1d'
  | 'planExpired'
  | 'inactive3d'
  | 'inactive7d'
  | 'weeklyDigest',
  number
>;

function newCounters(): Counters {
  return {
    welcomeSeries: 0,
    freeToPaid: 0,
    planExpiring7d: 0,
    planExpiring1d: 0,
    planExpired: 0,
    inactive3d: 0,
    inactive7d: 0,
    weeklyDigest: 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Welcome series (day 2 + day 5 after signup)                               */
/* -------------------------------------------------------------------------- */

async function runWelcomeSeries(entities: JobEntities, now: Date, counters: Counters) {
  const users = await entities.User.findMany({
    where: { email: { not: null }, createdAt: { lte: new Date(now.getTime() - 2 * DAY_MS) } },
    select: { id: true, email: true, username: true, createdAt: true, profile: { select: { fullName: true } } },
  });

  for (const u of users) {
    const name = displayName(u.profile, u.username);
    const step2 = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'lifecycle',
      template: 'welcome-series-2',
      dedupeKey: `welcome-series-2:${u.id}`,
      render: (links) => welcomeSeriesTemplate({ email: u.email!, name, ...links, step: 2 }),
    });
    if (step2.status === 'sent') counters.welcomeSeries += 1;

    if (u.createdAt > new Date(now.getTime() - 5 * DAY_MS)) continue;
    const step5 = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'lifecycle',
      template: 'welcome-series-5',
      dedupeKey: `welcome-series-5:${u.id}`,
      render: (links) => welcomeSeriesTemplate({ email: u.email!, name, ...links, step: 5 }),
    });
    if (step5.status === 'sent') counters.welcomeSeries += 1;
  }
}

/* -------------------------------------------------------------------------- */
/*  Free -> paid sequence (day 3 + day 7 for users who never bought a plan)   */
/* -------------------------------------------------------------------------- */

async function runFreeToPaid(entities: JobEntities, now: Date, counters: Counters) {
  const users = await entities.User.findMany({
    where: {
      email: { not: null },
      createdAt: { lte: new Date(now.getTime() - 3 * DAY_MS) },
      subscriptions: { none: {} },
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      profile: { select: { fullName: true } },
      _count: { select: { userAttempts: true } },
    },
  });

  for (const u of users) {
    const name = displayName(u.profile, u.username);
    const daysActive = daysBetween(u.createdAt, now);
    const attempted = u._count.userAttempts;

    const day3 = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'lifecycle',
      template: 'free-to-paid-3d',
      dedupeKey: `free-to-paid-3d:${u.id}`,
      render: (links) => freeToPaidTemplate({ email: u.email!, name, ...links, attempted, daysActive }),
    });
    if (day3.status === 'sent') counters.freeToPaid += 1;

    if (daysActive < 7) continue;
    const day7 = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'lifecycle',
      template: 'free-to-paid-7d',
      dedupeKey: `free-to-paid-7d:${u.id}`,
      render: (links) => freeToPaidTemplate({ email: u.email!, name, ...links, attempted, daysActive }),
    });
    if (day7.status === 'sent') counters.freeToPaid += 1;
  }
}

/* -------------------------------------------------------------------------- */
/*  Plan expiring (7d/1d) + plan expired                                      */
/* -------------------------------------------------------------------------- */

type SubRow = {
  id: string;
  createdAt: Date;
  durationDays: number;
  expiresAt: Date | null;
  planType: string;
  allExamsAccess: boolean;
  examAccess: { name: string } | null;
};

function pickLiveSubscription(subs: SubRow[], now: Date): (SubRow & { effectiveExpiresAt: Date }) | null {
  const live = subs
    .map((s) => ({ ...s, effectiveExpiresAt: effectiveExpiryOf(s) }))
    .filter((s) => s.effectiveExpiresAt > now)
    .sort((a, b) => b.effectiveExpiresAt.getTime() - a.effectiveExpiresAt.getTime())[0];
  return live ?? null;
}

function mostRecentlyExpired(subs: SubRow[]): (SubRow & { effectiveExpiresAt: Date }) | null {
  const withExpiry = subs.map((s) => ({ ...s, effectiveExpiresAt: effectiveExpiryOf(s) }));
  withExpiry.sort((a, b) => b.effectiveExpiresAt.getTime() - a.effectiveExpiresAt.getTime());
  return withExpiry[0] ?? null;
}

async function runPlanExpiry(entities: JobEntities, now: Date, counters: Counters) {
  const users = await entities.User.findMany({
    where: { email: { not: null }, subscriptions: { some: {} } },
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { fullName: true } },
      subscriptions: {
        select: {
          id: true,
          createdAt: true,
          durationDays: true,
          expiresAt: true,
          planType: true,
          allExamsAccess: true,
          examAccess: { select: { name: true } },
        },
      },
    },
  });

  for (const u of users) {
    const name = displayName(u.profile, u.username);
    const live = pickLiveSubscription(u.subscriptions, now);

    if (live) {
      const daysLeft = daysBetween(now, live.effectiveExpiresAt);
      const planName = prettyPaymentPlanName(live.planType as PaymentPlanId);

      if (daysLeft >= 2 && daysLeft <= 7) {
        const res = await sendEmail({
          to: u.email!,
          userId: u.id,
          category: 'transactional',
          template: 'plan-expiring-7d',
          dedupeKey: `plan-expiring-7d:${live.id}`,
          render: () => planExpiringTemplate({ email: u.email!, name, planName, daysLeft, expiresOn: live.effectiveExpiresAt }),
        });
        if (res.status === 'sent') {
          counters.planExpiring7d += 1;
          await createNotification(
            { Notification: entities.Notification },
            {
              userId: u.id,
              type: 'plan_expiring',
              title: `${planName} expires in ${daysLeft} days`,
              body: 'Renew from Billing to keep uninterrupted access.',
              link: '/billing',
            }
          ).catch((err) => console.error('[automations] plan-expiring-7d notification row failed:', err));
        }
      }

      if (daysLeft >= 0 && daysLeft <= 1) {
        const res = await sendEmail({
          to: u.email!,
          userId: u.id,
          category: 'transactional',
          template: 'plan-expiring-1d',
          dedupeKey: `plan-expiring-1d:${live.id}`,
          render: () => planExpiringTemplate({ email: u.email!, name, planName, daysLeft, expiresOn: live.effectiveExpiresAt }),
        });
        if (res.status === 'sent') {
          counters.planExpiring1d += 1;
          await createNotification(
            { Notification: entities.Notification },
            {
              userId: u.id,
              type: 'plan_expiring',
              title: daysLeft <= 0 ? `${planName} expires today` : `${planName} expires tomorrow`,
              body: 'Renew from Billing to keep uninterrupted access.',
              link: '/billing',
            }
          ).catch((err) => console.error('[automations] plan-expiring-1d notification row failed:', err));
        }
      }
      continue;
    }

    // No live subscription right now: tell them once, only while the loss is
    // recent (within 3 days) -- an old churn from months ago shouldn't
    // resurface just because they still have no active plan today.
    const recent = mostRecentlyExpired(u.subscriptions);
    if (!recent) continue;
    const daysSinceExpiry = daysBetween(recent.effectiveExpiresAt, now);
    if (daysSinceExpiry < 0 || daysSinceExpiry > 3) continue;

    const res = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'transactional',
      template: 'plan-expired',
      dedupeKey: `plan-expired:${recent.id}`,
      render: () => planExpiredTemplate({ email: u.email!, name, planName: prettyPaymentPlanName(recent.planType as PaymentPlanId) }),
    });
    if (res.status === 'sent') counters.planExpired += 1;
  }
}

/* -------------------------------------------------------------------------- */
/*  "We miss you" (3 / 7 inactive days, for anyone who has ever practiced)   */
/* -------------------------------------------------------------------------- */

async function runInactivity(entities: JobEntities, now: Date, counters: Counters) {
  const users = await entities.User.findMany({
    where: { email: { not: null } },
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { fullName: true, targetExamDate: true } },
      userAttempts: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      mockExamAttempts: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  for (const u of users) {
    const dates = [u.userAttempts[0]?.createdAt, u.mockExamAttempts[0]?.createdAt].filter((d): d is Date => !!d);
    if (dates.length === 0) continue; // never practiced -- welcome series/free-to-paid own this case

    const lastActivity = new Date(Math.max(...dates.map((d) => d.getTime())));
    const daysInactive = daysBetween(lastActivity, now);
    if (daysInactive < 3) continue;

    const name = displayName(u.profile, u.username);
    const daysToExam = u.profile?.targetExamDate ? daysBetween(now, u.profile.targetExamDate) : null;
    const dueReviews = await entities.ReviewSchedule.count({ where: { userId: u.id, dueAt: { lte: now } } });

    const send3d = async () =>
      sendEmail({
        to: u.email!,
        userId: u.id,
        category: 'lifecycle',
        template: 'inactive-3d',
        dedupeKey: `inactive-3d:${u.id}:${lastActivity.toISOString()}`,
        render: (links) =>
          inactivityTemplate({
            email: u.email!,
            name,
            ...links,
            daysInactive,
            dueReviews: dueReviews || undefined,
            daysToExam: daysToExam != null && daysToExam >= 0 ? daysToExam : null,
          }),
      });
    const res3 = await send3d();
    if (res3.status === 'sent') counters.inactive3d += 1;

    if (daysInactive < 7) continue;
    const res7 = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'lifecycle',
      template: 'inactive-7d',
      dedupeKey: `inactive-7d:${u.id}:${lastActivity.toISOString()}`,
      render: (links) =>
        inactivityTemplate({
          email: u.email!,
          name,
          ...links,
          daysInactive,
          dueReviews: dueReviews || undefined,
          daysToExam: daysToExam != null && daysToExam >= 0 ? daysToExam : null,
        }),
    });
    if (res7.status === 'sent') counters.inactive7d += 1;
  }
}

/* -------------------------------------------------------------------------- */
/*  Weekly progress digest (every Monday, UTC, to anyone who has practiced)  */
/* -------------------------------------------------------------------------- */

async function runWeeklyDigest(entities: JobEntities, now: Date, counters: Counters) {
  if (now.getUTCDay() !== 1) return; // Monday only

  const mondayKey = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const users = await entities.User.findMany({
    where: {
      email: { not: null },
      OR: [{ userAttempts: { some: {} } }, { mockExamAttempts: { some: {} } }],
    },
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { fullName: true, targetExamDate: true } },
      userAttempts: { select: { createdAt: true, isCorrect: true } },
      mockExamAttempts: { select: { createdAt: true, submittedAt: true } },
    },
  });

  for (const u of users) {
    const name = displayName(u.profile, u.username);
    const weekAttempts = u.userAttempts.filter((a) => a.createdAt >= weekAgo);
    const weekAnswered = weekAttempts.length;
    const weekAccuracy = weekAnswered > 0 ? Math.round((weekAttempts.filter((a) => a.isCorrect).length / weekAnswered) * 100) : null;

    const activityDates = [...u.userAttempts.map((a) => a.createdAt), ...u.mockExamAttempts.flatMap((m) => [m.createdAt, ...(m.submittedAt ? [m.submittedAt] : [])])];
    const streak = computeCurrentStreak(activityDates, now);
    const daysToExam = u.profile?.targetExamDate ? daysBetween(now, u.profile.targetExamDate) : null;

    if (weekAnswered === 0 && streak === 0) continue; // nothing to report this week

    const res = await sendEmail({
      to: u.email!,
      userId: u.id,
      category: 'lifecycle',
      template: 'weekly-digest',
      dedupeKey: `weekly-digest:${u.id}:${mondayKey}`,
      render: (links) =>
        weeklyDigestTemplate({
          email: u.email!,
          name,
          ...links,
          weekAnswered,
          weekAccuracy,
          streak,
          readiness: null,
          daysToExam: daysToExam != null && daysToExam >= 0 ? daysToExam : null,
        }),
    });
    if (res.status === 'sent') counters.weeklyDigest += 1;
  }
}

// Local copy of dashboard/streak.ts's "current streak" half only -- the job
// only needs today's number, not the badge-earning longest streak.
function computeCurrentStreak(dates: Date[], now: Date): number {
  if (dates.length === 0) return 0;
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const dayStarts = Array.from(new Set(dates.map(dayKey)))
    .map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const mostRecent = dayStarts[dayStarts.length - 1];
  if (mostRecent !== todayStart && mostRecent !== todayStart - DAY_MS) return 0;
  const daySet = new Set(dayStarts);
  let streak = 0;
  let cursor = mostRecent;
  while (daySet.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/* -------------------------------------------------------------------------- */

export async function runDailyEmailAutomations(_args: unknown, context: { entities: JobEntities }) {
  const now = new Date();
  const counters = newCounters();

  await runWelcomeSeries(context.entities, now, counters);
  await runFreeToPaid(context.entities, now, counters);
  await runPlanExpiry(context.entities, now, counters);
  await runInactivity(context.entities, now, counters);
  await runWeeklyDigest(context.entities, now, counters);

  console.log('[email-automations]', JSON.stringify(counters));
  return counters;
}
