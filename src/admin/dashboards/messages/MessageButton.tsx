import { MessageCircleMore } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getUnreadMessageCount, useQuery } from 'wasp/client/operations';

const MessageButton = () => {
  const { data: unreadCount } = useQuery(getUnreadMessageCount);
  const hasUnread = !!unreadCount && unreadCount > 0;

  return (
    <li className='relative'>
      <WaspRouterLink
        className='relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors'
        to={routes.AdminMessagesRoute.to}
        title={hasUnread ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}` : 'Messages'}
      >
        {hasUnread && (
          <span className='absolute -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-destructive'>
            <span className='absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75' />
          </span>
        )}
        <MessageCircleMore className='size-5' />
      </WaspRouterLink>
    </li>
  );
};

export default MessageButton;
