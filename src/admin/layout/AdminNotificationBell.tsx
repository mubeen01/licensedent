import { Bell, MessageCircleMore, Rocket } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { routes } from 'wasp/client/router';
import { getFastTrackPendingCount, getUnreadMessageCount, useQuery } from 'wasp/client/operations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { cn } from '../../lib/utils';

// Admin header bell -- consolidates the two queues that actually need admin attention (same counts
// already shown as sidebar badges, see admin/layout/Sidebar.tsx) into one notification-style icon,
// replacing the old messages-only MessageButton. Same visual language as the student dashboard's
// notifications/NotificationBell.tsx, but admin has no per-admin Notification rows to list -- these
// are live counts, not a feed, so the dropdown links straight to each queue instead of listing items.
export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadMessages } = useQuery(getUnreadMessageCount);
  const { data: pendingFastTrack } = useQuery(getFastTrackPendingCount);
  const total = (unreadMessages ?? 0) + (pendingFastTrack ?? 0);
  const hasUnread = total > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className='relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary hover:bg-accent'
          title={hasUnread ? `${total} item${total === 1 ? '' : 's'} need attention` : 'Notifications'}
        >
          {hasUnread && (
            <span className='absolute -top-0.5 -right-0.5 z-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground'>
              {total > 9 ? '9+' : total}
            </span>
          )}
          <Bell className='size-5' strokeWidth={2.25} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72 p-2'>
        <div className='px-1 pb-1.5 text-sm font-semibold text-foreground'>Needs attention</div>
        <div className='space-y-1'>
          <Link
            to={routes.AdminMessagesRoute.to}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent',
              (unreadMessages ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                (unreadMessages ?? 0) > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              <MessageCircleMore className='size-4' />
            </div>
            <span className='flex-1'>
              {unreadMessages ?? 0} unread message{unreadMessages === 1 ? '' : 's'}
            </span>
          </Link>
          <Link
            to={routes.AdminFastTrackApplicationsRoute.to}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-accent',
              (pendingFastTrack ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                (pendingFastTrack ?? 0) > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              <Rocket className='size-4' />
            </div>
            <span className='flex-1'>
              {pendingFastTrack ?? 0} pending Fast Track application{pendingFastTrack === 1 ? '' : 's'}
            </span>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
