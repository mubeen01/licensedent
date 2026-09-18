import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { verifyEmail } from 'wasp/client/auth';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AuthPageLayout } from '../AuthPageLayout';
import { Alert, AlertDescription } from '../../components/ui/alert';
import SeoHead from '../../client/components/SeoHead';

type Status = 'verifying' | 'success' | 'error';

export function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : 'This verification link is invalid or has expired.'
  );
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;
    verifyEmail({ token })
      .then(({ success, reason }) => {
        if (success) {
          setStatus('success');
          setTimeout(() => navigate(routes.LoginRoute.to), 2500);
        } else {
          setStatus('error');
          setErrorMessage(reason ?? 'This verification link is invalid or has expired.');
        }
      })
      .catch((err: unknown) => {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'This verification link is invalid or has expired.');
      });
  }, [token, navigate]);

  return (
    <AuthPageLayout>
      <SeoHead title='Verify Email — LicenseDent' description='Verify your LicenseDent account email.' path='/email-verification' noindex />
      {status === 'verifying' && (
        <div className='text-center'>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground mb-2'>Verifying your email…</h2>
          <p className='text-sm text-muted-foreground'>This will just take a moment.</p>
        </div>
      )}

      {status === 'success' && (
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10'>
            <CheckCircle2 className='h-5 w-5 text-success' aria-hidden='true' />
          </div>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground mb-2'>Email verified</h2>
          <p className='text-sm text-muted-foreground mb-6'>Taking you to login…</p>
          <WaspRouterLink to={routes.LoginRoute.to} className='text-sm font-medium text-primary hover:underline'>
            Go to login now
          </WaspRouterLink>
        </div>
      )}

      {status === 'error' && (
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <XCircle className='h-5 w-5 text-destructive' aria-hidden='true' />
          </div>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground mb-2'>Verification failed</h2>
          <Alert variant='destructive' className='mb-6 text-left'>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <WaspRouterLink to={routes.LoginRoute.to} className='text-sm font-medium text-primary hover:underline'>
            Go to login
          </WaspRouterLink>
        </div>
      )}
    </AuthPageLayout>
  );
}
