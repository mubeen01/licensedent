import { Flame } from 'lucide-react';
import { getReviewerActivityStats, useQuery } from 'wasp/client/operations';

// Same visual language as the student dashboard's streak/XP card (gradient
// icon badge, bold tabular number) but scoped to the current admin's own
// review activity -- a plain, documented count (today's approvals +
// rejections, and a trailing 7-day total), not a gamified/opaque score.
export default function ReviewerActivityTile() {
  const { data, isLoading } = useQuery(getReviewerActivityStats);

  return (
    <div className='flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-amber-500/5 via-card to-card px-4 py-3 shadow-sm'>
      <span className='flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm'>
        <Flame className='h-5 w-5' />
      </span>
      <div className='flex items-baseline gap-1.5'>
        <span className='text-xl font-black tabular-nums text-foreground'>
          {isLoading ? '…' : (data?.reviewedToday ?? 0)}
        </span>
        <span className='text-sm font-medium text-muted-foreground'>reviewed today</span>
      </div>
      <span className='mx-1 h-4 w-px bg-border' />
      <span className='text-sm text-muted-foreground'>
        <span className='font-semibold text-foreground tabular-nums'>
          {isLoading ? '…' : (data?.reviewedThisWeek ?? 0)}
        </span>{' '}
        this week
      </span>
    </div>
  );
}
