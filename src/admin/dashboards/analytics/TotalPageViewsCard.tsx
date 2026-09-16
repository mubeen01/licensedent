import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

type PageViewsStats = {
  totalPageViews: number | undefined;
  prevDayViewsChangePercent: string | undefined;
};

const TotalPageViewsCard = ({ totalPageViews, prevDayViewsChangePercent }: PageViewsStats) => {
  const prevDayViewsChangePercentValue = parseInt(prevDayViewsChangePercent || '');
  const isDeltaPositive = prevDayViewsChangePercentValue > 0;

  return (
    <Card className='rounded-2xl border-border/80 shadow-sm hover:-translate-y-1 hover:shadow-lg'>
      <CardHeader className='pb-2'>
        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
          <Eye className='size-6' />
        </div>
      </CardHeader>

      <CardContent className='flex justify-between'>
        <div>
          <h4 className='text-title-md font-bold text-foreground'>{totalPageViews}</h4>
          <span className='text-sm font-medium text-muted-foreground'>Total page views</span>
        </div>

        <span
          className={cn('flex items-center gap-1 text-sm font-medium', {
            'text-success':
              isDeltaPositive && prevDayViewsChangePercent && prevDayViewsChangePercentValue !== 0,
            'text-destructive':
              !isDeltaPositive && prevDayViewsChangePercent && prevDayViewsChangePercentValue !== 0,
            'text-muted-foreground': !prevDayViewsChangePercent || prevDayViewsChangePercentValue === 0,
          })}
        >
          {prevDayViewsChangePercent && prevDayViewsChangePercentValue !== 0
            ? `${prevDayViewsChangePercent}%`
            : '-'}
          {prevDayViewsChangePercent &&
            prevDayViewsChangePercentValue !== 0 &&
            (isDeltaPositive ? <ArrowUp /> : <ArrowDown />)}
        </span>
      </CardContent>
    </Card>
  );
};

export default TotalPageViewsCard;
