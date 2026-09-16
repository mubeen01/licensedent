import { Copy } from 'lucide-react';
import { getQuestionById, useQuery } from 'wasp/client/operations';

type Option = { key: string; text: string };

// Shows the actual published question a pending/flagged question was flagged
// as a possible duplicate of, side-by-side with a plain "reads very similar"
// warning that gave no way to check it -- a reviewer previously had to
// search the Published tab by hand to see what it was even being compared
// against.
export default function DuplicateComparisonPanel({ duplicateOfQuestionId }: { duplicateOfQuestionId: string }) {
  const { data: dup, isLoading } = useQuery(getQuestionById, { id: duplicateOfQuestionId });

  if (isLoading) {
    return <p className='text-xs text-amber-700/70 dark:text-amber-400/70'>Loading the published question…</p>;
  }
  if (!dup) {
    return null;
  }

  const options = (dup.options as unknown as Option[]) ?? [];

  return (
    <div className='shrink-0 overflow-hidden rounded-lg border border-amber-300/70 bg-card dark:border-amber-900/70'>
      <div className='flex items-center gap-2 border-b border-amber-300/50 bg-amber-50/60 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30'>
        <Copy className='h-3.5 w-3.5 text-amber-700 dark:text-amber-400' />
        <p className='text-xs font-semibold text-amber-900 dark:text-amber-200'>Comparing against this published question</p>
      </div>
      <div className='flex flex-col gap-2 p-3 text-xs'>
        <p className='font-serif text-[13px] leading-relaxed text-foreground'>{dup.stem}</p>
        <ul className='flex flex-col gap-1'>
          {options.map((o) => (
            <li key={o.key} className={o.key === dup.correctKey ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              <span className='font-mono'>{o.key}.</span> {o.text}
            </li>
          ))}
        </ul>
        {dup.explanation && <p className='italic text-muted-foreground'>{dup.explanation}</p>}
      </div>
    </div>
  );
}
