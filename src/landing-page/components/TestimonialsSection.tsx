import { Quote, User } from 'lucide-react';
import { getPublishedTestimonials, useQuery } from 'wasp/client/operations';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

// Renders nothing at all while there are zero published testimonials --
// deliberate. A prior version of this section was removed for having
// placeholder names implying real outcomes nobody actually reported (see
// schema.prisma's Testimonial model comment). It only reappears once real,
// name-cleared quotes exist, added through /admin/testimonials.
export default function TestimonialsSection() {
  const { data: testimonials } = useQuery(getPublishedTestimonials);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='From real students'
        title='What dentists preparing with us actually say'
        description='Genuine quotes, added as they come in — nothing here is written by us.'
      />
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {testimonials.map((t, idx) => (
          <Reveal key={t.id} delay={Math.min(idx * 80, 320)} className='h-full'>
            <div className='card-elevated flex h-full flex-col gap-4 p-6'>
              <Quote className='h-5 w-5 text-primary/40' />
              <p className='flex-1 text-sm leading-6 text-foreground/90'>&ldquo;{t.quote}&rdquo;</p>
              <div className='flex items-center gap-3 border-t border-border pt-4'>
                {t.avatarImageUrl ? (
                  <img src={t.avatarImageUrl} alt='' className='h-10 w-10 rounded-full object-cover' />
                ) : (
                  <span className='flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                    <User className='h-5 w-5' />
                  </span>
                )}
                <div>
                  <p className='text-sm font-semibold text-foreground'>{t.name}</p>
                  <p className='text-xs text-muted-foreground'>{t.context}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
