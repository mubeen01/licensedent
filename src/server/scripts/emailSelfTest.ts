import type { PrismaClient } from '@prisma/client';
import { ensureEmailPreference, sendEmail } from '../../email/send';
import { campaignTemplate, weeklyDigestTemplate, welcomeTemplate } from '../../email/templates';

/**
 * PRD-008 Phase 2 check of the real send pipeline (preferences, suppression,
 * dedupe, logging, Resend). Sends go to Resend's test sink delivered@resend.dev
 * (never a real person), attributed to a real user so consent rules apply.
 *
 *   EMAIL_SEND_MODE=live wasp db seed emailSelfTest   # actually calls Resend
 *   wasp db seed emailSelfTest                         # dev mode: logged, not delivered
 *
 * Restores the user's preferences and deletes its own EmailLog rows afterwards.
 */
export async function emailSelfTest(prisma: PrismaClient) {
  const user = await prisma.user.findFirst({ where: { email: 'riza@licensedent.com' }, select: { id: true } });
  if (!user) throw new Error('riza@licensedent.com not found (run seedLaunchAccounts)');
  const pref = await ensureEmailPreference(prisma.emailPreference, user.id);
  const original = { marketingOptIn: pref.marketingOptIn, studyEmails: pref.studyEmails, suppressedAt: pref.suppressedAt, suppressedReason: pref.suppressedReason };
  const to = 'delivered@resend.dev';
  const run = `selftest-${Date.now()}`;
  const results: [string, string, string][] = [];
  const check = (label: string, expected: string, got: { status: string; reason?: string; error?: string }) =>
    results.push([label, expected, got.status + (got.reason ? ` (${got.reason})` : got.error ? ` (${got.error})` : '')]);
  const setPref = (data: Record<string, unknown>) => prisma.emailPreference.update({ where: { id: pref.id }, data });

  try {
    await setPref({ marketingOptIn: false, studyEmails: true, suppressedAt: null, suppressedReason: null });

    const welcome = () => welcomeTemplate({ email: to, name: 'Riza Test', examName: 'IDC Ireland' });
    const digest = (l: { preferencesUrl: string | null; unsubscribeUrl: string | null }) =>
      weeklyDigestTemplate({ email: to, name: 'Riza Test', ...l, weekAnswered: 120, weekAccuracy: 71, streak: 4, readiness: 48, focusSubject: 'Endodontics', daysToExam: 30 });
    const campaign = (l: { preferencesUrl: string | null; unsubscribeUrl: string | null }) =>
      campaignTemplate({ email: to, name: 'Riza Test', ...l, subject: 'Self-test campaign', preheader: 'test', heading: 'Test', bodyMarkdown: 'Test body.' });

    check('transactional welcome', 'sent', await sendEmail({ db: prisma, to, userId: user.id, category: 'transactional', template: 'welcome', render: welcome, dedupeKey: `${run}:welcome` }));
    check('same dedupe key again', 'skipped', await sendEmail({ db: prisma, to, userId: user.id, category: 'transactional', template: 'welcome', render: welcome, dedupeKey: `${run}:welcome` }));
    check('lifecycle digest', 'sent', await sendEmail({ db: prisma, to, userId: user.id, category: 'lifecycle', template: 'weekly-digest', render: digest, dedupeKey: `${run}:digest` }));
    check('marketing, not opted in', 'skipped', await sendEmail({ db: prisma, to, userId: user.id, category: 'marketing', template: 'campaign', render: campaign }));
    await setPref({ marketingOptIn: true });
    check('marketing, opted in, no postal address', 'skipped', await sendEmail({ db: prisma, to, userId: user.id, category: 'marketing', template: 'campaign', render: campaign }));
    await setPref({ studyEmails: false });
    check('lifecycle, study emails off', 'skipped', await sendEmail({ db: prisma, to, userId: user.id, category: 'lifecycle', template: 'weekly-digest', render: digest }));
    await setPref({ studyEmails: true, suppressedAt: new Date(), suppressedReason: 'self-test' });
    check('lifecycle, suppressed', 'skipped', await sendEmail({ db: prisma, to, userId: user.id, category: 'lifecycle', template: 'weekly-digest', render: digest }));
    check('transactional, suppressed (still sent)', 'sent', await sendEmail({ db: prisma, to, userId: user.id, category: 'transactional', template: 'welcome', render: welcome, dedupeKey: `${run}:welcome-suppressed` }));
    check('lifecycle without a user', 'skipped', await sendEmail({ db: prisma, to, category: 'lifecycle', template: 'weekly-digest', render: digest }));
  } finally {
    await setPref(original);
    const logs = await prisma.emailLog.findMany({ where: { toEmail: to, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } }, select: { status: true, template: true, providerId: true } });
    console.log('\nEmailLog rows written:', logs.map((l) => `${l.template}:${l.status}${l.providerId ? `(${l.providerId.slice(0, 8)})` : ''}`).join(', '));
    await prisma.emailLog.deleteMany({ where: { toEmail: to } });
  }

  const devMode = process.env.EMAIL_SEND_MODE !== 'live';
  let pass = 0;
  for (const [label, expected, got] of results) {
    const ok = got.startsWith(expected) || (devMode && expected === 'sent' && got.startsWith('skipped (dev mode'));
    if (ok) pass++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(42)} expected ${expected.padEnd(8)} got ${got}`);
  }
  console.log(`\n${pass}/${results.length} passed${devMode ? ' (dev mode: "sent" cases were logged, not delivered)' : ' (live: real Resend sends to delivered@resend.dev)'}`);
}
