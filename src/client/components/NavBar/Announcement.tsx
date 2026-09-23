import { Link as WaspRouterLink, routes } from 'wasp/client/router';

// 2026-09-23 pilot-cohort decision: the old "Practice free for DHA, HAAD,
// MOH & 6 more Gulf licensing exams" line overstated what's actually free
// (15 practice questions/day, one exam's worth of Fast Track access if
// admin-approved) as an unconditional, unlimited claim. This banner --
// the single highest-visibility spot on the site -- now promotes the real,
// honest offer: a free 1-month Fast Track pass, limited to a few
// hand-reviewed applicants, not a blanket "everything's free."
export function Announcement() {
  return (
    <div className='relative flex justify-center items-center gap-3 p-3 w-full bg-linear-to-r from-primary to-secondary font-semibold text-primary-foreground text-center'>
      <span className='hidden lg:block'>
        Free 1-month Fast Track pass — a few spots open for selected dentists
      </span>
      {/* PRD-006 L11: below `lg` the full sentence was hidden entirely,
          leaving only a bare CTA pill with no context. Short variant fills
          that gap on narrower screens. */}
      <span className='block text-xs lg:hidden'>Free Fast Track — limited spots</span>
      <div className='hidden lg:block self-stretch w-0.5 bg-primary-foreground/20'></div>
      <WaspRouterLink
        to={routes.FastTrackApplyRoute.to}
        className='cursor-pointer rounded-full bg-background/20 px-2.5 py-1 text-xs hover:bg-background/30 transition-colors tracking-wider'
      >
        Apply now →
      </WaspRouterLink>
    </div>
  );
}
