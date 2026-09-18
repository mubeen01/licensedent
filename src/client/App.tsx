import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from 'wasp/client/auth';
import { getMyOnboardingProfile, useQuery } from 'wasp/client/operations';
import { routes } from 'wasp/client/router';
import './Main.css';
import NavBar from './components/NavBar/NavBar';
import { marketingNavigationItems } from './components/NavBar/constants';
import CookieConsentBanner from './components/cookie-consent/Banner';
import OrganizationJsonLd from './components/OrganizationJsonLd';
import Footer from '../landing-page/components/Footer';
import { footerNavigation } from '../landing-page/contentSections';

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();

  // Every standalone auth page uses AuthPageLayout's own full-height, self-
  // branded split screen -- the marketing NavBar/Footer must never wrap
  // around it (double branding, duplicated chrome).
  const STANDALONE_AUTH_PATHS = [
    routes.LoginRoute.build(),
    routes.SignupRoute.build(),
    routes.RequestPasswordResetRoute.build(),
    routes.PasswordResetRoute.build(),
    routes.EmailVerificationRoute.build(),
  ];
  const shouldDisplayAppNavBar = useMemo(() => {
    return !STANDALONE_AUTH_PATHS.includes(location.pathname);
  }, [location]);

  // Every logged-in "app" area (student dashboard + admin panel) has its own
  // self-contained header/sidebar chrome -- the public marketing NavBar
  // (Practice / Free Demo Exam / Pricing / Blog) must never layer on top of it.
  // '/onboarding' gets the same bare-Outlet treatment: it's a full self-
  // contained page, not a dashboard sub-page.
  const APP_SHELL_PREFIXES = [
    '/admin',
    '/dashboard',
    '/practice',
    '/mock-exams',
    '/quiz-builder',
    '/video-lectures',
    '/progress',
    '/account',
    '/billing',
    '/onboarding',
  ];
  const isAppShell = useMemo(() => {
    return APP_SHELL_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  }, [location]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  // Mandatory one-time onboarding gate. Only checked on app-shell routes (not
  // on public/marketing pages) so a logged-in-but-not-onboarded user browsing
  // e.g. /pricing is never interrupted -- the gate fires the moment they
  // enter the dashboard/practice/etc. '/onboarding' itself is excluded to
  // avoid redirecting to itself.
  const { data: user, isLoading: isAuthLoading } = useAuth();
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const shouldCheckOnboarding = isAppShell && !isOnboardingRoute;

  // Kept enabled whenever a user is logged in -- NOT scoped down to
  // `shouldCheckOnboarding` routes only. This query must stay "active" while
  // sitting on /onboarding itself, otherwise Wasp's automatic action->query
  // cache invalidation (completeOnboarding shares the UserProfile entity with
  // this query) has nothing to refetch: invalidating a disabled query just
  // marks it stale without re-fetching, so the very next render on
  // /dashboard reads one stale "not completed" value before the real refetch
  // resolves and bounces back to /onboarding -- with the draft already
  // cleared, looking like a blank, endless loop. Keeping it active the whole
  // time means the invalidation this component's own completeOnboarding call
  // triggers actually refetches before navigate() ever runs.
  const { data: onboardingProfile, isLoading: isOnboardingProfileLoading } = useQuery(
    getMyOnboardingProfile,
    undefined,
    { enabled: !!user }
  );

  const isCheckingOnboardingGate =
    shouldCheckOnboarding && (isAuthLoading || (!!user && isOnboardingProfileLoading));
  const needsOnboarding = shouldCheckOnboarding && !!user && !onboardingProfile?.completedAt;

  return (
    <>
      <OrganizationJsonLd />
      <div className='min-h-screen bg-background text-foreground'>
        {isCheckingOnboardingGate ? null : needsOnboarding ? (
          <Navigate to={routes.OnboardingRoute.to} replace />
        ) : isAppShell ? (
          <Outlet />
        ) : (
          <>
            {shouldDisplayAppNavBar && <NavBar navigationItems={marketingNavigationItems} />}
            <div className='mx-auto max-w-(--breakpoint-2xl)'>
              <Outlet />
            </div>
            {/* Same gate as the NavBar above: every marketing/public page (landing,
                pricing, legal, exam guides) gets one shared footer here instead of
                each page importing its own -- Pricing and Legal previously rendered
                with no footer at all because they never called it themselves. */}
            {shouldDisplayAppNavBar && <Footer footerNavigation={footerNavigation} />}
          </>
        )}
      </div>
      <CookieConsentBanner />
    </>
  );
}
