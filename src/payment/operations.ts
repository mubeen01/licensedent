import * as z from 'zod';
import type {
  GenerateCheckoutSession,
  GetCustomerPortalUrl,
  GetMyDashboardScope,
  GetMyEffectiveAccess,
  GetMySubscription,
  GetMySubscriptionHistory,
  GetPlanAvailability,
} from 'wasp/server/operations';
import type { Subscription } from 'wasp/entities';
import { PaymentPlanId, paymentPlans } from '../payment/plans';
import { getEffectiveAccess, getUserDashboardScope, type DashboardScope, type EffectiveAccess } from './access';
import { paymentProcessor } from './paymentProcessor';
import { HttpError } from 'wasp/server';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

const generateCheckoutSessionSchema = z.object({
  planId: z.nativeEnum(PaymentPlanId),
  // Required for single-exam ('access', allExamsAccess: false) plans that don't imply
  // their own exam -- which Exam the student is buying access to. Ignored for
  // all-exams plans (Extended) and for implied-exam plans (Ireland Pathway), where the
  // exam is resolved server-side instead -- see impliedExamCode below.
  examId: z.string().optional(),
});

type GenerateCheckoutSessionInput = z.infer<typeof generateCheckoutSessionSchema>;

export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionInput,
  CheckoutSession
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const { planId: paymentPlanId, examId } = ensureArgsSchemaOrThrowHttpError(
    generateCheckoutSessionSchema,
    rawArgs
  );
  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    // If using the usernameAndPassword Auth method, switch to an Auth method that provides an email.
    throw new HttpError(403, 'User needs an email to make a payment.');
  }

  const paymentPlan = paymentPlans[paymentPlanId];
  const isSingleExamPlan = paymentPlan.effect.kind === 'access' && !paymentPlan.effect.allExamsAccess;
  const impliedExamCode = paymentPlan.effect.kind === 'access' ? paymentPlan.effect.impliedExamCode : undefined;

  // Resolved server-side, never trusting client-supplied examId for the final value --
  // for implied-exam plans (e.g. Ireland Pathway) the exam is fixed by the plan itself,
  // for other single-exam plans (Fast Track/Standard) it's the student's picked examId,
  // validated to actually exist either way.
  let resolvedExamId: string | undefined;
  if (isSingleExamPlan) {
    if (impliedExamCode) {
      const impliedExam = await context.entities.Exam.findFirst({ where: { code: impliedExamCode } });
      if (!impliedExam) {
        throw new HttpError(500, `Implied exam with code "${impliedExamCode}" not found.`);
      }
      resolvedExamId = impliedExam.id;
    } else {
      if (!examId) {
        throw new HttpError(400, 'Please choose which exam this plan is for.');
      }
      const exam = await context.entities.Exam.findUnique({ where: { id: examId } });
      if (!exam) {
        throw new HttpError(400, 'Selected exam not found.');
      }
      resolvedExamId = examId;
    }
  }

  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User,
    examId: resolvedExamId,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

// PRD-006 follow-up (2026-09-20 final launch audit): which plans currently
// have a real Stripe price id configured, vs. the OpenSaaS template's
// leftover placeholder or a genuinely unset env var. `getPaymentProcessorPlanId()`
// only distinguishes "unset" (throws) from "set" -- it can't tell a real price
// id apart from the placeholder, so PricingPage previously had to hardcode a
// per-plan disabled state (see git history on IrelandPathway's old guard) that
// someone had to remember to remove once a real id was configured. This
// re-checks live on every load instead, so the "Buy Now"/"Coming soon" state
// self-corrects the moment a real id is set in .env.server -- no code change
// needed at launch time. Never leaks the actual id, only a boolean per plan.
const PLACEHOLDER_STRIPE_PRICE_ID = '012345';

export const getPlanAvailability: GetPlanAvailability<void, Record<PaymentPlanId, boolean>> = async () => {
  const availability = {} as Record<PaymentPlanId, boolean>;
  for (const planId of Object.values(PaymentPlanId)) {
    try {
      const id = paymentPlans[planId].getPaymentProcessorPlanId();
      availability[planId] = Boolean(id) && id !== PLACEHOLDER_STRIPE_PRICE_ID;
    } catch {
      availability[planId] = false;
    }
  }
  return availability;
};

export const getCustomerPortalUrl: GetCustomerPortalUrl<void, string | null> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  // The portal URL is Stripe's own generic customer-lookup link -- it only
  // works for someone Stripe actually has a customer record for (set at real
  // checkout, see stripe/paymentProcessor.ts's createCheckoutSession). An
  // account whose access was granted manually (admin grant, no real Stripe
  // purchase) has no such record; sending them into that portal is a dead
  // end (Stripe can't find their email), not a working "manage billing"
  // flow. Returning null here lets the client show that honestly instead.
  const dbUser = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { paymentProcessorUserId: true },
  });
  if (!dbUser?.paymentProcessorUserId) {
    return null;
  }

  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User,
  });
};

// Most recent exam-access pass for the logged-in user, used by AccountPage to show plan
// name/expiry. Access-gating on practice/question endpoints is a separate feature — this
// only surfaces the record for display.
export type SubscriptionWithExam = Subscription & {
  examAccess: { code: string | null; flagEmoji: string | null; name: string } | null;
};

export const getMySubscription: GetMySubscription<void, SubscriptionWithExam | null> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  return context.entities.Subscription.findFirst({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
    include: { examAccess: { select: { code: true, flagEmoji: true, name: true } } },
  });
};

// Every exam-access pass ever purchased by the logged-in user, for BillingPage's
// history list — real purchase records, never fabricated invoice data.
export const getMySubscriptionHistory: GetMySubscriptionHistory<void, Subscription[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  return context.entities.Subscription.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
  });
};

// Client-side entitlement mirror of the server helper (1.2/1.3). Powers the
// upsell cards and the "X free questions left today" readout so the UI matches
// what the gated operations will actually allow. Never the source of truth by
// itself -- the server gates on getEffectiveAccess directly.
export const getMyEffectiveAccess: GetMyEffectiveAccess<void, EffectiveAccess> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return getEffectiveAccess(context.user.id, context.entities);
};

// PRD-002 Phase I4: which dashboard shell variant DashboardSidebar/
// DashboardHomePage should render -- deliberately its own query (not folded
// into getMyEffectiveAccess) since it needs the Exam entity for I3's
// getUserDashboardScope, which getMyEffectiveAccess's exam-blind counterpart
// getEffectiveAccess does not.
export const getMyDashboardScope: GetMyDashboardScope<void, DashboardScope> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return getUserDashboardScope(context.user.id, context.entities);
};
