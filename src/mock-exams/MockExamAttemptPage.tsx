import { AlertTriangle, CheckCircle2, Flag, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import { getMockExamAttempt, saveMockExamAnswer, submitMockExamAttempt, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../lib/utils';
import ProtectedContent from '../client/components/ProtectedContent';

type Option = { key: string; text: string };
type AnswerState = { selectedKey: string | null; markedForReview: boolean };

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function MockExamAttemptPage({ user }: { user: AuthUser }) {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { data: fetched, isLoading, error: fetchError } = useQuery(getMockExamAttempt, { attemptId: attemptId! });

  // Freeze the question list + seed local answer state on first successful
  // load only -- a background refetch must never reshuffle what's on screen
  // or clobber answers the user has already changed locally.
  const [items, setItems] = useState<typeof fetched extends undefined ? undefined : NonNullable<typeof fetched>['items'] | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  useEffect(() => {
    if (fetched && !items) {
      setItems(fetched.items);
      const seeded: Record<string, AnswerState> = {};
      for (const item of fetched.items) {
        seeded[item.questionId] = { selectedKey: item.selectedKey, markedForReview: item.markedForReview };
      }
      setAnswers(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched]);

  useEffect(() => {
    if (fetched?.status === 'submitted') {
      navigate(`/mock-exams/${attemptId}/results`, { replace: true });
    }
  }, [fetched, attemptId, navigate]);

  const [index, setIndex] = useState(0);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasAutoSubmitted = useRef(false);

  const deadline = useMemo(
    () => (fetched ? new Date(fetched.createdAt).getTime() + fetched.durationMinutes * 60_000 : null),
    [fetched]
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remainingMs = deadline ? deadline - now : null;

  async function handleSubmit() {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitMockExamAttempt({ attemptId });
      navigate(`/mock-exams/${attemptId}/results`);
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to submit exam');
      setIsSubmitting(false);
    }
  }

  // Auto-submit once time runs out.
  useEffect(() => {
    if (remainingMs !== null && remainingMs <= 0 && !hasAutoSubmitted.current && !isSubmitting) {
      hasAutoSubmitted.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  function updateAnswer(questionId: string, next: Partial<AnswerState>) {
    setAnswers((prev) => {
      const merged = { ...(prev[questionId] ?? { selectedKey: null, markedForReview: false }), ...next };
      // Fire-and-forget autosave -- a real 150-question exam must survive a refresh.
      if (attemptId) {
        saveMockExamAnswer({
          attemptId,
          questionId,
          selectedKey: merged.selectedKey,
          markedForReview: merged.markedForReview,
        }).catch(() => {
          // Best-effort: a transient failure here shouldn't interrupt the exam.
          // The next change to this question will retry the save.
        });
      }
      return { ...prev, [questionId]: merged };
    });
  }

  if (isLoading || !items) return <LoadingSpinner />;

  if (fetchError) {
    return (
      <div className='max-w-2xl mx-auto p-6'>
        <p className='text-sm text-destructive'>{(fetchError as any)?.message ?? 'Failed to load this attempt'}</p>
      </div>
    );
  }

  const current = items[index];
  const currentAnswer = answers[current.questionId] ?? { selectedKey: null, markedForReview: false };
  const options = (current.options as unknown as Option[]) ?? [];
  const answeredCount = Object.values(answers).filter((a) => !!a.selectedKey).length;
  const isLowTime = remainingMs !== null && remainingMs <= 5 * 60_000;

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4'>
        <div>
          <p className='text-sm font-bold text-foreground'>{fetched?.mockTestTitle}</p>
          <p className='text-xs text-muted-foreground'>
            {answeredCount}/{items.length} answered
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold',
            isLowTime ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
          )}
        >
          <Timer className='h-4 w-4' />
          {remainingMs !== null ? formatRemaining(remainingMs) : '--:--'}
        </div>
      </div>

      <div className='flex-1 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full p-4 md:p-6'>
        {/* Question */}
        <ProtectedContent>
        <div className='flex-1 min-w-0 rounded-sm border border-border bg-card shadow-sm p-5 md:p-8 flex flex-col gap-6'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='rounded-full bg-accent px-2.5 py-0.5 font-medium text-accent-foreground'>
              {current.subjectName}
            </span>
            <span>
              Question {index + 1} of {items.length}
            </span>
          </div>

          <p className='text-lg md:text-xl leading-relaxed font-medium text-foreground'>{current.stem}</p>

          {current.imageUrl && (
            <img src={current.imageUrl} alt='' className='max-h-80 rounded-lg border border-border object-contain' />
          )}

          <div className='flex flex-col gap-2.5'>
            {options.map((opt) => {
              const isSelected = currentAnswer.selectedKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => updateAnswer(current.questionId, { selectedKey: opt.key })}
                  className={cn(
                    'flex items-center gap-3 text-left text-sm md:text-base rounded-lg px-4 py-3 border-2 transition-colors',
                    isSelected ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
                  )}
                >
                  <span className='font-mono font-semibold text-muted-foreground shrink-0'>{opt.key}.</span>
                  <span className='flex-1'>{opt.text}</span>
                </button>
              );
            })}
          </div>

          <div className='flex items-center justify-between pt-2 border-t border-border'>
            <label className='flex items-center gap-2 text-xs text-muted-foreground cursor-pointer'>
              <Checkbox
                checked={currentAnswer.markedForReview}
                onCheckedChange={(v) => updateAnswer(current.questionId, { markedForReview: !!v })}
              />
              <Flag className='h-3.5 w-3.5' /> Mark for review
            </label>

            <div className='flex items-center gap-2'>
              <Button variant='outline' disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                Previous
              </Button>
              {index < items.length - 1 ? (
                <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
              ) : (
                <Button onClick={() => setConfirmingSubmit(true)}>Review & submit</Button>
              )}
            </div>
          </div>
        </div>
        </ProtectedContent>

        {/* Question palette */}
        <div className='lg:w-72 flex-none rounded-sm border border-border bg-card shadow-sm p-4 h-fit lg:sticky lg:top-20'>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>Questions</p>
          <div className='grid grid-cols-8 lg:grid-cols-6 gap-1.5'>
            {items.map((item, i) => {
              const a = answers[item.questionId];
              const isCurrent = i === index;
              return (
                <button
                  key={item.questionId}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'relative h-8 w-8 rounded text-xs font-semibold flex items-center justify-center transition-colors',
                    isCurrent
                      ? 'ring-2 ring-primary'
                      : a?.selectedKey
                      ? 'bg-secondary/20 text-secondary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  {i + 1}
                  {a?.markedForReview && (
                    <span className='absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gold' />
                  )}
                </button>
              );
            })}
          </div>

          <div className='mt-4 pt-4 border-t border-border flex flex-col gap-2 text-xs text-muted-foreground'>
            <span className='flex items-center gap-1.5'>
              <span className='h-2.5 w-2.5 rounded bg-secondary/20' /> Answered
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='h-2.5 w-2.5 rounded-full bg-gold' /> Marked for review
            </span>
          </div>

          {submitError && (
            <p className='mt-3 text-xs text-destructive flex items-center gap-1.5'>
              <AlertTriangle className='h-3.5 w-3.5' /> {submitError}
            </p>
          )}

          <Button
            className='mt-4 w-full'
            variant='outline'
            disabled={isSubmitting}
            onClick={() => setConfirmingSubmit(true)}
          >
            Submit exam
          </Button>
        </div>
      </div>

      {confirmingSubmit && (
        <div className='fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-6 flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-primary' />
              <h3 className='text-base font-bold text-foreground'>Submit this exam?</h3>
            </div>
            <p className='text-sm text-muted-foreground'>
              {answeredCount} of {items.length} questions answered
              {answeredCount < items.length ? ` -- ${items.length - answeredCount} left blank.` : '.'} You won't be
              able to change answers after submitting.
            </p>
            <div className='flex items-center justify-end gap-2'>
              <Button variant='outline' onClick={() => setConfirmingSubmit(false)} disabled={isSubmitting}>
                Keep going
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MockExamAttemptPage;
