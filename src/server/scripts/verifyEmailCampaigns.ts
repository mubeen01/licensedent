import type { PrismaClient } from '@prisma/client';
import { resolveCampaignAudience, sendEmailCampaignJob } from '../../email/campaignSend';
import { campaignTemplate } from '../../email/templates';
import { sendTestEmail } from '../../email/send';

/**
 * PRD-008 Phase 4 live check: exercises the real campaign audience resolver,
 * the send job (dev mode -- logged, not delivered), and the admin "send
 * test" path (a genuine Resend call to the test sink, never a real person).
 * Cleans up its own EmailCampaign/EmailLog rows. Safe to rerun.
 *
 *   wasp db seed verifyEmailCampaigns
 */
export async function verifyEmailCampaigns(prisma: PrismaClient) {
  const results: [string, string][] = [];
  const check = (label: string, outcome: string) => {
    results.push([label, outcome]);
    console.log(`[verify-email-campaigns] ${label}: ${outcome}`);
  };

  // 1. Audience resolver against the real dev DB, unfiltered (everyone opted in).
  const anyoneAudience = await resolveCampaignAudience({}, { User: prisma.user });
  check('audience (any filter)', `${anyoneAudience.length} opted-in user(s)`);

  // 2. A campaign that should match nobody real (a country nobody in dev data has).
  const nobodyAudience = await resolveCampaignAudience({ audienceCountry: '__no_such_country__' }, { User: prisma.user });
  check('audience (impossible country filter)', nobodyAudience.length === 0 ? 'correctly 0' : `unexpected ${nobodyAudience.length}`);

  // 3. Create a throwaway draft campaign and run the real send job against it
  // (dev mode: sendEmail logs but never delivers -- same safety net Phase 3 relies on).
  const campaign = await prisma.emailCampaign.create({
    data: {
      subject: 'Self-test campaign (safe to ignore)',
      preheader: 'Internal verification only.',
      heading: 'Self-test',
      bodyMarkdown: 'This is a verification run, not a real newsletter.',
      status: 'sending',
    },
  });
  try {
    const jobResult = await sendEmailCampaignJob({ campaignId: campaign.id }, { entities: { User: prisma.user, EmailCampaign: prisma.emailCampaign } });
    check('send job result', JSON.stringify(jobResult));

    const logRows = await prisma.emailLog.findMany({ where: { campaignId: campaign.id }, select: { status: true, error: true } });
    check('EmailLog rows written for this campaign', String(logRows.length));
    const allDevSkipped = logRows.every((r) => r.status === 'skipped' && r.error?.includes('dev mode'));
    check('all rows correctly dev-mode-skipped', logRows.length === 0 || allDevSkipped ? 'yes' : 'NO -- unexpected send attempt');

    const after = await prisma.emailCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    check('campaign status after job', after.status);
  } finally {
    await prisma.emailLog.deleteMany({ where: { campaignId: campaign.id } });
    await prisma.emailCampaign.delete({ where: { id: campaign.id } });
  }

  // 4. Re-check the job no-ops on a draft (safety guard for the "cancel" path).
  const draftCampaign = await prisma.emailCampaign.create({
    data: { subject: 'draft guard test', preheader: 'x', heading: 'x', bodyMarkdown: 'x', status: 'draft' },
  });
  try {
    const guardResult = await sendEmailCampaignJob(
      { campaignId: draftCampaign.id },
      { entities: { User: prisma.user, EmailCampaign: prisma.emailCampaign } }
    );
    check('job on a draft (should no-op)', JSON.stringify(guardResult));
  } finally {
    await prisma.emailCampaign.delete({ where: { id: draftCampaign.id } });
  }

  // 5. Admin "send test" -- a real Resend call to the test sink (marketing key).
  const testResult = await sendTestEmail({
    to: 'delivered@resend.dev',
    category: 'marketing',
    render: () =>
      campaignTemplate({
        email: 'delivered@resend.dev',
        name: 'Self Test',
        subject: 'Self-test campaign preview',
        preheader: 'Verification only.',
        heading: 'Self-test',
        bodyMarkdown: 'This is a verification run.',
      }),
  });
  check('sendTestEmail (real Resend call, test sink)', JSON.stringify(testResult));

  console.log('[verify-email-campaigns] summary:\n' + results.map(([l, o]) => `  ${l}: ${o}`).join('\n'));
}
