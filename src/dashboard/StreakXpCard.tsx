import { Award, Flame, Lock } from 'lucide-react';
import { getMyStudyStats, useQuery } from 'wasp/client/operations';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';

export default function StreakXpCard() {
  const { data: stats, isLoading } = useQuery(getMyStudyStats);

  return (
    <div className='card-elevated p-6'>
      <div className='flex flex-col sm:flex-row sm:items-center gap-6 mb-6'>
        <div className='flex items-center gap-4'>
          <div className='p-3 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl shrink-0'>
            <Flame className='h-5 w-5 text-gold' />
          </div>
          <div>
            <p className='text-2xl font-semibold text-foreground'>
              {isLoading ? '…' : stats?.currentStreakDays ?? 0} day{stats?.currentStreakDays === 1 ? '' : 's'}
            </p>
            <p className='text-sm text-muted-foreground'>Current streak</p>
          </div>
        </div>

        <div className='flex-1'>
          <div className='flex items-center justify-between mb-1.5'>
            <span className='text-sm font-medium text-foreground'>Level {isLoading ? '…' : stats?.level ?? 1}</span>
            <span className='text-xs text-muted-foreground'>
              {isLoading ? '' : `${stats?.xpIntoLevel ?? 0} / ${stats?.xpForNextLevel ?? 1000} XP`}
            </span>
          </div>
          <Progress value={isLoading ? 0 : ((stats?.xpIntoLevel ?? 0) / (stats?.xpForNextLevel ?? 1000)) * 100} />
        </div>
      </div>

      <div className='flex items-center gap-2 mb-4'>
        <Award className='w-4 h-4 text-muted-foreground' />
        <h3 className='text-sm font-medium uppercase tracking-wide text-muted-foreground'>Badges</h3>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        {stats?.badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={cn(
              'rounded-xl border p-3 flex flex-col gap-1 transition-colors',
              badge.achieved
                ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/5'
                : 'border-border bg-muted/30 opacity-60'
            )}
          >
            <div className='flex items-center gap-1.5'>
              {badge.achieved ? (
                <Award className='w-3.5 h-3.5 text-primary shrink-0' />
              ) : (
                <Lock className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
              )}
              <span className='text-xs font-medium text-foreground truncate'>{badge.label}</span>
            </div>
            <p className='text-[11px] text-muted-foreground leading-snug'>{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
