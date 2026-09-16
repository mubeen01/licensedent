import React from 'react';
import { cn } from '../../lib/utils';
import SectionTitle from './SectionTitle';

export interface GridFeature {
  name: string;
  description: string;
  href?: string;
  icon?: React.ReactNode;
  emoji?: string;
  direction?: 'col' | 'row' | 'col-reverse' | 'row-reverse';
  align?: 'center' | 'left';
  size: 'small' | 'medium' | 'large';
  fullWidthIcon?: boolean;
  gradient?: string;
}

interface FeaturesGridProps {
  features: GridFeature[];
  className?: string;
}

const sizeToSpan: Record<GridFeature['size'], string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-2 row-span-2',
};

const FeaturesGrid = ({ features, className = '' }: FeaturesGridProps) => {
  return (
    <div className='mx-auto my-16 max-w-7xl md:my-24 lg:my-32' id='features'>
      <div className='mb-4 flex justify-center'>
        <span className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary'>
          What you get
        </span>
      </div>

      <SectionTitle
        title='Everything you need to pass'
        description='Built specifically for dentists preparing for Prometric-style licensing exams.'
      />

      <div
        className={cn(
          'mx-4 mt-6 grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-4 md:mx-6 md:grid-cols-4 lg:mx-8 lg:grid-cols-6',
          className
        )}
      >
        {features.map((feature) => (
          <FeaturesGridItem key={feature.name + feature.description} {...feature} />
        ))}
      </div>
    </div>
  );
};

function FeaturesGridItem({
  name,
  description,
  icon,
  emoji,
  href,
  size = 'medium',
  gradient = 'from-primary to-secondary',
}: GridFeature) {
  const isLarge = size === 'large';

  const card = (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl',
        isLarge ? 'p-7' : 'p-5'
      )}
    >
      {/* Hover gradient wash */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]',
          gradient
        )}
        aria-hidden='true'
      />

      {/* Featured tile gets a soft corner glow */}
      {isLarge && (
        <div
          className={cn(
            'pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-linear-to-br opacity-[0.18] blur-2xl',
            gradient
          )}
          aria-hidden='true'
        />
      )}

      <div className='relative z-10 flex h-full flex-col'>
        <div
          className={cn(
            'flex flex-none items-center justify-center rounded-xl bg-linear-to-br shadow-xs transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110',
            gradient,
            isLarge ? 'h-14 w-14' : 'h-11 w-11'
          )}
        >
          {icon ? icon : emoji ? <span className={isLarge ? 'text-3xl' : 'text-2xl'}>{emoji}</span> : null}
        </div>

        <h3 className={cn('mt-4 font-bold text-foreground', isLarge ? 'text-xl' : 'text-base')}>{name}</h3>
        <p className={cn('mt-2 leading-relaxed text-muted-foreground', isLarge ? 'text-sm' : 'text-xs')}>
          {description}
        </p>

        {isLarge && (
          <div className='mt-auto pt-5'>
            <span className='inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary'>
              ★ Highest-yield
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={sizeToSpan[size]}>
        {card}
      </a>
    );
  }

  return <div className={sizeToSpan[size]}>{card}</div>;
}

export default FeaturesGrid;