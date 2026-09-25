import { type EmailCampaign } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { sendEmailCampaignJob } from 'wasp/server/jobs';
import {
  type CancelScheduledCampaign,
  type CreateEmailCampaign,
  type DeleteEmailCampaign,
  type GetCampaignAudienceCount,
  type GetEmailCampaignById,
  type GetEmailCampaignSendLog,
  type GetEmailCampaigns,
  type GetEmailTemplateGallery,
  type PreviewCampaignEmail,
  type ScheduleEmailCampaign,
  type SendEmailCampaignNow,
  type SendTestCampaignEmail,
  type UpdateEmailCampaign,
} from 'wasp/server/operations';
import * as z from 'zod';
import { type CampaignAudienceFilter, resolveCampaignAudience } from '../../../email/campaignSend';
import { sendTestEmail } from '../../../email/send';
import { campaignTemplate, templateGallery } from '../../../email/templates';
import { PaymentPlanId } from '../../../payment/plans';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

const audienceFilterSchema = z.object({
  audienceExamId: z.string().nonempty().nullable().optional(),
  audiencePlanType: z.nativeEnum(PaymentPlanId).nullable().optional(),
  audienceAccess: z.enum(['any', 'active', 'free']).nullable().optional(),
  audienceCountry: z.string().trim().nonempty().nullable().optional(),
});

const campaignInputSchema = z
  .object({
    subject: z.string().trim().min(1, 'Subject is required').max(200),
    preheader: z.string().trim().min(1, 'Preheader is required').max(200),
    heading: z.string().trim().min(1, 'Heading is required').max(200),
    bodyMarkdown: z.string().trim().min(1, 'Body is required'),
  })
  .merge(audienceFilterSchema);
type CampaignInput = z.infer<typeof campaignInputSchema>;

/* -------------------------------------------------------------------------- */
/*  Stats: read live from EmailLog, never duplicated on EmailCampaign itself  */
/* -------------------------------------------------------------------------- */

export type CampaignStats = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
};

const EMPTY_STATS: CampaignStats = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };

function tallyStats(
  logs: { campaignId: string | null; status: string; deliveredAt: Date | null; openedAt: Date | null; clickedAt: Date | null; bouncedAt: Date | null; complainedAt: Date | null }[]
): Map<string, CampaignStats> {
  const byId = new Map<string, CampaignStats>();
  for (const log of logs) {
    if (!log.campaignId) continue;
    const s = byId.get(log.campaignId) ?? { ...EMPTY_STATS };
    if (log.status === 'sent') s.sent += 1;
    if (log.deliveredAt) s.delivered += 1;
    if (log.openedAt) s.opened += 1;
    if (log.clickedAt) s.clicked += 1;
    if (log.bouncedAt) s.bounced += 1;
    if (log.complainedAt) s.complained += 1;
    byId.set(log.campaignId, s);
  }
  return byId;
}

export type EmailCampaignWithStats = EmailCampaign & {
  audienceExam: { id: string; name: string } | null;
  stats: CampaignStats;
};

export const getEmailCampaigns: GetEmailCampaigns<void, EmailCampaignWithStats[]> = async (_args, context) => {
  ensureAdmin(context.user);
  const campaigns = await context.entities.EmailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { audienceExam: { select: { id: true, name: true } } },
  });
  const logs = await context.entities.EmailLog.findMany({
    where: { campaignId: { in: campaigns.map((c) => c.id) } },
    select: { campaignId: true, status: true, deliveredAt: true, openedAt: true, clickedAt: true, bouncedAt: true, complainedAt: true },
  });
  const statsById = tallyStats(logs);
  return campaigns.map((c) => ({ ...c, stats: statsById.get(c.id) ?? { ...EMPTY_STATS } }));
};

const campaignIdInputSchema = z.object({ campaignId: z.string().nonempty() });
type CampaignIdInput = z.infer<typeof campaignIdInputSchema>;

export const getEmailCampaignById: GetEmailCampaignById<CampaignIdInput, EmailCampaignWithStats> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId } = ensureArgsSchemaOrThrowHttpError(campaignIdInputSchema, rawArgs);
  const campaign = await context.entities.EmailCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { audienceExam: { select: { id: true, name: true } } },
  });
  const logs = await context.entities.EmailLog.findMany({
    where: { campaignId },
    select: { campaignId: true, status: true, deliveredAt: true, openedAt: true, clickedAt: true, bouncedAt: true, complainedAt: true },
  });
  return { ...campaign, stats: tallyStats(logs).get(campaignId) ?? { ...EMPTY_STATS } };
};

// The send log: one row per recipient, for "who actually got this."
export type CampaignSendLogRow = {
  id: string;
  toEmail: string;
  status: string;
  error: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  bouncedAt: Date | null;
  complainedAt: Date | null;
};

export const getEmailCampaignSendLog: GetEmailCampaignSendLog<CampaignIdInput, CampaignSendLogRow[]> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId } = ensureArgsSchemaOrThrowHttpError(campaignIdInputSchema, rawArgs);
  return context.entities.EmailLog.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      toEmail: true,
      status: true,
      error: true,
      createdAt: true,
      deliveredAt: true,
      openedAt: true,
      clickedAt: true,
      bouncedAt: true,
      complainedAt: true,
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  Template gallery: visual QA for every template the app sends, real       */
/*  sample data, no DB writes -- see templates.ts's own gallery() function.  */
/* -------------------------------------------------------------------------- */

export type TemplateGalleryEntry = { id: string; label: string; category: string; subject: string; html: string };

export const getEmailTemplateGallery: GetEmailTemplateGallery<void, TemplateGalleryEntry[]> = async (_args, context) => {
  ensureAdmin(context.user);
  return templateGallery().map((t) => ({ id: t.id, label: t.label, category: t.category, subject: t.email.subject, html: t.email.html }));
};

const previewInputSchema = z.object({
  subject: z.string().default(''),
  preheader: z.string().default(''),
  heading: z.string().default(''),
  bodyMarkdown: z.string().default(''),
});
type PreviewInput = z.infer<typeof previewInputSchema>;

// Renders the composer's current (possibly unsaved) content through the real
// campaignTemplate() -- no DB write, so it's safe to call on every keystroke
// (debounced client-side). Sample recipient data only.
export const previewCampaignEmail: PreviewCampaignEmail<PreviewInput, { html: string }> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(previewInputSchema, rawArgs);
  const rendered = campaignTemplate({
    email: 'preview@example.com',
    name: 'Aisha Rahman',
    subject: args.subject || '(no subject yet)',
    preheader: args.preheader,
    heading: args.heading || '(no heading yet)',
    bodyMarkdown: args.bodyMarkdown || '_Nothing written yet._',
  });
  return { html: rendered.html };
};

/* -------------------------------------------------------------------------- */
/*  Audience: the same resolver the real send job uses, so the live count    */
/*  an admin sees while composing is never out of step with who gets it.     */
/* -------------------------------------------------------------------------- */

export const getCampaignAudienceCount: GetCampaignAudienceCount<CampaignAudienceFilter, { count: number }> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const filter = ensureArgsSchemaOrThrowHttpError(audienceFilterSchema, rawArgs);
  const audience = await resolveCampaignAudience(filter, context.entities);
  return { count: audience.length };
};

/* -------------------------------------------------------------------------- */
/*  CRUD -- drafts only; a scheduled/sending/sent campaign is frozen so the   */
/*  audience count an admin saw before sending can't silently drift.         */
/* -------------------------------------------------------------------------- */

export const createEmailCampaign: CreateEmailCampaign<CampaignInput, EmailCampaign> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(campaignInputSchema, rawArgs);

  const campaign = await context.entities.EmailCampaign.create({
    data: { ...args, createdById: context.user!.id },
  });

  await logAdminAction(context, {
    action: 'emailCampaign.create',
    entityType: 'EmailCampaign',
    entityId: campaign.id,
    details: { subject: campaign.subject },
  });

  return campaign;
};

const updateInputSchema = campaignInputSchema.extend({ id: z.string().nonempty() });
type UpdateInput = z.infer<typeof updateInputSchema>;

export const updateEmailCampaign: UpdateEmailCampaign<UpdateInput, EmailCampaign> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id, ...rest } = ensureArgsSchemaOrThrowHttpError(updateInputSchema, rawArgs);

  const existing = await context.entities.EmailCampaign.findUniqueOrThrow({ where: { id } });
  if (existing.status !== 'draft') {
    throw new HttpError(400, 'Only a draft campaign can be edited. Cancel it back to draft first.');
  }

  const updated = await context.entities.EmailCampaign.update({ where: { id }, data: rest });

  await logAdminAction(context, { action: 'emailCampaign.update', entityType: 'EmailCampaign', entityId: id });

  return updated;
};

export const deleteEmailCampaign: DeleteEmailCampaign<CampaignIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId } = ensureArgsSchemaOrThrowHttpError(campaignIdInputSchema, rawArgs);

  const existing = await context.entities.EmailCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (existing.status !== 'draft') {
    throw new HttpError(400, 'Only a draft campaign can be deleted.');
  }
  await context.entities.EmailCampaign.delete({ where: { id: campaignId } });

  await logAdminAction(context, { action: 'emailCampaign.delete', entityType: 'EmailCampaign', entityId: campaignId, details: { subject: existing.subject } });
};

/* -------------------------------------------------------------------------- */
/*  Test send: previews in a real inbox, never touches the real audience.    */
/* -------------------------------------------------------------------------- */

const testSendInputSchema = z.object({ campaignId: z.string().nonempty(), testEmail: z.string().email() });
type TestSendInput = z.infer<typeof testSendInputSchema>;

export const sendTestCampaignEmail: SendTestCampaignEmail<TestSendInput, { status: string; error?: string }> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId, testEmail } = ensureArgsSchemaOrThrowHttpError(testSendInputSchema, rawArgs);
  const campaign = await context.entities.EmailCampaign.findUniqueOrThrow({ where: { id: campaignId } });

  const result = await sendTestEmail({
    to: testEmail,
    category: 'marketing',
    render: () =>
      campaignTemplate({
        email: testEmail,
        name: context.user!.username,
        subject: campaign.subject,
        preheader: campaign.preheader,
        heading: campaign.heading,
        bodyMarkdown: campaign.bodyMarkdown,
      }),
  });
  return result.status === 'failed' ? { status: result.status, error: result.error } : { status: result.status };
};

/* -------------------------------------------------------------------------- */
/*  Send now / schedule / cancel -- the real audience, via the shared job     */
/*  (src/email/campaignSend.ts) so composing, sending and the daily          */
/*  automations job all go through the exact same sendEmail() pipeline.      */
/* -------------------------------------------------------------------------- */

function ensureCanSend(campaign: EmailCampaign) {
  if (campaign.status !== 'draft') {
    throw new HttpError(400, `This campaign is already ${campaign.status}.`);
  }
}

export const sendEmailCampaignNow: SendEmailCampaignNow<CampaignIdInput, EmailCampaign> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId } = ensureArgsSchemaOrThrowHttpError(campaignIdInputSchema, rawArgs);
  const campaign = await context.entities.EmailCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  ensureCanSend(campaign);

  const updated = await context.entities.EmailCampaign.update({ where: { id: campaignId }, data: { status: 'sending' } });
  await sendEmailCampaignJob.submit({ campaignId });

  await logAdminAction(context, { action: 'emailCampaign.sendNow', entityType: 'EmailCampaign', entityId: campaignId });
  return updated;
};

const scheduleInputSchema = z.object({ campaignId: z.string().nonempty(), scheduledAt: z.coerce.date() });
type ScheduleInput = z.infer<typeof scheduleInputSchema>;

export const scheduleEmailCampaign: ScheduleEmailCampaign<ScheduleInput, EmailCampaign> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId, scheduledAt } = ensureArgsSchemaOrThrowHttpError(scheduleInputSchema, rawArgs);
  if (scheduledAt.getTime() <= Date.now()) {
    throw new HttpError(400, 'Pick a time in the future.');
  }
  const campaign = await context.entities.EmailCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  ensureCanSend(campaign);

  const updated = await context.entities.EmailCampaign.update({ where: { id: campaignId }, data: { status: 'scheduled', scheduledAt } });
  await sendEmailCampaignJob.delay(scheduledAt).submit({ campaignId });

  await logAdminAction(context, { action: 'emailCampaign.schedule', entityType: 'EmailCampaign', entityId: campaignId, details: { scheduledAt: scheduledAt.toISOString() } });
  return updated;
};

// The already-submitted pg-boss job still fires at its scheduled time, but
// sendEmailCampaignJob re-checks status right before sending and no-ops on
// anything that isn't still `sending`/`scheduled` -- see campaignSend.ts.
export const cancelScheduledCampaign: CancelScheduledCampaign<CampaignIdInput, EmailCampaign> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { campaignId } = ensureArgsSchemaOrThrowHttpError(campaignIdInputSchema, rawArgs);
  const campaign = await context.entities.EmailCampaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (campaign.status !== 'scheduled') {
    throw new HttpError(400, 'Only a scheduled campaign can be cancelled back to draft.');
  }

  const updated = await context.entities.EmailCampaign.update({ where: { id: campaignId }, data: { status: 'draft', scheduledAt: null } });
  await logAdminAction(context, { action: 'emailCampaign.cancelSchedule', entityType: 'EmailCampaign', entityId: campaignId });
  return updated;
};
