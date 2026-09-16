import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { VerifyEmailForm } from 'wasp/client/auth';
import { AuthPageLayout } from '../AuthPageLayout';
import { authFormAppearance } from '../authFormAppearance';

export function EmailVerificationPage() {
  return (
    <AuthPageLayout>
      <h2 className='text-2xl font-bold text-foreground mb-1'>Verify your email</h2>
      <p className='text-sm text-muted-foreground mb-6'>
        Confirming your LicenseDent account.
      </p>
      <VerifyEmailForm appearance={authFormAppearance} />
      <p className='mt-6 text-center text-sm text-muted-foreground'>
        Verified already?{' '}
        <WaspRouterLink to={routes.LoginRoute.to} className='font-medium text-primary underline'>
          Go to login
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
