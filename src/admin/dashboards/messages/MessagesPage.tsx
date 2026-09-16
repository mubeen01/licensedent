import { CheckCheck, Inbox, Mail, MailOpen } from 'lucide-react';
import { type AuthUser } from 'wasp/auth';
import { getContactFormMessages, markMessageRead, markMessageReplied, useQuery } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

function AdminMessages({ user }: { user: AuthUser }) {
  const { data: messages, isLoading, refetch } = useQuery(getContactFormMessages);

  async function handleMarkRead(id: string) {
    await markMessageRead({ id });
    refetch();
  }

  async function handleMarkReplied(id: string) {
    await markMessageReplied({ id });
    refetch();
  }

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Messages' />

      {isLoading && <LoadingSpinner />}

      {!isLoading && (!messages || messages.length === 0) && (
        <div className='rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center'>
          <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted'>
            <Inbox className='h-6 w-6 text-muted-foreground' />
          </div>
          <p className='font-semibold text-foreground'>No messages yet</p>
          <p className='text-sm text-muted-foreground mt-1'>
            Student support requests sent from the Account page will show up here.
          </p>
        </div>
      )}

      <div className='flex flex-col gap-3'>
        {messages?.map((m) => (
          <div key={m.id} className='rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-center gap-2'>
                {m.isRead ? (
                  <MailOpen className='h-4 w-4 text-muted-foreground' />
                ) : (
                  <Mail className='h-4 w-4 text-primary' />
                )}
                <span className={m.isRead ? 'text-sm text-muted-foreground' : 'text-sm font-bold text-foreground'}>
                  {m.user.username || m.user.email || 'Unknown user'}
                </span>
                {!m.isRead && (
                  <span className='rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary'>
                    New
                  </span>
                )}
                {m.repliedAt && (
                  <span className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                    Replied
                  </span>
                )}
              </div>
              <span className='shrink-0 text-xs text-muted-foreground'>
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>

            <p className='text-sm leading-relaxed text-foreground whitespace-pre-wrap'>{m.content}</p>

            <div className='flex items-center justify-end gap-2 pt-2 border-t border-border'>
              {!m.isRead && (
                <Button variant='outline' size='sm' onClick={() => handleMarkRead(m.id)}>
                  Mark read
                </Button>
              )}
              {!m.repliedAt && (
                <Button size='sm' onClick={() => handleMarkReplied(m.id)}>
                  <CheckCheck className='h-3.5 w-3.5 mr-1.5' />
                  Mark replied
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </DefaultLayout>
  );
}

export default AdminMessages;
