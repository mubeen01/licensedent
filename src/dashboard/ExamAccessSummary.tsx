import { getCustomerPortalUrl, getMySubscription, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { parsePaymentPlanId, prettyPaymentPlanName } from '../payment/plans';

// Shared by AccountPage and BillingPage so plan/expiry logic lives in one place.
export function ExamAccessSummary() {
  const { data: subscription, isLoading } = useQuery(getMySubscription);

  if (isLoading) {
    return <dd className='mt-1 text-sm text-muted-foreground sm:col-span-2 sm:mt-0'>Loading…</dd>;
  }

  if (!subscription) {
    return (
      <>
        <dd className='mt-1 text-sm text-foreground sm:col-span-1 sm:mt-0'>No active plan</dd>
        <BuyMoreButton />
      </>
    );
  }

  const planName = prettyPaymentPlanName(parsePaymentPlanId(subscription.planType));
  const expiresAt = new Date(subscription.createdAt);
  expiresAt.setDate(expiresAt.getDate() + subscription.durationDays);
  const isExpired = expiresAt.getTime() < Date.now();

  const examBadge = subscription.allExamsAccess
    ? '(all exams) '
    : subscription.examAccess
      ? `(${subscription.examAccess.flagEmoji ?? ''} ${subscription.examAccess.code ?? subscription.examAccess.name}) `
      : '';

  return (
    <>
      <dd className='mt-1 text-sm text-foreground sm:col-span-1 sm:mt-0'>
        {planName} {examBadge}— {isExpired ? 'expired' : 'expires'} {expiresAt.toLocaleDateString()}
      </dd>
      {isExpired ? <BuyMoreButton /> : <CustomerPortalButton />}
    </>
  );
}

export function BuyMoreButton() {
  return (
    <div className='ml-4 shrink-0 sm:col-span-1 sm:mt-0'>
      <WaspRouterLink
        to={routes.PricingPageRoute.to}
        className='font-medium text-sm text-primary hover:text-primary/80 transition-colors duration-200'
      >
        Buy a plan
      </WaspRouterLink>
    </div>
  );
}

export function CustomerPortalButton() {
  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl);

  const handleClick = () => {
    if (customerPortalUrl) {
      // PRD-006 M14: window.open(url, '_blank') alone doesn't set
      // noopener -- the opened Stripe tab otherwise keeps a live
      // window.opener handle back to this page.
      window.open(customerPortalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // null (not loading, no error) means this account has no real Stripe
  // customer record -- e.g. access was granted manually by an admin rather
  // than through a real purchase. Sending them into Stripe's portal would be
  // a dead end (Stripe has never heard of their email), so say so plainly
  // instead of showing a button that silently does nothing.
  if (!isCustomerPortalUrlLoading && !customerPortalUrlError && !customerPortalUrl) {
    return (
      <p className='ml-4 shrink-0 sm:col-span-1 sm:mt-0 text-xs text-muted-foreground'>
        Access was granted manually — email us to make billing changes.
      </p>
    );
  }

  return (
    <div className='ml-4 shrink-0 sm:col-span-1 sm:mt-0'>
      <Button
        onClick={handleClick}
        disabled={isCustomerPortalUrlLoading || !customerPortalUrl}
        variant='outline'
        size='sm'
        className='font-medium text-sm'
      >
        Manage billing
      </Button>
    </div>
  );
}
