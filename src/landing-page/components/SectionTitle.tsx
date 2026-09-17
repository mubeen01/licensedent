import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import Eyebrow from './Eyebrow';
import Reveal from './Reveal';

interface SectionTitleProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  /** Small uppercase label above the heading, e.g. "Pricing" or "How it works". */
  eyebrow?: string;
  align?: 'center' | 'left';
  className?: string;
}

export default function SectionTitle({
  title,
  description,
  eyebrow,
  align = 'center',
  className,
}: SectionTitleProps) {
  const isCentered = align === 'center';

  const titleElement =
    typeof title === 'string' ? (
      <h2 className='text-3xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl'>
        {title}
      </h2>
    ) : (
      title
    );

  const descriptionElement =
    typeof description === 'string' ? (
      <p className='mt-5 text-base leading-8 text-muted-foreground sm:text-lg text-pretty'>
        {description}
      </p>
    ) : (
      description
    );

  return (
    <Reveal
      className={cn(
        'mb-12 max-w-2xl sm:mb-16',
        isCentered ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && (
        <div className={cn('mb-4 flex', isCentered ? 'justify-center' : 'justify-start')}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      {titleElement}
      {descriptionElement}
    </Reveal>
  );
}