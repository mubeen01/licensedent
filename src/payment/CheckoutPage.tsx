import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import SeoHead from '../client/components/SeoHead';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

type PaymentStatus = 'loading' | 'paid' | 'canceled';

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const isCanceled = queryParams.get('canceled');
    const isSuccess = queryParams.get('success');

    if (isCanceled) {
      setPaymentStatus('canceled');
    } else if (isSuccess) {
      setPaymentStatus('paid');
    } else {
      navigate(routes.AccountRoute.to);
      return;
    }

    const timer = setTimeout(() => navigate(routes.AccountRoute.to), 4000);
    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center bg-background px-6 py-16 text-foreground'>
      <SeoHead
        title='Checkout — LicenseDent'
        description='Confirming your LicenseDent subscription payment.'
        path='/checkout'
      />
      <Card className='w-full max-w-md text-center'>
        <CardContent className='flex flex-col items-center gap-4 p-10'>
          {paymentStatus === 'loading' && (
            <>
              <div className='h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary' />
              <p className='text-sm text-muted-foreground'>Confirming your payment…</p>
            </>
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
        </CardContent>
      </Card>
    </div>
  );
}
