import { Search, X } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { searchQuestions, useQuery } from 'wasp/client/operations';
import useDebounce from '../../../client/hooks/useDebounce';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';

type QuestionSearchResult = { id: string; stem: string; status: string; subjectId: string; subjectName: string };

interface QuestionSearchBarProps {
  /** Jump straight to a question found anywhere in the bank, regardless of
   * which subject/batch/tab/page is currently browsed. */
  onJump: (result: QuestionSearchResult) => void;
}

// Full-text jump-to-question, forwardRef'd so the "/" keyboard shortcut
// (useReviewShortcuts) can focus it without a mouse click.
const QuestionSearchBar = forwardRef<HTMLInputElement, QuestionSearchBarProps>(function QuestionSearchBar(
  { onJump },
  ref
) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounced = useDebounce(query, 250);
  const trimmed = debounced.trim();

  const { data: results, isLoading } = useQuery(
    searchQuestions,
    { query: trimmed, limit: 20 },
    { enabled: trimmed.length >= 2 }
  );

  const showResults = isFocused && trimmed.length >= 2;

  return (
    <div className='relative'>
      <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        ref={ref}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        onFocus={() => setIsFocused(true)}
        // Deferred so a result button's onClick still fires before the
        // dropdown unmounts from the blur -- onMouseDown on each result
        // also prevents the blur from stealing focus before the click lands.
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder='Search every question by text… (press /)'
        className='pl-9 pr-8'
      />
      {query && (
        <button
          type='button'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setQuery('')}
          className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          aria-label='Clear search'
        >
          <X className='h-3.5 w-3.5' />
        </button>
      )}
      {showResults && (
        <div className='absolute z-20 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg'>
          {isLoading && <p className='px-3 py-2.5 text-sm text-muted-foreground'>Searching…</p>}
          {!isLoading && results?.length === 0 && (
            <p className='px-3 py-2.5 text-sm text-muted-foreground'>No matches for "{trimmed}".</p>
          )}
          {results?.map((r) => (
            <button
              key={r.id}
              type='button'
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onJump(r);
                setQuery('');
                setIsFocused(false);
              }}
              className='flex w-full flex-col gap-0.5 border-b border-border/60 px-3 py-2 text-left last:border-0 hover:bg-accent/60'
            >
              <span className='truncate text-sm text-foreground'>{r.stem}</span>
              <span className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                <span className='font-medium'>{r.subjectName}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wide',
                    r.status === 'published'
                      ? 'bg-primary/10 text-primary'
                      : r.status === 'rejected'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  )}
                >
                  {r.status}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default QuestionSearchBar;
