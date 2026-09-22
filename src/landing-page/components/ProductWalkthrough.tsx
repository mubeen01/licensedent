import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Layers,
  ListChecks,
  Rocket,
  Timer,
  XCircle,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

/**
 * Faithful mini recreations of the actual app screens (same components,
 * tokens and layout language as /dashboard, /practice, /mock-exams and
 * /progress) — not generic gradient placeholders. Keep these in sync if
 * those pages' layout changes meaningfully.
 */
const screens = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    tagline: 'Your exam-prep at a glance the moment you log in.',
  },
  {
    id: 'practice',
    name: 'Practice',
    icon: ListChecks,
    tagline: 'Subject-wise MCQs with clear, dentist-written explanations.',
  },
  {
    id: 'mocks',
    name: 'Mock Test',
    icon: Timer,
    tagline: 'Full-length, timed and Prometric-style — practice exam day before exam day.',
  },
  {
    id: 'progress',
    name: 'Progress',
    icon: BarChart3,
    tagline: 'Accuracy broken down by subject so you know exactly what to revise.',
  },
];

function BrowserChrome({ children, url }: { children: ReactNode; url: string }) {
  return (
    <div className='card-elevated'>
      <div className='flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5'>
        <div className='flex gap-1.5'>
          <span className='h-2.5 w-2.5 rounded-full bg-destructive/60' />
          <span className='h-2.5 w-2.5 rounded-full bg-warning/60' />
          <span className='h-2.5 w-2.5 rounded-full bg-success/60' />
        </div>
        <div className='flex-1 rounded-md bg-background/80 px-3 py-1 text-center text-[11px] text-muted-foreground'>
          {url}
        </div>
      </div>
      <div className='h-72 overflow-hidden sm:h-80'>{children}</div>
    </div>
  );
}

function DashboardMockup() {
  const stats = [
    { icon: ListChecks, value: '1,240', label: 'Attempted' },
    { icon: Activity, value: '86', label: 'This week' },
    { icon: Award, value: '78%', label: 'Accuracy' },
  ];
  return (
    <BrowserChrome url='app.licensedent.com/dashboard'>
      <div className='h-full bg-muted/20 p-5'>
        <div className='rounded-xl bg-primary p-4 text-primary-foreground'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium'>
            Preparing for 🇦🇪 DHA Licensing Exam
          </div>
          <p className='mt-2.5 text-base font-semibold'>Good morning, Dr. Amina</p>
          <button className='mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium'>
            <Rocket className='h-3.5 w-3.5' /> Start Practicing
          </button>
        </div>
        <div className='mt-3 grid grid-cols-3 gap-2.5'>
          {stats.map((s) => (
            <div key={s.label} className='rounded-lg border border-border bg-card p-2.5'>
              <s.icon className='h-3.5 w-3.5 text-primary' />
              <div className='mt-1.5 text-sm font-semibold text-foreground'>{s.value}</div>
              <div className='text-[10px] text-muted-foreground'>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  );
}

function PracticeMockup() {
  const options = [
    { key: 'A', text: 'Formocresol pulpotomy', correct: false },
    { key: 'B', text: 'Direct pulp capping with calcium hydroxide', correct: true },
    { key: 'C', text: 'Root canal treatment', correct: false },
  ];
  return (
    <BrowserChrome url='app.licensedent.com/practice'>
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between border-b border-border bg-muted/60 px-5 py-2.5'>
          <span className='rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary'>Endodontics</span>
          <span className='flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground'>
            <Clock className='h-3 w-3' /> 18:42
          </span>
        </div>
        <div className='flex-1 p-5'>
          <p className='text-sm font-medium leading-6 text-foreground'>
            A 9-year-old child presents with a pinpoint mechanical exposure of an asymptomatic, vital pulp. Treatment of choice?
          </p>
          <div className='mt-4 space-y-2'>
            {options.map((opt) => (
              <div
                key={opt.key}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs',
                  opt.correct ? 'border-secondary/40 bg-secondary/10' : 'border-border'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-semibold',
                    opt.correct ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {opt.key}
                </span>
                <span className='flex-1 text-foreground/90'>{opt.text}</span>
                {opt.correct && <CheckCircle2 className='h-3.5 w-3.5 flex-none text-secondary' />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function MockTestMockup() {
  return (
    <BrowserChrome url='app.licensedent.com/mock-exams'>
      <div className='flex h-full flex-col'>
        <div className='flex items-center justify-between border-b border-border bg-muted/60 px-5 py-2.5'>
          <span className='text-xs font-semibold text-foreground'>DHA Full Mock · Question 14 of 100</span>
          <span className='flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive'>
            <Timer className='h-3 w-3' /> 42:18
          </span>
        </div>
        <div className='grid grid-cols-[1fr_auto] flex-1'>
          <div className='p-5'>
            <p className='text-sm font-medium leading-6 text-foreground'>
              Which local anesthetic is contraindicated in atypical plasma cholinesterase deficiency?
            </p>
            <div className='mt-4 space-y-2'>
              {['Lidocaine', 'Articaine', 'Procaine', 'Bupivacaine'].map((opt, i) => (
                <div key={opt} className='flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground/90'>
                  <span className='flex h-5 w-5 flex-none items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground'>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </div>
              ))}
            </div>
          </div>
          <div className='hidden w-24 flex-none border-l border-border bg-muted/30 p-3 sm:block'>
            <div className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>Palette</div>
            <div className='mt-2 grid grid-cols-4 gap-1'>
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex h-4.5 w-4.5 items-center justify-center rounded text-[9px] font-medium',
                    i < 13 ? 'bg-secondary/20 text-secondary' : i === 13 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function ProgressMockup() {
  const rows = [
    { name: 'Endodontics', pct: 84 },
    { name: 'Periodontics', pct: 71 },
    { name: 'Oral Pathology', pct: 63 },
    { name: 'Prosthodontics', pct: 90 },
    { name: 'Pharmacology', pct: 58 },
  ];
  return (
    <BrowserChrome url='app.licensedent.com/progress'>
      <div className='h-full p-5'>
        <div className='flex items-center gap-2.5 rounded-xl bg-primary p-4 text-primary-foreground'>
          <Layers className='h-5 w-5' />
          <div>
            <div className='text-lg font-semibold leading-none'>78%</div>
            <div className='text-[11px] text-primary-foreground/75'>Overall accuracy · 5 subjects</div>
          </div>
        </div>
        <div className='mt-4 space-y-2.5'>
          {rows.map((r) => (
            <div key={r.name} className='flex items-center gap-3'>
              <span className='w-24 flex-none truncate text-[11px] text-muted-foreground'>{r.name}</span>
              <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                <div className='h-full rounded-full bg-primary' style={{ width: `${r.pct}%` }} />
              </div>
              <span className='w-8 flex-none text-right text-[11px] font-medium text-foreground'>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  );
}

const mockupById = {
  dashboard: DashboardMockup,
  practice: PracticeMockup,
  mocks: MockTestMockup,
  progress: ProgressMockup,
} as const;

export default function ProductWalkthrough() {
  const [activeId, setActiveId] = useState(screens[0].id);
  const active = screens.find((s) => s.id === activeId) ?? screens[0];

  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='See it in action'
        title='A quick tour of the app'
        description='The actual screens you land on once you sign up — dashboard, practice, mocks and progress.'
      />

      <Reveal className='grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center'>
        {/* Screen picker */}
        <div className='order-2 space-y-2 lg:order-1'>
          {screens.map((screen) => {
            const isActive = screen.id === active.id;
            return (
              <button
                key={screen.id}
                onClick={() => setActiveId(screen.id)}
                className={cn(
                  'flex w-full items-start gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200',
                  isActive
                    ? 'border-primary/40 bg-primary/5 shadow-[0_8px_20px_-14px_hsl(var(--primary)/0.5)]'
                    : 'border-transparent hover:border-border hover:bg-muted/50'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-colors duration-200',
                    isActive ? 'bg-linear-to-br from-primary to-secondary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <screen.icon className='h-5 w-5' />
                </span>
                <span>
                  <span className='block text-sm font-semibold text-foreground'>{screen.name}</span>
                  <span className='mt-0.5 block text-sm leading-6 text-muted-foreground'>{screen.tagline}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Mockup — keyed on the active screen so switching tabs crossfades
            in the new mockup instead of an instant, jarring cut. */}
        <div className='order-1 lg:order-2'>
          {(() => {
            const Mockup = mockupById[active.id as keyof typeof mockupById] ?? DashboardMockup;
            return (
              <div key={active.id} className='animate-in fade-in-0 slide-in-from-bottom-2 duration-300'>
                <Mockup />
              </div>
            );
          })()}
        </div>
      </Reveal>
    </div>
  );
}
