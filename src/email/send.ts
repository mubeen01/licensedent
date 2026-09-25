// The one path every non-auth email takes (PRD-008 Phase 2):
//   dedupe → preferences/suppression → render with personal links → Resend → EmailLog.
// Wasp's own auth emails (verify/reset) still go through Wasp's emailSender;
// they only use the shared templates.
import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from 'wasp/server';
import { EMAIL_BRAND, EMAIL_REPLY_TO, EMAIL_SENDERS, type EmailCategory, siteUrl } from './brand';
import type { RenderedEmail } from './layout';

export type EmailLinks = { preferencesUrl: string | null; unsubscribeUrl: string | null };

type Db = Pick<PrismaClient, 'emailPreference' | 'emailLog'>;

export type SendEmailInput = {
  to: string;
  userId?: string | null;
  category: EmailCategory;
  template: string; // stable key, e.g. 'plan-expiring-7d'
  render: (links: EmailLinks) => RenderedEmail;
  dedupeKey?: string | null; // same key is never sent twice
  campaignId?: string | null;
  db?: Db;
};

export type SendEmailResult =
  | { status: 'sent'; providerId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

function serverUrl(path: string): string {
  const base = (process.env.WASP_SERVER_URL || 'http://localhost:3101').replace(/\/$/, '');
  return `${base}${path}`;
}

export function newPreferenceToken(): string {
  return randomBytes(24).toString('base64url');
}

// Takes the EmailPreference table itself (prisma.emailPreference or Wasp's
// context.entities.EmailPreference), so every caller shares one implementation.
export async function ensureEmailPreference(table: PrismaClient['emailPreference'], userId: string) {
  const existing = await table.findUnique({ where: { userId } });
  if (existing) return existing;
  try {
    return await table.create({ data: { userId, token: newPreferenceToken() } });
  } catch {
    // Created concurrently by another request.
    return table.findUniqueOrThrow({ where: { userId } });
  }
}

// Outside production, emails are logged but not delivered unless
// EMAIL_SEND_MODE=live, so a dev database full of real addresses can
// never be emailed by accident.
function deliveryEnabled(): boolean {
  if (process.env.EMAIL_SEND_MODE === 'live') return true;
  if (process.env.EMAIL_SEND_MODE === 'log') return false;
  return process.env.NODE_ENV === 'production';
}

function apiKeyFor(category: EmailCategory): string | undefined {
  return category === 'marketing' ? process.env.RESEND_MARKETING_API_KEY : process.env.RESEND_API_KEY;
}

// PRD-008 Phase 4: an admin previewing a campaign draft in their own inbox.
// Deliberately bypasses every gate sendEmail() enforces (consent,
// suppression, dedupe, dev-mode, postal-address) since none of them apply --
// there's no recipient consent to check when the "recipient" is the admin
// who just clicked "send test", and skipping dev-mode is the whole point
// (seeing the real render before it goes to real students). Never call this
// for anything a recipient didn't explicitly ask to receive right now.
export async function sendTestEmail(input: { to: string; category: EmailCategory; render: () => RenderedEmail }): Promise<SendEmailResult> {
  const apiKey = apiKeyFor(input.category);
  if (!apiKey) return { status: 'failed', error: `missing Resend API key for ${input.category}` };
  const rendered = input.render();
  const sender = EMAIL_SENDERS[input.category];
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${sender.name} <${sender.email}>`,
        to: [input.to],
        reply_to: EMAIL_REPLY_TO,
        subject: `[TEST] ${rendered.subject}`,
        html: rendered.html,
        text: rendered.text,
        tags: [
          { name: 'category', value: input.category },
          { name: 'test', value: 'true' },
        ],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !body.id) {
      return { status: 'failed', error: `Resend ${res.status}: ${body.message ?? 'unknown error'}` };
    }
    return { status: 'sent', providerId: body.id };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const db = input.db ?? (defaultPrisma as unknown as Db);
  const { to, userId, category, template } = input;

  if (input.dedupeKey) {
    const prior = await db.emailLog.findUnique({ where: { dedupeKey: input.dedupeKey }, select: { id: true } });
    if (prior) return { status: 'skipped', reason: 'already sent (dedupe)' };
  }

  let links: EmailLinks = { preferencesUrl: null, unsubscribeUrl: null };
  let skipReason: string | null = null;

  if (userId) {
    const pref = await ensureEmailPreference(db.emailPreference, userId);
    if (category !== 'transactional') {
      links = {
        preferencesUrl: siteUrl(`/email/preferences?token=${pref.token}`),
        unsubscribeUrl: siteUrl(`/email/preferences?token=${pref.token}&unsubscribe=${category}`),
      };
      if (pref.suppressedAt) skipReason = `suppressed (${pref.suppressedReason ?? 'bounce/complaint'})`;
      else if (category === 'lifecycle' && !pref.studyEmails) skipReason = 'study emails turned off';
      else if (category === 'marketing' && !pref.marketingOptIn) skipReason = 'not opted in to marketing';
    }
  } else if (category !== 'transactional') {
    skipReason = 'non-transactional email needs a user (for consent and unsubscribe)';
  }
  if (!skipReason && category === 'marketing' && !EMAIL_BRAND.postalAddress) {
    skipReason = 'marketing blocked: no postal address configured (PRD-008 E-D4)';
  }

  const rendered = input.render(links);
  const baseLog = {
    userId: userId ?? null,
    toEmail: to,
    category,
    template,
    subject: rendered.subject,
    dedupeKey: input.dedupeKey ?? null,
    campaignId: input.campaignId ?? null,
  };

  if (skipReason) {
    // Skips are logged without the dedupe key, so the automation can still send
    // later if the reason goes away (e.g. the student turns study emails back on).
    await db.emailLog.create({ data: { ...baseLog, dedupeKey: null, status: 'skipped', error: skipReason } });
    return { status: 'skipped', reason: skipReason };
  }

  // Claim the dedupe key first: a unique-constraint failure means a parallel run already has it.
  let log;
  try {
    log = await db.emailLog.create({ data: { ...baseLog, status: 'sending' } });
  } catch {
    return { status: 'skipped', reason: 'already sent (dedupe race)' };
  }

  if (!deliveryEnabled()) {
    await db.emailLog.update({ where: { id: log.id }, data: { status: 'skipped', error: 'dev mode: not delivered (set EMAIL_SEND_MODE=live)' } });
    console.log(`[email] (dev, not delivered) ${template} → ${to}: ${rendered.subject}`);
    return { status: 'skipped', reason: 'dev mode' };
  }

  const apiKey = apiKeyFor(category);
  if (!apiKey) {
    await db.emailLog.update({ where: { id: log.id }, data: { status: 'failed', error: 'missing Resend API key' } });
    return { status: 'failed', error: 'missing Resend API key' };
  }

  const sender = EMAIL_SENDERS[category];
  const headers: Record<string, string> = {};
  if (userId && category !== 'transactional') {
    const pref = await ensureEmailPreference(db.emailPreference, userId);
    // RFC 8058 one-click unsubscribe (required by Gmail/Yahoo for bulk senders).
    headers['List-Unsubscribe'] = `<${serverUrl(`/email/unsubscribe?token=${pref.token}&c=${category}`)}>, <mailto:${EMAIL_REPLY_TO}?subject=unsubscribe>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': log.id },
      body: JSON.stringify({
        from: `${sender.name} <${sender.email}>`,
        to: [to],
        reply_to: EMAIL_REPLY_TO,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers,
        tags: [
          { name: 'category', value: category },
          { name: 'template', value: template.replace(/[^A-Za-z0-9_-]/g, '_') },
        ],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !body.id) {
      const error = `Resend ${res.status}: ${body.message ?? 'unknown error'}`;
      await db.emailLog.update({ where: { id: log.id }, data: { status: 'failed', error, dedupeKey: null } });
      return { status: 'failed', error };
    }
    await db.emailLog.update({ where: { id: log.id }, data: { status: 'sent', providerId: body.id } });
    return { status: 'sent', providerId: body.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db.emailLog.update({ where: { id: log.id }, data: { status: 'failed', error, dedupeKey: null } });
    return { status: 'failed', error };
  }
}
