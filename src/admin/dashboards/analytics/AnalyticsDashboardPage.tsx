import { CheckCircle2, Clock, CreditCard, MessageCircleMore, Target, Users as UsersIcon } from 'lucide-react';
import { type AuthUser } from 'wasp/auth';
import { getAdminOverviewStats, getQuestionBankStats, useQuery } from 'wasp/client/operations';
import DefaultLayout from '../../layout/DefaultLayout';
import ReviewerActivityTile from '../questions/ReviewerActivityTile';
import GrowthChart from '../overview/GrowthChart';
import QuestionStatusDonut from '../overview/QuestionStatusDonut';
import QuickActions from '../overview/QuickActions';
import RecentActivityFeed from '../overview/RecentActivityFeed';
import ReviewVelocityChart from '../overview/ReviewVelocityChart';
import StatTile from '../overview/StatTile';
import SubjectCoverageChart from '../overview/SubjectCoverageChart';
import SystemStatusBanner from '../overview/SystemStatusBanner';

// Rebuilt 2026-08-16: the previous version of this page was mostly the Open
// SaaS template's Stripe-daily-stats widgets, which render as a permanent
// "no daily stats yet" overlay in this app's current state (placeholder
// Stripe key -- see SystemStatusBanner). Every widget below reads live off
// tables that are always populated (User/Question/Subscription/
// ContactFormMessage/MockExamAttempt), so this page never goes blank.
const Dashboard = ({ user }: { user: AuthUser }) => {
  const { data: overview } = useQuery(getAdminOverviewStats);
  const { data: bankStats } = useQuery(getQuestionBankStats);

  const studentsDelta =
    overview && overview.users.newPrev7Days > 0
      ? ((overview.users.newLast7Days - overview.users.newPrev7Days) / overview.users.newPrev7Days) * 100
      : null;

  return (
    <DefaultLayout user={user}>
      {overview && <SystemStatusBanner stripeConfigured={overview.system.stripeConfigured} />}

      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <div>
          <h1 className='text-title-sm font-black text-foreground'>
            Welcome back{user.username ? `, ${user.username}` : ''}
          </h1>
          <p className='text-sm text-muted-foreground mt-0.5'>Here's what's happening across LicenseDent.</p>
        </div>
        <ReviewerActivityTile />
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6'>
        <StatTile
          icon={UsersIcon}
          label='Total students'
          value={overview?.users.total}
          sub={`${overview?.users.newLast7Days ?? 0} new in the last 7 days`}
          accent='primary'
          deltaPercent={studentsDelta}
          href='/admin/users'
        />
        <StatTile
          icon={CheckCircle2}
          label='Published'
          value={bankStats?.totalPublished}
          sub={bankStats ? `+${bankStats.publishedLast7Days} in last 7 days` : undefined}
          accent='success'
          href='/admin/questions'
        />
        <StatTile
          icon={Clock}
          label='Awaiting review'
          value={bankStats ? bankStats.totalPending + bankStats.totalFlagged : undefined}
          sub={bankStats ? `${bankStats.totalFlagged} flagged for attention` : undefined}
          accent='gold'
          href='/admin/questions'
        />
        <StatTile
          icon={CreditCard}
          label='Active plans'
          value={overview?.subscriptions.active}
          sub={overview ? `$${overview.subscriptions.revenueToDate.toLocaleString()} in purchases to date` : undefined}
          accent='secondary'
          href='/admin/users'
        />
        <StatTile
          icon={MessageCircleMore}
          label='Unread messages'
          value={overview?.messages.unread}
          sub='From the Account page contact form'
          accent={overview && overview.messages.unread > 0 ? 'destructive' : 'primary'}
          href='/admin/messages'
        />
        <StatTile
          icon={Target}
          label='Mock exam avg. score'
          value={overview?.mockExams.avgScorePercent != null ? `${overview.mockExams.avgScorePercent}%` : '—'}
          sub={overview ? `${overview.mockExams.submittedTotal} exams submitted` : undefined}
          accent='primary'
        />
      </div>

      <div className='mb-6'>
        <QuickActions />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        <div className='xl:col-span-2 flex flex-col gap-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <GrowthChart />
            <ReviewVelocityChart />
          </div>
          <SubjectCoverageChart />
        </div>

        <div className='flex flex-col gap-6'>
          <QuestionStatusDonut />
          <RecentActivityFeed />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Dashboard;
