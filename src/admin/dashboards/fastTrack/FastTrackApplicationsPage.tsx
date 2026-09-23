import { Check, GraduationCap, Inbox, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  approveFastTrackApplication,
  getFastTrackApplications,
  rejectFastTrackApplication,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

const PAGE_SIZE = 50;

const statusTabs = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const;
type StatusTab = (typeof statusTabs)[number]['value'];

function AdminFastTrackApplications({ user }: { user: AuthUser }) {
  const [status, setStatus] = useState<StatusTab>('pending');
  const [skip, setSkip] = useState(0);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { data: applications, isLoading, refetch } = useQuery(getFastTrackApplications, {
    status,
    skip,
    take: PAGE_SIZE,
  });

  async function handleApprove(id: string) {
    setActioningId(id);
    try {
      await approveFastTrackApplication({ applicationId: id });
      await refetch();
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: string) {
    setActioningId(id);
    try {
      await rejectFastTrackApplication({ applicationId: id });
      await refetch();
    } finally {
      setActioningId(null);
    }
  }

  function changeTab(next: StatusTab) {
    setStatus(next);
    setSkip(0);
  }

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Fast Track Applications' />

      <div className='mb-5 flex gap-1 rounded-xl border border-border bg-card p-1 w-fit'>
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => changeTab(tab.value)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors',
              status === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && (!applications || applications.length === 0) && (
        <div className='rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center'>
          <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted'>
            <Inbox className='h-6 w-6 text-muted-foreground' />
          </div>
          <p className='font-semibold text-foreground'>No {status} applications</p>
        </div>
      )}

      <div className='flex flex-col gap-3'>
        {applications?.map((app) => (
          <div
            key={app.id}
            className='rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col gap-3'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-bold text-foreground'>
                  {app.user.username ?? app.user.email ?? 'Unknown user'}
                </span>
                <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                  <GraduationCap className='h-3 w-3' />
                  {app.exam.flagEmoji} {app.exam.code ?? app.exam.name}
                </span>
                <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                  <MapPin className='h-3 w-3' />
                  {app.city}
                </span>
              </div>
              <span className='shrink-0 text-xs text-muted-foreground'>
                {new Date(app.createdAt).toLocaleString()}
              </span>
            </div>

            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div>
                <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Background</div>
                <p className='mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap'>{app.experience}</p>
              </div>
              <div>
                <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Why this exam
                </div>
                <p className='mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap'>{app.whyThisExam}</p>
              </div>
            </div>

            {app.status === 'pending' && (
              <div className='flex items-center justify-end gap-2 pt-2 border-t border-border'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={actioningId === app.id}
                  onClick={() => handleReject(app.id)}
                >
                  <X className='h-3.5 w-3.5 mr-1.5' />
                  Reject
                </Button>
                <Button size='sm' disabled={actioningId === app.id} onClick={() => handleApprove(app.id)}>
                  <Check className='h-3.5 w-3.5 mr-1.5' />
                  Approve & grant access
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {applications && applications.length > 0 && (
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
            disabled={applications.length < PAGE_SIZE}
            onClick={() => setSkip((s) => s + PAGE_SIZE)}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </DefaultLayout>
  );
}

export default AdminFastTrackApplications;
