import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from 'wasp/client/auth';
import { routes } from 'wasp/client/router';
import { generateCheckoutSession, getCustomerPortalUrl, getPublicExams, useQuery } from 'wasp/client/operations';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';
import { pricingTeaserPlans } from '../landing-page/contentSections';
import { PaymentPlanId, getPlanPrice, paymentPlans, prettyPaymentPlanName, SubscriptionStatus } from './plans';
import SeoHead from '../client/components/SeoHead';

const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.Standard;

// PRD-002 §6 Q2's content gate (real IDC-specific content before public launch)
// cleared 2026-09-17 with Phase I7.1 (4 Lessons, 140 published IDC questions) --
// IDC Pathway is now purchasable from this page. Still deliberately NOT added to
// `pricingTeaserPlans` (see that array's comment) -- putting it on the public
// homepage teaser is a separate decision from making it purchasable here.
const visiblePaymentPlanIds: PaymentPlanId[] = [
  PaymentPlanId.FastTrack,
  PaymentPlanId.Standard,
  PaymentPlanId.Extended,
  PaymentPlanId.IrelandPathway,
];

interface PaymentPlanCard {
  name: string;
  price: string;
  tagline: string;
  duration: string;
  features: string[];
}

function teaserFor(planName: string) {
  const teaser = pricingTeaserPlans.find((p) => p.name === planName);
  if (!teaser) throw new Error(`No landing-page pricing teaser found for plan "${planName}"`);
  return teaser;
}

export const paymentPlanCards: Record<PaymentPlanId, PaymentPlanCard> = {
  [PaymentPlanId.FastTrack]: {
    name: prettyPaymentPlanName(PaymentPlanId.FastTrack),
    price: getPlanPrice(PaymentPlanId.FastTrack),
    tagline: teaserFor('Fast Track').tagline,
    duration: teaserFor('Fast Track').duration,
    features: teaserFor('Fast Track').features,
  },
  [PaymentPlanId.Standard]: {
    name: prettyPaymentPlanName(PaymentPlanId.Standard),
    price: getPlanPrice(PaymentPlanId.Standard),
    tagline: teaserFor('Standard').tagline,
    duration: teaserFor('Standard').duration,
    features: teaserFor('Standard').features,
  },
  [PaymentPlanId.Extended]: {
    name: prettyPaymentPlanName(PaymentPlanId.Extended),
    price: getPlanPrice(PaymentPlanId.Extended),
    tagline: teaserFor('Extended').tagline,
    duration: teaserFor('Extended').duration,
    features: teaserFor('Extended').features,
  },
  // Deliberately NOT sourced from `pricingTeaserPlans` (unlike the other three) --
  // that array also feeds the public LandingPage's homepage teaser section, and
  // putting Ireland there is a separate decision from making it purchasable here
  // (see visiblePaymentPlanIds above and pricingTeaserPlans's own comment).
  [PaymentPlanId.IrelandPathway]: {
    name: prettyPaymentPlanName(PaymentPlanId.IrelandPathway),
    price: getPlanPrice(PaymentPlanId.IrelandPathway),
    tagline: 'IDC Ireland only — question bank + Lessons',
    duration: '6 months · IDC Ireland only',
    features: [
      'Full IDC Ireland question bank',
      'Structured Lessons with gated quizzes',
      'Video lectures as the library launches',
      'Unlimited practice + timed mocks',
      'Progress analytics',
    ],
  },
};

const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: user } = useAuth();
  const { data: publicExams } = useQuery(getPublicExams);
  // Exam picker for single-exam plans (Fast Track / Standard) -- defaults to the first
  // exam with real published content once exams load, but the student can change it.
  const examsWithContent = publicExams?.filter((e) => e.publishedQuestionCount > 0) ?? [];
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  useEffect(() => {
    if (!selectedExamId && examsWithContent.length > 0) {
      setSelectedExamId(examsWithContent[0].id);
    }
  }, [examsWithContent, selectedExamId]);
  const selectedExam = examsWithContent.find((e) => e.id === selectedExamId);
  const isUserSubscribed =
    !!user && !!user.subscriptionStatus && user.subscriptionStatus !== SubscriptionStatus.Deleted;

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl, { enabled: isUserSubscribed });

  const navigate = useNavigate();

  async function handleBuyNowClick(paymentPlanId: PaymentPlanId) {
    // IDC Pathway's Stripe price isn't configured yet (PAYMENTS_IRELAND_PATHWAY_PLAN_ID) --
    // the button for this plan is disabled below, but guard here too in case
    // this is ever called programmatically.
    if (paymentPlanId === PaymentPlanId.IrelandPathway) {
      return;
    }
    if (!user) {
      navigate(routes.LoginRoute.to);
      return;
    }
    const planEffect = paymentPlans[paymentPlanId].effect;
    // Needs the shared exam-picker's choice only for plans that are single-exam AND
    // don't already imply their own exam (e.g. Ireland Pathway implies IDC server-side).
    const needsPickedExam =
      planEffect.kind === 'access' && !planEffect.allExamsAccess && !planEffect.impliedExamCode;
    if (needsPickedExam && !selectedExamId) {
      setErrorMessage('Please choose which exam you want this plan for.');
      return;
    }
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession({
        planId: paymentPlanId,
        examId: needsPickedExam ? selectedExamId : undefined,
      });

      if (checkoutResults?.sessionUrl) {
        window.location.href = checkoutResults.sessionUrl;
      } else {
        throw new Error('Error generating checkout session URL');
      }
    } catch (error: unknown) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Error processing payment. Please try again later.');
      setIsPaymentLoading(false); // We only set this to false here and not in the try block because we redirect to the checkout url within the same window
    }
  }

  const handleCustomerPortalClick = () => {
    if (!user) {
      navigate(routes.LoginRoute.to);
      return;
    }

    if (customerPortalUrlError) {
      setErrorMessage('Error fetching Customer Portal URL');
      return;
    }

    if (!customerPortalUrl) {
      // null (not an error) means this account has no real Stripe customer
      // record -- access was granted manually, not through a real purchase.
      setErrorMessage("This plan was granted manually, so there's no billing portal for it -- email us for changes.");
      return;
    }

    window.open(customerPortalUrl, '_blank');
  };

  return (
    <div className='relative overflow-hidden py-10 lg:mt-10'>
      <SeoHead
        title='Pricing — Plans for Gulf & Ireland Dental Exam Prep | LicenseDent'
        description='Fast Track, Standard and Extended plans for DHA, HAAD, MOH, SMLE, OMSB, QCHP, KMLE, NHRA, SHA and IDC Ireland exam prep. Human-verified content, no ads.'
        path='/pricing'
      />
      <div className='pointer-events-none absolute inset-0 -z-10' aria-hidden='true'>
        <div className='absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute top-10 right-1/4 h-96 w-96 rounded-full bg-secondary/10 blur-3xl' />
      </div>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div id='pricing' className='mx-auto max-w-4xl text-center'>
          <div className='flex justify-center'>
            <span className='inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary'>
              <img src='/logo/licensedent-icon.svg' alt='' className='h-5 w-5 rounded-md' />
              LicenseDent · Gulf + Ireland · dentist-verified
            </span>
          </div>
          <h1 className='mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
            One payment. <span className='bg-linear-to-r from-primary via-primary-muted to-secondary bg-clip-text text-transparent'>Full prep until exam day.</span>
          </h1>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground'>
          Fast Track for a booked DHA/MOH date, Standard for a 3-month runway, Extended for every Gulf exam, IDC
          Pathway for Ireland's own track. One-time purchase — full access for the duration, no auto-renewal, every
          answer checked by a dentist.
        </p>
        <div className='mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground'>
          <span className='inline-flex items-center gap-1.5'><CheckCircle className='h-4 w-4 text-secondary' /> Free demo first</span>
          <span className='inline-flex items-center gap-1.5'><CheckCircle className='h-4 w-4 text-secondary' /> Gulf MCQs + Irish SAQ cases</span>
          <span className='inline-flex items-center gap-1.5'><CheckCircle className='h-4 w-4 text-secondary' /> Mock tests + Smart Review</span>
        </div>
        {errorMessage && (
          <Alert variant='destructive' className='mt-8'>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {examsWithContent.length > 0 && (
          <div className='mx-auto mt-8 max-w-xs'>
            <Label htmlFor='examId'>Fast Track / Standard plans — which exam?</Label>
            <Select value={selectedExamId || undefined} onValueChange={setSelectedExamId}>
              <SelectTrigger id='examId' className='w-full mt-1.5'>
                <SelectValue placeholder='Choose an exam' />
              </SelectTrigger>
              <SelectContent>
                {examsWithContent.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.flagEmoji} {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='mt-1.5 text-xs text-muted-foreground'>Extended (every Gulf exam) and IDC Pathway (Ireland only) don't need a choice here.</p>
          </div>
        )}
        <div className='isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:gap-x-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4'>
          {visiblePaymentPlanIds.map((planId) => {
            const isIrelandPathway = planId === PaymentPlanId.IrelandPathway;
            return (
              <div
                key={planId}
                className={cn(
                  'card-elevated card-elevated-hover relative flex flex-col grow justify-between p-8 xl:p-10',
                  planId === bestDealPaymentPlanId && 'ring-2 ring-primary',
                  isIrelandPathway && 'opacity-80'
                )}
              >
                {planId === bestDealPaymentPlanId && (
                  <div
                    className='absolute top-0 right-0 -z-10 w-full h-full transform-gpu blur-3xl'
                    aria-hidden='true'
                  >
                    <div
                      className='absolute w-full h-full bg-linear-to-br from-primary/40 via-primary/20 to-gold/20 opacity-30'
                      style={{
                        clipPath: 'circle(670% at 50% 50%)',
                      }}
                    />
                  </div>
                )}
                <div className='h-full justify-between'>
                  <div className='flex items-center justify-between gap-x-4'>
                    <h2 id={planId} className='text-foreground text-lg font-semibold leading-8'>
                      {paymentPlanCards[planId].name}
                    </h2>
                    {planId === bestDealPaymentPlanId && (
                      <span className='rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground'>
                        Most popular
                      </span>
                    )}
                    {isIrelandPathway && (
                      <span className='rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
                        Coming soon
                      </span>
                    )}
                  </div>
                  {isIrelandPathway ? (
                    <p className='mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                      <span aria-hidden='true'>🇮🇪</span>
                      Scoped to IDC Ireland only
                    </p>
                  ) : planId === PaymentPlanId.Extended ? (
                    <p className='mt-2 text-xs font-semibold text-muted-foreground'>Every Gulf exam included</p>
                  ) : (
                    (selectedExam || examsWithContent[0]) && (
                      <p className='mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                        <span aria-hidden='true'>{(selectedExam ?? examsWithContent[0]).flagEmoji}</span>
                        Scoped to one exam — {(selectedExam ?? examsWithContent[0]).code}
                      </p>
                    )
                  )}
                  <p className='mt-4 text-sm leading-6 text-muted-foreground'>{paymentPlanCards[planId].tagline}</p>
                  <p className='mt-6 flex items-baseline gap-x-1'>
                    <span className='text-4xl font-bold tracking-tight text-foreground'>
                      {paymentPlanCards[planId].price}
                    </span>
                    <span className='text-sm font-semibold leading-6 text-muted-foreground'>
                      / {paymentPlanCards[planId].duration}
                    </span>
                  </p>
                  <ul role='list' className='mt-8 space-y-3 text-sm leading-6 text-muted-foreground'>
                    {paymentPlanCards[planId].features.map((feature) => (
                      <li key={feature} className='flex gap-x-3'>
                        <CheckCircle className='h-5 w-5 flex-none text-primary' aria-hidden='true' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='mt-8'>
                  {isIrelandPathway ? (
                    <Button disabled variant='outline' className='w-full' title="Email us and we'll get you set up.">
                      Coming soon
                    </Button>
                  ) : isUserSubscribed ? (
                    <Button
                      onClick={handleCustomerPortalClick}
                      disabled={isCustomerPortalUrlLoading}
                      aria-describedby='manage-subscription'
                      variant={planId === bestDealPaymentPlanId ? 'default' : 'outline'}
                      className='w-full'
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuyNowClick(planId)}
                      aria-describedby={planId}
                      variant={planId === bestDealPaymentPlanId ? 'default' : 'outline'}
                      className='w-full'
                      disabled={isPaymentLoading}
                    >
                      {!!user ? 'Buy plan' : 'Log in to buy plan'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
