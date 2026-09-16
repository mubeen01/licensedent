import { TriangleAlert } from 'lucide-react';

// Honest, always-visible status line for the one thing in this app that's
// currently broken end-to-end (see INFRA_NOTES.md / FEATURES.md's Known
// gaps table): a placeholder Stripe key blocks checkout entirely. Shown
// here instead of only discoverable by clicking "Buy plan" and hitting an
// error, since it's the single biggest blocker to a real pilot.
export default function SystemStatusBanner({ stripeConfigured }: { stripeConfigured: boolean }) {
  if (stripeConfigured) return null;

  return (
    <div className='flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 mb-6'>
      <TriangleAlert className='size-5 text-warning flex-shrink-0 mt-0.5' />
      <div className='text-sm'>
        <p className='font-semibold text-foreground'>Checkout is offline</p>
        <p className='text-muted-foreground'>
          <code className='rounded bg-muted px-1 py-0.5 text-xs'>STRIPE_API_KEY</code> in{' '}
          <code className='rounded bg-muted px-1 py-0.5 text-xs'>.env.server</code> is still the template's
          placeholder — students can't complete checkout until a real key is added. Everything else on this
          dashboard is live, real data.
        </p>
      </div>
    </div>
  );
}
