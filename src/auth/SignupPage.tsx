import { FormEvent, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { signup } from 'wasp/client/auth';
import { Lock, Mail } from 'lucide-react';
import { AuthPageLayout } from './AuthPageLayout';
import { getPasswordStrength, sanitizeInput, validateEmail } from './authValidation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import SeoHead from '../client/components/SeoHead';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const passwordStrength = password ? getPasswordStrength(password) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = sanitizeInput(email);
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // username/isAdmin are re-derived server-side from email (see userSignupFields.ts) —
      // values here just satisfy the generated signup payload shape.
      await signup({ email: cleanEmail, password, username: cleanEmail, isAdmin: false });
      setSignedUp(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (signedUp) {
    return (
      <AuthPageLayout>
        <SeoHead title='Sign Up — LicenseDent' description='Create your LicenseDent account.' path='/signup' noindex />
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Mail className='h-5 w-5 text-primary' aria-hidden='true' />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground mb-2'>Check your email</h1>
          <p className='text-sm text-muted-foreground mb-6'>
            We sent a verification link to <span className='font-medium text-foreground'>{email}</span>. Click it
            to activate your account.
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
      <SeoHead title='Sign Up — LicenseDent' description='Create your LicenseDent account.' path='/signup' noindex />
      <h1 className='text-2xl font-semibold tracking-tight text-foreground mb-1.5'>Create your account</h1>
      <p className='text-sm text-muted-foreground mb-7'>Start practicing for your Gulf licensing exam today.</p>

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
        <div className='space-y-1.5'>
          <Label htmlFor='password'>Password</Label>
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
          {passwordStrength && (
            <div className='pt-1'>
              <div className='flex gap-1'>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < passwordStrength.score ? passwordStrength.colorClassName : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>{passwordStrength.label}</p>
            </div>
          )}
        </div>
        <Button type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>

      <p className='mt-7 text-center text-sm text-muted-foreground'>
        Already have an account?{' '}
        <WaspRouterLink to={routes.LoginRoute.to} className='font-medium text-primary hover:underline'>
          Log in
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
