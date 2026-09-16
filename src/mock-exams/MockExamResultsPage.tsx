import { CheckCircle2, Flag, Trophy, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { type AuthUser } from 'wasp/auth';
import { getMockExamResults, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { cn } from '../lib/utils';
import DashboardLayout from '../dashboard/DashboardLayout';
import ProtectedContent from '../client/components/ProtectedContent';

type Option = { key: string; text: string };
type Filter = 'all' | 'incorrect' | 'marked';

function MockExamResultsPage({ user }: { user: AuthUser }) {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, error } = useQuery(getMockExamResults, { attemptId: attemptId! });
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <DashboardLayout user={user} pageTitle='Mock Exam Results'>
      <div className='max-w-3xl mx-auto p-6 flex flex-col gap-6'>
        {isLoading && <LoadingSpinner />}

        {error && (
          <p className='text-sm text-destructive'>{(error as any)?.message ?? 'Failed to load results'}</p>
        )}

        {data && (
          <>
            <div className='rounded-sm border border-border bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-lg p-6 md:p-8 flex flex-col items-center text-center gap-2'>
              <Trophy className='h-8 w-8' />
              <h2 className='text-lg font-bold'>{data.mockTestTitle}</h2>
              <p className='text-4xl font-black'>
                {data.correctCount}/{data.totalQuestions}
              </p>
              <p className='text-sm opacity-90'>
                {Math.round((data.correctCount / Math.max(1, data.totalQuestions)) * 100)}% correct
                {data.submittedAt ? ` · submitted ${new Date(data.submittedAt).toLocaleString()}` : ''}
              </p>
            </div>

            <div className='flex gap-2'>
              {(['all', 'incorrect', 'marked'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    filter === f
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  {f === 'all' ? 'All questions' : f === 'incorrect' ? 'Incorrect only' : 'Marked for review'}
                </button>
              ))}
            </div>

            <ProtectedContent>
            <div className='flex flex-col gap-4'>
              {data.items
                .filter((item) =>
                  filter === 'all' ? true : filter === 'incorrect' ? !item.isCorrect : item.markedForReview
                )
                .map((item) => {
                  const options = (item.options as unknown as Option[]) ?? [];
                  return (
                    <div key={item.order} className='rounded-sm border border-border bg-card shadow p-5 md:p-6 flex flex-col gap-4'>
                      <div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
                        <span className='flex items-center gap-2'>
                          <span className='rounded-full bg-accent px-2.5 py-0.5 font-medium text-accent-foreground'>
                            {item.subjectName}
                          </span>
                          Question {item.order + 1}
                          {item.markedForReview && <Flag className='h-3.5 w-3.5 text-gold' />}
                        </span>
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
                        {options.map((opt) => {
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
                              <span className='font-mono font-semibold shrink-0'>{opt.key}.</span>
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
                  );
                })}
            </div>
            </ProtectedContent>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MockExamResultsPage;
