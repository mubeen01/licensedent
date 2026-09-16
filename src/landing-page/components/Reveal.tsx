import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms — pass idx * 60 from a .map() for a cascading effect. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li';
}

/**
 * Fades + slides content in the first time it scrolls into view. Fires once
 * (an entered section never re-hides on scroll-away) and jumps straight to
 * the visible state for prefers-reduced-motion, so it never blocks content.
 */
export default function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as any}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className
      )}
    >
      {children}
    </Tag>
  );
}
