import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { getMyOnboardingProfile, useQuery } from 'wasp/client/operations';
import { routes } from 'wasp/client/router';
import './Main.css';
import NavBar from './components/NavBar/NavBar';
import { demoNavigationitems, marketingNavigationItems } from './components/NavBar/constants';
import CookieConsentBanner from './components/cookie-consent/Banner';

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const isMarketingPage = useMemo(() => {
    return location.pathname === '/' || location.pathname.startsWith('/pricing');
  }, [location]);

  const navigationItems = isMarketingPage ? marketingNavigationItems : demoNavigationitems;

  const shouldDisplayAppNavBar = useMemo(() => {
    return (
      location.pathname !== routes.LoginRoute.build() && location.pathname !== routes.SignupRoute.build()
    );
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
      <div className='min-h-screen bg-background text-foreground'>
        {isCheckingOnboardingGate ? null : needsOnboarding ? (
          <Navigate to={routes.OnboardingRoute.to} replace />
        ) : isAppShell ? (
          <Outlet />
        ) : (
          <>
            {shouldDisplayAppNavBar && <NavBar navigationItems={navigationItems} />}
            <div className='mx-auto max-w-screen-2xl'>
              <Outlet />
            </div>
          </>
        )}
      </div>
      <CookieConsentBanner />
    </>
  );
}
