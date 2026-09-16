import { ClipboardCheck, GraduationCap, History, type LucideIcon, MessageCircleMore, Tags, Upload, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminOverviewStats, getSubjectsForReview, useQuery } from 'wasp/client/operations';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

type Action = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  accent: 'primary' | 'secondary' | 'gold' | 'success' | 'destructive';
  count?: number;
};

export default function QuickActions() {
  const { data: subjects } = useQuery(getSubjectsForReview);
  const { data: overview } = useQuery(getAdminOverviewStats);

  const unsorted = subjects?.find((s) => s.name.toLowerCase() === 'unsorted');

  const actions: Action[] = [
    { key: 'import', label: 'Import questions', href: '/admin/questions/import', icon: Upload, accent: 'primary' },
    {
      key: 'unsorted',
      label: 'Review Unsorted',
      href: '/admin/questions?subject=Unsorted',
      icon: Tags,
      accent: 'gold',
      count: unsorted?.remainingCount,
    },
    { key: 'review', label: 'Question queue', href: '/admin/questions', icon: ClipboardCheck, accent: 'secondary' },
    { key: 'exams', label: 'Manage exams', href: '/admin/exams', icon: GraduationCap, accent: 'success' },
    {
      key: 'messages',
      label: 'Messages',
      href: '/admin/messages',
      icon: MessageCircleMore,
      accent: 'destructive',
      count: overview?.messages.unread,
    },
    { key: 'users', label: 'Manage users', href: '/admin/users', icon: Users, accent: 'primary' },
    { key: 'audit', label: 'Audit log', href: '/admin/audit-log', icon: History, accent: 'secondary' },
  ];

  const ACCENT: Record<Action['accent'], { text: string; bg: string }> = {
    primary: { text: 'text-primary', bg: 'bg-primary/10' },
    secondary: { text: 'text-secondary', bg: 'bg-secondary/10' },
    gold: { text: 'text-gold', bg: 'bg-gold/10' },
    success: { text: 'text-success', bg: 'bg-success/10' },
    destructive: { text: 'text-destructive', bg: 'bg-destructive/10' },
  };

  return (
    <Card className='rounded-2xl border-border/80 shadow-sm p-5 md:p-6'>
      <h3 className='text-sm font-bold text-foreground mb-4'>Quick actions</h3>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
        {actions.map((action) => {
          const { text, bg } = ACCENT[action.accent];
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              to={action.href}
              className='group relative flex flex-col items-start gap-2.5 rounded-2xl border border-border/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-transparent'
            >
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bg, text)}>
                <Icon className='size-5' />
              </span>
              <span className='text-sm font-semibold text-foreground'>{action.label}</span>
              {typeof action.count === 'number' && action.count > 0 && (
                <span
                  className={cn(
                    'absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                    bg,
                    text
                  )}
                >
                  {action.count.toLocaleString()}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
