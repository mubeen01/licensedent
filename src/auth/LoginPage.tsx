import { FormEvent, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { login } from 'wasp/client/auth';
import { useNavigate } from 'react-router';
import { Lock, Mail } from 'lucide-react';
import { AuthPageLayout } from './AuthPageLayout';
import { sanitizeInput, validateEmail } from './authValidation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import SeoHead from '../client/components/SeoHead';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = sanitizeInput(email);
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: cleanEmail, password });
      navigate(routes.DashboardHomeRoute.to);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthPageLayout>
      <SeoHead title='Log In — LicenseDent' description='Log in to your LicenseDent account.' path='/login' noindex />
      <h2 className='text-2xl font-semibold tracking-tight text-foreground mb-1.5'>Welcome back</h2>
      <p className='text-sm text-muted-foreground mb-7'>Log in to keep your practice streak going.</p>

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
              autoComplete='current-password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>
        <Button type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className='mt-7 space-y-2 text-center text-sm text-muted-foreground'>
        <p>
          Forgot your password?{' '}
          <WaspRouterLink to={routes.RequestPasswordResetRoute.to} className='font-medium text-primary hover:underline'>
            Reset it
          </WaspRouterLink>
        </p>
        <p>
          Don&apos;t have an account?{' '}
          <WaspRouterLink to={routes.SignupRoute.to} className='font-medium text-primary hover:underline'>
            Sign up
          </WaspRouterLink>
        </p>
      </div>
    </AuthPageLayout>
  );
}
