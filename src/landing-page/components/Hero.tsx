import { BadgeCheck, BookOpen, CheckCircle2, Globe, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import FlagIcon, { type FlagCode } from '../../client/components/ExamFlag';

const badgeFlags: FlagCode[] = ['AE', 'OM', 'QA', 'BH', 'KW', 'SA', 'IE'];

// Deliberately strong, unmissable dots -- three previous attempts (an
// arbitrary Tailwind class, then a low-alpha inline style against
// --border, then against --foreground at 16%) each turned out correct in
// the DevTools computed-style sense but too subtle to survive a real
// screenshot/compression pass. This one uses plain black at a real
// opacity, sized up, with every positioning property inline (not a single
// Tailwind class) so there is nothing left to doubt.
const dotLayerWrapperStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  pointerEvents: 'none',
  overflow: 'hidden',
};
const dotGridStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(#000000 1.8px, transparent 1.8px)',
  backgroundSize: '22px 22px',
  opacity: 0.09,
};

// Illustrative "readiness" numbers for the hero panel -- a real feature
// (progress analytics by subject) shown as a static, representative sample,
// not a live user's actual data. Not a claim about any specific outcome.
const readinessSubjects = [
  { name: 'Endodontics', pct: 91 },
  { name: 'Periodontics', pct: 76 },
  { name: 'Oral Surgery', pct: 68 },
];
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Counts a number up from 0 to its target once, on mount. */
function useCountUp(target: number, duration = 1300) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function HeroStat({
  icon: Icon,
  target,
  suffix = '',
  format = false,
  label,
}: {
  icon: LucideIcon;
  target: number | null;
  suffix?: string;
  format?: boolean;
  label: string;
}) {
  const count = useCountUp(target ?? 0);
  const display = target == null ? 'Growing' : format ? `${count.toLocaleString()}${suffix}` : `${count}${suffix}`;
  return (
    <div className='flex flex-1 flex-col items-center gap-1 px-3 text-center lg:items-start lg:text-left'>
      <Icon className='h-4 w-4 text-primary' strokeWidth={2} />
      <span className='text-xl font-bold text-foreground'>{display}</span>
      <span className='text-xs text-muted-foreground'>{label}</span>
    </div>
  );
}

export default function Hero({ questionCount, examCount }: { questionCount?: number; examCount?: number }) {
  // Live from the database (useBankStats in LandingPage) — every number here
  // counts up from 0 to the real value on load instead of appearing static.
  const heroStats = [
    { target: questionCount ?? null, suffix: '+', format: true, label: 'Published questions', icon: BookOpen },
    { target: 100, suffix: '%', label: 'Written by dentists', icon: BadgeCheck },
    { target: examCount ?? 10, suffix: '', label: 'Gulf + Ireland exams', icon: Globe },
  ];

  return (
    <div className='relative isolate w-full overflow-hidden bg-background'>
      {/* Quiet dot-grid texture, visible across the whole hero (no fading
          mask -- that clipped it down to near-invisible in practice) + a
          single, restrained accent glow. Replaces the previous dual
          teal/sky blur blobs, which read as a generic "AI SaaS gradient
          wash" rather than a considered visual. */}
      <div style={dotLayerWrapperStyle} aria-hidden='true'>
        <div style={dotGridStyle} />
        <div className='absolute -top-56 left-[8%] h-[620px] w-[620px] rounded-full bg-primary/[0.08] blur-[90px]' />
      </div>

      <div className='mx-auto max-w-7xl px-6 pt-6 pb-4 sm:pt-8 sm:pb-5 md:pt-9 md:pb-6 lg:px-8'>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-20'>
          {/* Left column -- PRD-006 H7: renders at full opacity immediately
              (this is the LCP element); below-the-fold sections keep their
              own Reveal-based scroll-in animation. */}
          <div className='space-y-6 text-center lg:text-left'>
            <div className='flex justify-center lg:justify-start'>
              <div className='inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary'>
                <span className='flex items-center gap-1' aria-hidden='true'>
                  {badgeFlags.map((code) => (
                    <FlagIcon key={code} code={code} />
                  ))}
                </span>
                <span className='h-3 w-px bg-primary/25' aria-hidden='true' />
                Gulf + Ireland licensing exams
              </div>
            </div>

            {/* PRD-006 H1: this headline describes the product (a question
                bank) rather than promising a pass/outcome for a regulated
                licence exam -- kept that framing through this redesign;
                only the visual treatment (solid accent, no animated
                gradient) changed. */}
            <h1 className='text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]'>
              Prepare for DHA, MOH &{' '}
              <span className='text-primary'>IDC Ireland</span>{' '}
              with a question bank built by dentists
            </h1>

            <p className='mx-auto max-w-xl text-base leading-7 text-muted-foreground lg:mx-0'>
              LicenseDent turns dense textbooks into exam-pattern questions — subject-wise practice, high-yield
              recalls, timed mocks and clear explanations for{' '}
              <span className='font-semibold text-foreground'>DHA, MOH, HAAD & IDC Ireland</span>, written from
              real clinical practice. Study in the app, track your readiness, walk in prepared.
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
              <Button
                size='lg'
                asChild
                className='group w-full bg-primary px-8 font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.55)] sm:w-auto'
              >
                <WaspRouterLink to={routes.DemoExamRoute.to}>
                  Start Free — Try 20 Questions
                  <span className='inline-block transition-transform group-hover:translate-x-1' aria-hidden='true'>
                    →
                  </span>
                </WaspRouterLink>
              </Button>
              <Button
                size='lg'
                variant='outline'
                asChild
                className='w-full border-border bg-background px-8 font-semibold hover:bg-muted sm:w-auto'
              >
                <WaspRouterLink to={routes.PricingPageRoute.to}>See Plans & Pricing</WaspRouterLink>
              </Button>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start'>
              <span className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-secondary' /> Free demo · no card needed
              </span>
              <span className='flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4 text-secondary' /> Every answer checked by a dentist
              </span>
              <span className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-secondary' /> Gulf + Ireland pattern bank
              </span>
            </div>

            <div className='card-elevated mx-auto flex max-w-md items-stretch divide-x divide-border py-4 lg:mx-0'>
              {heroStats.map((stat) => (
                <HeroStat key={stat.label} {...stat} />
              ))}
            </div>
          </div>

          {/* Right column: an abstract "readiness" panel -- a real feature
              (progress analytics by subject) drawn as an actual chart,
              not a fake app screenshot or browser-chrome mockup. */}
          <div className='relative mt-8 flex justify-center lg:mt-0 lg:justify-end'>
            <ReadinessPanel />
          </div>
        </div>
        {/* No exam-badge strip here anymore -- it duplicated the flag/exam
            marquee in Clients.tsx, which renders immediately after this
            section, one screen down at most. */}
      </div>
    </div>
  );
}

function ReadinessPanel() {
  const overallPct = 82;
  const ringOffset = RING_CIRCUMFERENCE * (1 - overallPct / 100);

  return (
    <div className='card-elevated w-full max-w-sm p-6'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-semibold text-muted-foreground'>Your readiness</span>
        <span className='rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success'>↑ 6% this week</span>
      </div>

      <div className='mt-5 flex items-center gap-6'>
        <svg width='104' height='104' viewBox='0 0 104 104' aria-hidden='true' className='flex-none'>
          <circle cx='52' cy='52' r={RING_RADIUS} fill='none' stroke='hsl(var(--muted))' strokeWidth='11' />
          <circle
            cx='52'
            cy='52'
            r={RING_RADIUS}
            fill='none'
            stroke='hsl(var(--primary))'
            strokeWidth='11'
            strokeLinecap='round'
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            transform='rotate(-90 52 52)'
          />
          <text x='52' y='48' textAnchor='middle' fontSize='24' fontWeight='700' fill='hsl(var(--foreground))'>
            {overallPct}%
          </text>
          <text x='52' y='66' textAnchor='middle' fontSize='10.5' fill='hsl(var(--muted-foreground))'>
            overall
          </text>
        </svg>
        <div className='flex flex-1 flex-col gap-2.5'>
          {readinessSubjects.map((s) => (
            <div key={s.name} className='flex flex-col gap-1'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground'>{s.name}</span>
                <span className='font-bold text-foreground'>{s.pct}%</span>
              </div>
              <div className='h-1.5 rounded-full bg-muted'>
                <div className='h-full rounded-full bg-primary' style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-5 flex items-center justify-between border-t border-border pt-4 text-sm'>
        <span className='text-muted-foreground'>Next mock exam</span>
        <span className='font-semibold text-foreground'>DHA · 4 days</span>
      </div>
    </div>
  );
}
