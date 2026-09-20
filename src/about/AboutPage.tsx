import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import SeoHead from '../client/components/SeoHead';

/**
 * PRD-006 M20: the site's core claim -- "every answer checked by a
 * dentist" -- had no page saying who does that. Content below is
 * deliberately generic (no individual names) and omits legal-entity
 * details (jurisdiction, registration number): both were explicit calls
 * from the user (2026-09-20) rather than something to invent. "LicenseDent"
 * is used as the operating name only; add real legal-entity details here
 * once the user provides them (see docs/09-work-changelog.md same-date
 * entry for the conversation this came from).
 */
export default function AboutPage() {
  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='About LicenseDent'
        description='Who verifies LicenseDent’s dental licensing exam content, and how to get in touch.'
        path='/about'
      />
      <main className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>About LicenseDent</h1>

        <div className='mt-10 space-y-12'>
          <section>
            <h2 className='text-xl font-semibold'>What we do</h2>
            <div className='mt-4 space-y-3'>
              <p className='text-sm leading-7 text-foreground/85'>
                LicenseDent builds practice question banks, timed mock exams, and subject-wise revision tools for
                dentists preparing for licensing exams across the Gulf (DHA, HAAD, MOH, SHA, SMLE, OMSB, QCHP,
                NHRA, KMLE) and the Irish Dental Council statutory exam (IDC Ireland).
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold'>Who verifies our content</h2>
            <div className='mt-4 space-y-3'>
              <p className='text-sm leading-7 text-foreground/85'>
                Every question in our bank is written or reviewed by a panel of licensed, practicing dentists
                before it reaches students. Nothing is published from an unverified or AI-generated guess — content
                flagged as uncertain during review stays hidden from students until a reviewer confirms it.
              </p>
            </div>
          </section>

          <section>
            <h2 className='text-xl font-semibold'>Get in touch</h2>
            <div className='mt-4 space-y-3'>
              <p className='text-sm leading-7 text-foreground/85'>
                Questions about your account, a plan, or something you think we got wrong in a question? Email us
                at{' '}
                <a href='mailto:support@licensedent.com' className='text-primary underline-offset-2 hover:underline'>
                  support@licensedent.com
                </a>
                . We read every message.
              </p>
            </div>
          </section>
        </div>

        <div className='mt-14 flex flex-wrap gap-3'>
          <Button asChild variant='outline'>
            <WaspRouterLink to={routes.LandingPageRoute.to}>Back to home</WaspRouterLink>
          </Button>
          <Button asChild>
            <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
          </Button>
        </div>
      </main>
    </div>
  );
}
