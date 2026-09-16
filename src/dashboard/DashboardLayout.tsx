import { type ReactNode, useState } from 'react';
import { Menu, ListChecks, BarChart3, LayoutDashboard } from 'lucide-react';
import { type AuthUser } from 'wasp/auth';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import DarkModeSwitcher from '../client/components/DarkModeSwitcher';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  user: AuthUser;
  pageTitle: string;
  children: ReactNode;
}

const pageGreetings: Record<string, string> = {
  Dashboard: 'Your exam-prep at a glance',
  Practice: 'Pick a subject and get quizzing',
  Progress: 'Your accuracy by subject',
  Account: 'Your account details',
  Billing: 'Your plan and purchase history',
  'Video Lectures': 'Recorded subject-wise lectures, available as they launch',
  'Mock Exams': 'Timed, full-length practice exams',
  'Mock Exam Results': 'Your score, correct answers and explanations',
  Review: 'Questions you marked important or added notes to',
  'Smart Review': "Today's spaced-repetition queue",
  'Quiz Builder': 'Build your own quiz from any mix of subjects and filters',
  'Quiz Results': 'Your score, correct answers and explanations',
};

// Student-facing shell (Dashboard/Practice/Progress/Account/Billing) — NOT admin-gated,
// unlike admin/layout/DefaultLayout.
export default function DashboardLayout({ user, pageTitle, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const firstName = user.username || user.email?.split('@')[0] || 'there';

  return (
    <div className='h-screen bg-muted/30 flex overflow-hidden'>
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <DashboardSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='bg-background/80 backdrop-blur-xl border-b border-border flex-shrink-0'>
          <div className='px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => setSidebarOpen(true)}
                className='lg:hidden p-2 hover:bg-accent rounded-lg transition-colors'
              >
                <Menu className='w-5 h-5 text-foreground' />
              </button>
              <div>
                <h1 className='text-lg lg:text-xl font-semibold tracking-tight text-foreground'>{pageTitle}</h1>
                <p className='text-sm text-muted-foreground mt-0.5'>
                  {pageGreetings[pageTitle] ?? `Welcome, ${firstName}`}
                </p>
              </div>
            </div>
            <DarkModeSwitcher />
          </div>
        </header>

        <main className='flex-1 overflow-auto'>{children}</main>

        {/* Mobile bottom nav */}
        <div className='lg:hidden bg-background/90 backdrop-blur-xl border-t border-border px-4 py-2 flex-shrink-0'>
          <div className='flex items-center justify-around'>
            <WaspRouterLink to={routes.DashboardHomeRoute.to} className='flex flex-col items-center gap-1 p-2 text-muted-foreground'>
              <LayoutDashboard className='w-5 h-5' />
              <span className='text-xs font-medium'>Home</span>
            </WaspRouterLink>
            <WaspRouterLink to={routes.PracticeRoute.to} className='flex flex-col items-center gap-1 p-2 text-muted-foreground'>
              <ListChecks className='w-5 h-5' />
              <span className='text-xs font-medium'>Practice</span>
            </WaspRouterLink>
            <WaspRouterLink to={routes.ProgressRoute.to} className='flex flex-col items-center gap-1 p-2 text-muted-foreground'>
              <BarChart3 className='w-5 h-5' />
              <span className='text-xs font-medium'>Progress</span>
            </WaspRouterLink>
          </div>
        </div>
      </div>
    </div>
  );
}
