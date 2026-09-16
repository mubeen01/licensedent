import * as z from 'zod';
import type {
  GenerateCheckoutSession,
  GetCustomerPortalUrl,
  GetMyEffectiveAccess,
  GetMySubscription,
  GetMySubscriptionHistory,
} from 'wasp/server/operations';
import type { Subscription } from 'wasp/entities';
import { PaymentPlanId, paymentPlans } from '../payment/plans';
import { getEffectiveAccess, type EffectiveAccess } from './access';
import { paymentProcessor } from './paymentProcessor';
import { HttpError } from 'wasp/server';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

const generateCheckoutSessionSchema = z.object({
  planId: z.nativeEnum(PaymentPlanId),
  // Required for single-exam ('access', allExamsAccess: false) plans -- which Exam the
  // student is buying access to. Ignored for the Extended plan (all exams).
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

  if (isSingleExamPlan) {
    if (!examId) {
      throw new HttpError(400, 'Please choose which exam this plan is for.');
    }
    const exam = await context.entities.Exam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new HttpError(400, 'Selected exam not found.');
    }
  }

  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User,
    examId: isSingleExamPlan ? examId : undefined,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

export const getCustomerPortalUrl: GetCustomerPortalUrl<void, string | null> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
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
