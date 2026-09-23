import type { CSSProperties } from 'react';

const dotGridStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(#000000 1.8px, transparent 1.8px)',
  backgroundSize: '22px 22px',
  opacity: 0.06,
};

/**
 * The quiet dot-grid + single restrained glow backdrop established by
 * Hero.tsx and reused by About/Contact -- replaces the old dual/triple
 * colored blur-blob hero treatment, which read as a generic "AI SaaS
 * gradient wash" (see Hero.tsx's own comment on why it moved away from
 * that). `glowClassName` is the one allowed accent glow, sized/positioned/
 * colored by the caller.
 */
export default function DotGridBackdrop({ glowClassName }: { glowClassName?: string }) {
  return (
    <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden' aria-hidden='true'>
      <div style={dotGridStyle} />
      {glowClassName && <div className={glowClassName} />}
    </div>
  );
}
