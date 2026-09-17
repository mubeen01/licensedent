import { CheckCircle2, Lock, Trophy, Unlock, XCircle } from 'lucide-react';
import { useParams } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import { Link as WaspRouterLink } from 'wasp/client/router';
import { getLessonPartQuizResults, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import ProtectedContent from '../client/components/ProtectedContent';
import DashboardLayout from '../dashboard/DashboardLayout';
import { cn, optionLetter } from '../lib/utils';

function LessonPartQuizResultsPage({ user }: { user: AuthUser }) {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, error } = useQuery(getLessonPartQuizResults, { attemptId: attemptId! });

  return (
    <DashboardLayout user={user} pageTitle='Lesson Quiz Results'>
      <div className='max-w-3xl mx-auto p-6 flex flex-col gap-6'>
        {isLoading && <LoadingSpinner />}

        {error && <p className='text-sm text-destructive'>{(error as any)?.message ?? 'Failed to load results'}</p>}

        {data && (
          <>
            <div
              className={cn(
                'rounded-sm shadow-lg p-6 md:p-8 flex flex-col items-center text-center gap-2 text-white',
                data.passed
                  ? 'bg-linear-to-br from-primary via-primary to-secondary'
                  : 'bg-linear-to-br from-muted-foreground/80 to-muted-foreground'
              )}
            >
              <Trophy className='h-8 w-8' />
              <h2 className='text-lg font-bold'>
                {data.lessonTitle} · {data.partTitle}
              </h2>
              <p className='text-4xl font-black'>
                {data.correctCount}/{data.totalQuestions}
              </p>
              <p className='text-sm opacity-90'>
                {data.percent}% correct · {data.passThresholdPercent}% needed to pass
                {data.submittedAt ? ` · submitted ${new Date(data.submittedAt).toLocaleString()}` : ''}
              </p>
              <div className='flex items-center gap-2 mt-2 rounded-full bg-black/20 px-4 py-1.5 text-sm font-semibold'>
                {data.passed ? (
                  <>
                    <Unlock className='h-4 w-4' /> Passed — next part unlocked
                  </>
                ) : (
                  <>
                    <Lock className='h-4 w-4' /> Not passed yet — retake to unlock the next part
                  </>
                )}
              </div>
            </div>

            <WaspRouterLink
              to='/lessons'
              className='self-center text-sm font-medium text-primary hover:underline'
            >
              Back to Lessons
            </WaspRouterLink>

            <ProtectedContent>
              <div className='flex flex-col gap-4'>
                {data.items.map((item) => (
                  <div key={item.order} className='rounded-sm border border-border bg-card shadow-sm p-5 md:p-6 flex flex-col gap-4'>
                    <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
                      <span>Question {item.order + 1}</span>
                      <span
                        className={cn(
                          'flex items-center gap-1.5 font-semibold',
                          item.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                        )}
                      >
                        {item.isCorrect ? <CheckCircle2 className='h-4 w-4' /> : <XCircle className='h-4 w-4' />}
                        {item.isCorrect ? 'Correct' : item.selectedKey ? 'Incorrect' : 'Not answered'}
                      </span>
                    </div>

                    <p className='text-base font-medium text-foreground leading-relaxed'>{item.stem}</p>

                    <div className='flex flex-col gap-2'>
                      {item.options.map((opt, optIndex) => {
                        const isSelected = item.selectedKey === opt.key;
                        const isCorrectOne = opt.key === item.correctKey;
                        return (
                          <div
                            key={opt.key}
                            className={cn(
                              'flex items-center gap-3 text-sm rounded-lg px-4 py-2.5 border-2',
                              isCorrectOne
                                ? 'bg-green-50 border-green-400 text-green-900 dark:bg-green-950/60 dark:border-green-700 dark:text-green-200'
                                : isSelected
                                ? 'bg-red-50 border-red-400 text-red-900 dark:bg-red-950/60 dark:border-red-700 dark:text-red-200'
                                : 'border-border'
                            )}
                          >
                            <span className='font-mono font-semibold shrink-0'>{optionLetter(optIndex)}.</span>
                            <span className='flex-1'>{opt.text}</span>
                            {isCorrectOne && <CheckCircle2 className='h-4 w-4 shrink-0' />}
                            {isSelected && !isCorrectOne && <XCircle className='h-4 w-4 shrink-0' />}
                          </div>
                        );
                      })}
                    </div>

                    <div className='rounded-lg bg-muted p-4'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5'>
                        Explanation
                      </p>
                      <p className='text-sm leading-relaxed text-foreground'>{item.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ProtectedContent>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default LessonPartQuizResultsPage;
