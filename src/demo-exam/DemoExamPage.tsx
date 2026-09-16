import { AlertCircle, CheckCircle2, Clock, Trophy, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { demoExamQuestions, type DemoExamQuestion } from './demoExamQuestions';

const EXAM_DURATION_SECONDS = 15 * 60;
const QUESTION_COUNT = 20;

/** Fisher-Yates, so every attempt gets a different order (questions AND options). */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleQuestion(q: DemoExamQuestion): DemoExamQuestion {
  const shuffledOptions = shuffle(q.options);
  return { ...q, options: shuffledOptions };
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Phase = 'intro' | 'exam' | 'results';

export default function DemoExamPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<DemoExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [reviewOpen, setReviewOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = () => {
    const picked = shuffle(demoExamQuestions).slice(0, QUESTION_COUNT).map(shuffleQuestion);
    setQuestions(picked);
    setAnswers({});
    setCurrentIndex(0);
    setSecondsLeft(EXAM_DURATION_SECONDS);
    setPhase('exam');
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('results');
  };

  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const score = useMemo(() => {
    const correct = questions.reduce((sum, q, i) => (answers[i] === q.correctKey ? sum + 1 : sum), 0);
    return { correct, total: questions.length, percent: questions.length ? Math.round((correct / questions.length) * 100) : 0 };
  }, [questions, answers]);

  const answeredCount = Object.keys(answers).length;

  if (phase === 'intro') {
    return (
      <div className='mx-auto max-w-2xl px-6 py-16 sm:py-24'>
        <div className='rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-12'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg'>
            <img src='/licensedent-icon.svg' alt='LicenseDent' className='h-full w-full object-cover' />
          </div>
          <h1 className='mt-6 text-3xl font-bold text-foreground'>Free DHA-Style Demo Exam</h1>
          <p className='mt-3 text-muted-foreground'>
            20 questions · 15 minutes · a fresh, shuffled set every time you take it.
          </p>
          <div className='mt-6 grid grid-cols-3 gap-4 text-sm'>
            <div className='rounded-xl border border-border bg-muted/40 p-4'>
              <div className='text-2xl font-bold text-primary'>20</div>
              <div className='text-muted-foreground'>Questions</div>
            </div>
            <div className='rounded-xl border border-border bg-muted/40 p-4'>
              <div className='text-2xl font-bold text-primary'>15</div>
              <div className='text-muted-foreground'>Minutes</div>
            </div>
            <div className='rounded-xl border border-border bg-muted/40 p-4'>
              <div className='text-2xl font-bold text-primary'>1</div>
              <div className='text-muted-foreground'>No login</div>
            </div>
          </div>
          <p className='mt-6 text-xs text-muted-foreground'>
            No account needed. The timer starts as soon as you click start, and auto-submits at 0:00 — just
            like the real exam.
          </p>
          <Button
            size='lg'
            onClick={startExam}
            className='mt-8 w-full bg-gradient-to-r from-primary to-secondary text-white sm:w-auto sm:px-10'
          >
            Start the demo exam
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'exam') {
    const question = questions[currentIndex];
    const selected = answers[currentIndex];
    const isLowTime = secondsLeft <= 60;

    return (
      <div className='mx-auto max-w-4xl px-6 py-8 sm:py-12'>
        {/* Header: timer + progress */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm'>
          <div className='text-sm font-medium text-muted-foreground'>
            Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
          </div>
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
              isLowTime ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}
          >
            <Clock className='h-4 w-4' />
            {formatTime(secondsLeft)}
          </div>
        </div>

        {/* Question palette */}
        <div className='mb-6 flex flex-wrap gap-2'>
          {questions.map((_, i) => {
            const isAnswered = answers[i] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                  isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : isAnswered
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className='rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8'>
          <p className='text-base font-medium leading-7 text-foreground'>{question.stem}</p>

          <div className='mt-6 space-y-2.5'>
            {question.options.map((opt) => {
              const isSelected = opt.key === selected;
              return (
                <button
                  key={opt.key}
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIndex]: opt.key }))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200',
                    isSelected ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/30 hover:bg-muted/40'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className='flex-1 text-foreground'>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className='mt-6 flex items-center justify-between gap-3'>
          <Button
            variant='outline'
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          {currentIndex === questions.length - 1 ? (
            <Button onClick={finishExam} className='bg-gradient-to-r from-primary to-secondary text-white'>
              Submit exam
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
              Next
            </Button>
          )}
        </div>
      </div>
    );
  }

  // phase === 'results'
  const tier =
    // 20 questions only ever produce multiples of 5 — 98 is never reachable,
    // so the top tier uses 95 (19/20 or 20/20) as the practical equivalent.
    score.percent >= 95
      ? {
          icon: Trophy,
          color: 'text-secondary',
          bg: 'bg-secondary/10',
          border: 'border-secondary/30',
          heading: 'Congratulations! 🎉',
          message: "That's an outstanding score — you're ready to sit your exam with confidence.",
          cta: { label: 'Create a free account', to: routes.SignupRoute.to },
        }
      : score.percent >= 80
        ? {
            icon: AlertCircle,
            color: 'text-gold',
            bg: 'bg-gold/10',
            border: 'border-gold/30',
            heading: "You're close!",
            message:
              'A strong score, but not quite there yet. A focused 1-month Fast Track course could be exactly what closes the gap before your exam.',
            cta: { label: 'See the Fast Track plan', to: routes.PricingPageRoute.to },
          }
        : {
            icon: AlertCircle,
            color: 'text-destructive',
            bg: 'bg-destructive/10',
            border: 'border-destructive/30',
            heading: 'There are real gaps to close',
            message:
              "This score suggests you're not exam-ready yet — that's exactly what a structured course and full question bank are for. Join our program to build a real study plan.",
            cta: { label: 'View courses & plans', to: routes.PricingPageRoute.to },
          };
  const TierIcon = tier.icon;

  return (
    <div className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
      <div className={cn('rounded-3xl border-2 p-8 text-center shadow-sm sm:p-12', tier.border, tier.bg)}>
        <TierIcon className={cn('mx-auto h-12 w-12', tier.color)} />
        <div className='mt-4 text-5xl font-bold text-foreground'>{score.percent}%</div>
        <p className='mt-1 text-sm text-muted-foreground'>
          {score.correct} of {score.total} correct
        </p>
        <h2 className={cn('mt-6 text-2xl font-bold', tier.color)}>{tier.heading}</h2>
        <p className='mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground'>{tier.message}</p>

        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button asChild size='lg' className='bg-gradient-to-r from-primary to-secondary text-white'>
            <WaspRouterLink to={tier.cta.to}>{tier.cta.label}</WaspRouterLink>
          </Button>
          <Button variant='outline' size='lg' onClick={startExam}>
            Retake with new questions
          </Button>
        </div>
      </div>

      {/* Review */}
      <div className='mt-8'>
        <button
          onClick={() => setReviewOpen((v) => !v)}
          className='mx-auto flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80'
        >
          {reviewOpen ? 'Hide' : 'Review'} your answers
        </button>

        {reviewOpen && (
          <div className='mt-6 space-y-3'>
            {questions.map((q, i) => {
              const yourKey = answers[i];
              const isCorrect = yourKey === q.correctKey;
              return (
                <div key={i} className='rounded-xl border border-border bg-card p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <p className='text-sm font-medium text-foreground'>
                      {i + 1}. {q.stem}
                    </p>
                    {isCorrect ? (
                      <CheckCircle2 className='h-5 w-5 flex-none text-secondary' />
                    ) : (
                      <XCircle className='h-5 w-5 flex-none text-destructive' />
                    )}
                  </div>
                  <p className='mt-2 text-xs text-muted-foreground'>
                    Your answer:{' '}
                    <span className={isCorrect ? 'font-semibold text-secondary' : 'font-semibold text-destructive'}>
                      {yourKey ? q.options.find((o) => o.key === yourKey)?.text : 'Not answered'}
                    </span>
                    {isCorrect && <span className='ml-1.5 font-semibold text-secondary'>✓ Correct</span>}
                  </p>
                  {!isCorrect && (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      Correct answer:{' '}
                      <span className='font-semibold text-secondary'>
                        {q.options.find((o) => o.key === q.correctKey)?.text}
                      </span>
                    </p>
                  )}
                  <p className='mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground'>
                    <span className='font-semibold text-foreground'>Explanation: </span>
                    {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
