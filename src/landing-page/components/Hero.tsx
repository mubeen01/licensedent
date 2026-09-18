import { BadgeCheck, BookOpen, CheckCircle2, Clock, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

const examBadges = ['DHA', 'HAAD', 'MOH', 'SMLE', 'OMSB', 'QCHP', 'KMLE', 'NHRA', 'SHA', 'IDC Ireland'];

export default function Hero({ questionCount, examCount }: { questionCount?: number; examCount?: number }) {
  // Live from the database (useBankStats in LandingPage) — no more hardcoded
  // question counts. While the count hasn't loaded yet, show a claim that
  // makes no number, rather than a stale or aspirational one.
  const questionStatValue = questionCount != null ? `${questionCount.toLocaleString()}+` : 'Growing';
  const heroStats = [
    { value: questionStatValue, label: 'Published questions', icon: BookOpen },
    { value: '100%', label: 'Dentist-verified', icon: BadgeCheck },
    { value: examCount ?? '10', label: 'Gulf + Ireland exams', icon: Globe },
  ];
  const [isVisible, setIsVisible] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleMockupMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div className='relative w-full overflow-hidden bg-background pt-14'>
      {/* Dot-grid + gradient mesh background */}
      <div className='pointer-events-none absolute inset-0 -z-10' aria-hidden='true'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.09)_1px,transparent_0)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_65%_55%_at_50%_0%,black_35%,transparent_100%)]' />
        <div className='absolute -top-32 -left-32 h-128 w-lg rounded-full bg-primary/20 blur-[100px]' />
        <div className='absolute top-0 -right-32 h-128 w-lg rounded-full bg-secondary/15 blur-[100px]' />
      </div>

      <div className='mx-auto max-w-7xl px-6 py-20 sm:py-24 md:py-32 lg:px-8'>
        <div className='grid items-center gap-12 lg:grid-cols-2 lg:gap-20'>
          {/* Left column */}
          <div
            className={`space-y-8 text-center transition-all duration-1000 lg:text-left ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className='flex justify-center lg:justify-start'>
              <div className='inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-xs'>
                <span className='relative flex h-2 w-2'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
                  <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
                </span>
                <Sparkles className='h-4 w-4' />
                Gulf + Ireland · dentist-verified answers
              </div>
            </div>

            <h1 className='text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.5rem]'>
              Clear DHA, MOH &{' '}
              <span className='animate-gradient-x bg-linear-to-r from-primary via-primary-muted to-secondary bg-size-[200%_100%] bg-clip-text text-transparent'>
                IDC Ireland
              </span>{' '}
              with confidence
            </h1>

            <p className='mx-auto max-w-xl text-lg leading-8 text-muted-foreground lg:mx-0'>
              LicenseDent turns dense textbooks into exam-pattern questions — subject-wise practice, high-yield
              recalls, timed mocks and{' '}
              <span className='font-semibold text-primary'>dentist-verified</span> explanations for{' '}
              <span className='font-semibold text-foreground'>DHA, MOH, HAAD & IDC Ireland</span>. Study in the
              app, track readiness, walk in prepared.
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
              <Button
                size='lg'
                asChild
                className='group w-full border-0 bg-linear-to-r from-primary to-secondary px-8 font-semibold text-white shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_45px_-8px_hsl(var(--primary)/0.55)] sm:w-auto'
              >
                <WaspRouterLink to={routes.SignupRoute.to}>
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
                className='w-full border-border/80 bg-background/60 px-8 font-semibold backdrop-blur-xs hover:bg-muted sm:w-auto'
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
                <div
                  key={stat.label}
                  className='flex flex-1 flex-col items-center gap-1 px-3 text-center lg:items-start lg:text-left'
                >
                  <stat.icon className='h-4 w-4 text-primary' strokeWidth={2} />
                  <span className='text-xl font-bold text-foreground'>{stat.value}</span>
                  <span className='text-xs text-muted-foreground'>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: product mockup in browser chrome */}
          <div
            className={`relative mt-8 transition-all delay-300 duration-1000 lg:mt-0 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div
              className='absolute inset-0 -z-10 scale-95 rounded-4xl bg-linear-to-br from-primary/25 via-secondary/15 to-gold/20 blur-3xl'
              aria-hidden='true'
            />
            {/* Inner wrapper owns the mouse-tilt transform, separate from the entrance transform above */}
            <div
              ref={mockupRef}
              onMouseMove={handleMockupMouseMove}
              onMouseLeave={resetTilt}
              style={{ transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
              className='transition-transform duration-300 ease-out will-change-transform'
            >
              <BrowserFrame />
            </div>
            <div className='absolute -top-4 right-6 rounded-full bg-gold px-3 py-1 text-xs font-medium text-gold-foreground shadow-lg animate-float'>
              ✨ Live preview
            </div>
            <div className='absolute -bottom-3 -left-3 rounded-full bg-linear-to-r from-primary to-primary-muted px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg animate-pulse'>
              🦷 Dentist-verified
            </div>
          </div>
        </div>

        {/* Exam coverage strip */}
        <div className='mt-16 flex flex-col items-center gap-3 border-t border-border/70 pt-8 sm:mt-20'>
          <span className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
            Gulf licensing + IDC Ireland — one bank, exam-pattern questions
          </span>
          <div className='flex flex-wrap items-center justify-center gap-2'>
            {examBadges.map((exam) => (
              <span
                key={exam}
                className='rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary'
              >
                {exam}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowserFrame() {
  return (
    <div className='mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl'>
      <div className='flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5'>
        <div className='flex gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-destructive/60' />
          <span className='h-2.5 w-2.5 rounded-full bg-warning/60' />
          <span className='h-2.5 w-2.5 rounded-full bg-success/60' />
        </div>
        <div className='flex-1 rounded-md bg-background/80 px-3 py-1 text-center text-[11px] text-muted-foreground'>
          app.licensedent.com/practice
        </div>
      </div>
      <SampleQuestionCard />
    </div>
  );
}

function SampleQuestionCard() {
  // ⚠️ SAMPLE question shown on the homepage. Your brand promise is
  // "dentist-verified answers", so have your reviewer confirm this exact card
  // before publishing — or replace it with a question you've already verified.
  // The highlighted answer (correctKey) must match what the explanation argues.
  const options = [
    { key: 'A', text: 'Formocresol pulpotomy' },
    { key: 'B', text: 'Direct pulp capping with calcium hydroxide' },
    { key: 'C', text: 'Root canal treatment' },
    { key: 'D', text: 'Extraction and space maintainer' },
  ];
  const correctKey = 'B'; // matches the explanation below (direct pulp capping)

  return (
    <div>
      <div className='flex items-center justify-between border-b border-border bg-muted/60 px-6 py-3'>
        <div className='flex items-center gap-2'>
          <span className='rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'>
            Endodontics
          </span>
          <span className='text-xs text-muted-foreground'>Question 7 of 40 · DHA Mock Test</span>
        </div>
        <div className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
          <Clock className='h-3.5 w-3.5' />
          18:42
        </div>
      </div>
      <div className='p-6'>
        <p className='text-sm font-medium leading-6 text-foreground'>
          A 9-year-old child presents with a carious permanent molar with a pinpoint mechanical exposure of an
          asymptomatic, vital pulp. What is the treatment of choice?
        </p>
        <div className='mt-5 space-y-2.5'>
          {options.map((opt) => {
            const isCorrect = opt.key === correctKey;
            return (
              <div
                key={opt.key}
                className={
                  'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors ' +
                  (isCorrect
                    ? 'border-secondary/40 bg-secondary/10 text-foreground'
                    : 'border-border text-foreground/80')
                }
              >
                <span
                  className={
                    'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ' +
                    (isCorrect ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground')
                  }
                >
                  {opt.key}
                </span>
                <span className='flex-1'>{opt.text}</span>
                {isCorrect && <CheckCircle2 className='h-4 w-4 flex-none text-secondary' />}
              </div>
            );
          })}
        </div>
        <div className='mt-4 rounded-lg bg-muted/70 px-4 py-3 text-xs leading-5 text-muted-foreground'>
          <span className='font-semibold text-foreground'>Explanation: </span>
          Direct pulp capping preserves pulp vitality when the exposure is small, mechanical, and the pulp shows
          no sign of irreversible pulpitis — the conservative first choice in a vital, asymptomatic tooth.
        </div>
      </div>
    </div>
  );
}
