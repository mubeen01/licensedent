import { type AuthUser } from 'wasp/auth';
import { PaymentPlanId, SubscriptionStatus } from './plans';

// Shared by every Extended-plan perk (Video Lectures, Quiz Builder, ...) so
// the gate is defined once instead of copied per feature.
export function hasExtendedPlanAccess(user: AuthUser): boolean {
  return (
    user.subscriptionPlan === PaymentPlanId.Extended &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted
  );
}
