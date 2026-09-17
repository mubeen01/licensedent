import { CheckCircle2, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import { getLessonPartQuizAttempt, saveLessonPartQuizAnswer, submitLessonPartQuizAttempt, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import ProtectedContent from '../client/components/ProtectedContent';
import { Button } from '../components/ui/button';
import { cn, optionLetter } from '../lib/utils';

function LessonPartQuizPage({ user }: { user: AuthUser }) {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { data: fetched, isLoading, error: fetchError } = useQuery(getLessonPartQuizAttempt, { attemptId: attemptId! });

  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  useEffect(() => {
    if (fetched && Object.keys(answers).length === 0) {
      const seeded: Record<string, string | null> = {};
      for (const item of fetched.items) seeded[item.questionId] = item.selectedKey;
      setAnswers(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetched]);

  useEffect(() => {
    if (fetched?.status === 'submitted') {
      navigate(`/lessons/quiz/${attemptId}/results`, { replace: true });
    }
  }, [fetched, attemptId, navigate]);

  const [index, setIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function selectAnswer(questionId: string, key: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
    if (attemptId) {
      saveLessonPartQuizAnswer({ attemptId, questionId, selectedKey: key }).catch(() => {
        // Best-effort: a transient failure here shouldn't interrupt the quiz.
      });
    }
  }

  async function handleSubmit() {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitLessonPartQuizAttempt({ attemptId });
      navigate(`/lessons/quiz/${attemptId}/results`);
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to submit quiz');
      setIsSubmitting(false);
    }
  }

  if (isLoading || !fetched) return <LoadingSpinner />;

  if (fetchError) {
    return (
      <div className='max-w-2xl mx-auto p-6'>
        <p className='text-sm text-destructive'>{(fetchError as any)?.message ?? 'Failed to load this quiz'}</p>
      </div>
    );
  }

  const items = fetched.items;
  const current = items[index];
  const selectedKey = answers[current.questionId] ?? null;
  const answeredCount = Object.values(answers).filter((v) => !!v).length;

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <div className='sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4'>
        <div>
          <p className='text-sm font-bold text-foreground flex items-center gap-1.5'>
            <GraduationCap className='h-3.5 w-3.5 text-primary' /> {fetched.lessonTitle} · {fetched.partTitle}
          </p>
          <p className='text-xs text-muted-foreground'>
            {answeredCount}/{items.length} answered
          </p>
        </div>
      </div>

      <div className='flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full p-4 md:p-6'>
        <ProtectedContent>
          <div className='rounded-sm border border-border bg-card shadow-sm p-5 md:p-8 flex flex-col gap-6'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>
                Question {index + 1} of {items.length}
              </span>
            </div>

            <p className='text-lg md:text-xl leading-relaxed font-medium text-foreground'>{current.stem}</p>

            {current.imageUrl && (
              <img src={current.imageUrl} alt='' className='max-h-80 rounded-lg border border-border object-contain' />
            )}

            <div className='flex flex-col gap-2.5'>
              {current.options.map((opt, optIndex) => {
                const isSelected = selectedKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => selectAnswer(current.questionId, opt.key)}
                    className={cn(
                      'flex items-center gap-3 text-left text-sm md:text-base rounded-lg px-4 py-3 border-2 transition-colors',
                      isSelected ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <span className='font-mono font-semibold text-muted-foreground shrink-0'>{optionLetter(optIndex)}.</span>
                    <span className='flex-1'>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            <div className='flex items-center justify-between pt-2 border-t border-border'>
              <Button variant='outline' disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                Previous
              </Button>
              {index < items.length - 1 ? (
                <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
              ) : (
                <Button onClick={() => setConfirming(true)}>Review & submit</Button>
              )}
            </div>
          </div>
        </ProtectedContent>

        <div className='flex items-center justify-center gap-2'>
          {items.map((item, i) => (
            <button
              key={item.questionId}
              onClick={() => setIndex(i)}
              className={cn(
                'h-8 w-8 rounded text-xs font-semibold flex items-center justify-center transition-colors',
                i === index
                  ? 'ring-2 ring-primary'
                  : answers[item.questionId]
                  ? 'bg-secondary/20 text-secondary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {submitError && <p className='text-xs text-destructive text-center'>{submitError}</p>}
      </div>

      {confirming && (
        <div className='fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-6 flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-primary' />
              <h3 className='text-base font-bold text-foreground'>Submit this quiz?</h3>
            </div>
            <p className='text-sm text-muted-foreground'>
              {answeredCount} of {items.length} questions answered
              {answeredCount < items.length ? ` -- ${items.length - answeredCount} left blank.` : '.'} You won't be
              able to change answers after submitting.
            </p>
            <div className='flex items-center justify-end gap-2'>
              <Button variant='outline' onClick={() => setConfirming(false)} disabled={isSubmitting}>
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

export default LessonPartQuizPage;
