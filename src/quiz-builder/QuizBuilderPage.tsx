import { AlertTriangle, BookOpen, CheckCircle2, PartyPopper, Sparkles, Target, Timer, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import {
  getCustomQuizMatchCount,
  getMyProgress,
  getPracticeSubjects,
  startCustomQuizAttempt,
  useQuery,
} from 'wasp/client/operations';
import DashboardLayout from '../dashboard/DashboardLayout';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { hasQuizBuilderPlanAccess } from '../payment/planAccess';
import ExtendedPlanUpsell from '../client/components/ExtendedPlanUpsell';
import PracticeSession from '../questions/PracticeSession';
import type { CustomQuizFilters } from '../questions/operations';

const COUNT_OPTIONS = [10, 20, 50, 100, 150, 200];
const WEAK_ACCURACY_THRESHOLD = 70;
const DURATION_PRESETS = [30, 60, 90, 120];
const SECONDS_PER_QUESTION = 30;

const DIFFICULTY_OPTIONS: { key: 'easy' | 'medium' | 'hard'; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

const INCLUDE_OPTIONS: { key: keyof CustomQuizFilters['include']; label: string; hint: string }[] = [
  { key: 'previouslyWrong', label: 'Previously Wrong', hint: 'Questions you got wrong before' },
  { key: 'neverAttempted', label: 'Never Attempted', hint: "Questions you haven't tried yet" },
  { key: 'bookmarked', label: 'Bookmarked', hint: 'Questions you starred as important' },
  { key: 'recentlyAdded', label: 'Recently Added', hint: 'Added to the bank in the last 6 months' },
  { key: 'highYield', label: 'High-Yield', hint: 'Tagged as disproportionately likely to appear on boards' },
  { key: 'caseBased', label: 'Case-Based', hint: 'Patient-scenario questions, not direct recall' },
  { key: 'imageOnly', label: 'Image-Based', hint: 'Only questions with an X-ray or clinical photo' },
];

type Stage = { name: 'setup' } | { name: 'session'; filters: CustomQuizFilters; count: number } | { name: 'complete'; correct: number; total: number };

function QuizBuilder() {
  const [stage, setStage] = useState<Stage>({ name: 'setup' });

  return (
    <div className='max-w-4xl mx-auto p-6'>
      {stage.name === 'setup' && (
        <QuizBuilderSetup onStartPractice={(filters, count) => setStage({ name: 'session', filters, count })} />
      )}

      {stage.name === 'session' && (
        <PracticeSession
          mode='custom'
          customFilters={stage.filters}
          count={stage.count}
          onFinish={({ correct, total }) => setStage({ name: 'complete', correct, total })}
        />
      )}

      {stage.name === 'complete' && (
        <div className='overflow-hidden rounded-xl border border-border bg-card text-center'>
          <div className='bg-primary p-8 md:p-10 text-primary-foreground flex flex-col items-center gap-3'>
            <PartyPopper className='h-7 w-7' />
            <h2 className='text-lg font-semibold'>Quiz complete</h2>
            <p className='text-4xl font-semibold'>
              {stage.correct} / {stage.total}
            </p>
            <p className='text-sm text-primary-foreground/80'>
              {Math.round((stage.correct / Math.max(1, stage.total)) * 100)}% correct
            </p>
          </div>
          <div className='p-6'>
            <Button onClick={() => setStage({ name: 'setup' })}>Build another quiz</Button>
          </div>
        </div>
      )}
    </div>
  );
}

type TimeMode = 'practice' | 'timed';

function QuizBuilderSetup({ onStartPractice }: { onStartPractice: (filters: CustomQuizFilters, count: number) => void }) {
  const navigate = useNavigate();
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery(getPracticeSubjects);
  const { data: progress } = useQuery(getMyProgress);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<CustomQuizFilters['difficulties']>([]);
  const [include, setInclude] = useState<CustomQuizFilters['include']>({});
  const [count, setCount] = useState(20);
  const [timeMode, setTimeMode] = useState<TimeMode>('practice');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [useSecondsPerQuestion, setUseSecondsPerQuestion] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const filters: CustomQuizFilters = { subjectIds: selectedIds, difficulties, include };
  const { data: matchCount, isLoading: isLoadingMatchCount } = useQuery(getCustomQuizMatchCount, { filters });

  const weakSubjects = (progress ?? []).filter((s) => s.accuracy < WEAK_ACCURACY_THRESHOLD);
  const effectiveDurationMinutes = useSecondsPerQuestion
    ? Math.max(1, Math.ceil((count * SECONDS_PER_QUESTION) / 60))
    : durationMinutes;

  function toggleSubject(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function toggleDifficulty(key: 'easy' | 'medium' | 'hard') {
    setDifficulties((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));
  }

  function toggleInclude(key: keyof CustomQuizFilters['include']) {
    setInclude((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    if (timeMode === 'practice') {
      onStartPractice(filters, count);
      return;
    }
    setIsStarting(true);
    setStartError(null);
    try {
      const { attemptId } = await startCustomQuizAttempt({ filters, count, durationMinutes: effectiveDurationMinutes });
      navigate(`/quiz-builder/${attemptId}`);
    } catch (e: any) {
      setStartError(e?.message ?? 'Failed to start quiz');
      setIsStarting(false);
    }
  }

  if (isLoadingSubjects) return <LoadingSpinner />;

  if (!subjects || subjects.length === 0) {
    return (
      <div className='rounded-2xl border border-border bg-card shadow-sm p-8 text-center text-sm text-muted-foreground'>
        No published questions available yet. Check back soon.
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='overflow-hidden rounded-xl bg-primary p-6 md:p-8 text-primary-foreground'>
        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/70'>
          <Wand2 className='h-3.5 w-3.5' />
          Quiz Builder
        </div>
        <h1 className='mt-2 text-2xl md:text-3xl font-semibold'>Build your perfect quiz</h1>
        <p className='mt-2 text-sm md:text-base text-primary-foreground/80 max-w-xl'>
          Pick subjects and filters, choose how many questions, and generate a quiz that's never quite the
          same twice.
        </p>
      </div>

      {weakSubjects.length > 0 && (
        <div className='rounded-xl border border-gold/30 bg-gold/5 p-5 flex items-center justify-between gap-4 flex-wrap'>
          <div className='flex items-center gap-3'>
            <span className='flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-gold/15 text-gold'>
              <Target className='h-4 w-4' />
            </span>
            <div>
              <p className='font-medium text-foreground'>Your weak areas</p>
              <p className='text-sm text-muted-foreground'>
                {weakSubjects.map((s) => `${s.subjectName} (${s.accuracy}%)`).join(', ')}
              </p>
            </div>
          </div>
          <Button variant='outline' onClick={() => setSelectedIds(weakSubjects.map((s) => s.subjectId))}>
            Use these
          </Button>
        </div>
      )}

      <div>
        <h2 className='text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4'>
          Subjects <span className='normal-case font-normal'>(none selected = all subjects)</span>
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {subjects.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <span className='flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary'>
                  <BookOpen className='h-4.5 w-4.5' />
                </span>
                <span className='font-medium text-foreground leading-snug'>{s.name}</span>
                {isSelected && <CheckCircle2 className='absolute right-3 top-3 h-5 w-5 text-primary' />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className='text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4'>
          Difficulty <span className='normal-case font-normal'>(none selected = any)</span>
        </h2>
        <div className='flex gap-2'>
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isSelected = difficulties.includes(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => toggleDifficulty(opt.key)}
                className={cn(
                  'flex-1 rounded-lg border py-2.5 text-center text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className='text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4'>Include</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {INCLUDE_OPTIONS.map((opt) => {
            const isSelected = !!include[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => toggleInclude(opt.key)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 flex-none items-center justify-center rounded-md border',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  )}
                >
                  {isSelected && <CheckCircle2 className='h-4 w-4' />}
                </span>
                <span>
                  <span className='block font-medium text-foreground'>{opt.label}</span>
                  <span className='block text-xs text-muted-foreground'>{opt.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className='rounded-xl border border-border bg-card p-6 flex flex-col gap-6'>
        <div>
          <p className='text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3'>Number of questions</p>
          <div className='grid grid-cols-3 sm:grid-cols-6 gap-2'>
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={cn(
                  'rounded-lg border py-3 text-center font-medium transition-colors',
                  count === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className='text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3'>Time mode</p>
          <div className='grid grid-cols-2 gap-2'>
            <button
              onClick={() => setTimeMode('practice')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                timeMode === 'practice' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}
            >
              <span className='block font-medium text-foreground'>Practice</span>
              <span className='block text-xs text-muted-foreground'>No timer, feedback after each question</span>
            </button>
            <button
              onClick={() => setTimeMode('timed')}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                timeMode === 'timed' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}
            >
              <span className='block font-medium text-foreground flex items-center gap-1.5'>
                <Timer className='h-3.5 w-3.5' /> Timed / Exam Mode
              </span>
              <span className='block text-xs text-muted-foreground'>Countdown timer, feedback after you submit</span>
            </button>
          </div>

          {timeMode === 'timed' && (
            <div className='mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4'>
              <label className='flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer'>
                <input
                  type='checkbox'
                  checked={useSecondsPerQuestion}
                  onChange={(e) => setUseSecondsPerQuestion(e.target.checked)}
                  className='h-4 w-4 rounded border-input'
                />
                {SECONDS_PER_QUESTION} seconds per question
              </label>

              {!useSecondsPerQuestion && (
                <div className='flex gap-2'>
                  {DURATION_PRESETS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setDurationMinutes(m)}
                      className={cn(
                        'flex-1 rounded-lg border py-2 text-center text-sm font-medium transition-colors',
                        durationMinutes === m
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              )}

              <p className='text-xs text-muted-foreground'>{effectiveDurationMinutes} minutes total</p>
            </div>
          )}
        </div>

        {startError && (
          <div className='flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>
            <AlertTriangle className='h-4 w-4 flex-none' />
            {startError}
          </div>
        )}

        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <p className='text-sm text-muted-foreground'>
            {isLoadingMatchCount ? 'Checking matches…' : `${matchCount ?? 0} matching question${matchCount === 1 ? '' : 's'} found`}
          </p>
          <Button size='lg' disabled={!matchCount || isStarting} onClick={handleGenerate}>
            <Sparkles className='w-4 h-4 mr-2' />
            {isStarting ? 'Starting…' : `Generate Quiz${matchCount ? ` — ${Math.min(count, matchCount)} questions` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QuizBuilderPage({ user }: { user: AuthUser }) {
  const unlocked = hasQuizBuilderPlanAccess(user);

  return (
    <DashboardLayout user={user} pageTitle='Quiz Builder'>
      {unlocked ? (
        <QuizBuilder />
      ) : (
        <ExtendedPlanUpsell
          feature='Quiz Builder'
          description="Build your own quiz from any mix of subjects and smart filters — previously wrong, never attempted, bookmarked, and more. No two quizzes are ever quite the same. Upgrade to the Extended or IDC Pathway plan to unlock it."
          planLabel='Extended or IDC Pathway plan'
        />
      )}
    </DashboardLayout>
  );
}
