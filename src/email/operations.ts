import { createHmac, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { HttpError, type MiddlewareConfigFn } from 'wasp/server';
import type {
  GetEmailPreferencesByToken,
  GetMyEmailPreferences,
  UpdateEmailPreferencesByToken,
  UpdateMyEmailPreferences,
} from 'wasp/server/operations';
import type { EmailUnsubscribeOneClick, ResendWebhook } from 'wasp/server/api';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { ensureEmailPreference } from './send';

export type EmailPreferencesView = {
  email: string; // masked on the public (token) page
  marketingOptIn: boolean;
  studyEmails: boolean;
  suppressed: boolean;
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

const tokenSchema = z.object({ token: z.string().min(20).max(100) });
const updateSchema = z.object({
  marketingOptIn: z.boolean().optional(),
  studyEmails: z.boolean().optional(),
});

function toView(
  pref: { marketingOptIn: boolean; studyEmails: boolean; suppressedAt: Date | null },
  email: string
): EmailPreferencesView {
  return { email, marketingOptIn: pref.marketingOptIn, studyEmails: pref.studyEmails, suppressed: !!pref.suppressedAt };
}

function changes(input: z.infer<typeof updateSchema>, current: { marketingOptIn: boolean }) {
  return {
    ...(input.studyEmails !== undefined && { studyEmails: input.studyEmails }),
    ...(input.marketingOptIn !== undefined && {
      marketingOptIn: input.marketingOptIn,
      ...(input.marketingOptIn && !current.marketingOptIn && { marketingOptInAt: new Date() }),
    }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Public (token) — the links in every email; no login needed                */
/* -------------------------------------------------------------------------- */

export const getEmailPreferencesByToken: GetEmailPreferencesByToken<{ token: string }, EmailPreferencesView> = async (
  rawArgs,
  context
) => {
  const { token } = ensureArgsSchemaOrThrowHttpError(tokenSchema, rawArgs);
  const pref = await context.entities.EmailPreference.findUnique({ where: { token }, include: { user: { select: { email: true } } } });
  if (!pref) throw new HttpError(404, 'This link is not valid anymore.');
  return toView(pref, maskEmail(pref.user.email ?? ''));
};

export const updateEmailPreferencesByToken: UpdateEmailPreferencesByToken<
  { token: string; marketingOptIn?: boolean; studyEmails?: boolean },
  EmailPreferencesView
> = async (rawArgs, context) => {
  const { token, ...rest } = ensureArgsSchemaOrThrowHttpError(tokenSchema.merge(updateSchema), rawArgs);
  const pref = await context.entities.EmailPreference.findUnique({ where: { token }, include: { user: { select: { email: true } } } });
  if (!pref) throw new HttpError(404, 'This link is not valid anymore.');
  const updated = await context.entities.EmailPreference.update({ where: { id: pref.id }, data: changes(rest, pref) });
  return toView(updated, maskEmail(pref.user.email ?? ''));
};

/* -------------------------------------------------------------------------- */
/*  Logged-in (Account page, onboarding opt-in)                               */
/* -------------------------------------------------------------------------- */

export const getMyEmailPreferences: GetMyEmailPreferences<void, EmailPreferencesView> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  const pref = await ensureEmailPreference(context.entities.EmailPreference, context.user.id);
  return toView(pref, context.user.email ?? '');
};

export const updateMyEmailPreferences: UpdateMyEmailPreferences<
  { marketingOptIn?: boolean; studyEmails?: boolean },
  EmailPreferencesView
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);
  const input = ensureArgsSchemaOrThrowHttpError(updateSchema, rawArgs);
  const pref = await ensureEmailPreference(context.entities.EmailPreference, context.user.id);
  const updated = await context.entities.EmailPreference.update({ where: { id: pref.id }, data: changes(input, pref) });
  return toView(updated, context.user.email ?? '');
};

/* -------------------------------------------------------------------------- */
/*  RFC 8058 one-click unsubscribe (POST from Gmail/Yahoo/Apple Mail)         */
/* -------------------------------------------------------------------------- */

export const emailUnsubscribeOneClick: EmailUnsubscribeOneClick = async (req, res, context) => {
  const token = String(req.query.token ?? '');
  const category = String(req.query.c ?? 'marketing');
  const pref = token ? await context.entities.EmailPreference.findUnique({ where: { token } }) : null;
  if (pref) {
    await context.entities.EmailPreference.update({
      where: { id: pref.id },
      data: category === 'lifecycle' ? { studyEmails: false } : { marketingOptIn: false },
    });
  }
  // Always 200: mail clients don't show errors, and a bad token must not leak anything.
  res.status(200).send('Unsubscribed');
};

export const emailUnsubscribeMiddlewareConfigFn: MiddlewareConfigFn = (config) => {
  // Mail clients POST "List-Unsubscribe=One-Click" as form data.
  config.set('express.urlencoded', express.urlencoded({ extended: false }));
  return config;
};

/* -------------------------------------------------------------------------- */
/*  Resend webhook: delivery events + automatic suppression                   */
/* -------------------------------------------------------------------------- */

// Resend signs webhooks with Svix: HMAC-SHA256 over "id.timestamp.body" using
// the base64 key after "whsec_"; the header holds space-separated "v1,<sig>".
function verifySvix(body: string, headers: express.Request['headers'], secret: string): boolean {
  const id = String(headers['svix-id'] ?? '');
  const ts = String(headers['svix-timestamp'] ?? '');
  const sigHeader = String(headers['svix-signature'] ?? '');
  if (!id || !ts || !sigHeader) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest();
  return sigHeader.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) return false;
    const given = Buffer.from(sig, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

type ResendEvent = {
  type: string;
  created_at?: string;
  data?: { email_id?: string; to?: string[]; bounce?: { type?: string } };
};

export const resendWebhook: ResendWebhook = async (req, res, context) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!secret || !verifySvix(raw, req.headers, secret)) {
    return res.status(401).json({ error: 'invalid signature' });
  }
  let event: ResendEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'invalid body' });
  }

  const at = event.created_at ? new Date(event.created_at) : new Date();
  const providerId = event.data?.email_id;
  const field: Record<string, 'deliveredAt' | 'openedAt' | 'clickedAt' | 'bouncedAt' | 'complainedAt'> = {
    'email.delivered': 'deliveredAt',
    'email.opened': 'openedAt',
    'email.clicked': 'clickedAt',
    'email.bounced': 'bouncedAt',
    'email.complained': 'complainedAt',
  };
  const column = field[event.type];
  if (providerId && column) {
    // Keep the FIRST open/click time; later events don't overwrite it.
    await context.entities.EmailLog.updateMany({ where: { providerId, [column]: null }, data: { [column]: at } });
  }

  // Hard bounces and spam complaints stop every non-essential email to that person.
  const isHardBounce = event.type === 'email.bounced' && (event.data?.bounce?.type ?? 'Permanent') === 'Permanent';
  if (isHardBounce || event.type === 'email.complained') {
    for (const address of event.data?.to ?? []) {
      const user = await context.entities.User.findFirst({ where: { email: { equals: address, mode: 'insensitive' } }, select: { id: true } });
      if (!user) continue;
      const pref = await ensureEmailPreference(context.entities.EmailPreference, user.id);
      await context.entities.EmailPreference.update({
        where: { id: pref.id },
        data: {
          suppressedAt: at,
          suppressedReason: event.type === 'email.complained' ? 'spam complaint' : 'hard bounce',
          ...(event.type === 'email.complained' && { marketingOptIn: false }),
        },
      });
    }
  }
  return res.status(200).json({ received: true });
};

export const resendWebhookMiddlewareConfigFn: MiddlewareConfigFn = (config) => {
  // Signature is computed over the exact raw bytes.
  config.delete('express.json');
  config.set('express.raw', express.raw({ type: 'application/json' }));
  return config;
};
