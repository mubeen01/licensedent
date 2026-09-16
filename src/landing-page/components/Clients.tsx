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
 * users who prefer reduced motion.
 */

interface Destination {
  flag: string;
  country: string;
  exams: string;
}

const destinations: Destination[] = [
  { flag: '🇦🇪', country: 'United Arab Emirates', exams: 'DHA · HAAD · MOH' },
  { flag: '🇸🇦', country: 'Saudi Arabia', exams: 'SMLE' },
  { flag: '🇴🇲', country: 'Oman', exams: 'OMSB · SHA' },
  { flag: '🇶🇦', country: 'Qatar', exams: 'QCHP' },
  { flag: '🇰🇼', country: 'Kuwait', exams: 'KMLE' },
  { flag: '🇧🇭', country: 'Bahrain', exams: 'NHRA' },
];

function DestinationChip({ flag, country, exams }: Destination) {
  return (
    <div className='group flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'>
      <span className='flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-muted text-xl leading-none transition-transform duration-300 group-hover:scale-110' aria-hidden='true'>
        {flag}
      </span>
      <div className='text-left'>
        <div className='whitespace-nowrap text-sm font-semibold text-foreground'>{country}</div>
        <div className='whitespace-nowrap text-xs font-medium tracking-wide text-muted-foreground'>{exams}</div>
      </div>
    </div>
  );
}

export default function Clients() {
  // Rendered twice back-to-back so the -50% scroll loops seamlessly.
  const track = [...destinations, ...destinations];

  return (
    <section aria-label='Gulf licensing coverage' className='w-full py-14 sm:py-16'>
      <p className='mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground'>
        Prepare for the licence that lets you practice across the Gulf
      </p>

      {/* Marquee */}
      <div className='relative overflow-hidden'>
        {/* edge fades */}
        <div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent sm:w-28' />
        <div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-transparent sm:w-28' />

        <div className='dp-marquee-track flex w-max items-center gap-4 px-4'>
          {track.map((d, i) => (
            <DestinationChip key={`${d.country}-${i}`} {...d} />
          ))}
        </div>
      </div>

      <p className='mt-8 px-6 text-center text-xs text-muted-foreground'>
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
        .dp-marquee-track:hover {
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