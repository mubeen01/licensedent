import { useEffect, useLayoutEffect, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Outlet, useLocation, useNavigationType } from 'react-router';
import { useAuth } from 'wasp/client/auth';
import { getMyOnboardingProfile, useQuery } from 'wasp/client/operations';
import { routes } from 'wasp/client/router';
import './Main.css';
import NavBar from './components/NavBar/NavBar';
import { marketingNavigationItems } from './components/NavBar/constants';
import CookieConsentBanner from './components/cookie-consent/Banner';
import OrganizationJsonLd from './components/OrganizationJsonLd';
import NavigationProgress from './components/NavigationProgress';
import { usePrefetchSectionRoutes } from './hooks/usePrefetchSectionRoutes';
import Footer from '../landing-page/components/Footer';
import { footerNavigation } from '../landing-page/contentSections';
import { SITE_TITLE } from '../shared/siteTitle';

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
// Student-sidebar targets preloaded by usePrefetchSectionRoutes. '/lessons'
// is a sidebar item (Ireland scope) but isn't an app-shell prefix above.
const STUDENT_SECTION_PREFIXES = APP_SHELL_PREFIXES.filter((p) => p !== '/admin' && p !== '/onboarding').concat('/lessons');

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

  const isAppShell = useMemo(() => {
    return APP_SHELL_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  }, [location]);

  // Preload the rest of the current area's pages (admin or student) so
  // sidebar clicks don't wait on a lazy-route code download -- see the hook.
  usePrefetchSectionRoutes(
    location.pathname.startsWith('/admin') ? 'admin' : isAppShell ? 'student' : null,
    STUDENT_SECTION_PREFIXES
  );

  // Scroll on navigation. Previously only #hash links scrolled, so clicking
  // e.g. "Blog" in the footer opened /blog still scrolled to the bottom
  // (an SPA route change keeps the old window scroll position). New pages
  // now start at the top; back/forward (POP) is left alone so the browser
  // keeps its usual restore-where-you-were behaviour. Depends on the whole
  // `location` object (new key per navigation), so re-clicking the link for
  // the page you're already on also returns you to the top.
  const navigationType = useNavigationType();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
      return;
    }
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location, navigationType]);

  // Safety net for the "page freezes after clicking a menu item" bug: Radix
  // modal Sheet/DropdownMenu set `pointer-events: none` on <body> while
  // open, and if the menu is unmounted mid-close by the route change (the
  // marketing NavBar disappears entirely on /login, /dashboard, etc.) that
  // style can be left behind, making the whole page unclickable. After each
  // navigation, clear it unless a Radix layer is genuinely still open.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const hasOpenLayer = document.querySelector(
        '[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [role="alertdialog"][data-state="open"]'
      );
      if (!hasOpenLayer && document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  // Tab title. Wasp's generated root layout renders the app-level `title:`
  // as a <title> in <head>, and pages that use SeoHead render a second one.
  // `document.title` reads the FIRST <title>, which is the layout's generic
  // one. Setting `document.title` updates that first element's text in
  // place, so it always shows the current page's title.
  //
  // This used to be done by deleting the extra <title> elements from the
  // DOM (c4ae0d6). That crashed navigation: React owns those nodes, and on
  // the homepage (whose title text equals the site title) the removed node
  // was the one React later tried to unmount. The result was
  // "NotFoundError: removeChild", the old page frozen on screen, and the
  // app hanging on the next click. Never remove React-managed head nodes.
  //
  // Reset to the site title on every route change (layout effect, so it
  // runs before SeoHead's own effect sets the page title). Pages without
  // SeoHead (admin, dashboard) then show the site title instead of the last
  // public page's.
  useLayoutEffect(() => {
    document.title = SITE_TITLE;
  }, [location.pathname]);

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
      <NavigationProgress />
      <div className='min-h-screen bg-background text-foreground'>
        {isCheckingOnboardingGate ? null : needsOnboarding ? (
          <Navigate to={routes.OnboardingRoute.to} replace />
        ) : isAppShell ? (
          <Outlet />
        ) : (
          // theme-landing here (not just on LandingPage's own div) so the shared
          // NavBar/Announcement/Footer chrome and every other public page
          // (pricing, exams, legal) get the same 2026-09-22 indigo/violet/amber
          // identity as the homepage -- previously scoped to LandingPage alone,
          // which left the Announcement banner and NavBar stuck on the old
          // teal/sky palette directly above the new hero. isAppShell above keeps
          // the logged-in dashboard (its own theme) completely untouched.
          <div className='theme-landing'>
            {shouldDisplayAppNavBar && <NavBar navigationItems={marketingNavigationItems} />}
            <div className='mx-auto max-w-(--breakpoint-2xl)'>
              <Outlet />
            </div>
            {/* Same gate as the NavBar above: every marketing/public page (landing,
                pricing, legal, exam guides) gets one shared footer here instead of
                each page importing its own -- Pricing and Legal previously rendered
                with no footer at all because they never called it themselves. */}
            {shouldDisplayAppNavBar && <Footer footerNavigation={footerNavigation} />}
          </div>
        )}
      </div>
      <CookieConsentBanner />
      {/* Global toast portal -- currently only used for the admin review
          queue's undo toasts (see undoToast.tsx), which render their own
          fully custom, theme-aware JSX via toast.custom() rather than
          react-hot-toast's default toast styling. */}
      <Toaster position='bottom-right' />
    </>
  );
}
