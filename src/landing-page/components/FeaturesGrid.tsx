import {
  Bookmark,
  BookOpen,
  Brain,
  Flame,
  Globe,
  Layers,
  LineChart,
  Puzzle,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

/** Maps each feature's exact `name` to a lucide icon — falls back to `emoji`/`icon` if a name isn't listed. */
const featureIcons: Partial<Record<string, LucideIcon>> = {
  'High-yield recall bank': Target,
  'Custom Quiz Builder': Puzzle,
  'Smart Review': RefreshCw,
  'Streaks, XP & study plan': Flame,
  'Verified explanations': ShieldCheck,
  'Rule-out reasoning': Brain,
  'Image-based MCQs': ScanLine,
  'Timed mock tests': Timer,
  'Subject-wise practice': BookOpen,
  Flashcards: Layers,
  'Progress analytics': LineChart,
  'Mark for review': Bookmark,
  'Multi-exam access': Globe,
  'Study on any device': Smartphone,
};

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
  /** Overrides the large-card spotlight label (defaults to "★ Highest-yield") -- lets a second spotlight card (e.g. "✨ New") avoid repeating the same badge text. */
  badge?: string;
}

interface FeaturesGridProps {
  features: GridFeature[];
  className?: string;
}

const FeaturesGrid = ({ features, className = '' }: FeaturesGridProps) => {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8' id='features'>
      <SectionTitle
        eyebrow='What you get'
        title='Everything you need to pass'
        description='Built specifically for dentists preparing for Prometric-style licensing exams.'
      />

      <div className={cn('mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
        {features.map((feature, idx) => (
          <Reveal
            key={feature.name + feature.description}
            delay={Math.min(idx * 60, 360)}
            className={feature.size === 'large' ? 'sm:col-span-2 lg:col-span-2' : undefined}
          >
            <FeaturesGridItem {...feature} />
          </Reveal>
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
  badge,
}: GridFeature) {
  const isLarge = size === 'large';
  const Icon = featureIcons[name];
  const renderedIcon = icon ? icon : Icon ? undefined : emoji ? <span className='text-3xl'>{emoji}</span> : null;

  /* ---- Wide horizontal spotlight (the featured feature) ---- */
  if (isLarge) {
    return (
      <div className='group relative flex h-full flex-col gap-6 overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center sm:p-10'>
        <div
          className='relative z-10 flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary'
        >
          {Icon && !icon ? <Icon className='h-7 w-7' strokeWidth={1.75} /> : renderedIcon}
        </div>
        <div className='relative z-10'>
          <span className='inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary'>
            {badge ?? '★ Highest-yield'}
          </span>
          <h3 className='mt-2 text-2xl font-semibold text-foreground sm:text-3xl'>{name}</h3>
          <p className='mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground'>{description}</p>
        </div>
      </div>
    );
  }

  /* ---- Standard big card ---- */
  const card = (
    <div className='group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md'>
      <div className='flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary'>
        {Icon && !icon ? <Icon className='h-5 w-5' strokeWidth={1.75} /> : renderedIcon}
      </div>
      <h3 className='mt-5 text-base font-semibold text-foreground'>{name}</h3>
      <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{description}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className='block'>
        {card}
      </a>
    );
  }

  return card;
}

export default FeaturesGrid;