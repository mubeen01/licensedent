import { type AuthUser } from 'wasp/auth';
import { getMyDashboardOverview, getMyDashboardScope, getMyOnboardingProfile, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import {
  Activity,
  Award,
  BookOpenCheck,
  CalendarClock,
  CheckCircle,
  Layers,
  ListChecks,
  Rocket,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { getDaysUntil, getTimeOfDayGreeting } from './greeting';
import StreakXpCard from './StreakXpCard';
import StudyPlanCard from './StudyPlanCard';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useBankStats } from '../client/hooks/useBankStats';

function DashboardHomePage({ user }: { user: AuthUser }) {
  const { data: overview, isLoading } = useQuery(getMyDashboardOverview);
  const { data: profile } = useQuery(getMyOnboardingProfile);
  const { data: dashboardScope } = useQuery(getMyDashboardScope);
  const isIreland = dashboardScope?.kind === 'ireland';
  const { stats: bankStats } = useBankStats();
  const firstName = profile?.fullName || user.username || user.email?.split('@')[0] || 'there';
  const greeting = getTimeOfDayGreeting();
  const daysUntilExam = getDaysUntil(profile?.targetExamDate);
  const hasSubscription = !!user.subscriptionStatus && user.subscriptionStatus !== 'deleted';

  return (
    <DashboardLayout user={user} pageTitle='Dashboard'>
      {/* Header */}
      <div
        className={cn(
          'border-b',
          isIreland
            ? 'border-transparent bg-gradient-to-br from-primary via-primary to-secondary'
            : 'border-border bg-background'
        )}
      >
        <div className='max-w-7xl mx-auto px-6 py-10 md:py-12'>
          <div className='flex flex-wrap items-center gap-2 mb-4'>
            <div
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                isIreland ? 'bg-white/15 text-primary-foreground backdrop-blur-sm' : 'bg-primary/10 text-primary'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full mr-2', isIreland ? 'bg-white' : 'bg-primary')} />
              {isIreland
                ? 'IDC Ireland Licensing Exam Prep'
                : profile?.exam
                ? `Preparing for ${profile.exam.flagEmoji ?? ''} ${
                    profile.exam.authorityLabel ?? profile.exam.name
                  } Licensing Exam`
                : 'Gulf Dental Licensing Exam Prep'}
            </div>
            {daysUntilExam !== null && (
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                  isIreland ? 'bg-white/10 text-primary-foreground/90 backdrop-blur-sm' : 'bg-muted text-muted-foreground'
                )}
              >
                <CalendarClock className='w-3.5 h-3.5' />
                {daysUntilExam === 0 ? 'Your exam is today' : `${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'} until your exam`}
              </div>
            )}
          </div>

          <h1
            className={cn(
              'text-2xl md:text-4xl font-semibold tracking-tight mb-2',
              isIreland ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {greeting}, {firstName}
          </h1>
          <p
            className={cn(
              'text-base leading-relaxed max-w-2xl mb-7',
              isIreland ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}
          >
            {overview && overview.totalAttempted > 0
              ? `You've answered ${overview.totalAttempted} questions at ${overview.accuracy}% accuracy. Keep going.`
              : 'Start practicing to see your accuracy and progress here.'}
          </p>

          <div className='flex flex-col sm:flex-row gap-3'>
            <WaspRouterLink to={routes.PracticeRoute.to}>
              <Button
                className={isIreland ? 'bg-white text-primary hover:bg-white/90 shadow-lg' : undefined}
              >
                <Rocket className='w-4 h-4 mr-2' />
                Start Practicing
              </Button>
            </WaspRouterLink>
            <WaspRouterLink to={routes.ProgressRoute.to}>
              <Button
                variant='outline'
                className={
                  isIreland ? 'bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground' : undefined
                }
              >
                <Target className='w-4 h-4 mr-2' />
                View Progress
              </Button>
            </WaspRouterLink>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-10 space-y-10'>
        {/* Streak/XP/badges + personalized study plan */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <StreakXpCard />
          <StudyPlanCard />
        </div>

        {/* Stat cards — real data only */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            icon={ListChecks}
            label='Total'
            value={isLoading ? '…' : overview?.totalAttempted ?? 0}
            sub='Questions attempted'
            isIreland={isIreland}
          />
          <StatCard
            icon={Activity}
            label='Week'
            value={isLoading ? '…' : overview?.thisWeekAttempted ?? 0}
            sub='Attempted this week'
            isIreland={isIreland}
          />
          <StatCard
            icon={Award}
            label='Accuracy'
            value={isLoading ? '…' : `${overview?.accuracy ?? 0}%`}
            sub='Overall accuracy'
            isIreland={isIreland}
          />
          <StatCard
            icon={Layers}
            label='Subjects'
            value={isLoading ? '…' : overview?.subjectsCovered ?? 0}
            sub='Subjects covered'
            isIreland={isIreland}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Recent activity */}
          <div className='lg:col-span-2'>
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-base font-semibold text-foreground flex items-center mb-5'>
                  <Activity className='w-4 h-4 mr-2.5 text-primary' />
                  Recent Activity
                </h3>

                {overview && overview.recentActivity.length > 0 ? (
                  <div className='space-y-2'>
                    {overview.recentActivity.map((a) => (
                      <div
                        key={a.id}
                        className='flex items-center gap-4 p-3 rounded-lg border border-border/70'
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            a.isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {a.isCorrect ? <CheckCircle className='w-4 h-4' /> : <XCircle className='w-4 h-4' />}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-sm text-foreground truncate'>{a.subjectName}</p>
                          <p className='text-xs text-muted-foreground'>
                            {a.isCorrect ? 'Correct' : 'Incorrect'} · {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-12'>
                    <div className='w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3'>
                      <Activity className='w-5 h-5 text-muted-foreground' />
                    </div>
                    <p className='text-foreground font-medium text-sm'>No activity yet</p>
                    <p className='text-muted-foreground text-sm mt-1'>Start a practice session to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trust card — real claims only, from the landing page's own stats */}
          <Card
            className={cn(
              'border-primary',
              isIreland ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-primary'
            )}
          >
            <CardContent className='p-6 text-primary-foreground'>
              <div className='flex items-center gap-3 mb-5'>
                <div className='p-2.5 bg-white/15 rounded-xl'>
                  <ShieldCheck className='w-5 h-5' />
                </div>
                <div>
                  <h3 className='font-semibold'>Human-Verified</h3>
                  <p className='text-primary-foreground/75 text-xs'>Never AI-guessed</p>
                </div>
              </div>
              <p className='text-primary-foreground/85 mb-5 text-sm leading-relaxed'>
                {bankStats && !isIreland
                  ? `Every answer key is checked by a dentist before it's published — ${bankStats.publishedQuestionCount.toLocaleString()} questions across ${bankStats.subjectCount} subjects and ${bankStats.examCount} Gulf licensing exams.`
                  : "Every answer key is checked by a dentist before it's published — never AI-guessed."}
              </p>
              {!hasSubscription && (
                <WaspRouterLink to={routes.PricingPageRoute.to}>
                  <Button
                    variant='outline'
                    className='w-full bg-white/10 border-white/25 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground'
                  >
                    <BookOpenCheck className='w-4 h-4 mr-2' />
                    Buy a plan
                  </Button>
                </WaspRouterLink>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  isIreland,
}: {
  icon: typeof ListChecks;
  label: string;
  value: string | number;
  sub: string;
  isIreland?: boolean;
}) {
  return (
    <Card className={isIreland ? 'transition-shadow hover:shadow-lg hover:shadow-primary/5' : undefined}>
      <CardContent className='p-5'>
        <div className='flex items-center justify-between mb-3'>
          <div className={cn('p-2 rounded-lg', isIreland ? 'bg-gradient-to-br from-primary/15 to-secondary/15' : 'bg-primary/10')}>
            <Icon className='h-4 w-4 text-primary' />
          </div>
          <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>{label}</div>
        </div>
        <div className='text-2xl font-semibold text-foreground mb-0.5'>{value}</div>
        <p className='text-sm text-muted-foreground'>{sub}</p>
      </CardContent>
    </Card>
  );
}

export default DashboardHomePage;
