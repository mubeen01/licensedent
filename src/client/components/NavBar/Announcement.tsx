import { Link as WaspRouterLink, routes } from 'wasp/client/router';

export function Announcement() {
  return (
    <div className='relative flex justify-center items-center gap-3 p-3 w-full bg-gradient-to-r from-primary to-secondary font-semibold text-primary-foreground text-center'>
      <span className='hidden lg:block'>Practice free for DHA, HAAD, MOH & 6 more Gulf licensing exams</span>
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
