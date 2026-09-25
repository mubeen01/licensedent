// PRD-008 Phase 4: campaign audience resolution + the actual send job.
// Shared by the admin's live audience count (query) and the real send (job)
// so "how many will this reach" and "who actually got it" can never drift.
import type { PrismaClient } from '@prisma/client';
import { effectiveExpiryOf } from '../payment/access';
import { sendEmail } from './send';
import { campaignTemplate } from './templates';

export type CampaignAudienceFilter = {
  audienceExamId?: string | null;
  audiencePlanType?: string | null;
  audienceAccess?: string | null; // 'any' | 'active' | 'free'
  audienceCountry?: string | null;
};

type SubRow = {
  planType: string;
  createdAt: Date;
  durationDays: number;
  expiresAt: Date | null;
  allExamsAccess: boolean;
  examAccessId: string | null;
};

// 'active' / 'free' / a plan type / an exam all read the SAME live-subscription
// data access.ts's getEffectiveAccess reads -- filtering in application code
// (rather than a raw Prisma `where`) so this never has to re-derive
// effectiveExpiryOf's null-expiresAt fallback logic a second time.
function matchesAudience(subs: SubRow[], filter: CampaignAudienceFilter, now: Date): boolean {
  const live = subs.filter((s) => effectiveExpiryOf(s) > now);
  if (filter.audienceAccess === 'active' && live.length === 0) return false;
  if (filter.audienceAccess === 'free' && subs.length > 0) return false;
  if (filter.audiencePlanType && !live.some((s) => s.planType === filter.audiencePlanType)) return false;
  // Exam filter means "currently has access to this exam" (an all-exams plan
  // counts), not "onboarded into it" -- simplest, most useful reading for a
  // "tell people who can use this exam's content" campaign.
  if (filter.audienceExamId && !live.some((s) => s.allExamsAccess || s.examAccessId === filter.audienceExamId)) {
    return false;
  }
  return true;
}

type Entities = {
  User: PrismaClient['user'];
};

export type AudienceMember = { id: string; email: string; name: string | null };

export async function resolveCampaignAudience(filter: CampaignAudienceFilter, entities: Entities, now = new Date()): Promise<AudienceMember[]> {
  const candidates = await entities.User.findMany({
    where: {
      email: { not: null },
      emailPreference: { marketingOptIn: true, suppressedAt: null },
      ...(filter.audienceCountry && { profile: { country: filter.audienceCountry } }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { fullName: true } },
      subscriptions: {
        select: { planType: true, createdAt: true, durationDays: true, expiresAt: true, allExamsAccess: true, examAccessId: true },
      },
    },
  });

  return candidates
    .filter((u) => matchesAudience(u.subscriptions, filter, now))
    .map((u) => ({ id: u.id, email: u.email!, name: u.profile?.fullName ?? u.username }));
}

type JobEntities = Entities & {
  EmailCampaign: PrismaClient['emailCampaign'];
};

// The actual job: submitted immediately by "send now", or with a pg-boss
// `startAfter` delay by "schedule". Re-checks the campaign's own status right
// before sending -- a campaign moved back to `draft` (the "cancel" action)
// between scheduling and the job actually firing is a no-op, not a send.
export async function sendEmailCampaignJob(args: { campaignId: string }, context: { entities: JobEntities }) {
  const campaign = await context.entities.EmailCampaign.findUnique({ where: { id: args.campaignId } });
  if (!campaign || (campaign.status !== 'sending' && campaign.status !== 'scheduled')) {
    console.log(`[email-campaign] ${args.campaignId} is no longer sending/scheduled (status: ${campaign?.status ?? 'deleted'}) -- skipped`);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  await context.entities.EmailCampaign.update({ where: { id: campaign.id }, data: { status: 'sending' } });

  const audience = await resolveCampaignAudience(campaign, context.entities);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const member of audience) {
    const result = await sendEmail({
      to: member.email,
      userId: member.id,
      category: 'marketing',
      template: 'campaign',
      campaignId: campaign.id,
      dedupeKey: `campaign:${campaign.id}:${member.id}`,
      render: (links) =>
        campaignTemplate({
          email: member.email,
          name: member.name,
          ...links,
          subject: campaign.subject,
          preheader: campaign.preheader,
          heading: campaign.heading,
          bodyMarkdown: campaign.bodyMarkdown,
        }),
    });
    if (result.status === 'sent') sent += 1;
    else if (result.status === 'skipped') skipped += 1;
    else failed += 1;
  }

  await context.entities.EmailCampaign.update({ where: { id: campaign.id }, data: { status: 'sent', sentAt: new Date() } });
  console.log(`[email-campaign] ${campaign.id} done: ${sent} sent, ${skipped} skipped, ${failed} failed (audience ${audience.length})`);
  return { sent, skipped, failed };
}
