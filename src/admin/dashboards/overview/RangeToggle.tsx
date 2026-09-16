import { cn } from '../../../lib/utils';

export default function RangeToggle({
  value,
  onChange,
  options = [7, 30, 90],
}: {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}) {
  return (
    <div className='inline-flex items-center gap-0.5 rounded-full bg-muted/60 p-1'>
      {options.map((opt) => (
        <button
          key={opt}
          type='button'
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            value === opt ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt}d
        </button>
      ))}
    </div>
  );
}
