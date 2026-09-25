import { Bell, CheckCheck, GraduationCap, Mail, Rocket, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  useAction,
  useQuery,
} from 'wasp/client/operations';
import { type Notification } from 'wasp/entities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { cn } from '../lib/utils';

const TYPE_ICON: Record<string, typeof Bell> = {
  message_replied: Mail,
  fast_track_decision: Rocket,
  plan_activated: Wallet,
  plan_expiring: Wallet,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function NotificationRow({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const Icon = TYPE_ICON[notification.type] ?? GraduationCap;
  const content = (
    <div
      className={cn(
        'flex gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        notification.isRead ? 'text-muted-foreground' : 'bg-primary/5 text-foreground'
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          notification.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'
        )}
      >
        <Icon className='size-3.5' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className={cn('text-sm leading-5', !notification.isRead && 'font-semibold')}>{notification.title}</p>
        <p className='mt-0.5 text-xs leading-5 text-muted-foreground'>{notification.body}</p>
        <p className='mt-1 text-[11px] text-muted-foreground/70'>{timeAgo(new Date(notification.createdAt))}</p>
      </div>
      {!notification.isRead && <span className='mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary' />}
    </div>
  );

  if (!notification.link) {
    return (
      <button type='button' className='w-full' onClick={() => onRead(notification.id)}>
        {content}
      </button>
    );
  }

  return (
    <Link to={notification.link} className='block w-full' onClick={() => onRead(notification.id)}>
      {content}
    </Link>
  );
}

// Student dashboard bell -- mirrors admin/dashboards/messages/MessageButton.tsx's unread-count
// pattern, but with a real dropdown list since this covers several notification types, not one.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useQuery(getMyUnreadNotificationCount);
  const { data: notifications } = useQuery(getMyNotifications, { take: 20 }, { enabled: open });
  const markRead = useAction(markNotificationRead);
  const markAllRead = useAction(markAllNotificationsRead);
  const hasUnread = !!unreadCount && unreadCount > 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className='relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary hover:bg-accent'
          title={hasUnread ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}
        >
          {hasUnread && (
            <span className='absolute -top-0.5 -right-0.5 z-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive'>
              <span className='absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75' />
            </span>
          )}
          <Bell className='size-5' strokeWidth={2.25} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80 p-2'>
        <div className='flex items-center justify-between px-1 pb-1.5'>
          <span className='text-sm font-semibold text-foreground'>Notifications</span>
          {hasUnread && (
            <button
              type='button'
              onClick={() => markAllRead(undefined)}
              className='flex items-center gap-1 text-xs font-medium text-primary hover:underline'
            >
              <CheckCheck className='size-3.5' /> Mark all read
            </button>
          )}
        </div>
        <div className='max-h-96 space-y-1 overflow-y-auto'>
          {!notifications || notifications.length === 0 ? (
            <p className='px-2 py-6 text-center text-sm text-muted-foreground'>You're all caught up.</p>
          ) : (
            notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} onRead={(id) => markRead({ id })} />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
