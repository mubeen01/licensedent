import { BookOpenCheck, ClipboardCheck, Globe2, ShieldCheck } from 'lucide-react';
import Reveal from './Reveal';

export interface Stat {
  value: string;
  label: string;
  description: string;
}

const icons = [BookOpenCheck, ShieldCheck, Globe2, ClipboardCheck];

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className='mx-auto max-w-7xl px-6 py-14 lg:px-8'>
      <div className='grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4'>
        {stats.map((stat, i) => {
          const Icon = icons[i % icons.length];
          return (
            <Reveal key={stat.label} delay={i * 90} className='px-6 py-8 first:pt-0 sm:py-0 sm:first:pl-0 sm:last:pr-0'>
              <Icon className='h-5 w-5 text-primary' strokeWidth={1.75} />
              <div className='mt-4 text-3xl font-semibold tracking-tight text-foreground'>{stat.value}</div>
              <div className='mt-1 text-sm font-medium text-foreground'>{stat.label}</div>
              <div className='mt-1 text-sm text-muted-foreground'>{stat.description}</div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
