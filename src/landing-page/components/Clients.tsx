/**
 * Clients / trust strip.
 *
 * A brand-new platform has no client logos to show, and we deliberately do NOT
 * display official licensing-authority logos (that would imply an endorsement
 * we don't have — see the non-affiliation note in the footer).
 *
 * Instead this is an honest "where this takes you" strip: the Gulf countries a
 * dentist can practice in, each mapped to the exam(s) that unlock it. It reads
 * like a modern logo marquee but every item is true and on-brand.
 *
 * Self-contained: the scroll animation lives in the <style> block below, so you
 * don't need to edit tailwind.config. It pauses on hover and stops entirely for
 * users who prefer reduced motion. PRD-006 M4: also pauses via an explicit
 * button (hover alone doesn't satisfy WCAG 2.2.2 for keyboard/touch users,
 * who can't hover), and the duplicated back-half of the track (rendered only
 * so the -50% loop is seamless) is now aria-hidden so its content isn't
 * announced twice by assistive tech.
 */

import { Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import FlagIcon, { type FlagCode } from './FlagIcon';

interface Destination {
  flag: FlagCode;
  country: string;
  exams: string;
}

// PRD-006 M5: SHA (Sharjah Health Authority) is a UAE exam, not Oman's --
// it was previously listed under Oman alongside OMSB. Corrected to the
// UAE entry; Oman keeps only its real exam, OMSB.
const destinations: Destination[] = [
  { flag: 'AE', country: 'United Arab Emirates', exams: 'DHA · HAAD · MOH · SHA' },
  { flag: 'SA', country: 'Saudi Arabia', exams: 'SMLE' },
  { flag: 'OM', country: 'Oman', exams: 'OMSB' },
  { flag: 'QA', country: 'Qatar', exams: 'QCHP' },
  { flag: 'KW', country: 'Kuwait', exams: 'KMLE' },
  { flag: 'BH', country: 'Bahrain', exams: 'NHRA' },
];

function DestinationChip({ flag, country, exams }: Destination) {
  return (
    <div className='card-elevated card-elevated-hover group flex items-center gap-2.5 px-3.5 py-2'>
      <span className='flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-muted leading-none transition-transform duration-300 group-hover:scale-110' aria-hidden='true'>
        <FlagIcon code={flag} className='h-4 w-[1.5rem]' />
      </span>
      <div className='text-left'>
        <div className='whitespace-nowrap text-xs font-semibold text-foreground'>{country}</div>
        <div className='whitespace-nowrap text-[10.5px] font-medium tracking-wide text-muted-foreground'>{exams}</div>
      </div>
    </div>
  );
}

export default function Clients() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section aria-label='Gulf licensing coverage' className='w-full py-3 sm:py-4'>
      <div className='mb-2.5 flex items-center justify-center gap-2 px-6'>
        <p className='text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Prepare for the licence that lets you practice across the Gulf
        </p>
        <button
          type='button'
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? 'Resume scrolling destination list' : 'Pause scrolling destination list'}
          className='flex h-5 w-5 flex-none items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary'
        >
          {isPaused ? <Play className='h-2.5 w-2.5' aria-hidden='true' /> : <Pause className='h-2.5 w-2.5' aria-hidden='true' />}
        </button>
      </div>

      {/* Marquee */}
      <div className='relative overflow-hidden'>
        {/* edge fades */}
        <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent sm:w-28' />
        <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-transparent sm:w-28' />

        <div className={cn('dp-marquee-track flex w-max items-center gap-4 px-4', isPaused && 'dp-marquee-paused')}>
          {destinations.map((d, i) => (
            <DestinationChip key={`${d.country}-${i}`} {...d} />
          ))}
          {/* Rendered a second time, back-to-back, so the -50% scroll loops
              seamlessly -- purely decorative duplication, aria-hidden so a
              screen reader doesn't read every country and exam twice. */}
          <div className='flex items-center gap-4' aria-hidden='true'>
            {destinations.map((d, i) => (
              <DestinationChip key={`${d.country}-dup-${i}`} {...d} />
            ))}
          </div>
        </div>
      </div>

      <p className='mt-4 px-6 text-center text-[11px] text-muted-foreground'>
        An independent preparation platform — not affiliated with any listed authority.
      </p>

      <style>{`
        @keyframes dp-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .dp-marquee-track {
          animation: dp-marquee 34s linear infinite;
        }
        /* Runs continuously -- no hover-to-pause. Only the explicit pause
           button (kept for WCAG 2.2.2, which real moving content needs a
           way to stop) and prefers-reduced-motion below still stop it. */
        .dp-marquee-track.dp-marquee-paused {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .dp-marquee-track {
            animation: none;
            width: 100%;
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}