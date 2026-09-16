import { CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

/**
 * Closing call-to-action.
 *
 * The "live / advanced" feel here comes from motion and *honest* animated
 * product numbers — NOT from a fake live-activity feed. The platform is
 * pre-launch, so we never fabricate "X people online" style social proof.
 *
 * All animation is self-contained (scoped <style> below + your existing
 * animate-gradient-x / animate-float classes) and it respects reduced-motion.
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
    { target: 100, suffix: '%', label: 'Dentist-verified' },
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
      <div className='text-2xl font-bold text-white sm:text-3xl'>
        {display}
        {stat.suffix ?? ''}
      </div>
      <div className='mt-1 text-xs font-medium tracking-wide text-gray-400'>{stat.label}</div>
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
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
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

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className='relative overflow-hidden py-20 sm:py-28'
      aria-labelledby='cta-heading'
    >
      {/* Base gradient — matches the Hero so the two dark ends bookend the page */}
      <div className='absolute inset-0 bg-linear-to-br from-[#111318] via-[#191d24] to-[#151a17]' aria-hidden='true' />

      {/* Faint tech grid, faded out toward the edges */}
      <div className='dp-cta-grid absolute inset-0' aria-hidden='true' />

      {/* Aurora glows — drift on their own and lean toward the cursor */}
      <div
        className='dp-aurora absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-primary/25 blur-3xl'
        style={{ transform: `translate(${mouse.x * 40}px, ${mouse.y * 30}px)` }}
        aria-hidden='true'
      />
      <div
        className='dp-aurora absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-secondary/25 blur-3xl'
        style={{ animationDelay: '3s', transform: `translate(${-mouse.x * 40}px, ${-mouse.y * 30}px)` }}
        aria-hidden='true'
      />

      {/* Floating particles */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
        {[...Array(14)].map((_, i) => (
          <span
            key={i}
            className='absolute h-1 w-1 rounded-full bg-white/20 animate-pulse'
            style={{
              left: `${(i * 41) % 100}%`,
              top: `${(i * 59) % 100}%`,
              animationDelay: `${(i % 5) * 0.7}s`,
              animationDuration: `${2 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* Card with an animated gradient border */}
      <div className='relative mx-auto max-w-3xl px-6'>
        <div className='animate-gradient-x rounded-3xl bg-linear-to-r from-primary via-secondary to-primary bg-size-[200%_auto] p-px shadow-2xl'>
          <div className='rounded-3xl bg-[#0f1218]/85 px-6 py-12 text-center backdrop-blur-xl sm:px-12'>
            <div className='mb-6 flex justify-center'>
              <span className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-muted backdrop-blur-xs'>
                <span className='relative flex h-2 w-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
                </span>
                <Sparkles className='h-4 w-4 text-primary' /> Ready when you are
              </span>
            </div>

            <h2 id='cta-heading' className='text-3xl font-bold text-white sm:text-4xl lg:text-5xl'>
              Your license is closer
              <span className='block animate-gradient-x bg-linear-to-r from-primary-muted via-primary to-secondary bg-size-[200%_100%] bg-clip-text text-transparent'>
                than you think
              </span>
            </h2>

            <p className='mx-auto mt-5 max-w-xl text-lg leading-7 text-gray-300'>
              Join LicenseDent free — practice DHA, MOH & IDC Ireland pattern questions, track readiness
              subject-wise, and walk into exam day prepared.
            </p>

            {/* Honest, animated product numbers */}
            <div className='mx-auto mt-8 grid max-w-lg grid-cols-2 gap-6 border-y border-white/10 py-6 sm:grid-cols-4'>
              {ctaStats.map((stat) => (
                <StatCounter key={stat.label} stat={stat} run={inView} />
              ))}
            </div>

            <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Button
                size='lg'
                asChild
                className='w-full border-0 bg-linear-to-r from-primary to-secondary px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 sm:w-auto'
              >
                <WaspRouterLink to={routes.SignupRoute.to}>Create free account</WaspRouterLink>
              </Button>
              <Button
                size='lg'
                variant='outline'
                asChild
                className='w-full border-white/25 bg-white/5 px-8 font-semibold text-white backdrop-blur-md hover:bg-white/15 hover:text-white sm:w-auto'
              >
                <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
              </Button>
            </div>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400'>
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
      </div>

      <style>{`
        .dp-cta-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 46px 46px;
          -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
                  mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
        }
        @keyframes dp-aurora-drift {
          0%, 100% { translate: 0 0; }
          50%      { translate: 0 -22px; }
        }
        .dp-aurora {
          animation: dp-aurora-drift 9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .dp-aurora { animation: none; }
        }
      `}</style>
    </section>
  );
}