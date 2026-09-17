import {
  BarChart3,
  Bookmark,
  ChevronDown,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  RotateCcw,
  Settings,
  Timer,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { useLocation } from 'react-router';
import { useAuth, logout } from 'wasp/client/auth';
import { getDueReviewCount, getMyDashboardScope, getMySubscription, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { parsePaymentPlanId, prettyPaymentPlanName } from '../payment/plans';

interface DashboardSidebarProps {
  onClose?: () => void;
}

export default function DashboardSidebar({ onClose }: DashboardSidebarProps) {
  const location = useLocation();
  const { data: user } = useAuth();
  const { data: subscription } = useQuery(getMySubscription);
  const { data: dueReviewCount } = useQuery(getDueReviewCount);
  const { data: dashboardScope } = useQuery(getMyDashboardScope);
  const isIreland = dashboardScope?.kind === 'ireland';

  const allNavItems = [
    { to: routes.DashboardHomeRoute.to, label: 'Dashboard', icon: LayoutDashboard },
    { to: routes.PracticeRoute.to, label: 'Practice', icon: ListChecks },
    {
      to: routes.SmartReviewRoute.to,
      label: 'Smart Review',
      icon: RotateCcw,
      badge: dueReviewCount ? String(dueReviewCount) : undefined,
    },
    { to: routes.ReviewRoute.to, label: 'Review', icon: Bookmark },
    // Quiz Builder/Video Lectures are Extended-plan perks that can never work for
    // Ireland Pathway (Extended explicitly excludes Ireland -- PRD-002 §3 Goal 3),
    // so showing them with an "Extended" upsell badge would be actively
    // misleading for an Ireland subscriber, not just inapplicable. Hidden
    // entirely for Ireland scope rather than shown-then-blocked.
    { to: routes.QuizBuilderRoute.to, label: 'Quiz Builder', icon: Wand2, badge: 'Extended', hideForIreland: true },
    { to: routes.MockExamsRoute.to, label: 'Mock Exams', icon: Timer },
    {
      to: routes.VideoLecturesRoute.to,
      label: 'Video Lectures',
      icon: Video,
      badge: 'Extended',
      hideForIreland: true,
    },
    { to: routes.ProgressRoute.to, label: 'Progress', icon: BarChart3 },
    { to: routes.AccountRoute.to, label: 'Account', icon: Settings },
    { to: routes.BillingRoute.to, label: 'Billing', icon: CreditCard },
  ];
  const navItems = allNavItems.filter((item) => !isIreland || !('hideForIreland' in item && item.hideForIreland));

  const isActive = (to: string) => location.pathname === to;

  const daysRemaining = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.createdAt).getTime() +
            subscription.durationDays * 86400000 -
            Date.now()) /
            86400000
        )
      )
    : 0;
  const percentRemaining = subscription
    ? Math.max(4, Math.round((daysRemaining / subscription.durationDays) * 100))
    : 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className='h-full flex flex-col bg-card border-r border-border overflow-hidden'>
      {/* Brand header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-border shrink-0'>
        <WaspRouterLink to='/' className='flex items-center space-x-2.5'>
          <div className='w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-xs'>
            <img src='/licensedent-icon.svg' alt='LicenseDent' className='h-full w-full object-cover' />
          </div>
          <div>
            <h1 className='text-sm font-semibold text-foreground leading-tight'>LicenseDent</h1>
            <p className='text-xs text-muted-foreground leading-tight'>
              {isIreland ? 'IDC Ireland Prep' : 'Gulf + Ireland Prep'}
            </p>
          </div>
        </WaspRouterLink>

        {onClose && (
          <button onClick={onClose} className='lg:hidden p-1.5 hover:bg-accent rounded-lg transition-colors'>
            <X className='w-4 h-4 text-muted-foreground' />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-3 py-4 overflow-y-auto'>
        <div className='space-y-0.5'>
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <WaspRouterLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {active && (
                  <span className='absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary' />
                )}
                <item.icon className='mr-3 h-4 w-4 shrink-0' />
                <span className='flex-1 text-left truncate'>{item.label}</span>
                {'badge' in item && item.badge && !active && (
                  <span className='ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                    {item.badge}
                  </span>
                )}
              </WaspRouterLink>
            );
          })}
        </div>
      </nav>

      {/* Exam access widget (real data, not fabricated) */}
      <div className='p-3 border-t border-border shrink-0'>
        <div className='rounded-lg border border-border bg-muted/40 p-3'>
          <div className='flex items-center justify-between mb-2'>
            <span className='font-medium text-xs text-foreground'>Exam Access</span>
            {subscription && <span className='text-sm font-semibold text-primary'>{daysRemaining}d</span>}
          </div>

          {subscription ? (
            <>
              <div className='w-full bg-muted rounded-full h-1.5 mb-2 overflow-hidden'>
                <div
                  className='bg-primary h-1.5 rounded-full transition-all duration-700'
                  style={{ width: `${percentRemaining}%` }}
                />
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground'>
                  {prettyPaymentPlanName(parsePaymentPlanId(subscription.planType))}
                  {subscription.allExamsAccess
                    ? ' · all exams'
                    : subscription.examAccess
                    ? ` · ${subscription.examAccess.flagEmoji ?? ''} ${subscription.examAccess.code ?? subscription.examAccess.name}`.trim()
                    : ''}
                </span>
              </div>
            </>
          ) : (
            <WaspRouterLink
              to={routes.PricingPageRoute.to}
              className='text-xs font-medium text-primary hover:underline'
            >
              No active plan — buy one →
            </WaspRouterLink>
          )}
        </div>
      </div>

      {/* User profile + quick actions */}
      {user?.email && (
        <div className='p-3 border-t border-border shrink-0'>
          <div className='flex items-center space-x-2 p-2 rounded-lg'>
            <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-medium text-xs shrink-0'>
              {user.email[0].toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-xs text-foreground truncate'>{user.username || user.email.split('@')[0]}</p>
              <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
            </div>
            <ChevronDown className='w-3 h-3 text-muted-foreground shrink-0' />
          </div>

          <div className='mt-2 pt-2 border-t border-border'>
            <div className='grid grid-cols-2 gap-1'>
              <WaspRouterLink to={routes.AccountRoute.to}>
                <Button variant='ghost' size='sm' className='w-full justify-start text-xs h-7 font-medium'>
                  <Settings className='w-3 h-3 mr-1 shrink-0' />
                  <span className='truncate'>Settings</span>
                </Button>
              </WaspRouterLink>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleLogout}
                className='justify-start text-xs h-7 font-medium hover:text-destructive'
              >
                <LogOut className='w-3 h-3 mr-1 shrink-0' />
                <span className='truncate'>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
