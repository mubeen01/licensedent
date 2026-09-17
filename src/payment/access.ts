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
//
// PRD-002 Phase I3: `getEffectiveAccess` above answers "does this user have
// ANY active plan" -- exam-blind by design, kept for gates that genuinely
// aren't about a specific exam (the free daily cap, billing display).
// `getEffectiveAccessForExam`/`getAccessibleExamIds` below answer "does this
// user's plan cover THIS exam", reading `Subscription.examAccessId`/
// `allExamsAccess` for the first time anywhere in the app (previously present
// in the schema, set correctly at checkout/grant, but never read by any
// access-gating code -- see PRD-002 §1/§2). `allExamsAccess: true` means "every
// exam where `Exam.standalonePackOnly` is false", computed at check-time by
// joining Exam, not a literal "every exam" -- so Extended covers all Gulf
// exams but not Ireland, without another schema change if a future exam also
// needs to be its own pack.

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
// with fakes and decoupled from the full Wasp context type. getEffectiveAccess
// doesn't touch Exam at all, so it deliberately does NOT require callers to
// register/pass it -- only the exam-aware functions below (ExamAwareAccessEntities)
// need it, so main.wasp.ts entity lists (and this type) catch at compile time
// if a call site forgets to register Exam for those.
export type AccessEntities = {
  Subscription: {
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
    }): Promise<
      Array<{
        planType: string;
        durationDays: number;
        createdAt: Date;
        expiresAt: Date | null;
        allExamsAccess: boolean;
        examAccessId: string | null;
      }>
    >;
  };
  UserAttempt: {
    count(args: { where: { userId: string; mockTestId: null; createdAt: { gte: Date } } }): Promise<number>;
  };
};

export type ExamAwareAccessEntities = AccessEntities & {
  Exam: {
    findUnique(args: {
      where: { id: string };
      select: { standalonePackOnly: true };
    }): Promise<{ standalonePackOnly: boolean } | null>;
    findMany(args: { where: { standalonePackOnly: boolean }; select: { id: true } }): Promise<Array<{ id: string }>>;
    findFirst(args: { where: { code: string }; select: { id: true } }): Promise<{ id: string } | null>;
  };
};

type LiveSub = Awaited<ReturnType<AccessEntities['Subscription']['findMany']>>[number];

// Shared by getEffectiveAccess/getEffectiveAccessForExam -- an optional
// `coversExam` predicate narrows which subscriptions are even eligible before
// picking the best (longest-live) one, so both exam-blind and exam-scoped
// entitlement share one "pick the best live row" implementation.
async function computeAccess(
  userId: string,
  entities: AccessEntities,
  now: Date,
  coversExam?: (sub: LiveSub) => boolean
): Promise<EffectiveAccess> {
  const subs = await entities.Subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  const eligible = coversExam ? subs.filter(coversExam) : subs;

  // Latest eligible row that is still unexpired. A user can hold several
  // passes (history keeps them all, possibly for different exams); entitlement
  // follows the best (latest) live one among those that actually cover what's
  // being asked for.
  const live = eligible
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

export async function getEffectiveAccess(
  userId: string,
  entities: AccessEntities,
  now: Date = new Date()
): Promise<EffectiveAccess> {
  return computeAccess(userId, entities, now);
}

// Exam-scoped entitlement: "does this user's plan cover THIS exam right now."
// An allExamsAccess sub covers it unless the exam is standalonePackOnly; a
// single-exam sub covers it only if examAccessId matches. An exam that can't
// be found covers nothing (fail closed, not open).
export async function getEffectiveAccessForExam(
  userId: string,
  examId: string,
  entities: ExamAwareAccessEntities,
  now: Date = new Date()
): Promise<EffectiveAccess> {
  const targetExam = await entities.Exam.findUnique({ where: { id: examId }, select: { standalonePackOnly: true } });
  const coversExam = (sub: LiveSub) =>
    sub.allExamsAccess ? !(targetExam?.standalonePackOnly ?? true) : sub.examAccessId === examId;
  return computeAccess(userId, entities, now, coversExam);
}

// Every exam id the user currently has live access to, across all of their
// (possibly several, possibly different-exam) live Subscription rows -- for
// content queries that select from a pool rather than checking one target
// exam (practice draw, Smart Review, My Reviews). Empty array, not an
// exception, when the user has no live coverage of anything.
export async function getAccessibleExamIds(
  userId: string,
  entities: ExamAwareAccessEntities,
  now: Date = new Date()
): Promise<string[]> {
  const subs = await entities.Subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  const live = subs.filter((s) => effectiveExpiryOf(s) > now);

  const singleExamIds = live
    .filter((s): s is LiveSub & { examAccessId: string } => !s.allExamsAccess && !!s.examAccessId)
    .map((s) => s.examAccessId);

  if (!live.some((s) => s.allExamsAccess)) {
    return Array.from(new Set(singleExamIds));
  }

  const nonStandaloneExams = await entities.Exam.findMany({
    where: { standalonePackOnly: false },
    select: { id: true },
  });
  return Array.from(new Set([...singleExamIds, ...nonStandaloneExams.map((e) => e.id)]));
}

// PRD-002 Phase I4: what the dashboard shell (DashboardSidebar/DashboardHomePage)
// should show. 'ireland' means the user's entire accessible-exam set is exactly
// IDC Ireland -- true for a real Ireland Pathway subscriber, and (deliberately,
// by data rather than by plan enum) for anyone else whose access happens to
// resolve the same way, e.g. an admin grant scoped to IDC on a different plan.
// Everyone else (free, any Gulf single-exam plan, Extended, or no access at
// all) gets 'default', the existing multi-exam Gulf dashboard -- Ireland's
// scoped variant is deliberately NOT a generic "any single-exam plan" mode
// (see PRD-002 §3 Goal 4: this is specifically about Ireland Pathway
// subscribers, not Fast Track/Standard, which stay on the default shell).
export type DashboardScope = { kind: 'ireland' } | { kind: 'default' };

export async function getUserDashboardScope(
  userId: string,
  entities: ExamAwareAccessEntities,
  now: Date = new Date()
): Promise<DashboardScope> {
  const accessibleExamIds = await getAccessibleExamIds(userId, entities, now);
  if (accessibleExamIds.length !== 1) return { kind: 'default' };

  const idcExam = await entities.Exam.findFirst({ where: { code: 'IDC' }, select: { id: true } });
  return idcExam && accessibleExamIds[0] === idcExam.id ? { kind: 'ireland' } : { kind: 'default' };
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

// PRD-002 Phase I8.2: Quiz Builder is an Extended-plan perk for Gulf students,
// but the Ireland Pathway plan's own goals (PRD-002 §3 Goal 1, §7 Phase I8
// intro) explicitly bundle "pick a subject and take a broader quiz" access
// for IDC Pathway subscribers too -- deliberately NOT opened to Fast
// Track/Standard (single-exam Gulf plans), which stay exactly as scoped
// before this phase (see PRD-002 §4 non-goals on not extending their UX).
export function requireQuizBuilderPlan(access: EffectiveAccess): void {
  if (
    !access.active ||
    (access.planType !== PaymentPlanId.Extended && access.planType !== PaymentPlanId.IrelandPathway)
  ) {
    throw new HttpError(
      403,
      'The Extended or IDC Pathway plan is needed for this. Pick one on the Pricing page -- access starts instantly.'
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
