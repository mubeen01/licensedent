// Dependency-free charts for the student dashboard. Plain SVG/CSS so they
// inherit the theme (currentColor + the brand/line tokens in Main.css) and
// stay crisp in light, dark and the Ireland theme without a charting library.
import { useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import type { DailyActivity } from '../operations';

export function Sparkline({
  values,
  className,
  label,
}: {
  // null = no data that day (the line bridges the gap instead of dropping to 0)
  values: (number | null)[];
  className?: string;
  label: string;
}) {
  const points = values.map((v, i) => ({ i, v })).filter((p): p is { i: number; v: number } => p.v !== null);
  const W = 120;
  const H = 32;
  if (points.length < 2) {
    return <div className={cn('h-8', className)} aria-hidden='true' />;
  }
  const max = Math.max(...points.map((p) => p.v));
  const min = Math.min(...points.map((p) => p.v));
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * (W - 4) + 2;
  const y = (v: number) => H - 3 - ((v - min) / span) * (H - 6);
  const line = points.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points[points.length - 1].i).toFixed(1)},${H} L${x(points[0].i).toFixed(1)},${H} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio='none' className={cn('h-8 w-full text-brand-9', className)} role='img' aria-label={label}>
      <path d={area} fill='currentColor' opacity='0.08' />
      <path d={line} fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' strokeLinecap='round' vectorEffect='non-scaling-stroke' />
      <circle cx={x(last.i)} cy={y(last.v)} r='2.25' fill='currentColor' />
    </svg>
  );
}

export function Meter({
  value,
  label,
  tone = 'brand',
  marker,
  className,
}: {
  value: number; // 0-100
  label: string;
  tone?: 'brand' | 'neutral' | 'warning' | 'success';
  marker?: number; // optional target tick, 0-100
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role='meter'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('relative h-1.5 w-full rounded-full bg-line', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none',
          tone === 'brand' && 'bg-brand-9',
          tone === 'neutral' && 'bg-ink-3',
          tone === 'warning' && 'bg-warning',
          tone === 'success' && 'bg-success'
        )}
        style={{ width: `${pct}%` }}
      />
      {marker !== undefined && (
        <div className='absolute -top-1 h-3.5 w-px bg-ink-2' style={{ left: `${marker}%` }} aria-hidden='true' />
      )}
    </div>
  );
}

// 26-week activity map, Monday-first columns (GitHub-style).
export function ActivityMap({ days }: { days: DailyActivity[] }) {
  // On narrow screens the map scrolls sideways; open it on the most recent weeks, not the oldest.
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [days.length]);
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const first = parse(days[0].date);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const cells: (DailyActivity | null)[] = [...Array(lead).fill(null), ...days];
  const weeks: (DailyActivity | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const max = Math.max(1, ...days.map((d) => d.attempted));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  const LEVEL_CLASS = ['bg-line', 'bg-brand-4', 'bg-brand-6', 'bg-brand-9/70', 'bg-brand-9'];
  // Label a column only where a new month starts (first week containing the 1st..7th that isn't already labelled).
  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const day = week.find((c) => c && parse(c.date).getDate() <= 7);
    if (!day) return '';
    const m = parse(day.date).getMonth();
    if (m === lastMonth) return '';
    lastMonth = m;
    return parse(day.date).toLocaleDateString(undefined, { month: 'short' });
  });

  return (
    <div ref={scrollRef} className='overflow-x-auto'>
      <div className='grid min-w-[520px] gap-[3px]' style={{ gridTemplateColumns: `1.75rem repeat(${weeks.length}, minmax(0, 1fr))` }}>
        <div />
        {weeks.map((_, i) => (
          <div key={`m${i}`} className='h-4 whitespace-nowrap text-[10px] leading-4 text-ink-3'>
            {monthLabels[i]}
          </div>
        ))}
        {['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, row) => (
          <FragmentRow key={row} label={d} cells={weeks.map((w) => w[row] ?? null)} level={level} levelClass={LEVEL_CLASS} parse={parse} />
        ))}
      </div>
      <div className='mt-3 flex items-center gap-1.5 text-[11px] text-ink-3'>
        <span>Less</span>
        {LEVEL_CLASS.map((c) => (
          <span key={c} className={cn('h-2.5 w-2.5 rounded-[3px]', c)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function FragmentRow({
  label,
  cells,
  level,
  levelClass,
  parse,
}: {
  label: string;
  cells: (DailyActivity | null)[];
  level: (n: number) => number;
  levelClass: string[];
  parse: (key: string) => Date;
}) {
  return (
    <>
      <div className='flex items-center text-[10px] leading-3 text-ink-3'>{label}</div>
      {cells.map((c, i) =>
        c ? (
          <div
            key={i}
            title={`${parse(c.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${
              c.attempted === 0 ? 'no practice' : `${c.attempted} question${c.attempted === 1 ? '' : 's'}, ${Math.round((c.correct / c.attempted) * 100)}% correct`
            }`}
            className={cn('aspect-square w-full rounded-[3px]', levelClass[level(c.attempted)])}
          />
        ) : (
          <div key={i} className='aspect-square w-full' />
        )
      )}
    </>
  );
}

// Vertical score bars for submitted mocks, oldest first, with a target line.
export function ScoreBars({
  scores,
  target,
  targetLabel,
  className,
}: {
  scores: { key: string; label: string; pct: number }[];
  target: number;
  targetLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('relative flex flex-col', className)}>
      <div className='relative flex min-h-36 flex-1 gap-2 border-b border-line'>
        <div className='pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-3/60' style={{ bottom: `${target}%` }}>
          <span className='absolute -top-4 right-0 text-[10px] font-medium text-ink-3'>{targetLabel}</span>
        </div>
        {scores.map((s, i) => (
          <div key={s.key} className='relative flex-1' title={`${s.label}: ${s.pct}%`}>
            <div
              className={cn(
                'absolute bottom-0 left-1/2 w-full max-w-9 -translate-x-1/2 rounded-t-[4px]',
                i === scores.length - 1 ? 'bg-brand-9' : 'bg-brand-6'
              )}
              style={{ height: `${Math.max(2, s.pct)}%` }}
            />
            <span
              className='absolute inset-x-0 text-center text-[11px] font-medium tabular-nums text-ink-2'
              style={{ bottom: `calc(${Math.max(2, s.pct)}% + 4px)` }}
            >
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
      <div className='mt-1.5 flex gap-2'>
        {scores.map((s) => (
          <span key={s.key} className='flex-1 truncate text-center text-[10px] text-ink-3'>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
