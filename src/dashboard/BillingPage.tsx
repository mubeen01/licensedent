import { type AuthUser } from 'wasp/auth';
import { getMySubscriptionHistory, useQuery } from 'wasp/client/operations';
import { CreditCard, Receipt } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { ExamAccessSummary } from './ExamAccessSummary';
import { Separator } from '../components/ui/separator';
import { parsePaymentPlanId, prettyPaymentPlanName } from '../payment/plans';

function BillingPage({ user }: { user: AuthUser }) {
  const { data: history, isLoading } = useQuery(getMySubscriptionHistory);

  return (
    <DashboardLayout user={user} pageTitle='Billing'>
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        <div className='card-elevated overflow-hidden'>
          <div className='px-6 py-5 flex items-center gap-3 border-b border-border/70'>
            <div className='p-2 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-lg'>
              <CreditCard className='w-5 h-5 text-primary' />
            </div>
            <h3 className='font-semibold text-foreground'>Current plan</h3>
          </div>
          <div className='py-5 px-6'>
            <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
              <dt className='text-sm font-medium text-muted-foreground'>Exam access</dt>
              <ExamAccessSummary />
            </div>
          </div>
        </div>

        <div className='card-elevated p-6'>
          <h3 className='font-semibold text-foreground flex items-center gap-2.5 mb-5'>
            <Receipt className='w-4 h-4 text-primary' />
            Purchase history
          </h3>

          {isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}
          {!isLoading && (!history || history.length === 0) && (
            <p className='text-sm text-muted-foreground'>No purchases yet.</p>
          )}
          {!isLoading &&
            history &&
            history.map((sub, i) => (
              <div key={sub.id}>
                {i > 0 && <Separator className='my-3' />}
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      {prettyPaymentPlanName(parsePaymentPlanId(sub.planType))}
                      {sub.allExamsAccess ? ' · all exams' : ''}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Purchased {new Date(sub.createdAt).toLocaleDateString()} · {sub.durationDays} days access
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default BillingPage;
