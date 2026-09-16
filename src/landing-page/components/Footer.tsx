import { Mail } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';

interface NavigationItem {
  name: string;
  href: string;
}

/**
 * Social links are inline SVGs (no icon-library dependency, so they can't break
 * the build) and point at "#" placeholders. Replace the hrefs with your real
 * profiles, or delete this array to hide the row entirely.
 */
const socials = [
  {
    name: 'Instagram',
    href: '#',
    path: 'M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.26.07 1.64.07 4.83s0 3.57-.07 4.83c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.26.06-1.64.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.57.07-4.83c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.73.36-1.05.68-.32.32-.51.62-.68 1.05-.12.32-.27.8-.31 1.7C3.24 8.5 3.24 8.86 3.24 12s0 3.5.07 4.74c.04.9.19 1.38.31 1.7.17.43.36.73.68 1.05.32.32.62.51 1.05.68.32.12.8.27 1.7.31 1.24.07 1.6.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.31.43-.17.73-.36 1.05-.68.32-.32.51-.62.68-1.05.12-.32.27-.8.31-1.7.07-1.24.07-1.6.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.31-1.7a2.8 2.8 0 0 0-.68-1.05 2.8 2.8 0 0 0-1.05-.68c-.32-.12-.8-.27-1.7-.31C15.5 4 15.14 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 8.14A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Zm6.3-8.34a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z',
  },
  {
    name: 'LinkedIn',
    href: '#',
    path: 'M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.4 8.4h3.1V21H3.4V8.4Zm5.06 0h2.97v1.72h.04c.41-.78 1.42-1.6 2.93-1.6 3.13 0 3.71 2.06 3.71 4.74V21h-3.09v-5.36c0-1.28-.02-2.92-1.78-2.92-1.78 0-2.05 1.39-2.05 2.83V21H8.46V8.4Z',
  },
  {
    name: 'YouTube',
    href: '#',
    path: 'M23.5 6.5a3 3 0 0 0-2.1-2.12C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.4.52A3 3 0 0 0 .5 6.5 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.12c1.9.52 9.4.52 9.4.52s7.5 0 9.4-.52a3 3 0 0 0 2.1-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z',
  },
];

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
      className='relative mt-24 border-t border-border bg-card-subtle/40 dark:bg-boxdark-2'
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
                <img src='/licensedent-icon.svg' alt='LicenseDent' className='h-full w-full object-cover' />
              </span>
              <span className='text-lg font-bold text-foreground'>LicenseDent</span>
            </WaspRouterLink>
            <p className='mt-4 max-w-sm text-sm leading-6 text-muted-foreground'>
              Question banks, recall bank, timed mock tests and expert-verified explanations for General
              Dentists preparing for DHA, HAAD, MOH, SMLE and IDC Ireland licensing exams.
            </p>

            <a
              href='mailto:support@licensedent.com'
              className='mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
            >
              <Mail className='h-4 w-4' /> support@licensedent.com
            </a>

            <div className='mt-5 flex items-center gap-2'>
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary'
                >
                  <svg viewBox='0 0 24 24' className='h-4 w-4' fill='currentColor' aria-hidden='true'>
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className='md:col-span-3'>
            <h3 className='text-sm font-semibold leading-6 text-foreground'>Product</h3>
            <ul role='list' className='mt-4 space-y-3'>
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className='text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                  >
                    {item.name}
                  </a>
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
                  <a
                    href={item.href}
                    className='text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                  >
                    {item.name}
                  </a>
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
                  className='text-sm font-semibold leading-6 text-primary transition-colors hover:text-primary/80'
                >
                  Create free account
                </WaspRouterLink>
              </li>
              <li>
                <WaspRouterLink
                  to={routes.PricingPageRoute.to}
                  className='text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
                >
                  View plans
                </WaspRouterLink>
              </li>
              <li>
                <WaspRouterLink
                  to={routes.LoginRoute.to}
                  className='text-sm leading-6 text-muted-foreground transition-colors hover:text-primary'
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
            &copy; {new Date().getFullYear()} LicenseDent. All rights reserved.
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