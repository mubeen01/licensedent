import { HttpError } from 'wasp/server';
import { PaymentPlanId } from './plans';

// Single source of truth for "what can this student access RIGHT NOW".
// Every gate (practice cap, Smart Review, Mock Exams, Progress, Quiz Builder,
// Video Lectures) goes through getEffectiveAccess -- no other code may decide
// entitlements from User.subscriptionStatus/Plan alone. Those legacy columns
// are kept in sync by the grant/revoke + webhook paths (1.4) for display and
// the paid mock-attempt CAP, but entitlement = this helper, which reads the
// real Subscription table and its expiresAt (1.2).
//
// Entitlement rules (decisions D1/D5):
//  - Free tier: demo exam + 15 practice questions/day (real UserAttempt rows,
//    mockTestId=null). Smart Review, Mock Exams, Progress, Quiz Builder and
//    Video Lectures require an active plan.
//  - Hard lockout at expiresAt: no grace period, in-progress included.

export const FREE_DAILY_PRACTICE_LIMIT = 15;

// "Today" for the free daily cap is the UTC calendar day. Server clock is the
// only clock in play (Postgres now()); the Gulf pilot window (UTC+4) means the
// cap resets 4h after local midnight -- acceptable for v1, revisit if support
// asks for local-day reset.
function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Rows created before the 1.2 migration were backfilled (createdAt +
// durationDays); all new grant paths set expiresAt explicitly. A null here
// means "row written by a path we must fix" -- fall back to the same formula
// the backfill used rather than treating it as infinite access.
export function effectiveExpiryOf(sub: { expiresAt: Date | null; createdAt: Date; durationDays: number }): Date {
  return sub.expiresAt ?? new Date(sub.createdAt.getTime() + sub.durationDays * 24 * 60 * 60 * 1000);
}

export type EffectiveAccess = {
  // true when at least one Subscription row is unexpired (the latest such row
  // is what planType/expiresAt describe).
  active: boolean;
  planType: PaymentPlanId | null;
  expiresAt: Date | null;
  // Remaining free practice questions today. null = paid (unlimited).
  // Free users get the clamped remainder so UI can render "X left today".
  freePracticeRemainingToday: number | null;
};

// Minimal entity surface -- only what the helper touches. Keeps it unit-testable
// with fakes and decoupled from the full Wasp context type.
export type AccessEntities = {
  Subscription: {
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
    }): Promise<Array<{ planType: string; durationDays: number; createdAt: Date; expiresAt: Date | null }>>;
  };
  UserAttempt: {
    count(args: { where: { userId: string; mockTestId: null; createdAt: { gte: Date } } }): Promise<number>;
  };
};

export async function getEffectiveAccess(
  userId: string,
  entities: AccessEntities,
  now: Date = new Date()
): Promise<EffectiveAccess> {
  const subs = await entities.Subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

  // Latest row that is still unexpired. A user can hold several passes (history
  // keeps them all); entitlement follows the best (latest) live one.
  const live = subs
    .map((s) => ({ sub: s, expiresAt: effectiveExpiryOf(s) }))
    .filter(({ expiresAt }) => expiresAt > now)
    .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0];

  if (!live) {
    const usedToday = await entities.UserAttempt.count({
      where: { userId, mockTestId: null, createdAt: { gte: startOfUtcDay(now) } },
    });
    return {
      active: false,
      planType: null,
      expiresAt: null,
      freePracticeRemainingToday: Math.max(0, FREE_DAILY_PRACTICE_LIMIT - usedToday),
    };
  }

  return {
    active: true,
    planType: live.sub.planType as PaymentPlanId,
    expiresAt: live.expiresAt,
    freePracticeRemainingToday: null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Gate helpers for operations                                                */
/* -------------------------------------------------------------------------- */

// Throws 403 with an upsell-friendly message. The message is UI copy -- the
// client renders it as-is, so keep it sentence-case and action-oriented.
export function requireActivePlan(access: EffectiveAccess, feature = 'this feature'): void {
  if (!access.active) {
    throw new HttpError(
      403,
      `${feature.charAt(0).toUpperCase() + feature.slice(1)} needs an active plan. Pick one on the Pricing page -- access starts instantly.`
    );
  }
}

export function requireExtendedPlan(access: EffectiveAccess): void {
  if (!access.active || access.planType !== PaymentPlanId.Extended) {
    throw new HttpError(
      403,
      'The Extended plan is needed for this. Pick it on the Pricing page -- access starts instantly.'
    );
  }
}

// 15/day free practice: blocks only when a FREE user has no attempts left
// today. Paid users (access.active) always pass -- unlimited by D1.
export function requirePracticeSlotToday(access: EffectiveAccess): void {
  if (access.active) return;
  if ((access.freePracticeRemainingToday ?? 0) <= 0) {
    throw new HttpError(
      403,
      `You've used today's ${FREE_DAILY_PRACTICE_LIMIT} free practice questions. Practice resets tomorrow (UTC midnight) -- or get unlimited with any plan.`
    );
  }
}
