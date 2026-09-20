import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

// PRD-006 M3: extends the props Reveal forwards to its underlying element
// (previously just children/delay/className/as) so callers can attach real
// semantics -- role, aria-*, id -- to a revealed section, e.g. StudyTools's
// tablist. Typed against the generic HTMLElement (not HTMLDivElement/
// HTMLLIElement specifically) since `as` can render either tag and an
// event-handler prop typed for one is not assignable to the other's; the
// generic base is assignable to both. Omits the props Reveal itself already
// owns (className/style/ref) so it can't be double-specified.
type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms — pass idx * 60 from a .map() for a cascading effect. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li';
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className' | 'style'>;

/**
 * Fades + slides content in the first time it scrolls into view. Fires once
 * (an entered section never re-hides on scroll-away) and jumps straight to
 * the visible state for prefers-reduced-motion, so it never blocks content.
 */
export default function Reveal({ children, delay = 0, className, as = 'div', ...rest }: RevealProps) {
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
      {...rest}
    >
      {children}
    </Tag>
  );
}
