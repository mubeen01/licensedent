import { type ReactNode } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useCopyProtection } from '../hooks/useCopyProtection';

const WATERMARK_REPEAT_COUNT = 80;

// Wraps exam/practice question content (stem, options, explanations) with a
// tiled username watermark and copy protection, so a screenshot, screen
// recording, or leaked copy is traceable back to the account that took it.
// Right-click is disabled on the wrapped area only -- not page-wide -- and
// selection is blocked via CSS; give any real input/textarea inside a
// `select-text` class to opt back into normal editing.
export default function ProtectedContent({ children }: { children: ReactNode }) {
  const { data: user } = useAuth();
  const label = user?.username || user?.email || 'this account';
  useCopyProtection(label);

  return (
    <div className='relative select-none' onContextMenu={(e) => e.preventDefault()}>
      {children}

      <div aria-hidden='true' className='pointer-events-none absolute inset-0 z-20 overflow-hidden'>
        <div className='absolute -inset-1/4 flex flex-wrap content-center justify-center gap-x-10 gap-y-8 rotate-[-20deg] opacity-[0.06]'>
          {Array.from({ length: WATERMARK_REPEAT_COUNT }).map((_, i) => (
            <span key={i} className='whitespace-nowrap text-sm font-bold text-foreground'>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
