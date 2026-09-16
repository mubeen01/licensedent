import { Copy, ImageIcon, Sparkles } from 'lucide-react';
import { type Question } from 'wasp/entities';
import { Checkbox } from '../../../components/ui/checkbox';
import { cn } from '../../../lib/utils';
import { hasIncompleteOptions } from './optionValidation';

type Option = { key: string; text: string };

// A compact scannable row for the middle pane of the two-pane review layout
// -- readiness at a glance via the same red/amber/teal signal
// QuestionReviewCard's left-edge stripe uses, just as a dot instead of a
// border since a full-width stripe reads oddly at this density.
function readinessDotClass(
  question: Question,
  mode: 'unreviewed' | 'published' | 'rejected'
): string {
  if (mode === 'rejected') return 'bg-destructive';
  if (mode === 'published') return 'bg-primary';
  const options = (question.options as unknown as Option[]) ?? [];
  const hasIncomplete = hasIncompleteOptions(options);
  const hasValidAnswer = !!question.correctKey && options.some((o) => o.key === question.correctKey);
  const canApprove = hasValidAnswer && !hasIncomplete && !!question.difficulty;
  if (canApprove) return 'bg-primary';
  if (hasIncomplete || !hasValidAnswer) return 'bg-destructive';
  return 'bg-amber-400';
}

interface QuestionRowProps {
  question: Question & { possibleDuplicateOfPublished?: boolean; duplicateOfQuestionId?: string | null };
  mode: 'unreviewed' | 'published' | 'rejected';
  isActive: boolean;
  onSelect: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  /** Shown instead of nothing when this row came from a cross-bank search
   * result rather than the current subject/batch browse. */
  subjectName?: string;
}

export default function QuestionRow({
  question,
  mode,
  isActive,
  onSelect,
  selected,
  onToggleSelect,
  subjectName,
}: QuestionRowProps) {
  const hasAiSuggestion = !!question.suggestedExplanation && (!!question.suggestedCorrectKey || !!question.correctKey);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
        isActive
          ? 'border-primary/50 bg-primary/5 shadow-xs'
          : 'border-transparent hover:border-border hover:bg-accent/40'
      )}
    >
      <span className={cn('mt-1.5 h-2 w-2 flex-none rounded-full', readinessDotClass(question, mode))} />
      <div onClick={(e) => e.stopPropagation()} className='flex-none pt-0.5'>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label='Select question' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className={cn('truncate text-sm leading-snug', isActive ? 'font-semibold text-foreground' : 'text-foreground')}>
          {question.stem || <span className='italic text-muted-foreground'>(no stem detected)</span>}
        </p>
        <div className='mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground'>
          {subjectName && <span className='font-medium'>{subjectName}</span>}
          {!question.difficulty && mode !== 'rejected' && (
            <span className='rounded-full bg-amber-100 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'>
              Untagged
            </span>
          )}
          {hasAiSuggestion && (
            <span className='flex items-center gap-0.5 rounded-full bg-linear-to-r from-amber-500/15 to-orange-500/15 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-400'>
              <Sparkles className='h-2.5 w-2.5' />
              AI
            </span>
          )}
          {question.imageUrl && <ImageIcon className='h-3 w-3' />}
          {question.possibleDuplicateOfPublished && (
            <span className='flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'>
              <Copy className='h-2.5 w-2.5' />
              Possible dup
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
