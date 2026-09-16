import { HttpError, prisma } from 'wasp/server';
import {
  type GetAdminGrowthSeries,
  type GetAdminOverviewStats,
  type GetAdminRecentActivity,
  type GetAdminReviewVelocity,
} from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';
import { getPlanPrice, parsePaymentPlanId, prettyPaymentPlanName } from '../../../payment/plans';

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Zero-filled day buckets so a chart never silently drops a day with no
// events -- a flat line at 0 reads correctly, a missing point reads as a
// bug. Anchored to local midnight, not "now minus N*24h", so "last 7 days"
// always includes all of today so far.
function buildDayBuckets(days: number): string[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dateKey(new Date(startOfToday.getTime() - i * MS_PER_DAY)));
  }
  return keys;
}

function parsePriceToNumber(price: string): number {
  const n = Number(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// Real Stripe key vs the template's literal "sk_test_..." placeholder --
// never returns or logs the key itself, just whether checkout can work.
// See INFRA_NOTES.md's Stripe gap entry: this is currently false in dev.
function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_API_KEY;
  return !!key && key.length > 40 && !key.includes('...');
}

export type AdminOverviewStats = {
  users: { total: number; newLast7Days: number; newPrev7Days: number };
  subscriptions: {
    total: number;
    active: number;
    byPlan: { planType: string; label: string; count: number }[];
    revenueToDate: number;
  };
  messages: { unread: number };
  mockExams: { submittedTotal: number; avgScorePercent: number | null };
  system: { stripeConfigured: boolean };
};

// One round trip for every KPI tile on the admin dashboard. Deliberately
// independent of DailyStats/the Stripe-dependent stats job (see
// analytics/operations.ts's getDailyStats) -- every number here is computed
// live from tables that are always populated, so the dashboard's headline
// row never goes blank just because a Stripe key is a placeholder.
export const getAdminOverviewStats: GetAdminOverviewStats<void, AdminOverviewStats> = async (_args, context) => {
  ensureAdmin(context.user);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_PER_DAY);

  const [
    totalUsers,
    newLast7Days,
    newPrev7Days,
    totalSubscriptions,
    subscriptionsForActive,
    byPlanGroups,
    unreadMessages,
    submittedAttempts,
  ] = await Promise.all([
    context.entities.User.count(),
    context.entities.User.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    context.entities.User.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    context.entities.Subscription.count(),
    context.entities.Subscription.findMany({ select: { createdAt: true, durationDays: true } }),
    prisma.subscription.groupBy({ by: ['planType'], _count: { _all: true } }),
    context.entities.ContactFormMessage.count({ where: { isRead: false } }),
    prisma.mockExamAttempt.findMany({
      where: { status: 'submitted' },
      select: { correctCount: true, _count: { select: { items: true } } },
    }),
  ]);

  const active = subscriptionsForActive.filter(
    (s) => s.createdAt.getTime() + s.durationDays * MS_PER_DAY > now.getTime()
  ).length;

  const byPlan = byPlanGroups.map((g) => ({
    planType: g.planType,
    label: prettyPaymentPlanName(parsePaymentPlanId(g.planType)),
    count: g._count._all,
  }));
  const revenueToDate = byPlan.reduce(
    (sum, p) => sum + parsePriceToNumber(getPlanPrice(parsePaymentPlanId(p.planType))) * p.count,
    0
  );

  // Averaged per-attempt (correct / that attempt's own item count) rather
  // than correctCount/150 -- MockTest.questionCount isn't guaranteed to be
  // 150 for every exam going forward, so this stays accurate either way.
  const ratios = submittedAttempts
    .filter((a) => a.correctCount != null && a._count.items > 0)
    .map((a) => a.correctCount! / a._count.items);
  const avgScorePercent =
    ratios.length > 0 ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) : null;

  return {
    users: { total: totalUsers, newLast7Days, newPrev7Days },
    subscriptions: { total: totalSubscriptions, active, byPlan, revenueToDate },
    messages: { unread: unreadMessages },
    mockExams: { submittedTotal: submittedAttempts.length, avgScorePercent },
    system: { stripeConfigured: isStripeConfigured() },
  };
};

const daysRangeSchema = z.object({ days: z.number().int().min(7).max(90).default(30) });

export type GrowthPoint = { date: string; signups: number };

export const getAdminGrowthSeries: GetAdminGrowthSeries<{ days?: number } | void, GrowthPoint[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { days } = ensureArgsSchemaOrThrowHttpError(daysRangeSchema, rawArgs ?? {});
  const startOfWindow = new Date(new Date().setHours(0, 0, 0, 0) - (days - 1) * MS_PER_DAY);

  const users = await context.entities.User.findMany({
    where: { createdAt: { gte: startOfWindow } },
    select: { createdAt: true },
  });

  const buckets = new Map(buildDayBuckets(days).map((k) => [k, 0]));
  for (const u of users) {
    const k = dateKey(u.createdAt);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, signups]) => ({ date, signups }));
};

export type ReviewVelocityPoint = { date: string; approved: number; rejected: number };

export const getAdminReviewVelocity: GetAdminReviewVelocity<
  { days?: number } | void,
  ReviewVelocityPoint[]
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { days } = ensureArgsSchemaOrThrowHttpError(daysRangeSchema, rawArgs ?? {});
  const startOfWindow = new Date(new Date().setHours(0, 0, 0, 0) - (days - 1) * MS_PER_DAY);

  const [approved, rejected] = await Promise.all([
    context.entities.Question.findMany({
      where: { verifiedAt: { gte: startOfWindow } },
      select: { verifiedAt: true },
    }),
    context.entities.Question.findMany({
      where: { rejectedAt: { gte: startOfWindow } },
      select: { rejectedAt: true },
    }),
  ]);

  const buckets = new Map(buildDayBuckets(days).map((k) => [k, { approved: 0, rejected: 0 }]));
  for (const q of approved) {
    const k = dateKey(q.verifiedAt!);
    const bucket = buckets.get(k);
    if (bucket) bucket.approved += 1;
  }
  for (const q of rejected) {
    const k = dateKey(q.rejectedAt!);
    const bucket = buckets.get(k);
    if (bucket) bucket.rejected += 1;
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
};

export type AdminActivityEvent = {
  id: string;
  type: 'signup' | 'subscription' | 'message' | 'audit';
  title: string;
  subtitle: string | null;
  createdAt: string;
};

const TAKE_PER_SOURCE = 8;
const FEED_SIZE = 10;

// One merged, time-sorted feed instead of four separate "recent X" lists --
// mirrors what an admin actually wants on a homepage: "what just happened,"
// not four boxes they have to cross-reference by eye.
export const getAdminRecentActivity: GetAdminRecentActivity<void, AdminActivityEvent[]> = async (
  _args,
  context
) => {
  ensureAdmin(context.user);

  const [signups, subs, messages, audits] = await Promise.all([
    context.entities.User.findMany({
      orderBy: { createdAt: 'desc' },
      take: TAKE_PER_SOURCE,
      select: { id: true, email: true, username: true, createdAt: true },
    }),
    context.entities.Subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: TAKE_PER_SOURCE,
      include: { user: { select: { email: true, username: true } }, examAccess: { select: { name: true } } },
    }),
    context.entities.ContactFormMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: TAKE_PER_SOURCE,
      include: { user: { select: { email: true, username: true } } },
    }),
    context.entities.AdminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: TAKE_PER_SOURCE,
      include: { admin: { select: { email: true, username: true } } },
    }),
  ]);

  const who = (u: { email: string | null; username: string | null }) => u.username ?? u.email ?? 'A student';

  const events: AdminActivityEvent[] = [
    ...signups.map((u) => ({
      id: `signup:${u.id}`,
      type: 'signup' as const,
      title: `${who(u)} signed up`,
      subtitle: null,
      createdAt: u.createdAt.toISOString(),
    })),
    ...subs.map((s) => ({
      id: `subscription:${s.id}`,
      type: 'subscription' as const,
      title: `${who(s.user)} bought ${prettyPaymentPlanName(parsePaymentPlanId(s.planType))}`,
      subtitle: s.allExamsAccess ? 'All exams' : s.examAccess?.name ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
    ...messages.map((m) => ({
      id: `message:${m.id}`,
      type: 'message' as const,
      title: `${who(m.user)} sent a message`,
      subtitle: m.content.length > 90 ? `${m.content.slice(0, 90)}…` : m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    ...audits.map((a) => ({
      id: `audit:${a.id}`,
      type: 'audit' as const,
      title: `${who(a.admin)} — ${a.action}`,
      subtitle: `${a.entityType}:${a.entityId}`,
      createdAt: a.createdAt.toISOString(),
    })),
  ];

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return events.slice(0, FEED_SIZE);
};
