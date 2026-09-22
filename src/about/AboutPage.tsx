import { BookCheck, ClipboardCheck, Eye, FileClock, Mail } from 'lucide-react';
import { type CSSProperties } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import SeoHead from '../client/components/SeoHead';
import { useBankStats } from '../client/hooks/useBankStats';
import CTABanner from '../landing-page/components/CTABanner';
import Eyebrow from '../landing-page/components/Eyebrow';
import Reveal from '../landing-page/components/Reveal';
import SectionTitle from '../landing-page/components/SectionTitle';
import TrustSection from '../landing-page/components/TrustSection';

/**
 * PRD-006 M20: the site's core claim -- "every answer checked by a
 * dentist" -- had no page saying who does that. Content stays deliberately
 * generic (no individual names) and omits legal-entity details (jurisdiction,
 * registration number): both were explicit calls from the user (2026-09-20)
 * rather than something to invent. "LicenseDent" is used as the operating
 * name only; add real legal-entity details here once the user provides them
 * (see docs/09-work-changelog.md same-date entry for that conversation).
 *
 * 2026-09-23: rebuilt on the landing page's own building blocks (Eyebrow /
 * Reveal / SectionTitle / card-elevated / TrustSection / CTABanner) instead
 * of a plain prose page, so About reads as the same product as home rather
 * than a bolted-on legal page. Live question/exam counts reuse the same
 * useBankStats hook the landing page uses -- no separate hardcoded numbers
 * to drift out of sync.
 */

const dotGridStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(#000000 1.8px, transparent 1.8px)',
  backgroundSize: '22px 22px',
  opacity: 0.06,
};

const reviewSteps = [
  {
    icon: BookCheck,
    title: 'Written from real practice',
    description: 'Every question starts from real clinical knowledge and the actual blueprint of the exam it targets — not a generic MCQ template.',
  },
  {
    icon: Eye,
    title: 'Checked by a second dentist',
    description: 'Nothing reaches a student unreviewed. A second practicing dentist checks the answer key and explanation before it publishes.',
  },
  {
    icon: ClipboardCheck,
    title: 'Held back until confirmed',
    description: 'Anything flagged as uncertain during review stays hidden from students until a reviewer resolves it — never published on a guess.',
  },
  {
    icon: FileClock,
    title: 'Corrections, never silent edits',
    description: "If a published question is ever wrong, it's corrected through the same review process and the previous version is kept on record.",
  },
];

export default function AboutPage() {
  const { stats: bankStats } = useBankStats();

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='About LicenseDent'
        description="Who verifies LicenseDent's dental licensing exam content, and how to get in touch."
        path='/about'
      />

      <main className='isolate'>
        {/* Hero */}
        <section className='relative overflow-hidden border-b border-border/60'>
          <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden='true'>
            <div style={dotGridStyle} />
          </div>
          <div className='mx-auto max-w-3xl px-6 py-20 text-center sm:py-28'>
            <Reveal className='flex justify-center'>
              <Eyebrow>About LicenseDent</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className='mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl'>
                Built by dentists, <span className='text-primary'>for dentists</span> chasing a licence
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className='mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
                LicenseDent builds practice question banks, timed mock exams, and subject-wise revision
                tools for dentists preparing for licensing exams across the Gulf and Ireland — every
                question written or reviewed by a practicing dentist before a student ever sees it.
              </p>
            </Reveal>
          </div>
        </section>

        {/* What we do — live, honest numbers */}
        <div className='border-b border-border/60 bg-muted/30'>
          <div className='mx-auto max-w-7xl px-6 py-14 lg:px-8'>
            <div className='grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 sm:divide-x'>
              <Reveal className='px-6 py-6 first:pt-0 sm:py-0 sm:first:pl-0'>
                <div className='text-4xl font-bold tracking-tight text-foreground'>
                  {bankStats?.publishedQuestionCount != null ? `${bankStats.publishedQuestionCount.toLocaleString()}+` : 'Growing'}
                </div>
                <div className='mt-1.5 text-sm font-semibold text-foreground'>Published questions</div>
                <div className='mt-1 text-sm text-muted-foreground'>Every one written or reviewed by a dentist.</div>
              </Reveal>
              <Reveal delay={80} className='px-6 py-6 sm:py-0'>
                <div className='text-4xl font-bold tracking-tight text-foreground'>{bankStats?.examCount ?? 10}</div>
                <div className='mt-1.5 text-sm font-semibold text-foreground'>Gulf + Ireland exams</div>
                <div className='mt-1 text-sm text-muted-foreground'>DHA, HAAD, MOH, SMLE, IDC Ireland and more.</div>
              </Reveal>
              <Reveal delay={160} className='px-6 py-6 last:pb-0 sm:py-0 sm:last:pr-0'>
                <div className='text-4xl font-bold tracking-tight text-foreground'>100%</div>
                <div className='mt-1.5 text-sm font-semibold text-foreground'>Dentist-verified content</div>
                <div className='mt-1 text-sm text-muted-foreground'>Nothing goes live without a second review.</div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* How content gets reviewed */}
        <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
          <SectionTitle
            eyebrow='Our process'
            title='How a question reaches your practice session'
            description='The same four checkpoints, every time — no shortcuts for volume.'
          />
          <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {reviewSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={idx * 120} className='h-full'>
                  <div className='card-elevated card-elevated-hover flex h-full flex-col p-6'>
                    <span className='text-4xl font-bold tracking-tight text-primary/15' aria-hidden='true'>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className='mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-secondary/15 text-primary'>
                      <Icon className='h-5 w-5' strokeWidth={1.75} />
                    </div>
                    <h3 className='mt-4 text-base font-semibold text-foreground'>{step.title}</h3>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>{step.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Why trust us — reuses the exact section from the landing page */}
        <div className='border-y border-border/60 bg-muted/30'>
          <TrustSection />
        </div>

        {/* Get in touch */}
        <div className='mx-auto max-w-4xl px-6 py-16 md:py-24 lg:px-8'>
          <Reveal>
            <div className='card-elevated flex flex-col items-center gap-4 p-10 text-center'>
              <span className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
                <Mail className='h-5 w-5' />
              </span>
              <h2 className='text-2xl font-bold text-foreground'>Get in touch</h2>
              <p className='max-w-md text-sm leading-6 text-muted-foreground'>
                Questions about your account, a plan, or something you think we got wrong in a question?
                We read every message.
              </p>
              <div className='mt-2 flex flex-wrap items-center justify-center gap-3'>
                <Button asChild>
                  <WaspRouterLink to={routes.ContactRoute.to}>Contact us</WaspRouterLink>
                </Button>
                <Button asChild variant='outline'>
                  <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Closing CTA — same component the landing page ends on */}
        <CTABanner questionCount={bankStats?.publishedQuestionCount} examCount={bankStats?.examCount} />
      </main>
    </div>
  );
}
