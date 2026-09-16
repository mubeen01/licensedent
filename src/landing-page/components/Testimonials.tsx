import { Quote, Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating?: number;
}

// Two quiet, on-brand avatar treatments — alternated for subtle variety.
const avatarStyles = [
  'bg-primary/10 text-primary ring-primary/20',
  'bg-secondary/10 text-secondary ring-secondary/20',
];

export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowExpand = testimonials.length > 5;
  const mobileItemsToShow = 3;
  const itemsToShow = shouldShowExpand && !isExpanded ? mobileItemsToShow : testimonials.length;

  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Reviews'
        title='What dentists are saying'
        description='Early feedback from candidates using LicenseDent to prepare.'
      />

      <div className='relative z-10 columns-1 gap-6 md:columns-2 lg:columns-3'>
        {testimonials.slice(0, itemsToShow).map((testimonial, idx) => {
          const initials = testimonial.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('');
          const avatar = avatarStyles[idx % avatarStyles.length];

          return (
            <Reveal key={idx} delay={Math.min(idx * 70, 350)} className='mb-6 break-inside-avoid'>
            <figure
              className='group rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl'
            >
              <div className='flex items-center justify-between'>
                <div className='flex gap-0.5' aria-label={`Rated ${testimonial.rating ?? 5} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < (testimonial.rating ?? 5) ? 'fill-gold text-gold' : 'fill-muted text-muted'
                      )}
                    />
                  ))}
                </div>
                <Quote className='h-7 w-7 flex-none text-primary/15' aria-hidden='true' />
              </div>

              <blockquote className='mt-4'>
                <p className='text-sm leading-6 text-foreground/90'>{testimonial.quote}</p>
              </blockquote>

              <figcaption className='mt-6 flex items-center gap-3 border-t border-border/70 pt-4'>
                <span
                  className={cn(
                    'flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-semibold ring-1',
                    avatar
                  )}
                >
                  {initials}
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-sm font-semibold text-foreground'>{testimonial.name}</div>
                  <div className='truncate text-xs text-muted-foreground'>{testimonial.role}</div>
                </div>
              </figcaption>
            </figure>
            </Reveal>
          );
        })}
      </div>

      {shouldShowExpand && (
        <div className='mt-8 flex justify-center md:hidden'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='rounded-lg bg-primary/10 px-6 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/20'
          >
            {isExpanded ? 'Show less' : `Show ${testimonials.length - mobileItemsToShow} more`}
          </button>
        </div>
      )}
    </div>
  );
}