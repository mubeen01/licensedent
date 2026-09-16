import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';

/**
 * Terms of service, refund policy, and disclaimers in one place.
 * Owner-approved text required before public launch (status doc O4) — this
 * first draft is the standard 7-day no-questions-asked policy per plan D6.
 * Footer links use /legal#terms, /legal#refund, /legal#disclaimer anchors.
 */
const sections = [
  {
    id: 'terms',
    title: 'Terms of Service',
    body: [
      'LicenseDent ("we", "us", "the platform") provides exam-preparation software and practice content for Gulf dental licensing examinations. By creating an account or purchasing a plan you agree to these terms.',
      'Access is personal. Your account and purchased access are for your own use and may not be shared, resold, or distributed to others. We may suspend accounts that share credentials or content.',
      'Plans are one-time purchases granting access for a fixed duration (30, 90, or 180 days). Access does not auto-renew; if you wish to continue after your access period you can purchase again at the then-current price.',
      'You may not scrape, copy, redistribute, or attempt to prevent copy-deterrence measures applied to purchased content. Screenshots of your own study progress (scores, certificates) may be shared for personal use.',
      'The platform is provided "as is". We work hard to keep question content accurate and verified, but we cannot guarantee the content will be error-free. Use our in-app support to report any question you believe is wrong.',
      'We may update these terms. Material changes will be announced in-app.',
    ],
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    body: [
      'We want you to be confident in what you buy. If you purchase a plan and decide it is not right for you, contact us within 7 days of purchase and we will refund you in full, no questions asked.',
      'After 7 days, refunds are considered case by case. Please contact support through your Account page — we read every message.',
      'Refunds are issued to the original payment method within 5–10 business days after approval.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimers',
    body: [
      'LicenseDent is an independent exam-preparation service. We are not affiliated with, endorsed by, or connected to the Dubai Health Authority (DHA), Department of Health (DOH/HAAD), Ministry of Health (MOH), Saudi Commission (SMLE), or any other licensing authority whose name, code, or exam appears on this platform. All authority names and trademarks are the property of their respective owners and are used for identification only.',
      'Content on this platform is study-preparation material. It is not clinical advice, and does not replace professional judgement, official syllabi, or your own clinical training. Always cross-check against current official guidelines.',
      'Using this platform does not guarantee passing any examination. Results depend on many individual factors, including prior knowledge and preparation time.',
    ],
  },
];

export default function LegalPage() {
  return (
    <div className='bg-background text-foreground'>
      <div className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Terms, Refunds &amp; Disclaimers</h1>
        <p className='mt-3 text-sm text-muted-foreground'>
          Last updated: 18 August 2026 · Questions? Message us from your{' '}
          <WaspRouterLink to={routes.AccountRoute.to} className='text-primary underline-offset-2 hover:underline'>
            Account page
          </WaspRouterLink>
          .
        </p>

        <main className='mt-10 space-y-12'>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className='scroll-mt-24'>
              <h2 className='text-xl font-semibold'>{section.title}</h2>
              <div className='mt-4 space-y-3'>
                {section.body.map((para, i) => (
                  <p key={i} className='text-sm leading-7 text-foreground/85'>
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </main>

        <div className='mt-14 flex flex-wrap gap-3'>
          <Button asChild variant='outline'>
            <WaspRouterLink to={routes.LandingPageRoute.to}>Back to home</WaspRouterLink>
          </Button>
          <Button asChild>
            <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
