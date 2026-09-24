import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';

/**
 * Thin top-of-page loading bar shown while a route navigation is pending.
 *
 * Every Wasp page is a lazy route (`lazy: () => import(...)` in the generated
 * routes file). With React Router's data router, clicking a link to a page
 * whose code hasn't loaded yet keeps the OLD page on screen, with no visual
 * change at all, until the import resolves. In dev (Vite compiles each page
 * on first visit) that can be several seconds, so a first click looked
 * ignored and users clicked again ("have to click twice"). This makes the
 * pending state visible. The short delay avoids a flash on instant
 * navigations.
 */
export default function NavigationProgress() {
  const navigation = useNavigation();
  const isPending = navigation.state !== 'idle';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(id);
  }, [isPending]);

  useEffect(() => {
    document.documentElement.style.cursor = visible ? 'progress' : '';
    return () => {
      document.documentElement.style.cursor = '';
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      role='progressbar'
      aria-label='Loading page'
      aria-busy='true'
      className='pointer-events-none fixed inset-x-0 top-0 z-[10000] h-0.5 overflow-hidden bg-primary/15'
    >
      <div className='h-full w-1/3 animate-[nav-progress_1s_ease-in-out_infinite] bg-primary' />
    </div>
  );
}
