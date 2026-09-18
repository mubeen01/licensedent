import { FormEvent, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { requestPasswordReset } from 'wasp/client/auth';
import { Mail } from 'lucide-react';
import { AuthPageLayout } from '../AuthPageLayout';
import { sanitizeInput, validateEmail } from '../authValidation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import SeoHead from '../../client/components/SeoHead';

export function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = sanitizeInput(email);
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset({ email: cleanEmail });
      // Wasp always resolves { success: true } here regardless of whether the
      // email exists, to avoid leaking which addresses have accounts.
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthPageLayout>
        <SeoHead title='Forgot Password — LicenseDent' description='Reset your LicenseDent password.' path='/request-password-reset' noindex />
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Mail className='h-5 w-5 text-primary' aria-hidden='true' />
          </div>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground mb-2'>Check your email</h2>
          <p className='text-sm text-muted-foreground mb-6'>
            If an account exists for <span className='font-medium text-foreground'>{email}</span>, we've sent a
            password reset link.
          </p>
          <WaspRouterLink to={routes.LoginRoute.to} className='text-sm font-medium text-primary hover:underline'>
            Back to login
          </WaspRouterLink>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <SeoHead title='Forgot Password — LicenseDent' description='Reset your LicenseDent password.' path='/request-password-reset' noindex />
      <h2 className='text-2xl font-semibold tracking-tight text-foreground mb-1.5'>Forgot your password?</h2>
      <p className='text-sm text-muted-foreground mb-7'>Enter your email and we'll send you a reset link.</p>

      {error && (
        <Alert variant='destructive' className='mb-5'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='email'>Email</Label>
          <div className='relative'>
            <Mail className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' aria-hidden='true' />
            <Input
              id='email'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>
        <Button type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Sending…' : 'Send reset link'}
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
