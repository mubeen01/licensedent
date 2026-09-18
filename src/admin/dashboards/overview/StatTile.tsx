import { type LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../../lib/utils';

type Accent = 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'gold';

const ACCENT_CLASSES: Record<Accent, { text: string; bg: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/10' },
  secondary: { text: 'text-secondary', bg: 'bg-secondary/10' },
  success: { text: 'text-success', bg: 'bg-success/10' },
  warning: { text: 'text-warning', bg: 'bg-warning/10' },
  destructive: { text: 'text-destructive', bg: 'bg-destructive/10' },
  gold: { text: 'text-gold', bg: 'bg-gold/10' },
};

// deltaGoodDirection: which direction of change is the "good news" one for
// this metric -- more signups is good (up=good), more unread messages is bad
// (up=bad). Delta coloring follows that, not a blind "green if positive."
export default function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  deltaPercent,
  deltaGoodDirection = 'up',
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number | undefined;
  sub?: string;
  accent: Accent;
  deltaPercent?: number | null;
  deltaGoodDirection?: 'up' | 'down';
  href?: string;
}) {
  const { text, bg } = ACCENT_CLASSES[accent];
  const isLoading = value === undefined;

  const deltaDirection = deltaPercent == null ? null : deltaPercent > 0 ? 'up' : deltaPercent < 0 ? 'down' : 'flat';
  const isGoodDelta =
    deltaDirection === null || deltaDirection === 'flat' ? null : deltaDirection === deltaGoodDirection;

  const card = (
    <div className={cn('card-elevated p-5', href && 'card-elevated-hover cursor-pointer')}>
      <div className='flex items-center justify-between pb-2'>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', bg, text)}>
          <Icon className='size-6' />
        </div>
        {deltaDirection && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold',
              isGoodDelta ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {deltaDirection === 'up' ? (
              <TrendingUp className='size-3' />
            ) : deltaDirection === 'down' ? (
              <TrendingDown className='size-3' />
            ) : (
              <Minus className='size-3' />
            )}
            {Math.abs(deltaPercent!).toFixed(0)}%
          </span>
        )}
      </div>
      <h4 className={cn('text-title-md font-bold tabular-nums', text)}>
        {isLoading ? '…' : typeof value === 'number' ? value.toLocaleString() : value}
      </h4>
      <span className='text-sm font-medium text-muted-foreground'>{label}</span>
      {sub && <p className='mt-1 text-xs text-muted-foreground'>{sub}</p>}
    </div>
  );

  return href ? (
    <Link to={href} className='block'>
      {card}
    </Link>
  ) : (
    card
  );
}
