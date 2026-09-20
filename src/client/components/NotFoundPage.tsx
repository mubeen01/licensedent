import { SearchX } from 'lucide-react';
import { useAuth } from 'wasp/client/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import SeoHead from './SeoHead';

export function NotFoundPage() {
  const { data: user } = useAuth();

  return (
    <div className='flex min-h-[70vh] items-center justify-center px-6 py-24'>
      {/* PRD-006 H5: noCanonical -- every unmatched URL on the site rendered
          this same page, and it used to emit `canonical`/`og:url` both
          pointing at the literal, non-existent '/404' path. That's a
          contradictory signal alongside noindex (already saying "don't
          index this"), and a source of Search Console "soft 404" reports
          across every stray/typo'd URL. `path` stays for the sitewide
          convention SeoHead expects, but neither tag is emitted now. */}
      <SeoHead
        title='Page Not Found — LicenseDent'
        description='This page could not be found.'
        path='/404'
        noindex
        noCanonical
      />
      <div className='card-elevated flex flex-col items-center gap-4 p-10 text-center'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted'>
          <SearchX className='h-7 w-7 text-muted-foreground' aria-hidden='true' />
        </div>
        <h1 className='text-3xl font-bold text-foreground'>Page not found</h1>
        <p className='max-w-sm text-sm text-muted-foreground'>
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Button asChild className='mt-2'>
          <WaspRouterLink to={user ? routes.DashboardHomeRoute.to : routes.LandingPageRoute.to}>
            Go back home
          </WaspRouterLink>
        </Button>
      </div>
    </div>
  );
}
