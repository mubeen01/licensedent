import {
  Activity,
  ArrowLeft,
  Clock,
  FileClock,
  Mail,
  Percent,
  ShieldCheck,
  Target,
  Timer,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { type AuthUser } from 'wasp/auth';
import {
  getAdminAuditLog,
  getUserActivitySummary,
  getUserDetail,
  sendUserPasswordReset,
  updateUserProfileByAdmin,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { cn, formatRelativeTime } from '../../../lib/utils';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';
import AccountStatusPanel from './AccountStatusPanel';
import { type UserDetail } from './operations';
import StatTile from './StatTile';
import SubscriptionsPanel from './SubscriptionsPanel';
import TagEditor from './TagEditor';
import UserNotesPanel from './UserNotesPanel';

const TABS = ['Overview', 'Profile', 'Access & Billing', 'Notes', 'Audit Log'] as const;
type Tab = (typeof TABS)[number];

export default function UserDetailPage({ user }: { user: AuthUser }) {
  const { userId } = useParams<{ userId: string }>();
  const [tab, setTab] = useState<Tab>('Overview');

  const { data: detail, isLoading, refetch } = useQuery(getUserDetail, { userId: userId! });

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Users' />
      <Link
        to='/admin/users'
        className='mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='h-3.5 w-3.5' /> Back to all users
      </Link>

      {isLoading && <LoadingSpinner />}

      {!isLoading && !detail && (
        <p className='rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground'>
          User not found.
        </p>
      )}

      {detail && (
        <div className='flex flex-col gap-6'>
          <UserHeader detail={detail} onChanged={refetch} />

          <div className='flex flex-wrap gap-1 border-b border-border'>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  tab === t
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Overview' && <OverviewTab userId={userId!} />}
          {tab === 'Profile' && <ProfileTab detail={detail} onChanged={refetch} />}
          {tab === 'Access & Billing' && <SubscriptionsPanel userId={userId!} />}
          {tab === 'Notes' && <UserNotesPanel userId={userId!} />}
          {tab === 'Audit Log' && <UserAuditLogTab userId={userId!} />}
        </div>
      )}
    </DefaultLayout>
  );
}

function UserHeader({ detail, onChanged }: { detail: UserDetail; onChanged: () => void }) {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const initials = (detail.username || detail.email || '?').slice(0, 2).toUpperCase();

  async function handleSendReset() {
    setIsSendingReset(true);
    try {
      await sendUserPasswordReset({ userId: detail.id });
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to send password reset email');
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <div className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <span className='flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-sm'>
            {initials}
          </span>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-lg font-bold text-foreground'>{detail.username || detail.email}</h1>
              {detail.isAdmin && (
                <span className='inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary'>
                  <ShieldCheck className='h-3 w-3' /> Admin
                </span>
              )}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  detail.isDisabled ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                )}
              >
                {detail.isDisabled ? 'Disabled' : 'Active'}
              </span>
            </div>
            <p className='mt-0.5 flex items-center gap-1 text-sm text-muted-foreground'>
              <Mail className='h-3.5 w-3.5' /> {detail.email}
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>
              Joined {new Date(detail.createdAt).toLocaleDateString()} · Last active{' '}
              {formatRelativeTime(detail.lastLoginAt)} · {detail.loginCount.toLocaleString()} logins
            </p>
            <div className='mt-2'>
              <TagEditor userId={detail.id} tags={detail.tags} onChanged={onChanged} />
            </div>
          </div>
        </div>

        <div className='flex flex-none items-center gap-2'>
          <Button size='sm' variant='outline' disabled={isSendingReset} onClick={handleSendReset}>
            <Mail className='mr-1.5 h-3.5 w-3.5' />
            {isSendingReset ? 'Sending…' : resetSent ? 'Reset email sent ✓' : 'Send password reset'}
          </Button>
        </div>
      </div>

      <div className='mt-4'>
        <AccountStatusPanel
          userId={detail.id}
          userLabel={detail.username || detail.email || 'this user'}
          isDisabled={detail.isDisabled}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

function OverviewTab({ userId }: { userId: string }) {
  const { data: activity, isLoading } = useQuery(getUserActivitySummary, { userId });

  if (isLoading) return <LoadingSpinner />;
  if (!activity) return null;

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatTile icon={Target} value={activity.totalAttempts.toLocaleString()} label='Questions answered' color='primary' />
        <StatTile
          icon={Percent}
          value={activity.totalAttempts > 0 ? `${Math.round((activity.correctAttempts / activity.totalAttempts) * 100)}%` : '—'}
          label='Accuracy'
          color='success'
        />
        <StatTile icon={Timer} value={activity.mockExamsSubmitted.toLocaleString()} label='Mock exams submitted' color='gold' />
        <StatTile icon={Clock} value={formatRelativeTime(activity.lastActiveAt)} label='Last active' color='secondary' small />
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <div>
          <p className='mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground'>
            <Zap className='h-4 w-4' /> Recent practice attempts
          </p>
          {activity.recentAttempts.length === 0 && (
            <p className='rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground'>
              No practice attempts yet.
            </p>
          )}
          <div className='flex flex-col gap-2'>
            {activity.recentAttempts.map((a) => (
              <div key={a.id} className='flex items-start gap-2 rounded-xl border border-border bg-card p-3'>
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold',
                    a.isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {a.isCorrect ? '✓' : '✕'}
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-xs text-foreground'>{a.questionStem}</p>
                  <p className='text-[11px] text-muted-foreground'>{formatRelativeTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className='mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground'>
            <Activity className='h-4 w-4' /> Recent mock exams
          </p>
          {activity.recentMockExams.length === 0 && (
            <p className='rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground'>
              No mock exams yet.
            </p>
          )}
          <div className='flex flex-col gap-2'>
            {activity.recentMockExams.map((m) => (
              <div key={m.id} className='flex items-center justify-between rounded-xl border border-border bg-card p-3'>
                <div>
                  <p className='text-xs font-medium text-foreground capitalize'>{m.status.replace('_', ' ')}</p>
                  <p className='text-[11px] text-muted-foreground'>{formatRelativeTime(m.createdAt)}</p>
                </div>
                {m.correctCount !== null && (
                  <span className='text-xs font-semibold text-foreground'>{m.correctCount} correct</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ detail, onChanged }: { detail: UserDetail; onChanged: () => void }) {
  const [fullName, setFullName] = useState(detail.profile?.fullName ?? '');
  const [country, setCountry] = useState(detail.profile?.country ?? '');
  const [address, setAddress] = useState(detail.profile?.address ?? '');
  const [qualification, setQualification] = useState(detail.profile?.qualification ?? '');
  const [yearsOfExperience, setYearsOfExperience] = useState(
    detail.profile?.yearsOfExperience?.toString() ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      await updateUserProfileByAdmin({
        userId: detail.id,
        fullName: fullName || null,
        country: country || null,
        address: address || null,
        qualification: qualification || null,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : null,
      });
      setSaved(true);
      onChanged();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='max-w-xl rounded-2xl border border-border bg-card p-5'>
      <div className='mb-4 flex items-center gap-2'>
        <UserIcon className='h-4 w-4 text-muted-foreground' />
        <p className='text-sm font-semibold text-foreground'>Onboarding profile</p>
      </div>

      {detail.profile?.exam && (
        <p className='mb-4 text-xs text-muted-foreground'>
          Preparing for <span className='font-medium text-foreground'>{detail.profile.exam.name}</span>
        </p>
      )}

      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Full name</Label>
          <Input className='mt-1' value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Country</Label>
          <Input className='mt-1' value={country} onChange={(e) => setCountry(e.currentTarget.value)} />
        </div>
        <div className='sm:col-span-2'>
          <Label className='text-xs text-muted-foreground'>Address</Label>
          <Input className='mt-1' value={address} onChange={(e) => setAddress(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Qualification</Label>
          <Input className='mt-1' value={qualification} onChange={(e) => setQualification(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Years of experience</Label>
          <Input
            className='mt-1'
            type='number'
            min={0}
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.currentTarget.value)}
          />
        </div>
      </div>

      <div className='mt-5 flex items-center gap-3'>
        <Button size='sm' disabled={isSaving} onClick={handleSave}>
          {isSaving ? 'Saving…' : 'Save profile'}
        </Button>
        {saved && <span className='text-xs font-medium text-success'>Saved ✓</span>}
      </div>
    </div>
  );
}

function UserAuditLogTab({ userId }: { userId: string }) {
  const { data: entries, isLoading } = useQuery(getAdminAuditLog, {
    skip: 0,
    take: 50,
    entityType: 'User',
    entityId: userId,
  });

  return (
    <div className='rounded-2xl border border-border bg-card shadow-sm'>
      {isLoading && (
        <div className='p-6'>
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && (!entries || entries.length === 0) && (
        <p className='flex items-center gap-2 p-6 text-sm text-muted-foreground'>
          <FileClock className='h-4 w-4' /> No admin actions recorded for this user yet.
        </p>
      )}
      {!isLoading && entries && entries.length > 0 && (
        <ul className='divide-y divide-border'>
          {entries.map((entry) => (
            <li key={entry.id} className='flex flex-col gap-1 p-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-sm font-medium text-foreground'>
                  <span className='mr-2 font-mono text-xs text-muted-foreground'>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                  {entry.admin.username ?? entry.admin.email ?? entry.admin.id}
                  <span className='text-muted-foreground'> — {entry.action}</span>
                </p>
              </div>
              {entry.details !== null && entry.details !== undefined && (
                <details className='text-xs text-muted-foreground'>
                  <summary className='cursor-pointer select-none'>Details</summary>
                  <pre className='mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2'>
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
