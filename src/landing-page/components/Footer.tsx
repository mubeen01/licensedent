import { Mail } from 'lucide-react';
import { Link as ReactRouterLink } from 'react-router';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';

interface NavigationItem {
  name: string;
  href: string;
}

export default function Footer({
  footerNavigation,
}: {
  footerNavigation: {
    product: NavigationItem[];
    company: NavigationItem[];
  };
}) {
  return (
    <footer
      aria-label='Footer'
      className='relative mt-24 border-t border-border bg-card-subtle/40'
    >
      {/* Thin gradient accent along the very top */}
      <div
        className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent'
        aria-hidden='true'
      />

      <div className='mx-auto max-w-7xl px-6 py-16 lg:px-8'>
        <div className='grid grid-cols-2 gap-10 md:grid-cols-12'>
          {/* Brand */}
          <div className='col-span-2 md:col-span-5 md:pr-8'>
            <WaspRouterLink to={routes.LandingPageRoute.to} className='flex items-center gap-2'>
              <span className='flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-xs'>
                <img src='/logo/licensedent-icon.svg' alt='LicenseDent' width={512} height={512} className='h-full w-full object-cover' />
              </span>
              <span className='text-lg font-bold text-foreground'>LicenseDent</span>
            </WaspRouterLink>
            <p className='mt-4 max-w-sm text-sm leading-6 text-muted-foreground'>
              Question banks, recall bank, timed mock tests and dentist-written explanations for General
              Dentists preparing for DHA, HAAD, MOH, SMLE and IDC Ireland licensing exams.
            </p>

            <a
              href='mailto:support@licensedent.com'
              className='mt-5 inline-flex items-center gap-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
            >
              <Mail className='h-4 w-4' /> support@licensedent.com
            </a>
          </div>

          {/* Product */}
          <div className='md:col-span-3'>
            <h3 className='text-sm font-semibold leading-6 text-foreground'>Product</h3>
            <ul role='list' className='mt-4 space-y-3'>
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  {/* PRD-006 M16: these were plain <a href> -- clicking one
                      did a full document navigation/reload instead of a SPA
                      transition, even for internal links. Wasp's own typed
                      Link can't express a hash-only fragment on a route
                      (`to` must be one of its generated literal route
                      strings), so this follows the same pattern NavBar.tsx
                      already uses for its identical `/#exams`-style items:
                      plain react-router Link, which still renders a real,
                      crawlable <a href> under the hood. */}
                  <ReactRouterLink
                    to={item.href}
                    className='inline-block py-1 text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                  >
                    {item.name}
                  </ReactRouterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className='md:col-span-2'>
            <h3 className='text-sm font-semibold leading-6 text-foreground'>Company</h3>
            <ul role='list' className='mt-4 space-y-3'>
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  {item.href.startsWith('mailto:') ? (
                    <a
                      href={item.href}
                      className='inline-block py-1 text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                    >
                      {item.name}
                    </a>
                  ) : (
                    <ReactRouterLink
                      to={item.href}
                      className='inline-block py-1 text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                    >
                      {item.name}
                    </ReactRouterLink>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Get started CTA */}
          <div className='md:col-span-2'>
            <h3 className='text-sm font-semibold leading-6 text-foreground'>Get started</h3>
            <ul role='list' className='mt-4 space-y-3'>
              <li>
                <WaspRouterLink
                  to={routes.SignupRoute.to}
                  className='inline-block py-1 text-sm font-semibold leading-6 text-primary transition-colors hover:text-primary/80'
                >
                  Create free account
                </WaspRouterLink>
              </li>
              <li>
                <WaspRouterLink
                  to={routes.PricingPageRoute.to}
                  className='inline-block py-1 text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                >
                  View plans
                </WaspRouterLink>
              </li>
              <li>
                <WaspRouterLink
                  to={routes.LoginRoute.to}
                  className='inline-block py-1 text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                >
                  Log in
                </WaspRouterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row'>
          <p className='text-xs text-muted-foreground'>
            &copy; {new Date().getFullYear()} LicenseDent, operated by ThreePeak Group LLC (Wyoming, USA). All rights reserved.
          </p>
          <p className='text-xs text-muted-foreground'>
            Not affiliated with DHA, HAAD, DOH, MOH, SHA, SCFHS, QCHP, DHP, Kuwait MOH, NHRA, OMSB, Dental Council of Ireland or any licensing
            authority.
          </p>
        </div>

        {/* Closing statement */}
        <div className='mt-8 border-t border-border pt-8 text-center'>
          <p className='text-sm font-medium text-foreground'>Your success. Our mission.</p>
          <p className='mt-1.5 text-xs text-muted-foreground'>
            Empowering dentists across the Gulf to walk into their licensing exam prepared.
          </p>
        </div>
      </div>
    </footer>
  );
}