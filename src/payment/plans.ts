import { requireNodeEnvVar } from '../server/utils';

export enum SubscriptionStatus {
  PastDue = 'past_due',
  CancelAtPeriodEnd = 'cancel_at_period_end',
  Active = 'active',
  Deleted = 'deleted',
}

// Matches schema.prisma's SubscriptionPlanType enum (fast_track/standard/extended/
// ireland_pathway) — these are one-time, fixed-duration exam-access passes, not
// recurring subscriptions. IrelandPathway declared last: getPlanIdByPriceId's
// Object.values(PaymentPlanId).find(...) in the Stripe/LemonSqueezy webhooks calls
// each plan's getPaymentProcessorPlanId() (which throws if its env var is unset) up
// to the first match -- keeping it last means a real payment for any existing plan
// never reaches Ireland's (still-unset, pre-launch) env var lookup.
export enum PaymentPlanId {
  FastTrack = 'fast_track',
  Standard = 'standard',
  Extended = 'extended',
  IrelandPathway = 'ireland_pathway',
}

export interface PaymentPlan {
  // Returns the id under which this payment plan is identified on your payment processor.
  // E.g. this might be price id on Stripe, or variant id on LemonSqueezy.
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect =
  | { kind: 'subscription' }
  | { kind: 'credits'; amount: number }
  // A one-time purchase granting `durationDays` of exam access (see the `Subscription`
  // model in schema.prisma). `allExamsAccess: false` plans grant access to a single exam,
  // chosen on PricingPage and threaded through checkout session metadata to the webhook,
  // which sets the Subscription row's `examAccessId` (see stripe/webhook.ts). When
  // `impliedExamCode` is set, that single exam is fixed by the plan itself (looked up
  // server-side by Exam.code) rather than picked by the student/admin -- see
  // generateCheckoutSession and grantUserSubscription.
  | { kind: 'access'; durationDays: number; allExamsAccess: boolean; impliedExamCode?: string };

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.FastTrack]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_FAST_TRACK_PLAN_ID'),
    effect: { kind: 'access', durationDays: 30, allExamsAccess: false },
  },
  [PaymentPlanId.Standard]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_STANDARD_PLAN_ID'),
    effect: { kind: 'access', durationDays: 90, allExamsAccess: false },
  },
  [PaymentPlanId.Extended]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_EXTENDED_PLAN_ID'),
    effect: { kind: 'access', durationDays: 180, allExamsAccess: true },
  },
  [PaymentPlanId.IrelandPathway]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_IRELAND_PATHWAY_PLAN_ID'),
    // Same 180-day duration as Extended (PRD-002 §6 Q4), single-exam-scoped and
    // fixed to IDC Ireland -- not user-selected (PRD-002 Phase I2.3).
    effect: { kind: 'access', durationDays: 180, allExamsAccess: false, impliedExamCode: 'IDC' },
  },
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.FastTrack]: 'Fast Track',
    [PaymentPlanId.Standard]: 'Standard',
    [PaymentPlanId.Extended]: 'Extended',
    [PaymentPlanId.IrelandPathway]: 'IDC Pathway',
  };
  return planToName[planId];
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getPlanPrice(planId: PaymentPlanId): string {
  const planToPrice: Record<PaymentPlanId, string> = {
    [PaymentPlanId.FastTrack]: '$250',
    [PaymentPlanId.Standard]: '$550',
    [PaymentPlanId.Extended]: '$1,000',
    [PaymentPlanId.IrelandPathway]: '$800',
  };
  return planToPrice[planId];
}
