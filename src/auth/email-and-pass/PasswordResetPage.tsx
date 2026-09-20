import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { resetPassword } from 'wasp/client/auth';
import { CheckCircle2, Lock } from 'lucide-react';
import { AuthPageLayout } from '../AuthPageLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import SeoHead from '../../client/components/SeoHead';

export function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('This reset link is invalid or has expired. Request a new one.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate(routes.LoginRoute.to), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not reset your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const seo = (
    <SeoHead title='Reset Password — LicenseDent' description='Set a new LicenseDent password.' path='/password-reset' noindex />
  );

  if (!token) {
    return (
      <AuthPageLayout>
        {seo}
        {/* PRD-006 (adjacent to H11, found while fixing it): this state --
            reached by anyone visiting /password-reset without a real
            token, e.g. a bookmarked, mistyped, or already-used link --
            previously had no heading at all, so it had zero <h1>s. */}
        <h1 className='text-2xl font-semibold tracking-tight text-foreground mb-4'>Reset link invalid</h1>
        <Alert variant='destructive'>
          <AlertDescription>
            This reset link is invalid or has expired.{' '}
            <WaspRouterLink to={routes.RequestPasswordResetRoute.to} className='font-medium underline'>
              Request a new one
            </WaspRouterLink>
            .
          </AlertDescription>
        </Alert>
      </AuthPageLayout>
    );
  }

  if (success) {
    return (
      <AuthPageLayout>
        {seo}
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10'>
            <CheckCircle2 className='h-5 w-5 text-success' aria-hidden='true' />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground mb-2'>Password reset</h1>
          <p className='text-sm text-muted-foreground mb-6'>Taking you to login…</p>
          <WaspRouterLink to={routes.LoginRoute.to} className='text-sm font-medium text-primary hover:underline'>
            Go to login now
          </WaspRouterLink>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      {seo}
      <h1 className='text-2xl font-semibold tracking-tight text-foreground mb-1.5'>Reset your password</h1>
      <p className='text-sm text-muted-foreground mb-7'>Choose a new password for your account.</p>

      {error && (
        <Alert variant='destructive' className='mb-5'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='password'>New password</Label>
          <div className='relative'>
            <Lock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' aria-hidden='true' />
            <Input
              id='password'
              type='password'
              autoComplete='new-password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='confirmPassword'>Confirm new password</Label>
          <div className='relative'>
            <Lock className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' aria-hidden='true' />
            <Input
              id='confirmPassword'
              type='password'
              autoComplete='new-password'
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>
        <Button type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className='mt-7 text-center text-sm text-muted-foreground'>
        <WaspRouterLink to={routes.LoginRoute.to} className='font-medium text-primary hover:underline'>
          Back to login
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
