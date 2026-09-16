import type { ReactNode } from 'react';

export default function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary'>
      {children}
    </span>
  );
}
