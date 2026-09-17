import { type AuthUser } from 'wasp/auth';
import { PaymentPlanId, SubscriptionStatus } from './plans';

// Shared by every Extended-plan-only perk (Video Lectures -- zero real
// content yet, nothing to scope, so it stays Extended-only) so the gate is
// defined once instead of copied per feature.
export function hasExtendedPlanAccess(user: AuthUser): boolean {
  return (
    user.subscriptionPlan === PaymentPlanId.Extended &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted
  );
}

// PRD-002 Phase I8.2: Quiz Builder is also available to IDC Pathway
// subscribers (server-scoped to Ireland content only via
// requireQuizBuilderPlan/ensureQuizBuilderAccess) -- deliberately not Fast
// Track/Standard, see requireQuizBuilderPlan's comment for why.
export function hasQuizBuilderPlanAccess(user: AuthUser): boolean {
  return (
    (user.subscriptionPlan === PaymentPlanId.Extended || user.subscriptionPlan === PaymentPlanId.IrelandPathway) &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted
  );
}
