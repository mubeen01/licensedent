import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import {
  getDueReviewCount,
  getExamReadiness,
  getLessons,
  getMockExams,
  getMyDashboardOverview,
  getMyDashboardScope,
  getMyEffectiveAccess,
  getMyOnboardingProfile,
  getMyProgress,
  getMyStudyPlan,
  getMyStudyStats,
  getReadinessScore,
  useQuery,
} from 'wasp/client/operations';
import { routes } from 'wasp/client/router';
import { ArrowRight, Award, BookOpen, CalendarDays, Check, Info, ListChecks, Lock, RotateCcw, Timer } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { getDaysUntil, getTimeOfDayGreeting } from './greeting';
import { ActivityMap, Meter, ScoreBars, Sparkline } from './home/charts';
import ExamDateForm from './home/ExamDateForm';
import { cn } from '../lib/utils';
import { ExamFlag } from '../client/components/ExamFlag';
import type { DailyActivity } from './operations';

// Student home. Answers two questions in five seconds -- "what should I do
// today?" and "am I on track for my exam?" -- then gets out of the way.
// Every number is real (DB-backed queries); nothing is fabricated.

const WEAK_ACCURACY = 70; // matches getMyStudyPlan's WEAK_ACCURACY_THRESHOLD
const MOCK_READY_PCT = 95; // matches getExamReadiness's READY_SCORE_THRESHOLD

function DashboardHomePage({ user }: { user: AuthUser }) {
  const { data: overview, isLoading: loadingOverview } = useQuery(getMyDashboardOverview);
  const { data: profile } = useQuery(getMyOnboardingProfile);
  const { data: scope } = useQuery(getMyDashboardScope);
  const { data: access } = useQuery(getMyEffectiveAccess);
  const { data: stats } = useQuery(getMyStudyStats);
  const { data: plan } = useQuery(getMyStudyPlan);
  const { data: readiness } = useQuery(getReadinessScore);
  const { data: progress } = useQuery(getMyProgress);
  const { data: dueCount } = useQuery(getDueReviewCount);
  const hasAccess = !!access?.active;
  const isIreland = scope?.kind === 'ireland';
  const { data: mocks } = useQuery(getMockExams, {}, { enabled: hasAccess, retry: false });
  const { data: examReadiness } = useQuery(getExamReadiness, {}, { enabled: hasAccess, retry: false });
  const { data: lessons } = useQuery(getLessons, {}, { enabled: isIreland, retry: false });

  const firstName = (profile?.fullName || user.username || user.email?.split('@')[0] || 'there').split(/[\s@]/)[0];
  const daysUntilExam = getDaysUntil(profile?.targetExamDate);
  const dailyTarget = plan?.dailyTargetQuestions ?? 10;
  const today = overview?.todayAttempted ?? 0;

  const mockScores = useMemo(
    () =>
      (mocks ?? [])
        .flatMap((m) =>
          m.submittedAttempts.map((a) => ({
            key: a.id,
            label: `M${m.order}`,
            pct: a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0,
            at: a.submittedAt ? new Date(a.submittedAt).getTime() : 0,
          }))
        )
        .sort((a, b) => a.at - b.at)
        .slice(-8),
    [mocks]
  );
  const nextMock = useMemo(() => {
    const list = [...(mocks ?? [])].sort((a, b) => a.order - b.order);
    return list.find((m) => m.inProgressAttemptId) ?? list.find((m) => m.submittedAttempts.length === 0) ?? null;
  }, [mocks]);
  const nextLesson = useMemo(() => {
    // Lesson.order restarts at 1 in every subject, so: a lesson already in progress
    // first, then course order (lesson number, then subject: Endodontics L1 first).
    const started = (l: LessonSummary) => l.parts.some((p) => p.passed) && !l.parts.every((p) => p.passed);
    const ordered = [...(lessons ?? [])].sort(
      (a, b) => Number(started(b)) - Number(started(a)) || a.order - b.order || a.title.localeCompare(b.title)
    );
    for (const lesson of ordered) {
      const part = [...lesson.parts].sort((a, b) => a.order - b.order).find((p) => !p.passed && !p.isLocked);
      if (part) return { lesson, part };
    }
    return null;
  }, [lessons]);

  return (
    <DashboardLayout user={user} pageTitle='Dashboard'>
      <div className='mx-auto max-w-[1200px] space-y-4 px-4 py-5 sm:px-6 lg:space-y-5 lg:py-8'>
        {access && !hasAccess && <FreePlanBanner remaining={access.freePracticeRemainingToday} examName={profile?.exam?.code ?? null} />}

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5'>
          <TodayPanel
            className='lg:col-span-8'
            greeting={`${getTimeOfDayGreeting()}, ${firstName}`}
            examLabel={isIreland ? 'IDC Ireland' : profile?.exam?.code ?? profile?.exam?.name ?? null}
            examFlag={isIreland ? '🇮🇪' : profile?.exam?.flagEmoji ?? null}
            daysUntilExam={daysUntilExam}
            targetExamDate={profile?.targetExamDate ? String(profile.targetExamDate) : null}
            today={today}
            dailyTarget={dailyTarget}
            loading={loadingOverview}
            tasks={buildTasks({
              hasAccess,
              isIreland,
              dueCount: dueCount ?? 0,
              focus: plan?.focusSubjects[0] ?? null,
              goalMet: today >= dailyTarget,
              nextMock,
              nextLesson,
              freeRemaining: access?.freePracticeRemainingToday ?? null,
            })}
          />
          <ReadinessPanel
            className='lg:col-span-4'
            score={readiness?.score ?? null}
            breakdown={readiness?.breakdown ?? null}
            mocksPassed={examReadiness?.passedCount ?? 0}
            mocksNeeded={8}
          />
        </div>

        <KpiStrip
          loading={loadingOverview}
          total={overview?.totalAttempted ?? 0}
          thisWeek={overview?.thisWeekAttempted ?? 0}
          accuracy={overview?.accuracy ?? 0}
          daily={overview?.dailyActivity ?? []}
          streak={stats?.currentStreakDays ?? 0}
          bestStreak={stats?.longestStreakDays ?? 0}
          mockScores={mockScores}
        />

        {isIreland && lessons && lessons.length > 0 && <LessonsPanel lessons={lessons} next={nextLesson} />}

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5'>
          <SubjectsPanel className='lg:col-span-7' progress={progress ?? null} />
          <MocksPanel className='lg:col-span-5' hasAccess={hasAccess} scores={mockScores} nextMock={nextMock} />
        </div>

        <ActivityPanel
          days={overview?.dailyActivity ?? []}
          level={stats?.level ?? null}
          xpIntoLevel={stats?.xpIntoLevel ?? 0}
          xpForNextLevel={stats?.xpForNextLevel ?? 1000}
          badges={stats?.badges ?? []}
        />
      </div>
    </DashboardLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                            */
/* -------------------------------------------------------------------------- */

function PanelHeader({ id, title, action, hint }: { id?: string; title: string; action?: ReactNode; hint?: string }) {
  return (
    <div className='mb-4 flex items-center justify-between gap-3'>
      <h2 id={id} className='flex items-center gap-1.5 text-[13px] font-medium text-ink-2'>
        {title}
        {hint && (
          <span title={hint} className='text-ink-3' aria-label={hint}>
            <Info className='h-3.5 w-3.5' />
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}

function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className='group inline-flex items-center gap-1 text-[13px] font-medium text-brand-11 hover:underline underline-offset-4'
    >
      {children}
      <ArrowRight className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none' />
    </Link>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />;
}

/* -------------------------------------------------------------------------- */
/*  Today                                                                      */
/* -------------------------------------------------------------------------- */

type Task = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  to: string | null;
  cta: string;
  done: boolean;
};

type MockSummary = NonNullable<Awaited<ReturnType<typeof getMockExams>>>[number];
type LessonSummary = NonNullable<Awaited<ReturnType<typeof getLessons>>>[number];

function buildTasks({
  hasAccess,
  isIreland,
  dueCount,
  focus,
  goalMet,
  nextMock,
  nextLesson,
  freeRemaining,
}: {
  hasAccess: boolean;
  isIreland: boolean;
  dueCount: number;
  focus: { subjectId: string; name: string; accuracy: number; attempted: number } | null;
  goalMet: boolean;
  nextMock: MockSummary | null;
  nextLesson: { lesson: LessonSummary; part: LessonSummary['parts'][number] } | null;
  freeRemaining: number | null;
}): Task[] {
  if (!hasAccess) {
    return [
      {
        id: 'free-practice',
        icon: ListChecks,
        title: "Practise today's free questions",
        detail: freeRemaining === 0 ? 'All free questions used today. More tomorrow.' : `${freeRemaining ?? 15} free questions left today`,
        to: routes.PracticeRoute.to,
        cta: 'Practise',
        done: freeRemaining === 0,
      },
      {
        id: 'demo',
        icon: Timer,
        title: 'Try a timed demo exam',
        detail: '20 questions · 15 minutes · see how the real format feels',
        to: routes.DemoExamRoute.to,
        cta: 'Start demo',
        done: false,
      },
      {
        id: 'unlock',
        icon: Lock,
        title: 'Unlock the full course',
        detail: 'Every subject, full mock exams and Smart Review. One-time payment.',
        to: routes.PricingPageRoute.to,
        cta: 'See plans',
        done: false,
      },
    ];
  }

  const tasks: Task[] = [
    {
      id: 'review',
      icon: RotateCcw,
      title: 'Review what you missed',
      detail: dueCount > 0 ? `${dueCount} question${dueCount === 1 ? '' : 's'} due in Smart Review` : 'All caught up. Nothing due today.',
      to: dueCount > 0 ? routes.SmartReviewRoute.to : null,
      cta: 'Start review',
      done: dueCount === 0,
    },
  ];

  if (isIreland && nextLesson) {
    tasks.push({
      id: 'lesson',
      icon: BookOpen,
      title: `Continue ${nextLesson.lesson.title.split(': ').pop()}`,
      detail: `Part ${nextLesson.part.order} · watch, then pass the quiz to unlock the next part`,
      to: routes.LessonsRoute.to,
      cta: 'Continue',
      done: false,
    });
  } else {
    tasks.push({
      id: 'practice',
      icon: ListChecks,
      title: focus ? `Practise ${focus.name}` : 'Practise any subject',
      detail: focus
        ? `${focus.attempted === 0 ? 'Not started yet' : `${focus.accuracy}% accuracy`} · your biggest gap right now`
        : 'Keep every subject warm with a mixed set',
      to: focus ? `${routes.PracticeRoute.to}?subjects=${focus.subjectId}` : routes.PracticeRoute.to,
      cta: 'Practise',
      done: goalMet,
    });
  }

  if (nextMock) {
    const capReached = nextMock.attemptsUsed >= nextMock.attemptsCap && !nextMock.inProgressAttemptId;
    tasks.push({
      id: 'mock',
      icon: Timer,
      title: nextMock.inProgressAttemptId ? `Finish ${nextMock.title}` : `Take ${nextMock.title}`,
      detail: capReached
        ? `You've used all ${nextMock.attemptsCap} mock attempts on your plan`
        : `${nextMock.questionCount} questions · ${nextMock.durationMinutes} min · exam conditions`,
      to: capReached ? null : nextMock.inProgressAttemptId ? `/mock-exams/${nextMock.inProgressAttemptId}` : `/mock-exams/start/${nextMock.id}`,
      cta: nextMock.inProgressAttemptId ? 'Resume' : 'Start mock',
      done: false,
    });
  }
  return tasks;
}

function TodayPanel({
  className,
  greeting,
  examLabel,
  examFlag,
  daysUntilExam,
  targetExamDate,
  today,
  dailyTarget,
  loading,
  tasks,
}: {
  className?: string;
  greeting: string;
  examLabel: string | null;
  examFlag: string | null;
  daysUntilExam: number | null;
  targetExamDate: string | null;
  today: number;
  dailyTarget: number;
  loading: boolean;
  tasks: Task[];
}) {
  const [editingDate, setEditingDate] = useState(false);
  const primaryId = tasks.find((t) => !t.done && t.to)?.id;
  const goalPct = Math.min(100, Math.round((today / Math.max(1, dailyTarget)) * 100));
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className={cn('panel p-5 sm:p-6', className)} aria-labelledby='today-heading'>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3 [&>*+*]:before:mr-3 [&>*+*]:before:text-ink-3 [&>*+*]:before:content-["·"]'>
        <span>{dateLabel}</span>
        {examLabel && (
          <span className='inline-flex items-center gap-1.5 text-ink-2'>
            {examFlag && <ExamFlag emoji={examFlag} />}
            {examLabel}
          </span>
        )}
        {daysUntilExam !== null && !editingDate ? (
          <button onClick={() => setEditingDate(true)} className='inline-flex items-center gap-1 text-ink-2 hover:text-foreground' title='Change exam date'>
            <CalendarDays className='h-3.5 w-3.5' />
            {daysUntilExam === 0 ? 'Exam today' : `${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'} to exam`}
          </button>
        ) : (
          !editingDate && (
            <button onClick={() => setEditingDate(true)} className='inline-flex items-center gap-1 font-medium text-brand-11 hover:underline underline-offset-4'>
              <CalendarDays className='h-3.5 w-3.5' />
              Set your exam date
            </button>
          )
        )}
      </div>

      <h2 id='today-heading' className='mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-9'>
        {greeting}
      </h2>

      {editingDate && (
        <div className='mt-4 max-w-md'>
          <ExamDateForm defaultValue={targetExamDate} onDone={() => setEditingDate(false)} />
        </div>
      )}

      <div className='mt-5'>
        <div className='mb-2 flex items-baseline justify-between gap-3'>
          <span className='text-sm font-medium text-foreground'>Today&apos;s goal</span>
          {loading ? (
            <Skeleton className='h-4 w-24' />
          ) : (
            <span className='text-sm tabular-nums text-ink-2'>
              {today >= dailyTarget ? (
                <span className='inline-flex items-center gap-1 font-medium text-success'>
                  <Check className='h-3.5 w-3.5' /> {today} of {dailyTarget} questions
                </span>
              ) : (
                <>
                  <span className='font-medium text-foreground'>{today}</span> of {dailyTarget} questions
                </>
              )}
            </span>
          )}
        </div>
        <Meter value={goalPct} label="Today's question goal" tone={today >= dailyTarget ? 'success' : 'brand'} />
      </div>

      <ol className='mt-6 divide-y divide-line rounded-lg border border-line'>
        {tasks.map((t, i) => {
          const isPrimary = t.id === primaryId;
          return (
            <li key={t.id} className='flex items-center gap-3 px-3.5 py-3 sm:px-4'>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  t.done ? 'bg-success/12 text-success' : isPrimary ? 'bg-brand-9 text-primary-foreground' : 'bg-brand-3 text-brand-11'
                )}
                aria-hidden='true'
              >
                {t.done ? <Check className='h-3.5 w-3.5' /> : i + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <p className={cn('text-sm font-medium sm:truncate', t.done ? 'text-ink-3 line-through decoration-ink-3/50' : 'text-foreground')}>
                  {t.title}
                </p>
                <p className='text-[13px] text-ink-3 sm:truncate'>{t.detail}</p>
              </div>
              {t.to && !t.done && (
                <Link
                  to={t.to}
                  className={cn(
                    'group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isPrimary
                      ? 'bg-brand-9 text-primary-foreground hover:bg-brand-9/90'
                      : 'border border-line-strong bg-surface text-foreground hover:bg-surface-2'
                  )}
                >
                  {t.cta}
                  <ArrowRight className='hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none sm:block' />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Readiness                                                                  */
/* -------------------------------------------------------------------------- */

function ReadinessPanel({
  className,
  score,
  breakdown,
  mocksPassed,
  mocksNeeded,
}: {
  className?: string;
  score: number | null;
  breakdown: { mockAccuracyPct: number; subjectCoveragePct: number; streakPct: number } | null;
  mocksPassed: number;
  mocksNeeded: number;
}) {
  const factors = breakdown
    ? [
        { key: 'mock', label: 'Mock exam accuracy', weight: 50, value: breakdown.mockAccuracyPct },
        { key: 'coverage', label: 'Subject coverage', weight: 30, value: breakdown.subjectCoveragePct },
        { key: 'consistency', label: 'Consistency', weight: 20, value: breakdown.streakPct },
      ]
    : [];
  // The factor with the most points still on the table is the one worth working on.
  const weakest = [...factors].sort((a, b) => (100 - b.value) * b.weight - (100 - a.value) * a.weight)[0];
  const TIPS: Record<string, string> = {
    mock: 'Take a full mock this week. Mock accuracy is half of your score.',
    coverage: 'Answer 20+ questions in each subject you have not covered yet.',
    consistency: 'Practise a little every day. A 14-day streak maxes this out.',
  };
  const status = score === null ? '' : score >= 75 ? 'Nearly ready' : score >= 45 ? 'On track' : 'Building foundations';

  return (
    <section className={cn('panel flex flex-col p-5 sm:p-6', className)} aria-labelledby='readiness-heading'>
      <PanelHeader
        id='readiness-heading'
        title='Exam readiness'
        hint='A transparent blend of three real signals: 50% mock exam accuracy, 30% subject coverage (20+ questions per subject), 20% consistency (daily streak).'
      />
      {score === null ? (
        <Skeleton className='h-16 w-32' />
      ) : (
        <div className='flex items-end gap-3'>
          <p className='text-5xl font-semibold leading-none tracking-tight tabular-nums text-foreground'>{score}</p>
          <div className='pb-1'>
            <p className='text-sm text-ink-3'>/ 100</p>
            <p className='text-sm font-medium text-brand-11'>{status}</p>
          </div>
        </div>
      )}

      <ul className='mt-6 space-y-4'>
        {factors.map((f) => (
          <li key={f.key}>
            <div className='mb-1.5 flex items-baseline justify-between text-[13px]'>
              <span className='text-ink-2'>
                {f.label} <span className='text-ink-3'>· {f.weight}%</span>
              </span>
              <span className='font-medium tabular-nums text-foreground'>{f.value}%</span>
            </div>
            <Meter value={f.value} label={f.label} tone='neutral' />
          </li>
        ))}
      </ul>

      <div className='mt-auto pt-6'>
        {weakest && score !== null && (
          <p className='rounded-lg bg-surface-2 px-3 py-2.5 text-[13px] leading-5 text-ink-2'>
            <span className='font-medium text-foreground'>Next step: </span>
            {TIPS[weakest.key]}
          </p>
        )}
        <p className='mt-3 text-[12px] leading-5 text-ink-3'>
          Exam-ready check: {mocksPassed} of {mocksNeeded} mocks at {MOCK_READY_PCT}%+
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  KPI strip                                                                  */
/* -------------------------------------------------------------------------- */

function KpiStrip({
  loading,
  total,
  thisWeek,
  accuracy,
  daily,
  streak,
  bestStreak,
  mockScores,
}: {
  loading: boolean;
  total: number;
  thisWeek: number;
  accuracy: number;
  daily: DailyActivity[];
  streak: number;
  bestStreak: number;
  mockScores: { pct: number }[];
}) {
  const last14 = daily.slice(-14);
  const last7 = daily.slice(-7);
  const week = last7.reduce((acc, d) => ({ a: acc.a + d.attempted, c: acc.c + d.correct }), { a: 0, c: 0 });
  const weekAcc = week.a > 0 ? Math.round((week.c / week.a) * 100) : null;
  const latestMock = mockScores.length ? mockScores[mockScores.length - 1].pct : null;
  const mockDelta = mockScores.length > 1 ? latestMock! - mockScores[0].pct : null;

  const items = [
    {
      label: 'Questions answered',
      value: total.toLocaleString(),
      sub: thisWeek > 0 ? `+${thisWeek} this week` : 'None this week yet',
      chart: <Sparkline values={last14.map((d) => d.attempted)} label='Questions per day, last 14 days' />,
    },
    {
      label: 'Accuracy',
      value: total > 0 ? `${accuracy}%` : '—',
      sub: weekAcc !== null ? `${weekAcc}% over the last 7 days` : 'Practise to see your accuracy',
      chart: (
        <Sparkline
          values={last14.map((d) => (d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : null))}
          label='Accuracy per day, last 14 days'
        />
      ),
    },
    {
      label: 'Study streak',
      value: `${streak} day${streak === 1 ? '' : 's'}`,
      sub: bestStreak > 0 ? `Best: ${bestStreak} day${bestStreak === 1 ? '' : 's'}` : 'Practise today to start one',
      chart: (
        <div className='flex h-8 items-end gap-[3px]' aria-label='Active days, last 14 days' role='img'>
          {last14.map((d) => (
            <span key={d.date} className={cn('h-2 flex-1 rounded-[2px]', d.attempted > 0 ? 'bg-brand-9' : 'bg-line')} />
          ))}
        </div>
      ),
    },
    {
      label: 'Latest mock score',
      value: latestMock !== null ? `${latestMock}%` : '—',
      sub:
        mockDelta !== null
          ? `${mockDelta >= 0 ? '+' : ''}${mockDelta} pts since your first mock`
          : latestMock !== null
            ? 'Take another to see your trend'
            : 'No mocks taken yet',
      chart: <Sparkline values={mockScores.map((m) => m.pct)} label='Mock scores over time' />,
    },
  ];

  return (
    <section aria-label='Key numbers' className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-e1 lg:grid-cols-4 dark:shadow-none'>
      {items.map((it) => (
        <div key={it.label} className='flex flex-col bg-surface p-4 sm:p-5'>
          <p className='text-[13px] text-ink-2'>{it.label}</p>
          {loading ? (
            <Skeleton className='mt-2 h-8 w-20' />
          ) : (
            <p className='mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-[28px]'>{it.value}</p>
          )}
          <p className='mt-0.5 truncate text-[12px] text-ink-3'>{it.sub}</p>
          <div className='mt-3'>{it.chart}</div>
        </div>
      ))}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subjects                                                                   */
/* -------------------------------------------------------------------------- */

function SubjectsPanel({
  className,
  progress,
}: {
  className?: string;
  progress: { subjectId: string; subjectName: string; attempted: number; accuracy: number }[] | null;
}) {
  const rows = [...(progress ?? [])].sort((a, b) => a.accuracy - b.accuracy).slice(0, 8);
  return (
    <section className={cn('panel p-5 sm:p-6', className)} aria-labelledby='subjects-heading'>
      <PanelHeader id='subjects-heading'
        title='Subject strength' action={<TextLink to={routes.ProgressRoute.to}>All subjects</TextLink>} />
      {progress === null ? (
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-7 w-full' />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ListChecks} title='No subjects yet' body='Answer a few questions and your strongest and weakest subjects show up here.' to={routes.PracticeRoute.to} cta='Start practising' />
      ) : (
        <>
          <ul className='-mx-2'>
            {rows.map((s) => {
              const weak = s.accuracy < WEAK_ACCURACY;
              return (
                <li key={s.subjectId}>
                  <Link
                    to={`${routes.PracticeRoute.to}?subjects=${s.subjectId}`}
                    className='group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-lg px-2 py-2.5 hover:bg-surface-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_3.25rem]'
                  >
                    <span className='truncate text-sm text-foreground'>
                      {s.subjectName}
                      <span className='ml-2 text-[12px] text-ink-3 sm:hidden'>{s.attempted} answered</span>
                    </span>
                    <span className='order-3 col-span-2 sm:order-none sm:col-span-1'>
                      <Meter value={s.accuracy} label={`${s.subjectName} accuracy`} tone={weak ? 'warning' : 'brand'} marker={WEAK_ACCURACY} />
                    </span>
                    <span className='text-right text-sm font-medium tabular-nums text-foreground'>{s.accuracy}%</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className='mt-3 flex items-center gap-2 text-[12px] text-ink-3'>
            <span className='inline-block h-3 w-px bg-ink-2' aria-hidden='true' /> {WEAK_ACCURACY}% target · weakest first · tap a subject to practise it
          </p>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mocks                                                                      */
/* -------------------------------------------------------------------------- */

function MocksPanel({
  className,
  hasAccess,
  scores,
  nextMock,
}: {
  className?: string;
  hasAccess: boolean;
  scores: { key: string; label: string; pct: number }[];
  nextMock: MockSummary | null;
}) {
  return (
    <section className={cn('panel flex flex-col p-5 sm:p-6', className)} aria-labelledby='mocks-heading'>
      <PanelHeader id='mocks-heading'
        title='Mock exams' action={hasAccess ? <TextLink to={routes.MockExamsRoute.to}>All mocks</TextLink> : undefined} />
      {!hasAccess ? (
        <EmptyState icon={Lock} title='Full mock exams come with a plan' body='Timed, exam-length mocks with a scored review. Try the free 20-question demo first.' to={routes.DemoExamRoute.to} cta='Try the demo' />
      ) : scores.length === 0 ? (
        <EmptyState
          icon={Timer}
          title='No mocks yet'
          body='Your first mock sets your baseline. It is the biggest part of your readiness score.'
          to={nextMock ? `/mock-exams/start/${nextMock.id}` : routes.MockExamsRoute.to}
          cta='Take your first mock'
        />
      ) : (
        <>
          <dl className='mb-5 grid grid-cols-3 gap-3'>
            {[
              { label: 'Taken', value: String(scores.length) },
              { label: 'Average', value: `${Math.round(scores.reduce((a, s) => a + s.pct, 0) / scores.length)}%` },
              { label: 'Best', value: `${Math.max(...scores.map((s) => s.pct))}%` },
            ].map((m) => (
              <div key={m.label}>
                <dt className='text-[12px] text-ink-3'>{m.label}</dt>
                <dd className='text-lg font-semibold tabular-nums text-foreground'>{m.value}</dd>
              </div>
            ))}
          </dl>
          <ScoreBars className='flex-1' scores={scores} target={MOCK_READY_PCT} targetLabel={`Ready ${MOCK_READY_PCT}%`} />
          {nextMock && (
            <div className='mt-5 flex items-center justify-between gap-3 border-t border-line pt-4'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium text-foreground'>Next: {nextMock.title}</p>
                <p className='text-[12px] text-ink-3'>
                  {nextMock.attemptsUsed} of {nextMock.attemptsCap} attempts used
                </p>
              </div>
              <TextLink to={nextMock.inProgressAttemptId ? `/mock-exams/${nextMock.inProgressAttemptId}` : `/mock-exams/start/${nextMock.id}`}>
                {nextMock.inProgressAttemptId ? 'Resume' : 'Start'}
              </TextLink>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lessons (IDC Ireland)                                                      */
/* -------------------------------------------------------------------------- */

function LessonsPanel({
  lessons,
  next,
}: {
  lessons: LessonSummary[];
  next: { lesson: LessonSummary; part: LessonSummary['parts'][number] } | null;
}) {
  const parts = lessons.flatMap((l) => l.parts);
  const passed = parts.filter((p) => p.passed).length;
  const pct = parts.length ? Math.round((passed / parts.length) * 100) : 0;
  return (
    <section className='panel p-5 sm:p-6' aria-labelledby='lessons-heading'>
      <PanelHeader id='lessons-heading'
        title='Course progress' action={<TextLink to={routes.LessonsRoute.to}>All lessons</TextLink>} />
      <div className='grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center'>
        <div>
          <p className='text-2xl font-semibold tracking-tight tabular-nums text-foreground'>
            {passed} <span className='text-base font-normal text-ink-3'>of {parts.length} parts passed</span>
          </p>
          <Meter value={pct} label='Lesson parts passed' className='mt-3' />
        </div>
        {next ? (
          <Link to={routes.LessonsRoute.to} className='group flex items-center gap-3 rounded-lg border border-line p-3 hover:bg-surface-2'>
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-3 text-brand-11'>
              <BookOpen className='h-4 w-4' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block text-[12px] text-ink-3'>Up next</span>
              <span className='block truncate text-sm font-medium text-foreground'>
                {next.lesson.title} · Part {next.part.order}
              </span>
            </span>
            <ArrowRight className='h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none' />
          </Link>
        ) : (
          <p className='text-sm text-ink-2'>Every unlocked part is passed. Great work.</p>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Activity + level + badges                                                  */
/* -------------------------------------------------------------------------- */

function ActivityPanel({
  days,
  level,
  xpIntoLevel,
  xpForNextLevel,
  badges,
}: {
  days: DailyActivity[];
  level: number | null;
  xpIntoLevel: number;
  xpForNextLevel: number;
  badges: { id: string; label: string; description: string; achieved: boolean }[];
}) {
  const earned = badges.filter((b) => b.achieved).length;
  const activeDays = days.filter((d) => d.attempted > 0).length;
  return (
    <section className='panel p-5 sm:p-6' aria-labelledby='activity-heading'>
      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]'>
        <div className='min-w-0'>
          <PanelHeader id='activity-heading'
        title='Activity' action={<span className='text-[12px] text-ink-3'>{activeDays} active days in the last 6 months</span>} />
          {days.length > 0 ? <ActivityMap days={days} /> : <Skeleton className='h-28 w-full' />}
        </div>

        <div className='border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0'>
          <div className='flex items-baseline justify-between'>
            <p className='text-[13px] text-ink-2'>Level</p>
            <p className='text-[12px] tabular-nums text-ink-3'>
              {xpIntoLevel} / {xpForNextLevel} XP
            </p>
          </div>
          <p className='mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground'>{level ?? '—'}</p>
          <Meter value={(xpIntoLevel / Math.max(1, xpForNextLevel)) * 100} label='Progress to next level' className='mt-2' />

          <div className='mt-6 flex items-baseline justify-between'>
            <p className='text-[13px] text-ink-2'>Badges</p>
            <p className='text-[12px] tabular-nums text-ink-3'>
              {earned} of {badges.length}
            </p>
          </div>
          <ul className='mt-2 flex flex-wrap gap-1.5'>
            {badges.map((b) => (
              <li
                key={b.id}
                title={`${b.label}: ${b.description}${b.achieved ? '' : ' (locked)'}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]',
                  b.achieved ? 'border-brand-6 bg-brand-2 text-brand-11' : 'border-line text-ink-3'
                )}
              >
                {b.achieved ? <Award className='h-3 w-3' /> : <Lock className='h-3 w-3' />}
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared                                                                     */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon: Icon,
  title,
  body,
  to,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  to: string;
  cta: string;
}) {
  return (
    <div className='flex flex-1 flex-col items-start justify-center rounded-lg border border-dashed border-line-strong p-5'>
      <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-brand-3 text-brand-11'>
        <Icon className='h-4 w-4' />
      </span>
      <p className='mt-3 text-sm font-medium text-foreground'>{title}</p>
      <p className='mt-1 max-w-sm text-[13px] leading-5 text-ink-3'>{body}</p>
      <div className='mt-3'>
        <TextLink to={to}>{cta}</TextLink>
      </div>
    </div>
  );
}

function FreePlanBanner({ remaining, examName }: { remaining: number | null; examName: string | null }) {
  return (
    <div className='flex flex-col gap-3 rounded-xl border border-brand-6 bg-brand-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-sm text-foreground'>
        <span className='font-medium'>You&apos;re on the free plan.</span>{' '}
        <span className='text-ink-2'>
          {remaining ?? 15} of 15 practice questions left today. Unlock the full {examName ?? 'question'} bank, mocks and Smart Review from $100, one-time.
        </span>
      </p>
      <Link
        to={routes.PricingPageRoute.to}
        className='inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-9 px-3 text-[13px] font-medium text-primary-foreground hover:bg-brand-9/90'
      >
        See plans <ArrowRight className='h-3.5 w-3.5' />
      </Link>
    </div>
  );
}

export default DashboardHomePage;
