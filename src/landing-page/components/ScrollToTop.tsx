import { ArrowUp, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollY / docHeight) * 100, 100) : 0);
      setIsVisible(scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label='Back to top'
      title='Back to top'
      className='group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg ring-1 ring-white/20 transition-all duration-300 hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:scale-100'
    >
      {/* Progress ring — fills clockwise as you scroll, like a clinical gauge */}
      <svg className='pointer-events-none absolute inset-0 -m-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] -rotate-90' viewBox='0 0 36 36'>
        <path
          className='text-white/25'
          stroke='currentColor'
          strokeWidth='2'
          fill='none'
          d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
        />
        <path
          className='text-white transition-all duration-200'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          fill='none'
          strokeDasharray={`${progress}, 100`}
          d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
        />
      </svg>

      {/* Resting state: surgeon/clinician symbol. Fades out on hover. */}
      <Stethoscope className='absolute h-6 w-6 transition-all duration-200 group-hover:scale-90 group-hover:opacity-0' />

      {/* Hover state: clear "scroll up" affordance. */}
      <ArrowUp className='absolute h-5 w-5 translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100' />
    </button>
  );
}