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
      {/* Header — light surface for both themes; Ireland gets colorful accents, not a solid color fill */}
      <div
        className={cn(
          'relative overflow-hidden border-b border-border',
          isIreland ? 'bg-gradient-to-br from-primary/[0.07] via-background to-secondary/[0.07]' : 'bg-background'
        )}
      >
        {isIreland && (
          <>
            <div className='pointer-events-none absolute -top-32 -right-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl' />
            <div className='pointer-events-none absolute -bottom-28 left-1/5 h-64 w-64 rounded-full bg-secondary/20 blur-3xl' />
          </>
        )}
        <div className='relative max-w-7xl mx-auto px-6 py-7 md:py-9'>
          <div className='flex flex-wrap items-center gap-2 mb-3'>
            <div
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                isIreland ? 'bg-gradient-to-r from-primary/15 to-secondary/15 text-primary' : 'bg-primary/10 text-primary'
              )}
            >
              <span className='w-1.5 h-1.5 rounded-full mr-2 bg-primary' />
              {isIreland
                ? 'IDC Ireland Licensing Exam Prep'
                : profile?.exam
                ? `Preparing for ${profile.exam.flagEmoji ?? ''} ${
                    profile.exam.authorityLabel ?? profile.exam.name
                  } Licensing Exam`
                : 'Gulf Dental Licensing Exam Prep'}
            </div>
            {daysUntilExam !== null && (
              <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground'>
                <CalendarClock className='w-3.5 h-3.5' />
                {daysUntilExam === 0 ? 'Your exam is today' : `${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'} until your exam`}
              </div>
            )}
          </div>

          <h1
            className={cn(
              'inline-block text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] pb-1 mb-1',
              isIreland
                ? 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'
                : 'text-foreground'
            )}
          >
            {greeting}, {firstName}
          </h1>
          <p className='text-base md:text-lg leading-relaxed max-w-2xl mb-5 text-muted-foreground'>
            {overview && overview.totalAttempted > 0
              ? `You've answered ${overview.totalAttempted} questions at ${overview.accuracy}% accuracy. Keep going.`
              : 'Start practicing to see your accuracy and progress here.'}
          </p>

          <div className='flex flex-col sm:flex-row gap-3'>
            <WaspRouterLink to={routes.PracticeRoute.to}>
              <Button
                className={
                  isIreland
                    ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all'
                    : undefined
                }
              >
                <Rocket className='w-4 h-4 mr-2' />
                Start Practicing
              </Button>
            </WaspRouterLink>
            <WaspRouterLink to={routes.ProgressRoute.to}>
              <Button variant='outline'>
                <Target className='w-4 h-4 mr-2' />
                View Progress
              </Button>
            </WaspRouterLink>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
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
            accent='primary'
          />
          <StatCard
            icon={Activity}
            label='Week'
            value={isLoading ? '…' : overview?.thisWeekAttempted ?? 0}
            sub='Attempted this week'
            isIreland={isIreland}
            accent='secondary'
          />
          <StatCard
            icon={Award}
            label='Accuracy'
            value={isLoading ? '…' : `${overview?.accuracy ?? 0}%`}
            sub='Overall accuracy'
            isIreland={isIreland}
            accent='success'
          />
          <StatCard
            icon={Layers}
            label='Subjects'
            value={isLoading ? '…' : overview?.subjectsCovered ?? 0}
            sub='Subjects covered'
            isIreland={isIreland}
            accent='gold'
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
                        className='flex items-center gap-4 p-3 rounded-xl border border-border/70 hover:bg-accent/40 hover:border-border transition-colors'
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
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
              'relative overflow-hidden',
              isIreland ? 'border-primary/20 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.06]' : 'border-primary/20 bg-primary/5'
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-2xl',
                isIreland ? 'bg-secondary/15' : 'bg-primary/15'
              )}
            />
            <CardContent className='relative p-6'>
              <div className='flex items-center gap-3 mb-5'>
                <div
                  className={cn(
                    'p-2.5 rounded-xl',
                    isIreland ? 'bg-gradient-to-br from-primary/15 to-secondary/15 text-primary' : 'bg-primary/10 text-primary'
                  )}
                >
                  <ShieldCheck className='w-5 h-5' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>Human-Verified</h3>
                  <p className='text-muted-foreground text-xs'>Never AI-guessed</p>
                </div>
              </div>
              <p className='text-foreground/80 mb-5 text-sm leading-relaxed'>
                {bankStats && !isIreland
                  ? `Every answer key is checked by a dentist before it's published — ${bankStats.publishedQuestionCount.toLocaleString()} questions across ${bankStats.subjectCount} subjects and ${bankStats.examCount} Gulf licensing exams.`
                  : "Every answer key is checked by a dentist before it's published — never AI-guessed."}
              </p>
              {!hasSubscription && (
                <WaspRouterLink to={routes.PricingPageRoute.to}>
                  <Button
                    className={cn(
                      'w-full',
                      isIreland && 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90'
                    )}
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

const STAT_ACCENT_CLASSES = {
  primary: 'bg-primary/15 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  success: 'bg-success/15 text-success',
  gold: 'bg-gold/15 text-gold',
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  isIreland,
  accent = 'primary',
}: {
  icon: typeof ListChecks;
  label: string;
  value: string | number;
  sub: string;
  isIreland?: boolean;
  accent?: keyof typeof STAT_ACCENT_CLASSES;
}) {
  return (
    <Card
      className={cn(
        'rounded-2xl transition-all duration-200 hover:-translate-y-0.5',
        isIreland ? 'hover:shadow-lg hover:shadow-primary/10' : 'hover:shadow-md'
      )}
    >
      <CardContent className='p-5'>
        <div className='flex items-center justify-between mb-4'>
          <div className={cn('p-2.5 rounded-xl', STAT_ACCENT_CLASSES[accent])}>
            <Icon className='h-4 w-4' />
          </div>
          <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>{label}</div>
        </div>
        <div className='text-3xl font-bold text-foreground mb-0.5 tracking-tight'>{value}</div>
        <p className='text-sm text-muted-foreground'>{sub}</p>
      </CardContent>
    </Card>
  );
}

export default DashboardHomePage;
