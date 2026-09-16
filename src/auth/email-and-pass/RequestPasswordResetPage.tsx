import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { ForgotPasswordForm } from 'wasp/client/auth';
import { AuthPageLayout } from '../AuthPageLayout';
import { authFormAppearance } from '../authFormAppearance';

export function RequestPasswordResetPage() {
  return (
    <AuthPageLayout>
      <h2 className='text-2xl font-bold text-foreground mb-1'>Forgot your password?</h2>
      <p className='text-sm text-muted-foreground mb-6'>
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <ForgotPasswordForm appearance={authFormAppearance} />
      <p className='mt-6 text-center text-sm text-muted-foreground'>
        <WaspRouterLink to={routes.LoginRoute.to} className='font-medium text-primary underline'>
          Back to login
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
