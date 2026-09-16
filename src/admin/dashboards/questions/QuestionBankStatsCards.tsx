import { BookOpen, CheckCircle2, Clock, Tags, XCircle } from 'lucide-react';
import { type QuestionBankStats } from './operations';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';

// Same Card/CardHeader/CardContent shape as the SaaS analytics cards
// (TotalSignupsCard etc.) so this reads as one design system whether it's
// shown on the Question Review page or the admin Dashboard.
export default function QuestionBankStatsCards({
  stats,
  isLoading,
}: {
  stats: QuestionBankStats | undefined;
  isLoading: boolean;
}) {
  const tiles = [
    {
      key: 'total',
      icon: BookOpen,
      value: stats?.totalQuestions,
      label: 'Total questions',
      sub: stats ? `across ${stats.subjectCount} subject${stats.subjectCount === 1 ? '' : 's'}` : undefined,
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      key: 'published',
      icon: CheckCircle2,
      value: stats?.totalPublished,
      label: 'Published',
      sub: stats ? `+${stats.publishedLast7Days} in last 7 days` : undefined,
      accent: 'text-success',
      bg: 'bg-success/10',
    },
    {
      key: 'pending',
      icon: Clock,
      value: stats ? stats.totalPending + stats.totalFlagged : undefined,
      label: 'Awaiting review',
      sub: stats ? `${stats.totalFlagged} flagged for attention` : undefined,
      accent: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      key: 'tagging',
      icon: Tags,
      value: stats?.totalNeedsTagging,
      label: 'Needs tagging',
      sub: 'no difficulty set yet',
      accent: 'text-gold',
      bg: 'bg-gold/10',
    },
    {
      key: 'rejected',
      icon: XCircle,
      value: stats?.totalRejected,
      label: 'Rejected',
      sub: 'see the Rejected tab for reasons',
      accent: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card key={tile.key} className='rounded-2xl border-border/80 shadow-xs hover:-translate-y-1 hover:shadow-lg'>
            <CardHeader className='pb-2'>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tile.bg} ${tile.accent}`}>
                <Icon className='size-6' />
              </div>
            </CardHeader>
            <CardContent>
              <h4 className={`text-title-md font-bold tabular-nums ${tile.accent}`}>
                {isLoading || tile.value === undefined ? '...' : tile.value.toLocaleString()}
              </h4>
              <span className='text-sm font-medium text-muted-foreground'>{tile.label}</span>
              {tile.sub && <p className='mt-1 text-xs text-muted-foreground'>{tile.sub}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
