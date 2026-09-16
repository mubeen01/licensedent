import { Clock, ExternalLink, Mail, Target, Timer, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { getUserActivitySummary, sendUserPasswordReset, useQuery } from 'wasp/client/operations';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { formatRelativeTime } from '../../../lib/utils';
import LoadingSpinner from '../../layout/LoadingSpinner';
import AccountStatusPanel from './AccountStatusPanel';
import StatTile from './StatTile';
import SubscriptionsPanel from './SubscriptionsPanel';

export interface ManagedUser {
  id: string;
  email: string | null;
  username: string | null;
  isDisabled: boolean;
}

export default function UserManageSheet({
  user,
  open,
  onOpenChange,
}: {
  user: ManagedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
        {user && <SheetBody user={user} />}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ user }: { user: ManagedUser }) {
  const { data: activity, isLoading: activityLoading } = useQuery(getUserActivitySummary, { userId: user.id });

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSendReset() {
    setIsSendingReset(true);
    try {
      await sendUserPasswordReset({ userId: user.id });
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to send password reset email');
    } finally {
      setIsSendingReset(false);
    }
  }

  const initials = (user.username || user.email || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <SheetHeader>
        <div className='flex items-center gap-3'>
          <span className='flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-sm'>
            {initials}
          </span>
          <div className='min-w-0 text-left'>
            <SheetTitle className='truncate'>{user.username || user.email}</SheetTitle>
            <SheetDescription className='truncate'>{user.email}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <Link
        to={`/admin/users/${user.id}`}
        className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'
      >
        View full profile <ExternalLink className='h-3 w-3' />
      </Link>

      {/* Progress snapshot */}
      <div className='mt-6'>
        <p className='mb-3 text-sm font-semibold text-foreground'>Progress</p>
        {activityLoading && <LoadingSpinner />}
        {activity && (
          <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
            <StatTile icon={Target} value={activity.totalAttempts.toLocaleString()} label='Questions' color='primary' />
            <StatTile
              icon={Zap}
              value={activity.totalAttempts > 0 ? `${Math.round((activity.correctAttempts / activity.totalAttempts) * 100)}%` : '—'}
              label='Accuracy'
              color='success'
            />
            <StatTile icon={Timer} value={activity.mockExamsSubmitted.toLocaleString()} label='Mock exams' color='gold' />
            <StatTile icon={Clock} value={formatRelativeTime(activity.lastActiveAt)} label='Last active' color='secondary' small />
          </div>
        )}
      </div>

      {/* Account status */}
      <div className='mt-6'>
        <AccountStatusPanel
          userId={user.id}
          userLabel={user.username || user.email || 'this user'}
          isDisabled={user.isDisabled}
        />
      </div>

      <button
        onClick={handleSendReset}
        disabled={isSendingReset}
        className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50'
      >
        <Mail className='h-3.5 w-3.5' />
        {isSendingReset ? 'Sending…' : resetSent ? 'Password reset email sent ✓' : 'Send password reset email'}
      </button>

      {/* Subscriptions */}
      <div className='mt-8'>
        <SubscriptionsPanel userId={user.id} />
      </div>
    </>
  );
}
