import { cn } from '../../../lib/utils';

const STAT_COLORS = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  gold: { bg: 'bg-gold/10', text: 'text-gold' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary' },
} as const;

export default function StatTile({
  icon: Icon,
  value,
  label,
  color,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  color: keyof typeof STAT_COLORS;
  small?: boolean;
}) {
  const c = STAT_COLORS[color];
  return (
    <div className='rounded-xl border border-border bg-card p-3'>
      <div className={cn('mb-2 flex h-7 w-7 items-center justify-center rounded-lg', c.bg, c.text)}>
        <Icon className='h-3.5 w-3.5' />
      </div>
      <p className={cn('font-bold text-foreground', small ? 'text-sm' : 'text-lg')}>{value}</p>
      <p className='text-[11px] text-muted-foreground'>{label}</p>
    </div>
  );
}
