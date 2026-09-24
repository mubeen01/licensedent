import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getMySubscription, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import SeoHead from '../client/components/SeoHead';
import { Button } from '../components/ui/button';

type PaymentStatus = 'loading' | 'paid' | 'pending' | 'canceled';

// How long to wait for the Stripe webhook to create the Subscription row
// before telling the buyer it's still being activated.
const CONFIRM_TIMEOUT_MS = 30_000;
// A Subscription created this recently counts as "this purchase".
const RECENT_PURCHASE_MS = 60 * 60 * 1000;

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isCanceled = queryParams.get('canceled') === 'true';
  const isSuccess = queryParams.get('success') === 'true';

  // Audit L14 / RAID I-06: `?success=true` alone used to show "Payment
  // successful", even when typed by hand or before the webhook had granted
  // anything. Now success is shown only once a real, recent Subscription
  // row exists (created by the webhook), polled for up to 30 s.
  const { data: latestSub } = useQuery(getMySubscription, undefined, {
    enabled: isSuccess && paymentStatus === 'loading',
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (isCanceled) {
      setPaymentStatus('canceled');
      return;
    }
    if (!isSuccess) {
      navigate(routes.AccountRoute.to);
    }
  }, [isCanceled, isSuccess, navigate]);

  useEffect(() => {
    if (!isSuccess || paymentStatus !== 'loading') return;
    if (latestSub && Date.now() - new Date(latestSub.createdAt).getTime() < RECENT_PURCHASE_MS) {
      setPaymentStatus('paid');
    }
  }, [isSuccess, latestSub, paymentStatus]);

  useEffect(() => {
    if (!isSuccess || paymentStatus !== 'loading') return;
    const timer = setTimeout(() => setPaymentStatus('pending'), CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isSuccess, paymentStatus]);

  useEffect(() => {
    if (paymentStatus !== 'paid' && paymentStatus !== 'canceled') return;
    const timer = setTimeout(() => navigate(routes.AccountRoute.to), 4000);
    return () => clearTimeout(timer);
  }, [paymentStatus, navigate]);

  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 py-16 text-foreground'>
      <SeoHead
        title='Checkout — LicenseDent'
        description='Confirming your LicenseDent subscription payment.'
        path='/checkout'
        noindex
      />
      <div className='card-elevated flex w-full max-w-md flex-col items-center gap-4 p-10 text-center'>
        {paymentStatus === 'loading' && (
            <div role='status' aria-live='polite' className='flex flex-col items-center gap-4'>
              <div className='h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary' aria-hidden='true' />
              <h1 className='text-xl font-bold text-foreground'>Confirming your payment</h1>
              <p className='text-sm text-muted-foreground'>This will just take a moment…</p>
            </div>
          )}
          {paymentStatus === 'paid' && (
            <>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-success/10'>
                <CheckCircle2 className='h-8 w-8 text-success' />
              </div>
              <h1 className='text-xl font-bold text-foreground'>Payment successful</h1>
              <p className='text-sm text-muted-foreground'>Your plan is active. Taking you to your account…</p>
            </>
          )}
          {paymentStatus === 'pending' && (
            <>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <Clock className='h-8 w-8 text-muted-foreground' />
              </div>
              <h1 className='text-xl font-bold text-foreground'>Activating your plan</h1>
              <p className='text-sm text-muted-foreground'>
                We haven't received confirmation from the payment provider yet. This usually takes under a minute —
                refresh your account page shortly. If your plan still isn't active, contact support from your
                Account page and we'll sort it out.
              </p>
            </>
          )}
          {paymentStatus === 'canceled' && (
            <>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
                <XCircle className='h-8 w-8 text-muted-foreground' />
              </div>
              <h1 className='text-xl font-bold text-foreground'>Payment canceled</h1>
              <p className='text-sm text-muted-foreground'>No charge was made. Taking you back to your account…</p>
            </>
          )}
          <Button asChild variant='outline' size='sm' className='mt-2'>
            <WaspRouterLink to={routes.AccountRoute.to}>Go to account now</WaspRouterLink>
          </Button>
      </div>
    </div>
  );
}
