import { Check, Sparkles } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

export interface PricingTeaserPlan {
  name: string;
  tagline: string;
  duration: string;
  /** One-time price for the plan's full duration, e.g. "$100" — sourced from payment/plans.ts's getPlanPrice so it never drifts from what checkout actually charges. */
  price: string;
  features: string[];
  highlighted?: boolean;
  /** Short callout for a standout perk unique to this plan, e.g. video lectures. */
  perk?: string;
}

export default function PricingTeaser({ plans }: { plans: PricingTeaserPlan[] }) {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        title='Plans built around your exam date'
        description='Pay for the coverage you actually need — a single exam for a few months, or every exam for a full application cycle.'
      />

      <div className='mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch'>
        {plans.map((plan, idx) => {
          // Duration like "6 months · all exams" → main label + a small qualifier chip.
          const [durationMain, durationNote] = plan.duration.split('·').map((part) => part.trim());
          const accent = plan.highlighted ? 'primary' : 'secondary';

          return (
            <Reveal key={plan.name} delay={idx * 100} className='h-full'>
            <div
              className={cn(
                'card-elevated group relative flex h-full flex-col p-8',
                plan.highlighted
                  ? 'border-primary/40 shadow-[0_24px_48px_-20px_hsl(var(--primary)/0.35)] ring-1 ring-primary/25 lg:-my-4'
                  : 'card-elevated-hover'
              )}
            >
              {/* Thin accent rail on the recommended plan — quiet, not a rainbow badge */}
              {plan.highlighted && (
                <span
                  aria-hidden='true'
                  className='absolute inset-x-8 top-0 h-0.5 rounded-full bg-linear-to-r from-primary to-secondary'
                />
              )}

              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                  {plan.name}
                </h3>
                {plan.highlighted && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary'>
                    <Sparkles className='h-3 w-3' />
                    Most popular
                  </span>
                )}
              </div>

              <p className='mt-3 min-h-10 text-sm leading-6 text-muted-foreground'>{plan.tagline}</p>

              {/* Price is the real differentiator here, so it carries the type weight; duration/exam-scope ride along as context */}
              <div className='mt-6'>
                <div className='flex items-baseline gap-1.5'>
                  <span className='text-4xl font-bold tracking-tight text-foreground'>{plan.price}</span>
                  <span className='text-sm font-medium text-muted-foreground'>/ {durationMain}</span>
                </div>
                {durationNote && (
                  <span className='mt-3 inline-flex rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary'>
                    {durationNote}
                  </span>
                )}
              </div>

              {plan.perk && (
                <div className='mt-4 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary'>
                  {plan.perk}
                </div>
              )}

              <div className='my-7 h-px w-full bg-border' />

              <ul className='flex-1 space-y-3.5 text-sm'>
                {plan.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-3 text-foreground/80'>
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full',
                        accent === 'primary' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'
                      )}
                    >
                      <Check className='h-3 w-3' strokeWidth={3} />
                    </span>
                    <span className='leading-6'>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size='lg'
                variant={plan.highlighted ? 'default' : 'outline'}
                className={cn(
                  'mt-8 w-full font-semibold',
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:border-primary/40 hover:text-primary'
                )}
              >
                <WaspRouterLink to={routes.PricingPageRoute.to}>See full pricing</WaspRouterLink>
              </Button>
            </div>
            </Reveal>
          );
        })}
      </div>

      <p className='mt-10 text-center text-xs text-muted-foreground'>
        Every plan includes unlimited practice and full-length timed mock tests. No card required to start.
      </p>
    </div>
  );
}