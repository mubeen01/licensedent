import { Lock, Sparkles } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

export default function ExtendedPlanUpsell({
  feature,
  description,
  planLabel = 'Extended-plan',
}: {
  feature: string;
  description: string;
  // PRD-002 Phase I8.2: Quiz Builder is also an IDC Pathway perk now, so its
  // caller overrides this copy -- Video Lectures stays Extended-only (no
  // real content to scope), so it keeps the default.
  planLabel?: string;
}) {
  return (
    <div className='mx-auto max-w-2xl px-6 py-16 text-center'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-secondary text-white shadow-lg'>
        <Lock className='h-7 w-7' />
      </div>
      <h2 className='mt-6 text-2xl font-black text-foreground'>
        {feature} is an {planLabel} perk
      </h2>
      <p className='mt-3 text-muted-foreground leading-relaxed'>{description}</p>
      <WaspRouterLink to={routes.PricingPageRoute.to}>
        <Button className='mt-6 bg-linear-to-r from-primary to-secondary font-bold text-white'>
          <Sparkles className='mr-2 h-4 w-4' />
          View plans
        </Button>
      </WaspRouterLink>
    </div>
  );
}
