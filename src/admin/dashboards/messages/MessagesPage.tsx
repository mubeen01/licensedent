import { Check, CheckCheck, Copy, Inbox, Mail, MailOpen } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import { getContactFormMessages, markMessageRead, markMessageReplied, useQuery } from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

const PAGE_SIZE = 50;

function AdminMessages({ user }: { user: AuthUser }) {
  const [skip, setSkip] = useState(0);
  const { data: messages, isLoading, refetch } = useQuery(getContactFormMessages, { skip, take: PAGE_SIZE });

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
          <div key={m.id} className='rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col gap-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-wrap items-center gap-2'>
                {m.isRead ? (
                  <MailOpen className='h-4 w-4 text-muted-foreground shrink-0' />
                ) : (
                  <Mail className='h-4 w-4 text-primary shrink-0' />
                )}
                {m.user.username && (
                  <span className={m.isRead ? 'text-sm text-muted-foreground' : 'text-sm font-bold text-foreground'}>
                    {m.user.username}
                  </span>
                )}
                {m.user.email ? (
                  <EmailBadge email={m.user.email} emphasize={!m.isRead && !m.user.username} />
                ) : (
                  !m.user.username && <span className='text-sm text-muted-foreground'>Unknown user</span>
                )}
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

      {messages && messages.length > 0 && (
        <div className='flex items-center justify-between pt-4'>
          <button
            className='text-sm text-muted-foreground hover:text-foreground disabled:opacity-40'
            disabled={skip === 0}
            onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
          >
            &larr; Previous
          </button>
          <button
            className='text-sm text-muted-foreground hover:text-foreground disabled:opacity-40'
            disabled={messages.length < PAGE_SIZE}
            onClick={() => setSkip((s) => s + PAGE_SIZE)}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </DefaultLayout>
  );
}

// Always visible regardless of whether the sender also has a username --
// this is the one thing an admin actually needs to reply by hand, and it
// was previously hidden whenever a username existed.
function EmailBadge({ email, emphasize }: { email: string; emphasize: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, non-secure context) -- the
      // mailto link right next to this still works either way.
    }
  }

  return (
    <span className='inline-flex items-center gap-1'>
      <a
        href={`mailto:${email}`}
        className={emphasize ? 'text-sm font-bold text-foreground hover:underline' : 'text-xs text-muted-foreground hover:underline'}
      >
        {email}
      </a>
      <button
        onClick={handleCopy}
        title='Copy email'
        className='text-muted-foreground hover:text-foreground'
      >
        {copied ? <Check className='h-3 w-3 text-success' /> : <Copy className='h-3 w-3' />}
      </button>
    </span>
  );
}

export default AdminMessages;
