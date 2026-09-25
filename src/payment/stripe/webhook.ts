import { type MiddlewareConfigFn, HttpError, prisma } from 'wasp/server';
import { type PaymentsWebhook } from 'wasp/server/api';
import { type PrismaClient, type SubscriptionPlanType as PrismaSubscriptionPlanType } from '@prisma/client';
import express from 'express';
import type { Stripe } from 'stripe';
import { stripe } from './stripeClient';
import { paymentPlans, PaymentPlanId, SubscriptionStatus, getPlanPrice, prettyPaymentPlanName, type PaymentPlanEffect } from '../plans';
import { updateUserStripePaymentDetails } from './paymentDetails';
import { assertUnreachable } from '../../shared/utils';
import { requireNodeEnvVar } from '../../server/utils';
import { effectiveExpiryOf } from '../access';
import { sendEmail } from '../../email/send';
import { planActivatedTemplate } from '../../email/templates';
import { createNotification } from '../../notifications/operations';
import {
  parseWebhookPayload,
  type InvoicePaidData,
  type SessionCompletedData,
  type SubscriptionDeletedData,
  type SubscriptionUpdatedData,
} from './webhookPayload';
import { UnhandledWebhookEventError } from '../errors';

export const stripeWebhook: PaymentsWebhook = async (request, response, context) => {
  try {
    const rawStripeEvent = constructStripeEvent(request);
    const { eventName, data } = await parseWebhookPayload(rawStripeEvent);
    const prismaUserDelegate = context.entities.User;
    const prismaSubscriptionDelegate = context.entities.Subscription;
    switch (eventName) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data, prismaUserDelegate, prismaSubscriptionDelegate);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(data, prismaUserDelegate);
        break;
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(data, prismaUserDelegate);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(data, prismaUserDelegate);
        break;
      default:
        // If you'd like to handle more events, you can add more cases above.
        // When deploying your app, you configure your webhook in the Stripe dashboard to only send the events that you're
        // handling above and that are necessary for the functioning of your app. See: https://docs.opensaas.sh/guides/deploying/#setting-up-your-stripe-webhook
        // In development, it is likely that you will receive other events that you are not handling, and that's fine. These can be ignored without any issues.
        assertUnreachable(eventName);
    }
    return response.json({ received: true }); // Stripe expects a 200 response to acknowledge receipt of the webhook
  } catch (err) {
    if (err instanceof UnhandledWebhookEventError) {
      console.error(err.message);
      return response.status(422).json({ error: err.message });
    }

    console.error('Webhook error:', err);
    if (err instanceof HttpError) {
      return response.status(err.statusCode).json({ error: err.message });
    } else {
      return response.status(400).json({ error: 'Error processing Stripe webhook event' });
    }
  }
};

function constructStripeEvent(request: express.Request): Stripe.Event {
  try {
    const secret = requireNodeEnvVar('STRIPE_WEBHOOK_SECRET');
    const sig = request.headers['stripe-signature'];
    if (!sig) {
      throw new HttpError(400, 'Stripe webhook signature not provided');
    }
    return stripe.webhooks.constructEvent(request.body, sig, secret);
  } catch (err) {
    throw new HttpError(500, 'Error constructing Stripe webhook event');
  }
}

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // We need to delete the default 'express.json' middleware and replace it with 'express.raw' middleware
  // because webhook data in the body of the request as raw JSON, not as JSON in the body of the request.
  middlewareConfig.delete('express.json');
  middlewareConfig.set('express.raw', express.raw({ type: 'application/json' }));
  return middlewareConfig;
};

// Here we only update the user's payment details, and confirm credits because Stripe does not send invoices for one-time payments.
// NOTE: If you're accepting async payment methods like bank transfers or SEPA and not just card payments
// which are synchronous, checkout session completed could potentially result in a pending payment.
// If so, use the checkout.session.async_payment_succeeded event to confirm the payment.
async function handleCheckoutSessionCompleted(
  session: SessionCompletedData,
  prismaUserDelegate: PrismaClient['user'],
  prismaSubscriptionDelegate: PrismaClient['subscription']
) {
  const isSuccessfulOneTimePayment = session.mode === 'payment' && session.payment_status === 'paid';
  if (isSuccessfulOneTimePayment) {
    await saveSuccessfulOneTimePayment(session, prismaUserDelegate, prismaSubscriptionDelegate);
  }
}

async function saveSuccessfulOneTimePayment(
  session: SessionCompletedData,
  prismaUserDelegate: PrismaClient['user'],
  prismaSubscriptionDelegate: PrismaClient['subscription']
) {
  const userStripeId = session.customer;
  const lineItems = await getCheckoutLineItemsBySessionId(session.id);
  const lineItemPriceId = extractPriceId(lineItems);
  const planId = getPlanIdByPriceId(lineItemPriceId);
  const plan = paymentPlans[planId];
  const { subscriptionPlan, numOfCreditsPurchased, accessGrant } = getPlanEffectPaymentDetails({
    planId,
    planEffect: plan.effect,
  });
  const user = await updateUserStripePaymentDetails(
    {
      userStripeId,
      numOfCreditsPurchased,
      datePaid: new Date(),
      subscriptionPlan,
      subscriptionStatus: subscriptionPlan ? SubscriptionStatus.Active : undefined,
    },
    prismaUserDelegate
  );
  if (accessGrant) {
    // PaymentPlanId's string values ('fast_track'/'standard'/'extended') are kept in sync
    // with schema.prisma's SubscriptionPlanType enum values.
    // examId comes back from the checkout session's metadata (set in checkoutUtils.ts,
    // from the exam the student picked on PricingPage) -- only meaningful for single-exam
    // plans. Sessions created before this metadata existed simply have none, so
    // examAccessId falls back to null rather than failing the whole payment record.
    const subscription = await prismaSubscriptionDelegate.create({
      data: {
        userId: user.id,
        planType: planId as unknown as PrismaSubscriptionPlanType,
        durationDays: accessGrant.durationDays,
        allExamsAccess: accessGrant.allExamsAccess,
        examAccessId: accessGrant.allExamsAccess ? undefined : (session.metadata?.examId ?? undefined),
        source: 'payment',
      },
    });
    // PRD-008 Phase 3: best-effort only. A real purchase (already saved above)
    // must never be undone or blocked by a mail failure.
    await notifyPlanActivated(user, subscription, planId).catch((err) => {
      console.error('[stripe] plan-activated email failed:', err);
    });
  }
  return user;
}

async function notifyPlanActivated(
  user: { id: string; email: string | null },
  subscription: { id: string; createdAt: Date; durationDays: number; expiresAt: Date | null; allExamsAccess: boolean; examAccessId: string | null },
  planId: PaymentPlanId
) {
  const examLabel = subscription.allExamsAccess
    ? 'all exams'
    : subscription.examAccessId
      ? ((await prisma.exam.findUnique({ where: { id: subscription.examAccessId }, select: { name: true } }))?.name ?? 'your exam')
      : 'your exam';

  try {
    await createNotification(
      { Notification: prisma.notification },
      {
        userId: user.id,
        type: 'plan_activated',
        title: `${prettyPaymentPlanName(planId)} is active`,
        body: `You now have access to ${examLabel}. Good luck with your prep!`,
        link: '/dashboard',
      }
    );
  } catch (err) {
    console.error('[stripe] plan-activated notification row failed:', err);
  }

  if (!user.email) return;
  await sendEmail({
    to: user.email,
    userId: user.id,
    category: 'transactional',
    template: 'plan-activated',
    dedupeKey: `plan-activated:${subscription.id}`,
    render: () =>
      planActivatedTemplate({
        email: user.email!,
        planName: prettyPaymentPlanName(planId),
        examLabel,
        validUntil: effectiveExpiryOf(subscription),
        amountPaid: getPlanPrice(planId),
      }),
  });
}

// This is called when a subscription is successfully purchased or renewed and payment succeeds.
// Invoices are not created for one-time payments, so we handle them above.
async function handleInvoicePaid(invoice: InvoicePaidData, prismaUserDelegate: PrismaClient['user']) {
  await saveActiveSubscription(invoice, prismaUserDelegate);
}

async function saveActiveSubscription(invoice: InvoicePaidData, prismaUserDelegate: PrismaClient['user']) {
  const userStripeId = invoice.customer;
  const datePaid = new Date(invoice.period_start * 1000);
  const priceId = extractPriceId(invoice.lines);
  const subscriptionPlan = getPlanIdByPriceId(priceId);
  return updateUserStripePaymentDetails(
    { userStripeId, datePaid, subscriptionPlan, subscriptionStatus: SubscriptionStatus.Active },
    prismaUserDelegate
  );
}

async function handleCustomerSubscriptionUpdated(
  subscription: SubscriptionUpdatedData,
  prismaUserDelegate: PrismaClient['user']
) {
  const userStripeId = subscription.customer;
  let subscriptionStatus: SubscriptionStatus | undefined;
  const priceId = extractPriceId(subscription.items);
  const subscriptionPlan = getPlanIdByPriceId(priceId);

  // There are other subscription statuses, such as `trialing` that we are not handling and simply ignore
  // If you'd like to handle more statuses, you can add more cases above. Make sure to update the `SubscriptionStatus` type in `payment/plans.ts` as well.
  if (subscription.status === SubscriptionStatus.Active) {
    subscriptionStatus = subscription.cancel_at_period_end
      ? SubscriptionStatus.CancelAtPeriodEnd
      : SubscriptionStatus.Active;
  } else if (subscription.status === SubscriptionStatus.PastDue) {
    subscriptionStatus = SubscriptionStatus.PastDue;
  }
  if (subscriptionStatus) {
    const user = await updateUserStripePaymentDetails(
      { userStripeId, subscriptionPlan, subscriptionStatus },
      prismaUserDelegate
    );
    // (An OpenSaaS template "We hate to see you go... sweet offer" email used
    // to be sent here on cancel_at_period_end. LicenseDent sells one-time
    // passes, so this path shouldn't fire, but a placeholder email must never
    // reach a real customer if it ever does. Removed 2026-09-24.)
    return user;
  }
}

async function handleCustomerSubscriptionDeleted(
  subscription: SubscriptionDeletedData,
  prismaUserDelegate: PrismaClient['user']
) {
  const userStripeId = subscription.customer;
  return updateUserStripePaymentDetails(
    { userStripeId, subscriptionStatus: SubscriptionStatus.Deleted },
    prismaUserDelegate
  );
}

// We only expect one line item, but if you set up a product with multiple prices, you should change this function to handle them.
function extractPriceId(
  items: Stripe.ApiList<Stripe.LineItem> | SubscriptionUpdatedData['items'] | InvoicePaidData['lines']
): string {
  if (items.data.length === 0) {
    throw new HttpError(400, 'No items in stripe event object');
  }
  if (items.data.length > 1) {
    throw new HttpError(400, 'More than one item in stripe event object');
  }
  const item = items.data[0];

  // The 'price' property is found on SubscriptionItem and LineItem.
  if ('price' in item && item.price?.id) {
    return item.price.id;
  }

  // The 'pricing' property is found on InvoiceLineItem.
  if ('pricing' in item) {
    const priceId = item.pricing?.price_details?.price;
    if (priceId) {
      return priceId;
    }
  }
  throw new HttpError(400, 'Unable to extract price id from item');
}

async function getCheckoutLineItemsBySessionId(sessionId: string) {
  const { line_items } = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });
  if (!line_items) {
    throw new HttpError(400, 'No line items found in checkout session');
  }
  return line_items;
}

function getPlanIdByPriceId(priceId: string): PaymentPlanId {
  const planId = Object.values(PaymentPlanId).find(
    (planId) => paymentPlans[planId].getPaymentProcessorPlanId() === priceId
  );
  if (!planId) {
    throw new Error(`No plan with Stripe price id ${priceId}`);
  }
  return planId;
}

function getPlanEffectPaymentDetails({
  planId,
  planEffect,
}: {
  planId: PaymentPlanId;
  planEffect: PaymentPlanEffect;
}): {
  subscriptionPlan: PaymentPlanId | undefined;
  numOfCreditsPurchased: number | undefined;
  accessGrant: { durationDays: number; allExamsAccess: boolean } | undefined;
} {
  switch (planEffect.kind) {
    case 'subscription':
      return { subscriptionPlan: planId, numOfCreditsPurchased: undefined, accessGrant: undefined };
    case 'credits':
      return { subscriptionPlan: undefined, numOfCreditsPurchased: planEffect.amount, accessGrant: undefined };
    case 'access':
      return {
        subscriptionPlan: planId,
        numOfCreditsPurchased: undefined,
        accessGrant: { durationDays: planEffect.durationDays, allExamsAccess: planEffect.allExamsAccess },
      };
    default:
      assertUnreachable(planEffect);
  }
}
