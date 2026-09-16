import { Ban, ShieldCheck, UserPlus, Users, Zap } from 'lucide-react';
import { getUsersOverviewStats, useQuery } from 'wasp/client/operations';
import { cn } from '../../../lib/utils';

const TILES: {
  key: keyof Awaited<ReturnType<typeof getUsersOverviewStats>>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'gold' | 'secondary' | 'destructive';
}[] = [
  { key: 'totalUsers', label: 'Total users', icon: Users, color: 'primary' },
  { key: 'newLast7Days', label: 'New in last 7 days', icon: UserPlus, color: 'success' },
  { key: 'activeToday', label: 'Active today', icon: Zap, color: 'gold' },
  { key: 'adminCount', label: 'Admins', icon: ShieldCheck, color: 'secondary' },
  { key: 'disabledCount', label: 'Disabled', icon: Ban, color: 'destructive' },
];

const COLORS = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  gold: { bg: 'bg-gold/10', text: 'text-gold' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
} as const;

export default function UsersOverviewStats() {
  const { data: stats, isLoading } = useQuery(getUsersOverviewStats);

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
      {TILES.map((tile) => {
        const c = COLORS[tile.color];
        return (
          <div key={tile.key} className='rounded-2xl border border-border bg-card p-4 shadow-sm'>
            <div className={cn('mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg', c.bg, c.text)}>
              <tile.icon className='h-4 w-4' />
            </div>
            <p className='text-xl font-bold text-foreground'>
              {isLoading || !stats ? '—' : stats[tile.key].toLocaleString()}
            </p>
            <p className='text-xs text-muted-foreground'>{tile.label}</p>
          </div>
        );
      })}
    </div>
  );
}
