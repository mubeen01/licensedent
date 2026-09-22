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
  'Explanations that hold up': ShieldCheck,
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

export type FeatureAccent = 'primary' | 'secondary' | 'gold' | 'success';

/**
 * 2026-09-23 "more advanced/modern" pass: every card now carries a real
 * category colour instead of one flat primary-only treatment everywhere.
 * Deliberately kept to the app's own 4 themed tokens (primary/secondary/
 * gold/success) -- every one of those already has a dark-mode HSL override
 * defined in Main.css -- rather than the raw Tailwind palette classes
 * (`teal-500`, `sky-500`, `cyan-600`...) the old per-feature `gradient`
 * field used, which don't invert for dark mode and aren't part of the
 * theme system at all (design-quality note: token scales only, no
 * arbitrary colour classes). The visual language (top accent bar, corner
 * glow, two-tone icon chip) is lifted straight from ExamsGrid/AllExamsPage
 * so the whole site reads as one consistent system, not a redesigned
 * section next to untouched ones.
 */
const ACCENT_STYLES: Record<
  FeatureAccent,
  { bar: string; iconBg: string; iconText: string; chip: string; border: string; glow: string; blob: string }
> = {
  primary: {
    bar: 'bg-primary',
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    chip: 'from-primary/20 to-primary/5',
    border: 'hover:border-primary/35',
    glow: 'hover:shadow-[0_24px_48px_-24px_hsl(var(--primary)/0.35)]',
    blob: 'bg-primary/25',
  },
  secondary: {
    bar: 'bg-secondary',
    iconBg: 'bg-secondary/10',
    iconText: 'text-secondary',
    chip: 'from-secondary/20 to-secondary/5',
    border: 'hover:border-secondary/35',
    glow: 'hover:shadow-[0_24px_48px_-24px_hsl(var(--secondary)/0.35)]',
    blob: 'bg-secondary/25',
  },
  gold: {
    bar: 'bg-gold',
    iconBg: 'bg-gold/10',
    iconText: 'text-gold',
    chip: 'from-gold/20 to-gold/5',
    border: 'hover:border-gold/35',
    glow: 'hover:shadow-[0_24px_48px_-24px_hsl(var(--gold)/0.35)]',
    blob: 'bg-gold/25',
  },
  success: {
    bar: 'bg-success',
    iconBg: 'bg-success/10',
    iconText: 'text-success',
    chip: 'from-success/20 to-success/5',
    border: 'hover:border-success/35',
    glow: 'hover:shadow-[0_24px_48px_-24px_hsl(var(--success)/0.35)]',
    blob: 'bg-success/25',
  },
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
  /** One of the app's own themed tokens — see ACCENT_STYLES. Defaults to 'primary'. */
  accent?: FeatureAccent;
  /** Overrides the large-card spotlight label (defaults to "★ Highest-yield") -- lets a second spotlight card (e.g. "✨ New") avoid repeating the same badge text. */
  badge?: string;
  /** Small pill under the description, e.g. "Extended plan" — only for a fact the copy itself already states. */
  tag?: string;
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
  accent = 'primary',
  badge,
  tag,
}: GridFeature) {
  const isLarge = size === 'large';
  const Icon = featureIcons[name];
  const renderedIcon = icon ? icon : Icon ? undefined : emoji ? <span className='text-3xl'>{emoji}</span> : null;
  const a = ACCENT_STYLES[accent];

  /* ---- Wide horizontal spotlight (the featured feature) ---- */
  if (isLarge) {
    const card = (
      <div
        className={cn(
          'card-elevated group relative flex h-full flex-col gap-6 p-8 transition-all duration-300 hover:-translate-y-1 sm:flex-row sm:items-center sm:p-10',
          a.border,
          a.glow
        )}
      >
        <div className={cn('absolute inset-x-0 top-0 h-1', a.bar)} aria-hidden='true' />
        <div
          className={cn(
            'pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100',
            a.blob
          )}
          aria-hidden='true'
        />

        <div
          className={cn(
            'relative z-10 flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-linear-to-br transition-transform duration-300 group-hover:scale-110',
            a.chip,
            a.iconText
          )}
        >
          {Icon && !icon ? <Icon className='h-7 w-7' strokeWidth={1.75} /> : renderedIcon}
        </div>
        <div className='relative z-10'>
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest', a.iconText)}>
            {badge ?? '★ Highest-yield'}
          </span>
          <h3 className='mt-2 text-2xl font-semibold text-foreground sm:text-3xl'>{name}</h3>
          <p className='mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground'>{description}</p>
          {tag && (
            <span className='mt-4 inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
              {tag}
            </span>
          )}
        </div>
      </div>
    );
    return href ? (
      <a href={href} target='_blank' rel='noopener noreferrer' className='block h-full'>
        {card}
      </a>
    ) : (
      card
    );
  }

  /* ---- Standard card — 'small' gets a visibly more compact treatment
     (tighter padding, smaller icon, clamped description) so the grid reads
     as genuine bento size variation rather than uniform tiles. Every card
     now carries its own accent colour (top edge + icon chip + hover glow)
     instead of a single repeated primary treatment, so the grid reads as
     categorised at a glance, not just a wall of identical tiles. ---- */
  const isSmall = size === 'small';
  const card = (
    <div
      className={cn(
        'card-elevated group relative flex h-full flex-col transition-all duration-300 hover:-translate-y-1',
        a.border,
        a.glow,
        isSmall ? 'p-5' : 'p-7'
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', a.bar)} aria-hidden='true' />
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100',
          a.blob
        )}
        aria-hidden='true'
      />

      <div
        className={cn(
          'relative z-10 flex flex-none items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110',
          a.iconBg,
          a.iconText,
          isSmall ? 'h-9 w-9' : 'h-12 w-12'
        )}
      >
        {Icon && !icon ? <Icon className={isSmall ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} /> : renderedIcon}
      </div>
      <h3 className={cn('relative z-10 font-semibold text-foreground', isSmall ? 'mt-3 text-sm' : 'mt-5 text-base')}>{name}</h3>
      <p
        className={cn(
          'relative z-10 leading-relaxed text-muted-foreground',
          isSmall ? 'mt-1.5 line-clamp-2 text-xs' : 'mt-2 text-sm'
        )}
      >
        {description}
      </p>
      {tag && (
        <span className='relative z-10 mt-3 inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
          {tag}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className='block h-full'>
        {card}
      </a>
    );
  }

  return card;
}

export default FeaturesGrid;
