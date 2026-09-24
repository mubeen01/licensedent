import { useContext, useEffect } from 'react';
import { UNSAFE_DataRouterContext } from 'react-router';

type Section = 'admin' | 'student' | null;

/**
 * Once the user is inside the admin panel or the student dashboard, preload
 * the code for every other page in that same area while the browser is
 * idle. Every Wasp page is a lazy route, so without this each sidebar item's
 * first click waited on a code download (and, in dev, a Vite compile)
 * before anything changed on screen. Calling a route's `lazy()` early just
 * warms the module cache: when React Router later calls it for the real
 * navigation, the import resolves instantly.
 *
 * Scoped per area on purpose: public visitors never download admin or
 * dashboard code, and students never download admin code. Parameterised
 * routes (`/:attemptId`) are skipped, because they're reached from inside
 * a page, not from the sidebar.
 *
 * Uses React Router's `UNSAFE_DataRouterContext` (the only way to reach the
 * router's route list from inside the tree Wasp creates). If that ever
 * changes shape, this degrades to a no-op; navigation still works, it's just
 * not preloaded.
 */
export function usePrefetchSectionRoutes(section: Section, studentPrefixes: string[]) {
  const router = useContext(UNSAFE_DataRouterContext)?.router;

  useEffect(() => {
    if (!section || !router) return;

    const children = router.routes?.[0]?.children ?? [];
    const matchesSection = (path: string) =>
      section === 'admin'
        ? path.startsWith('/admin')
        : studentPrefixes.some((prefix) => path.startsWith(prefix));

    const loaders = children
      .filter((route) => typeof route.path === 'string' && !route.path.includes(':') && matchesSection(route.path))
      .map((route): unknown => route.lazy)
      // Wasp generates function-form `lazy`; the object form (per-property
      // lazy loaders) isn't used here, so it's simply skipped.
      .filter((lazy): lazy is () => Promise<unknown> => typeof lazy === 'function');

    const run = () => {
      for (const load of loaders) load().catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = globalThis.setTimeout(run, 1500);
    return () => globalThis.clearTimeout(handle);
    // studentPrefixes is a module-level constant in App.tsx; section changes drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, router]);
}
