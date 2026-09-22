import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

/**
 * Closing call-to-action.
 *
 * Kept the honest, animated product numbers (count up once the section is
 * in view) — the platform is pre-launch, so we never fabricate "X people
 * online" style social proof. Dropped the aurora/particle-field motion and
 * animated gradient text from the previous version: restrained now, no
 * per-frame mouse-tracked glow.
 */

interface CtaStat {
  target: number;
  suffix?: string;
  label: string;
  format?: boolean; // add thousands separators
}

// Question + exam targets arrive live from the database (LandingPage →
// useBankStats). No hardcoded "9,000" numbers here anymore.
function buildCtaStats(questionCount: number | undefined, examCount: number | undefined): (CtaStat | null)[] {
  return [
    questionCount != null
      ? { target: questionCount, suffix: '+', label: 'Published questions', format: true }
      : null,
    { target: examCount ?? 10, label: 'Gulf + Ireland exams' },
    { target: 100, suffix: '%', label: 'Written by dentists' },
  ];
}

/** Counts a number up to its target once `run` becomes true. */
function useCountUp(target: number, run: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;

    // Honour reduced-motion: jump straight to the final number.
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
  }, [target, run, duration]);

  return value;
}

function StatCounter({ stat, run }: { stat: CtaStat; run: boolean }) {
  const value = useCountUp(stat.target, run);
  const display = stat.format ? value.toLocaleString() : value.toString();
  return (
    <div className='text-center'>
      <div className='text-2xl font-bold text-background sm:text-3xl'>
        {display}
        {stat.suffix ?? ''}
      </div>
      <div className='mt-1 text-xs font-medium tracking-wide text-background/55'>{stat.label}</div>
    </div>
  );
}

export default function CTABanner({
  questionCount,
  examCount,
}: {
  questionCount?: number;
  examCount?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // While the live count hasn't loaded, render only the stats that don't
  // depend on it (never a placeholder number).
  const ctaStats = buildCtaStats(questionCount, examCount).filter((s): s is CtaStat => s !== null);

  // Start the count-up the first time the section scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className='relative overflow-hidden bg-foreground py-20 sm:py-28' aria-labelledby='cta-heading'>
      {/* One quiet accent glow, low-opacity, single hue -- no mouse-tracked
          aurora, no particle field. */}
      <div
        className='pointer-events-none absolute -bottom-64 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.14] blur-[100px]'
        aria-hidden='true'
      />

      <div className='relative mx-auto max-w-3xl px-6'>
        <div className='rounded-3xl border border-background/10 bg-background/5 px-6 py-12 text-center backdrop-blur-sm sm:px-12'>
          <div className='mb-6 flex justify-center'>
            <span className='inline-flex items-center gap-2 rounded-full border border-primary-muted/40 bg-primary/15 px-4 py-1.5 text-sm font-medium text-primary-muted'>
              Ready when you are
            </span>
          </div>

          <h2 id='cta-heading' className='text-3xl font-bold text-background sm:text-4xl lg:text-5xl'>
            Your license is closer <span className='text-primary-muted'>than you think</span>
          </h2>

          <p className='mx-auto mt-5 max-w-xl text-lg leading-7 text-background/65'>
            Join LicenseDent free — practice DHA, MOH & IDC Ireland pattern questions, track readiness
            subject-wise, and walk into exam day prepared.
          </p>

          {/* Honest, animated product numbers */}
          <div className='mx-auto mt-8 grid max-w-lg grid-cols-2 gap-6 border-y border-background/10 py-6 sm:grid-cols-4'>
            {ctaStats.map((stat) => (
              <StatCounter key={stat.label} stat={stat} run={inView} />
            ))}
          </div>

          <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Button
              size='lg'
              asChild
              className='w-full bg-primary px-8 font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 sm:w-auto'
            >
              <WaspRouterLink to={routes.SignupRoute.to}>Create free account</WaspRouterLink>
            </Button>
            <Button
              size='lg'
              variant='outline'
              asChild
              className='w-full border-background/25 bg-transparent px-8 font-semibold text-background hover:bg-background/10 hover:text-background sm:w-auto'
            >
              <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
            </Button>
          </div>

          <div className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-background/55'>
            <span className='flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-secondary' /> Free to start
            </span>
            <span className='flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-secondary' /> No setup fees
            </span>
            <span className='flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-secondary' /> One-time price · no recurring fees
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
