import {
  ClipboardCheck,
  GraduationCap,
  History,
  LayoutDashboard,
  MessageCircleMore,
  Upload,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { routes } from 'wasp/client/router';
import { cn } from '../../lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

type NavItem = { to: string; end: boolean; label: string; icon: typeof LayoutDashboard };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: routes.AdminRoute.to, end: true, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Content',
    items: [
      { to: routes.AdminQuestionsRoute.to, end: true, label: 'Question Review', icon: ClipboardCheck },
      { to: routes.AdminImportQuestionsRoute.to, end: true, label: 'Import Questions', icon: Upload },
      { to: routes.AdminExamsRoute.to, end: true, label: 'Exams', icon: GraduationCap },
    ],
  },
  {
    label: 'People',
    items: [
      { to: routes.AdminUsersRoute.to, end: true, label: 'Users', icon: UsersIcon },
      { to: routes.AdminMessagesRoute.to, end: true, label: 'Messages', icon: MessageCircleMore },
    ],
  },
  {
    label: 'System',
    items: [{ to: routes.AdminAuditLogRoute.to, end: true, label: 'Audit Log', icon: History }],
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { pathname } = location;

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  return (
    <aside
      ref={sidebar}
      className={cn(
        'absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-card border-r border-border shadow-2xl duration-300 ease-linear lg:static lg:translate-x-0',
        {
          'translate-x-0': sidebarOpen,
          '-translate-x-full': !sidebarOpen,
        }
      )}
    >
      {/* Brand header */}
      <div className='flex items-center justify-between gap-2 px-6 py-6 relative overflow-hidden flex-shrink-0 border-b border-border'>
        <NavLink to={routes.LandingPageRoute.to} className='flex items-center gap-3 relative z-10'>
          <div className='flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-2xl shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]'>
            <img src='/licensedent-icon.svg' alt='LicenseDent' className='h-full w-full object-cover' />
          </div>
          <div>
            <h1 className='text-sm font-black leading-tight text-foreground'>LicenseDent</h1>
            <p className='text-xs font-medium text-muted-foreground'>Admin Panel</p>
          </div>
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls='sidebar'
          aria-expanded={sidebarOpen}
          className='block lg:hidden relative z-10'
        >
          <X className='text-muted-foreground' />
        </button>
      </div>

      <div className='no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear'>
        <nav className='mt-2 py-4 px-4 lg:px-4'>
          {navGroups.map((group) => (
            <div key={group.label}>
              <h3 className='mb-3 ml-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70'>
                {group.label}
              </h3>
              <ul className='mb-7 flex flex-col gap-1'>
                {group.items.map((item) => {
                  const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-xl py-2.5 px-3.5 font-semibold text-sm transition-all duration-200',
                          active
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.5)]'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn('h-4 w-4 transition-transform duration-200', active && '-rotate-3')} />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
