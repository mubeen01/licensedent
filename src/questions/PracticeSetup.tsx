import { BookOpen, Bookmark, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getDueReviewCount, getPracticeSubjects, useQuery } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import LoadingSpinner from '../admin/layout/LoadingSpinner';

const COUNT_OPTIONS = [10, 20, 30];

const GRADIENTS = [
  'from-primary to-secondary',
  'from-amber-500 to-amber-400',
  'from-teal-500 to-teal-700',
  'from-cyan-500 to-sky-500',
  'from-sky-500 to-blue-500',
  'from-blue-500 to-sky-600',
  'from-teal-600 to-cyan-500',
  'from-secondary to-amber-600',
  'from-teal-500 to-cyan-600',
  'from-cyan-500 to-teal-500',
];

export default function PracticeSetup({
  onStart,
}: {
  onStart: (subjectIds: string[], count: number) => void;
}) {
  const { data: subjects, isLoading } = useQuery(getPracticeSubjects);
  const { data: dueReviewCount } = useQuery(getDueReviewCount);
  const [searchParams] = useSearchParams();
  // Lets the Study Plan dashboard card deep-link a "practice this now" button
  // straight into a preselected weak subject via /practice?subjects=id1,id2.
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => searchParams.get('subjects')?.split(',').filter(Boolean) ?? []
  );
  const [count, setCount] = useState(10);

  function toggleSubject(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  if (isLoading) return <LoadingSpinner />;

  if (!subjects || subjects.length === 0) {
    return (
      <div className='card-elevated p-8 text-center text-sm text-muted-foreground'>
        No published questions available yet. Check back soon.
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='overflow-hidden rounded-2xl bg-linear-to-r from-primary via-primary to-secondary p-6 md:p-8 text-primary-foreground shadow-lg'>
        <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] opacity-80'>
          <Sparkles className='h-3.5 w-3.5' />
          General Dentist Practice
        </div>
        <h1 className='mt-2 text-2xl md:text-3xl font-black'>Pick your subjects</h1>
        <p className='mt-2 text-sm md:text-base opacity-90 max-w-xl'>
          Select one or more subjects, choose how many questions, and start a focused practice session.
        </p>
      </div>

      {!!dueReviewCount && (
        <Link
          to='/practice/smart-review'
          className='flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 hover:border-primary/50 transition-colors'
        >
          <span className='flex items-center gap-3'>
            <span className='flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary text-white shadow-sm'>
              <RotateCcw className='h-5 w-5' />
            </span>
            <span>
              <span className='block font-bold text-foreground'>
                {dueReviewCount} question{dueReviewCount === 1 ? '' : 's'} ready for Smart Review
              </span>
              <span className='block text-sm text-muted-foreground'>Resurfaced based on what you've gotten wrong before</span>
            </span>
          </span>
          <span className='text-sm font-semibold text-primary shrink-0'>Start →</span>
        </Link>
      )}

      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-sm font-bold uppercase tracking-wide text-muted-foreground'>Subjects</h2>
          <Link
            to='/practice/review'
            className='flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline'
          >
            <Bookmark className='h-4 w-4' />
            My reviews
          </Link>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {subjects.map((s, i) => {
            const isSelected = selectedIds.includes(s.id);
            const gradient = GRADIENTS[i % GRADIENTS.length];
            return (
              <button
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 bg-linear-to-br',
                  isSelected
                    ? 'border-primary from-primary/10 to-secondary/5 shadow-lg shadow-primary/10 -translate-y-0.5'
                    : 'border-border from-card to-card-subtle/40 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5'
                )}
              >
                <span
                  className={cn(
                    'flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-linear-to-br text-white shadow-sm',
                    gradient
                  )}
                >
                  <BookOpen className='h-5 w-5' />
                </span>
                <span className='font-semibold text-foreground leading-snug'>{s.name}</span>
                {isSelected && (
                  <CheckCircle2 className='absolute right-3 top-3 h-5 w-5 text-primary' />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className='card-elevated p-6 flex flex-col gap-5'>
        <div>
          <p className='text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3'>
            Number of questions
          </p>
          <div className='flex gap-2'>
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={cn(
                  'flex-1 rounded-xl border-2 py-3 text-center font-bold transition-colors',
                  count === n
                    ? 'border-transparent bg-linear-to-r from-primary to-secondary text-white shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <Button
          size='lg'
          disabled={selectedIds.length === 0}
          onClick={() => onStart(selectedIds, count)}
          className='bg-linear-to-r from-primary to-secondary font-bold text-white'
        >
          Start practice{selectedIds.length > 0 ? ` — ${count} questions` : ''}
        </Button>
      </div>
    </div>
  );
}
