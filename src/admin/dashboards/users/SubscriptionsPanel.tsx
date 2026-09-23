import { CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  getExamsForAdmin,
  getUserSubscriptions,
  grantUserSubscription,
  revokeUserSubscription,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';
import { PaymentPlanId, getPlanPrice, paymentPlans, prettyPaymentPlanName } from '../../../payment/plans';
import LoadingSpinner from '../../layout/LoadingSpinner';
import { ExamFlag } from '../../../client/components/ExamFlag';

export default function SubscriptionsPanel({ userId }: { userId: string }) {
  const { data: subscriptions, isLoading: subsLoading, refetch: refetchSubs } = useQuery(getUserSubscriptions, {
    userId,
  });
  const { data: exams } = useQuery(getExamsForAdmin);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(subscriptionId: string) {
    if (!confirm('Revoke this access pass? The student loses access immediately.')) return;
    setRevokingId(subscriptionId);
    try {
      await revokeUserSubscription({ subscriptionId });
      refetchSubs();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to revoke subscription');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div>
      <p className='mb-3 text-sm font-semibold text-foreground'>Exam access</p>

      {subsLoading && <LoadingSpinner />}
      {!subsLoading && (!subscriptions || subscriptions.length === 0) && (
        <p className='rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground'>
          No access passes granted yet.
        </p>
      )}

      <div className='flex flex-col gap-2'>
        {subscriptions?.map((sub) => (
          <div
            key={sub.id}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border p-3',
              sub.isActive ? 'border-border bg-card' : 'border-border/60 bg-muted/30 opacity-70'
            )}
          >
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary'>
                  {prettyPaymentPlanName(sub.planType as PaymentPlanId)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    sub.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {sub.isActive ? <CheckCircle2 className='h-3 w-3' /> : <Clock className='h-3 w-3' />}
                  {sub.isActive ? 'Active' : 'Expired'}
                </span>
              </div>
              <p className='mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground'>
                {sub.allExamsAccess ? (
                  'All exams'
                ) : sub.examAccess ? (
                  <span className='inline-flex items-center gap-1'>
                    <ExamFlag emoji={sub.examAccess.flagEmoji} /> {sub.examAccess.name}
                  </span>
                ) : (
                  'Unscoped'
                )}
                {' · expires '}
                {sub.expiresAt.toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleRevoke(sub.id)}
              disabled={revokingId === sub.id}
              className='flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40'
              aria-label='Revoke'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        ))}
      </div>

      <GrantSubscriptionForm userId={userId} exams={exams} onGranted={refetchSubs} />
    </div>
  );
}

function GrantSubscriptionForm({
  userId,
  exams,
  onGranted,
}: {
  userId: string;
  exams: { id: string; name: string; flagEmoji: string | null }[] | undefined;
  onGranted: () => void;
}) {
  const [planType, setPlanType] = useState<PaymentPlanId | ''>('');
  const [examId, setExamId] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = planType ? paymentPlans[planType] : null;
  // Implied-exam plans (e.g. Ireland Pathway) fix their exam server-side -- no picker.
  const impliesOwnExam = plan?.effect.kind === 'access' && !!plan.effect.impliedExamCode;
  const needsExam = plan?.effect.kind === 'access' && !plan.effect.allExamsAccess && !impliesOwnExam;
  const canSubmit = !!planType && (!needsExam || !!examId);

  async function handleGrant() {
    if (!planType || !canSubmit) return;
    setIsGranting(true);
    setError(null);
    try {
      await grantUserSubscription({ userId, planType, examId: needsExam ? examId : null });
      setPlanType('');
      setExamId('');
      onGranted();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to grant access');
    } finally {
      setIsGranting(false);
    }
  }

  return (
    <div className='mt-6 rounded-2xl border border-dashed border-border p-4'>
      <p className='mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground'>
        <Plus className='h-4 w-4' /> Grant access pass
      </p>
      <div className='flex flex-col gap-3'>
        <Select value={planType} onValueChange={(v) => { setPlanType(v as PaymentPlanId); setExamId(''); }}>
          <SelectTrigger>
            <SelectValue placeholder='Choose a plan' />
          </SelectTrigger>
          <SelectContent>
            {Object.values(PaymentPlanId).map((id) => (
              <SelectItem key={id} value={id}>
                {prettyPaymentPlanName(id)} — {getPlanPrice(id)} ·{' '}
                {paymentPlans[id].effect.kind === 'access' ? paymentPlans[id].effect.durationDays : 0} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {needsExam && (
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger>
              <SelectValue placeholder='Which exam?' />
            </SelectTrigger>
            <SelectContent>
              {exams?.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  <span className='inline-flex items-center gap-1.5'>
                    <ExamFlag emoji={exam.flagEmoji} /> {exam.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {impliesOwnExam && (
          <p className='text-xs text-muted-foreground'>This plan is fixed to IDC Ireland — no exam choice needed.</p>
        )}

        {error && <p className='text-xs text-destructive'>{error}</p>}

        <Button size='sm' disabled={!canSubmit || isGranting} onClick={handleGrant} className='self-start'>
          {isGranting ? 'Granting…' : 'Grant access'}
        </Button>
      </div>
    </div>
  );
}
