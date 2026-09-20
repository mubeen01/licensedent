import { Link as WaspRouterLink, routes } from 'wasp/client/router';

export function Announcement() {
  return (
    <div className='relative flex justify-center items-center gap-3 p-3 w-full bg-linear-to-r from-primary to-secondary font-semibold text-primary-foreground text-center'>
      <span className='hidden lg:block'>Practice free for DHA, HAAD, MOH & 6 more Gulf licensing exams</span>
      {/* PRD-006 L11: below `lg` the full sentence was hidden entirely,
          leaving only a bare "Start free practice →" pill with no context
          for what it's free practice for. Short variant fills that gap on
          narrower screens. */}
      <span className='block text-xs lg:hidden'>Free DHA, HAAD, MOH practice</span>
      <div className='hidden lg:block self-stretch w-0.5 bg-primary-foreground/20'></div>
      <WaspRouterLink
        to={routes.SignupRoute.to}
        className='cursor-pointer rounded-full bg-background/20 px-2.5 py-1 text-xs hover:bg-background/30 transition-colors tracking-wider'
      >
        Start free practice →
      </WaspRouterLink>
    </div>
  );
}
