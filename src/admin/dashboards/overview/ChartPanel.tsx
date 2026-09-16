import { type ReactNode } from 'react';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

export default function ChartPanel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-2xl border-border/80 shadow-sm p-5 md:p-6', className)}>
      <div className='flex flex-wrap items-start justify-between gap-3 mb-5'>
        <div>
          <h3 className='text-sm font-bold text-foreground'>{title}</h3>
          {subtitle && <p className='text-xs text-muted-foreground mt-0.5'>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
