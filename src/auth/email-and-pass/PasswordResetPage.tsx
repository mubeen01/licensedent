import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { ResetPasswordForm } from 'wasp/client/auth';
import { AuthPageLayout } from '../AuthPageLayout';
import { authFormAppearance } from '../authFormAppearance';

export function PasswordResetPage() {
  return (
    <AuthPageLayout>
      <h2 className='text-2xl font-bold text-foreground mb-1'>Reset your password</h2>
      <p className='text-sm text-muted-foreground mb-6'>Choose a new password for your account.</p>
      <ResetPasswordForm appearance={authFormAppearance} />
      <p className='mt-6 text-center text-sm text-muted-foreground'>
        <WaspRouterLink to={routes.LoginRoute.to} className='font-medium text-primary underline'>
          Back to login
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
