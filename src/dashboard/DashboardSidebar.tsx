import {
  BarChart3,
  Bookmark,
  BookOpen,
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
    // Structured Lessons (PRD-002 Phase I5) only has real content for Ireland
    // Pathway today -- shown only in Ireland scope rather than exposing an
    // empty page to Gulf/Extended users. The schema itself is exam-agnostic,
    // so this is a content-availability call, not a hard architectural limit.
    { to: routes.LessonsRoute.to, label: 'Lessons', icon: BookOpen, showOnlyForIreland: true },
    // PRD-002 Phase I8.2: Quiz Builder is also an IDC Pathway perk now
    // (server-scoped to Ireland content only), so it's shown for Ireland
    // scope too -- the "Extended" badge would be actively misleading there
    // (an Ireland subscriber already has access), so it's suppressed instead.
    {
      to: routes.QuizBuilderRoute.to,
      label: 'Quiz Builder',
      icon: Wand2,
      badge: isIreland ? undefined : 'Extended',
    },
    { to: routes.MockExamsRoute.to, label: 'Mock Exams', icon: Timer },
    // Video Lectures stays Extended-only and hidden for Ireland scope --
    // zero real video content exists for any exam yet (PRD-002 §2), so
    // showing it (even unlocked) would be an empty page, not just inapplicable.
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
  const navItems = allNavItems.filter((item) => {
    if ('hideForIreland' in item && item.hideForIreland && isIreland) return false;
    if ('showOnlyForIreland' in item && item.showOnlyForIreland && !isIreland) return false;
    return true;
  });

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
      <div
        className={cn(
          'flex items-center justify-between px-5 py-4 border-b border-border shrink-0',
          isIreland && 'bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent'
        )}
      >
        <WaspRouterLink to='/' className='flex items-center space-x-2.5'>
          <div
            className={cn(
              'w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-xs',
              isIreland && 'ring-2 ring-primary/25 ring-offset-1 ring-offset-background'
            )}
          >
            <img src='/logo/licensedent-icon.svg' alt='LicenseDent' className='h-full w-full object-cover' />
          </div>
          <div>
            <h1 className='text-sm font-semibold text-foreground leading-tight'>LicenseDent</h1>
            {isIreland ? (
              <span className='inline-flex items-center gap-1 mt-0.5 rounded-full bg-gradient-to-r from-primary to-secondary px-1.5 py-px text-[10px] font-semibold text-primary-foreground leading-tight'>
                IDC Ireland
              </span>
            ) : (
              <p className='text-xs text-muted-foreground leading-tight'>Gulf + Ireland Prep</p>
            )}
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
                  'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all group relative',
                  active
                    ? isIreland
                      ? 'bg-gradient-to-r from-primary/15 to-secondary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
                      : 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:translate-x-0.5'
                )}
              >
                {active && !isIreland && (
                  <span className='absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary' />
                )}
                <span
                  className={cn(
                    'mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active && isIreland && 'bg-gradient-to-br from-primary/20 to-secondary/20'
                  )}
                >
                  <item.icon className='h-4 w-4 shrink-0' />
                </span>
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
        <div
          className={cn(
            'relative overflow-hidden rounded-xl p-3 border',
            isIreland
              ? 'border-primary/15 bg-gradient-to-br from-primary/[0.07] to-secondary/[0.07]'
              : 'border-border bg-muted/40'
          )}
        >
          {isIreland && (
            <div className='pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-secondary/15 blur-2xl' />
          )}
          <div className='flex items-center justify-between mb-2'>
            <span className='font-medium text-xs text-foreground'>Exam Access</span>
            {subscription && <span className='text-sm font-semibold text-primary'>{daysRemaining}d</span>}
          </div>

          {subscription ? (
            <>
              <div className='w-full rounded-full h-1.5 mb-2 overflow-hidden bg-muted'>
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-700',
                    isIreland ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-primary'
                  )}
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
            <WaspRouterLink to={routes.PricingPageRoute.to} className='text-xs font-medium text-primary hover:underline'>
              No active plan — buy one →
            </WaspRouterLink>
          )}
        </div>
      </div>

      {/* User profile + quick actions */}
      {user?.email && (
        <div className='p-3 border-t border-border shrink-0'>
          <div className='flex items-center space-x-2 p-2 rounded-lg'>
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-medium text-xs shrink-0',
                isIreland ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-primary'
              )}
            >
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
