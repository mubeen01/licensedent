// Every email LicenseDent sends, as typed functions over renderEmail().
// Copy rules: plain English for non-native readers, one clear action per email,
// real numbers only (never invented), no "AI"/"verified" slogans.
import { EMAIL_BRAND as B, siteUrl } from './brand';
import { renderEmail, type EmailBlock, type RenderedEmail } from './layout';

type Recipient = { email: string; name?: string | null };
type Links = { preferencesUrl?: string | null; unsubscribeUrl?: string | null };

const ACCOUNT_REASON = `You're receiving this because you have a ${B.name} account.`;
const STUDY_REASON = `You're receiving study emails because you have a ${B.name} account. You can turn them off in your email preferences.`;
const MARKETING_REASON = `You're receiving this because you opted in to news and offers from ${B.name}.`;

function firstName(name?: string | null): string | null {
  const n = name?.trim();
  if (!n || n.includes('@')) return null;
  return n.split(/\s+/)[0];
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/* ------------------------------------------------------------------ */
/*  Transactional: account                                             */
/* ------------------------------------------------------------------ */

export function verifyEmailTemplate(p: { verificationLink: string; email?: string | null }): RenderedEmail {
  return renderEmail({
    category: 'transactional',
    subject: `Confirm your email for ${B.name}`,
    preheader: 'One click to confirm your email and start practising.',
    heading: 'Confirm your email address',
    blocks: [
      { type: 'paragraph', text: `Thanks for joining ${B.name}. Please confirm this is your email address so we can keep your account secure and send you your study plan.` },
      { type: 'button', label: 'Confirm email', url: p.verificationLink, fallbackLink: true },
      { type: 'note', text: `Didn't create an account? You can ignore this email and nothing will happen.` },
    ],
    footer: { reason: `You're receiving this because this address was used to create a ${B.name} account.`, recipientEmail: p.email },
  });
}

export function passwordResetTemplate(p: { passwordResetLink: string; email?: string | null }): RenderedEmail {
  return renderEmail({
    category: 'transactional',
    subject: `Reset your ${B.name} password`,
    preheader: 'Use this link within 1 hour to choose a new password.',
    heading: 'Reset your password',
    blocks: [
      { type: 'paragraph', text: 'We received a request to reset the password for your account. Choose a new one with the button below. The link works for **1 hour**.' },
      { type: 'button', label: 'Choose a new password', url: p.passwordResetLink, fallbackLink: true },
      { type: 'note', text: `Didn't ask for this? Your password has not changed and you can ignore this email. If you keep getting these, contact [${B.supportEmail}](mailto:${B.supportEmail}).` },
    ],
    footer: { reason: ACCOUNT_REASON, recipientEmail: p.email },
  });
}

export function inviteTemplate(p: { passwordResetLink: string; email: string }): RenderedEmail {
  return renderEmail({
    category: 'transactional',
    subject: `You're invited to ${B.name}`,
    preheader: 'Set your password to start preparing for your licensing exam.',
    heading: `You're invited to ${B.name}`,
    blocks: [
      { type: 'paragraph', text: `Our team has created a ${B.name} account for you. Set a password to log in and start preparing for your dental licensing exam.` },
      { type: 'button', label: 'Set your password', url: p.passwordResetLink, fallbackLink: true },
      { type: 'note', text: 'This link works for 1 hour. If it expires, use "Forgot password" on the login page with this email address.' },
    ],
    footer: { reason: `You're receiving this because a ${B.name} admin invited this address.`, recipientEmail: p.email },
  });
}

export function welcomeTemplate(p: Recipient & { examName?: string | null }): RenderedEmail {
  return renderEmail({
    category: 'transactional',
    subject: `Welcome to ${B.name}, ${firstName(p.name) ?? 'doctor'}`,
    preheader: 'Your account is ready. Here is how to get the most from your first week.',
    heading: 'Your account is ready',
    greetingName: firstName(p.name),
    blocks: [
      { type: 'paragraph', text: `Welcome to ${B.name}${p.examName ? `. We'll help you prepare for the **${p.examName}** exam` : ''}. Three things make the biggest difference in week one:` },
      {
        type: 'list',
        items: [
          '**Set your exam date** on the dashboard. It sets your daily question goal and countdown.',
          '**Practise a little every day.** Consistency is part of your readiness score.',
          '**Take a timed mock** once you have practised each subject. It shows how exam day will feel.',
        ],
      },
      { type: 'button', label: 'Open my dashboard', url: siteUrl('/dashboard') },
      { type: 'paragraph', text: `Questions? Reply to this email. A real person on our team reads every message.` },
    ],
    footer: { reason: ACCOUNT_REASON, recipientEmail: p.email },
  });
}

/* ------------------------------------------------------------------ */
/*  Transactional: plans & access                                      */
/* ------------------------------------------------------------------ */

export function planActivatedTemplate(
  p: Recipient & { planName: string; examLabel: string; validUntil: Date | string; amountPaid?: string | null }
): RenderedEmail {
  const rows = [
    { label: 'Plan', value: p.planName },
    { label: 'Access', value: p.examLabel },
    { label: 'Valid until', value: fmtDate(p.validUntil) },
    ...(p.amountPaid ? [{ label: 'Paid', value: `${p.amountPaid} · one-time` }] : []),
  ];
  return renderEmail({
    category: 'transactional',
    subject: `Your ${p.planName} plan is active`,
    preheader: `Full access to ${p.examLabel} until ${fmtDate(p.validUntil)}.`,
    heading: `Your ${p.planName} plan is active`,
    greetingName: firstName(p.name),
    blocks: [
      { type: 'paragraph', text: `Thank you for choosing ${B.name}. Your plan is active now, with nothing else to set up.` },
      { type: 'details', rows },
      { type: 'button', label: 'Start practising', url: siteUrl('/dashboard') },
      { type: 'paragraph', text: `Your receipt from our payment provider, Stripe, arrives separately. Changed your mind? You can ask for a full refund within 7 days by replying to this email.` },
    ],
    footer: { reason: ACCOUNT_REASON, recipientEmail: p.email },
  });
}

export function planExpiringTemplate(
  p: Recipient & { planName: string; daysLeft: number; expiresOn: Date | string; answered?: number; accuracy?: number | null }
): RenderedEmail {
  const when = p.daysLeft <= 1 ? 'tomorrow' : `in ${p.daysLeft} days`;
  return renderEmail({
    category: 'transactional',
    subject: `Your ${B.name} access ends ${when}`,
    preheader: `Your ${p.planName} plan ends on ${fmtDate(p.expiresOn)}.`,
    heading: `Your access ends ${when}`,
    greetingName: firstName(p.name),
    blocks: [
      { type: 'paragraph', text: `Your **${p.planName}** plan ends on **${fmtDate(p.expiresOn)}**. After that, practice is limited to 15 free questions a day.` },
      ...(p.answered
        ? ([
            {
              type: 'stats',
              items: [
                { label: 'Questions answered', value: p.answered.toLocaleString('en-US') },
                { label: 'Accuracy', value: p.accuracy != null ? `${p.accuracy}%` : '—' },
              ],
            },
          ] as EmailBlock[])
        : []),
      { type: 'paragraph', text: 'Plans are one-time payments with no auto-renewal. If your exam is still ahead, you can add more time now so nothing is interrupted.' },
      { type: 'button', label: 'See plans', url: siteUrl('/pricing') },
    ],
    footer: { reason: ACCOUNT_REASON, recipientEmail: p.email },
  });
}

export function planExpiredTemplate(p: Recipient & { planName: string }): RenderedEmail {
  return renderEmail({
    category: 'transactional',
    subject: `Your ${B.name} plan has ended`,
    preheader: 'Your progress is saved. Pick up where you left off any time.',
    heading: 'Your plan has ended',
    greetingName: firstName(p.name),
    blocks: [
      { type: 'paragraph', text: `Your **${p.planName}** plan ended today. Everything you did is saved: your answers, notes, mock results and readiness score.` },
      { type: 'paragraph', text: 'You can still practise 15 free questions a day. When you are ready for full access again, choose a plan and continue exactly where you stopped.' },
      { type: 'button', label: 'See plans', url: siteUrl('/pricing') },
    ],
    footer: { reason: ACCOUNT_REASON, recipientEmail: p.email },
  });
}

export function fastTrackDecisionTemplate(p: Recipient & { approved: boolean }): RenderedEmail {
  return p.approved
    ? renderEmail({
        category: 'transactional',
        subject: 'Your free Fast Track pass is active',
        preheader: 'Your application was approved. 30 days of full access start now.',
        heading: 'Your Fast Track pass is active',
        greetingName: firstName(p.name),
        blocks: [
          { type: 'paragraph', text: 'Good news: your application was approved. Your **free 30-day Fast Track pass** is active now.' },
          { type: 'button', label: 'Open my dashboard', url: siteUrl('/dashboard') },
          { type: 'paragraph', text: 'Tip: set your exam date first. It sets your daily goal and shows what to study next.' },
        ],
        footer: { reason: `You're receiving this because you applied for a free Fast Track pass.`, recipientEmail: p.email },
      })
    : renderEmail({
        category: 'transactional',
        subject: 'Your Fast Track application',
        preheader: 'An update on your application, and free ways to keep practising.',
        heading: 'About your Fast Track application',
        greetingName: firstName(p.name),
        blocks: [
          { type: 'paragraph', text: 'Thank you for applying for a free Fast Track pass. We could not offer you a place in this round.' },
          { type: 'paragraph', text: 'You can keep preparing for free:' },
          { type: 'list', items: ['Practise **15 questions a day** on the free plan.', 'Take the **free 20-question demo exam** to see the real format.'] },
          { type: 'button', label: 'Keep practising', url: siteUrl('/dashboard') },
        ],
        footer: { reason: `You're receiving this because you applied for a free Fast Track pass.`, recipientEmail: p.email },
      });
}

/* ------------------------------------------------------------------ */
/*  Lifecycle: study emails (can be switched off)                     */
/* ------------------------------------------------------------------ */

export function welcomeSeriesTemplate(p: Recipient & Links & { step: 2 | 5 }): RenderedEmail {
  const footer = { reason: STUDY_REASON, recipientEmail: p.email, preferencesUrl: p.preferencesUrl, unsubscribeUrl: p.unsubscribeUrl };
  if (p.step === 2) {
    return renderEmail({
      category: 'lifecycle',
      subject: 'How to know when you are ready for your exam',
      preheader: 'Your readiness score, explained in 1 minute.',
      heading: 'How to know when you are ready',
      greetingName: firstName(p.name),
      blocks: [
        { type: 'paragraph', text: 'Your dashboard shows a **readiness score out of 100**. It is built from three things you control:' },
        {
          type: 'details',
          rows: [
            { label: 'Mock exam accuracy', value: '50%' },
            { label: 'Subject coverage (20+ questions each)', value: '30%' },
            { label: 'Consistency (daily streak)', value: '20%' },
          ],
        },
        { type: 'paragraph', text: 'The fastest way to raise it is a full, timed mock. It is also the best practice for exam day.' },
        { type: 'button', label: 'See my readiness', url: siteUrl('/dashboard') },
      ],
      footer,
    });
  }
  return renderEmail({
    category: 'lifecycle',
    subject: 'Stop forgetting what you got wrong',
    preheader: 'Smart Review brings back your mistakes at the right time.',
    heading: 'Turn mistakes into marks',
    greetingName: firstName(p.name),
    blocks: [
      { type: 'paragraph', text: 'Every question you get wrong goes into **Smart Review**. It brings each one back just before you would forget it, so it sticks for exam day.' },
      { type: 'paragraph', text: 'A few minutes a day is enough. Your dashboard shows how many are waiting.' },
      { type: 'button', label: 'Open Smart Review', url: siteUrl('/practice/smart-review') },
    ],
    footer,
  });
}

export function inactivityTemplate(
  p: Recipient & Links & { daysInactive: number; focusSubject?: string | null; dueReviews?: number; daysToExam?: number | null }
): RenderedEmail {
  const exam = p.daysToExam != null ? ` Your exam is **${p.daysToExam} days** away.` : '';
  return renderEmail({
    category: 'lifecycle',
    subject: p.daysToExam != null ? `${p.daysToExam} days to your exam. 10 minutes today?` : 'Ten minutes today keeps your streak going',
    preheader: 'A short session today makes the next one easier.',
    heading: 'Pick up where you left off',
    greetingName: firstName(p.name),
    blocks: [
      { type: 'paragraph', text: `It has been ${p.daysInactive} days since your last practice session.${exam} A short session today is enough to get back on track.` },
      ...((p.focusSubject || p.dueReviews
        ? [
            {
              type: 'list',
              items: [
                ...(p.dueReviews ? [`**${p.dueReviews} questions** are waiting in Smart Review`] : []),
                ...(p.focusSubject ? [`Your biggest gap right now is **${p.focusSubject}**`] : []),
              ],
            },
          ]
        : []) as EmailBlock[]),
      { type: 'button', label: 'Practise for 10 minutes', url: siteUrl('/dashboard') },
    ],
    footer: { reason: STUDY_REASON, recipientEmail: p.email, preferencesUrl: p.preferencesUrl, unsubscribeUrl: p.unsubscribeUrl },
  });
}

export function weeklyDigestTemplate(
  p: Recipient &
    Links & {
      weekAnswered: number;
      weekAccuracy: number | null;
      streak: number;
      readiness: number | null;
      focusSubject?: string | null;
      daysToExam?: number | null;
    }
): RenderedEmail {
  return renderEmail({
    category: 'lifecycle',
    subject: `Your week: ${p.weekAnswered} questions${p.weekAccuracy != null ? ` at ${p.weekAccuracy}%` : ''}`,
    preheader: p.focusSubject ? `Next focus: ${p.focusSubject}.` : 'Your weekly study summary.',
    heading: 'Your week in review',
    greetingName: firstName(p.name),
    blocks: [
      {
        type: 'stats',
        items: [
          { label: 'Answered', value: p.weekAnswered.toLocaleString('en-US'), sub: 'this week' },
          { label: 'Accuracy', value: p.weekAccuracy != null ? `${p.weekAccuracy}%` : '—', sub: 'this week' },
          { label: 'Readiness', value: p.readiness != null ? `${p.readiness}` : '—', sub: 'out of 100' },
        ],
      },
      {
        type: 'paragraph',
        text: [
          p.streak > 0 ? `You're on a **${p.streak}-day streak**.` : '',
          p.daysToExam != null ? `Your exam is **${p.daysToExam} days** away.` : '',
          p.focusSubject ? `This week, spend extra time on **${p.focusSubject}**.` : '',
        ]
          .filter(Boolean)
          .join(' ') || 'Keep going. Small daily sessions add up fast.',
      },
      { type: 'button', label: 'Plan my week', url: siteUrl('/dashboard') },
    ],
    footer: { reason: STUDY_REASON, recipientEmail: p.email, preferencesUrl: p.preferencesUrl, unsubscribeUrl: p.unsubscribeUrl },
  });
}

/* ------------------------------------------------------------------ */
/*  Marketing: campaigns written in /admin/emails                      */
/* ------------------------------------------------------------------ */

// Campaign bodies are simple markdown: paragraphs, "## heading", "- list",
// "> note", "---", and "[button: Label](https://...)" on its own line.
export function markdownToBlocks(md: string): EmailBlock[] {
  const blocks: EmailBlock[] = [];
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: 'paragraph', text: para.join(' ') });
    if (list.length) blocks.push({ type: 'list', items: list });
    para = [];
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    const btn = line.match(/^\[button:\s*([^\]]+)\]\((\S+)\)$/i);
    if (!line) flush();
    else if (btn) {
      flush();
      blocks.push({ type: 'button', label: btn[1].trim(), url: btn[2] });
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'heading', text: line.slice(3) });
    } else if (line === '---') {
      flush();
      blocks.push({ type: 'divider' });
    } else if (line.startsWith('> ')) {
      flush();
      blocks.push({ type: 'note', text: line.slice(2) });
    } else if (/^[-*] /.test(line)) {
      if (para.length) {
        blocks.push({ type: 'paragraph', text: para.join(' ') });
        para = [];
      }
      list.push(line.slice(2));
    } else {
      if (list.length) {
        blocks.push({ type: 'list', items: list });
        list = [];
      }
      para.push(line);
    }
  }
  flush();
  return blocks;
}

export function campaignTemplate(
  p: Recipient & Links & { subject: string; preheader: string; heading: string; bodyMarkdown: string }
): RenderedEmail {
  return renderEmail({
    category: 'marketing',
    subject: p.subject,
    preheader: p.preheader,
    heading: p.heading,
    greetingName: firstName(p.name),
    blocks: markdownToBlocks(p.bodyMarkdown),
    footer: { reason: MARKETING_REASON, recipientEmail: p.email, preferencesUrl: p.preferencesUrl, unsubscribeUrl: p.unsubscribeUrl },
  });
}

/* ------------------------------------------------------------------ */
/*  Gallery (admin preview + visual QA): realistic sample data         */
/* ------------------------------------------------------------------ */

export function templateGallery(): { id: string; label: string; category: string; email: RenderedEmail }[] {
  const r = { email: 'aisha.rahman@example.com', name: 'Aisha Rahman' };
  const links = { preferencesUrl: siteUrl('/email/preferences?token=sample'), unsubscribeUrl: siteUrl('/email/unsubscribe?token=sample') };
  const tomorrow = new Date(Date.now() + 86400000);
  return [
    { id: 'verify', label: 'Confirm email', category: 'Account', email: verifyEmailTemplate({ verificationLink: siteUrl('/email-verification?token=sample'), email: r.email }) },
    { id: 'reset', label: 'Password reset', category: 'Account', email: passwordResetTemplate({ passwordResetLink: siteUrl('/password-reset?token=sample'), email: r.email }) },
    { id: 'invite', label: 'Admin invite', category: 'Account', email: inviteTemplate({ passwordResetLink: siteUrl('/password-reset?token=sample'), email: r.email }) },
    { id: 'welcome', label: 'Welcome', category: 'Account', email: welcomeTemplate({ ...r, examName: 'DHA' }) },
    { id: 'plan-activated', label: 'Plan activated', category: 'Plans', email: planActivatedTemplate({ ...r, planName: 'Standard', examLabel: 'DHA (Dubai)', validUntil: new Date(Date.now() + 90 * 86400000), amountPaid: '$200' }) },
    { id: 'plan-expiring', label: 'Plan ending (7 days)', category: 'Plans', email: planExpiringTemplate({ ...r, planName: 'Standard', daysLeft: 7, expiresOn: new Date(Date.now() + 7 * 86400000), answered: 1240, accuracy: 74 }) },
    { id: 'plan-expired', label: 'Plan ended', category: 'Plans', email: planExpiredTemplate({ ...r, planName: 'Standard' }) },
    { id: 'fast-track-approved', label: 'Fast Track approved', category: 'Plans', email: fastTrackDecisionTemplate({ ...r, approved: true }) },
    { id: 'fast-track-rejected', label: 'Fast Track not approved', category: 'Plans', email: fastTrackDecisionTemplate({ ...r, approved: false }) },
    { id: 'series-2', label: 'Welcome series · day 2', category: 'Study', email: welcomeSeriesTemplate({ ...r, ...links, step: 2 }) },
    { id: 'series-5', label: 'Welcome series · day 5', category: 'Study', email: welcomeSeriesTemplate({ ...r, ...links, step: 5 }) },
    { id: 'inactivity', label: 'Inactive 3 days', category: 'Study', email: inactivityTemplate({ ...r, ...links, daysInactive: 3, focusSubject: 'Pharmacology', dueReviews: 23, daysToExam: 38 }) },
    { id: 'digest', label: 'Weekly digest', category: 'Study', email: weeklyDigestTemplate({ ...r, ...links, weekAnswered: 238, weekAccuracy: 74, streak: 6, readiness: 55, focusSubject: 'Pharmacology', daysToExam: 38 }) },
    {
      id: 'campaign',
      label: 'Newsletter / campaign',
      category: 'Marketing',
      email: campaignTemplate({
        ...r,
        ...links,
        subject: 'DHA 2026: what changed and how to prepare',
        preheader: 'Three changes to the DHA dental exam and a 30-day plan.',
        heading: 'DHA 2026: what changed',
        bodyMarkdown: `Here is what you need to know this month.\n\n## Three things to know\n- The exam is still **computer-based at Prometric**.\n- Check your **eligibility letter** before booking.\n- Plan at least **4 full mocks** before exam day.\n\n> New this month: 120 more Endodontics practice questions.\n\n[button: Read the full guide](${siteUrl('/exams/dha')})\n\nGood luck with your preparation.`,
      }),
    },
    { id: 'plan-expiring-1d', label: 'Plan ending (1 day, no name on file)', category: 'Plans', email: planExpiringTemplate({ email: r.email, planName: 'Fast Track', daysLeft: 1, expiresOn: tomorrow }) },
  ];
}
