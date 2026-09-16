import { CreditCard, History, MessageCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminRecentActivity, useQuery } from 'wasp/client/operations';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import LoadingSpinner from '../../layout/LoadingSpinner';

const EVENT_STYLE: Record<
  string,
  { icon: typeof UserPlus; text: string; bg: string; href: string }
> = {
  signup: { icon: UserPlus, text: 'text-secondary', bg: 'bg-secondary/10', href: '/admin/users' },
  subscription: { icon: CreditCard, text: 'text-success', bg: 'bg-success/10', href: '/admin/users' },
  message: { icon: MessageCircle, text: 'text-gold', bg: 'bg-gold/10', href: '/admin/messages' },
  audit: { icon: History, text: 'text-primary', bg: 'bg-primary/10', href: '/admin/audit-log' },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecentActivityFeed() {
  const { data: events, isLoading } = useQuery(getAdminRecentActivity);

  return (
    <Card className='rounded-2xl border-border/80 shadow-sm p-5 md:p-6 h-full flex flex-col'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-bold text-foreground'>Recent activity</h3>
      </div>

      {isLoading && (
        <div className='flex flex-1 items-center justify-center py-10'>
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && (!events || events.length === 0) && (
        <p className='py-10 text-center text-sm text-muted-foreground'>Nothing to show yet.</p>
      )}

      {!isLoading && events && events.length > 0 && (
        <ul className='flex flex-col divide-y divide-border'>
          {events.map((event) => {
            const style = EVENT_STYLE[event.type] ?? EVENT_STYLE.audit;
            const Icon = style.icon;
            return (
              <li key={event.id}>
                <Link to={style.href} className='flex items-start gap-3 py-3 group'>
                  <span className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl', style.bg, style.text)}>
                    <Icon className='size-4' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate'>
                      {event.title}
                    </span>
                    {event.subtitle && (
                      <span className='block text-xs text-muted-foreground truncate'>{event.subtitle}</span>
                    )}
                  </span>
                  <span className='flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap'>
                    {timeAgo(event.createdAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
