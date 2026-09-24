import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import SeoHead from '../client/components/SeoHead';

/**
 * Terms of service, refund policy, privacy policy, and disclaimers in one
 * place. Owner-approved text required before public launch (status doc O4)
 * — this first draft is the standard 7-day no-questions-asked policy per
 * plan D6. Footer/cookie-banner links use /legal#terms, /legal#refund,
 * /legal#privacy, /legal#disclaimer anchors.
 *
 * PRD-006 H2/H4: the Privacy Policy section is NEW -- the cookie-consent
 * banner (src/client/components/cookie-consent/Config.ts) linked to a
 * "Privacy Policy" that didn't exist anywhere on this page before. Content
 * below is scoped to what the codebase actually collects/uses (verified
 * against schema.prisma and the real integrations wired up in
 * src/payment/paymentProcessor.ts, main.wasp.ts's emailSender, and
 * src/file-upload/s3Utils.ts) -- no invented processors or facts. Retention
 * language and any jurisdiction-specific requirements (GDPR/CCPA-style
 * data-subject rights, a formal DPA with each processor, etc.) should get
 * a real legal review before this is treated as final -- flagged here
 * rather than silently assumed complete.
 *
 * 2026-09-23 pre-launch pass: added the entity/governing-law line
 * (ThreePeak Group LLC, Wyoming -- confirmed directly by the user, not
 * invented), a limitation-of-liability clause, and an explicit
 * no-CE-credit / not-ADA-CERP / not-AGD-PACE disclaimer. Codebase-wide
 * grep before this pass found zero existing CE/CERP/PACE claims anywhere
 * -- this only makes the absence explicit rather than correcting a false
 * claim that existed.
 */
const sections = [
  {
    id: 'terms',
    title: 'Terms of Service',
    body: [
      'LicenseDent ("we", "us", "the platform") is operated by ThreePeak Group LLC, a Wyoming, USA limited liability company. LicenseDent provides exam-preparation software and practice content for Gulf and Ireland dental licensing examinations. By creating an account or purchasing a plan you agree to these terms.',
      'What you are purchasing: time-limited access to our question banks, mock exams, and study tools for the plan and duration you select. A purchase is not a credential, certificate, license, or guarantee of any exam result — see the Disclaimers section below.',
      'Access is personal. Your account and purchased access are for your own use and may not be shared, resold, or distributed to others. We may suspend accounts that share credentials or content.',
      'Plans are one-time purchases granting access for a fixed duration (30, 90, or 180 days). Access does not auto-renew; if you wish to continue after your access period you can purchase again at the then-current price.',
      'You may not scrape, copy, redistribute, or attempt to prevent copy-deterrence measures applied to purchased content. Screenshots of your own study progress (scores, certificates) may be shared for personal use.',
      'The platform is provided "as is". We work hard to keep question content accurate and verified, but we cannot guarantee the content will be error-free. Use our in-app support to report any question you believe is wrong.',
      'Limitation of liability: to the maximum extent permitted by law, ThreePeak Group LLC and LicenseDent will not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including any exam outcome, and our total liability for any claim is limited to the amount you paid us in the 12 months before the claim arose.',
      'Governing law: these terms are governed by the laws of the State of Wyoming, USA, without regard to conflict-of-law principles.',
      'We may update these terms. Material changes will be announced in-app.',
    ],
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    body: [
      'We want you to be confident in what you buy. If you purchase a plan and decide it is not right for you, contact us within 7 days of purchase and we will refund you in full, no questions asked.',
      'After 7 days, refunds are considered case by case. Please contact support through your Account page — we read every message.',
      'Refunds are issued to the original payment method within 5–10 business days after approval.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'What we collect: your email address and password (for your account); your practice, quiz and mock-exam history and scores (so progress analytics and Smart Review work); any notes or messages you send us through the app; and basic technical/analytics data (like which pages are visited) collected via cookies, described below.',
      'Payments: purchases are processed by Stripe. We do not receive or store your full card details — Stripe handles that directly and shares with us only what we need to grant access (plan purchased, payment status, and a Stripe customer/subscription reference).',
      'Email delivery: account verification and password-reset emails are sent via Resend. Question images uploaded by our review team are stored on Amazon S3 — this does not include your personal data.',
      'Review tools: our content team may use OpenAI to draft suggested explanations for questions, which a dentist then checks. Only question text is sent — never your personal data or your answers.',
      'Cookies & analytics: we use a cookie-consent banner so you can accept or decline non-essential cookies. Only if you accept analytics cookies do we load Google Analytics, which tells us which pages are visited so we can improve the site. Declining keeps it switched off.',
      'Why we use it: to run your account and deliver the product you paid for, to improve the question bank and study tools based on real usage, and to communicate with you about your account or purchase.',
      'Retention: we keep your account and practice data for as long as your account is active, and for a reasonable period afterward for backup, fraud-prevention and legal purposes. You can ask us to delete your account and associated data at any time — contact us as described below.',
      'Sharing: we do not sell your personal data. It is shared only with the service providers named above, to the extent needed to run the platform, and where required by law.',
      'Your choices: you can update your account details from your Account page, manage cookie preferences from the cookie banner, and contact us to request a copy or deletion of your data.',
      'Questions or requests about your data: email us at support@licensedent.com.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimers',
    body: [
      'LicenseDent is an independent exam-preparation service. We are not affiliated with, endorsed by, or connected to the Dubai Health Authority (DHA), Department of Health (DOH/HAAD), Ministry of Health (MOH), Sharjah Health Authority (SHA), Saudi Commission for Health Specialties (SCFHS/SMLE), Qatar Council for Healthcare Practitioners (QCHP), Kuwait Ministry of Health, National Health Regulatory Authority (NHRA, Bahrain), Oman Medical Specialty Board (OMSB), the Dental Council of Ireland, or any other licensing authority whose name, code, or exam appears on this platform. All authority names and trademarks are the property of their respective owners and are used for identification only.',
      'Content on this platform is study-preparation material. It is not clinical advice, and does not replace professional judgement, official syllabi, or your own clinical training. Always cross-check against current official guidelines.',
      'Using this platform does not guarantee passing any examination. Results depend on many individual factors, including prior knowledge and preparation time.',
      'LicenseDent is not an ADA CERP Recognized Provider or an AGD PACE-approved provider, and no plan, course, or activity on this platform confers continuing education (CE) credit of any kind. Nothing on this site should be read as a claim of CE-credit approval by any dental board, association, or accrediting body.',
    ],
  },
];

export default function LegalPage() {
  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='Terms, Privacy, Refunds & Disclaimers | LicenseDent'
        description='LicenseDent terms of service, privacy policy, 7-day no-questions-asked refund policy, and disclaimers for Gulf and Ireland dental licensing exam prep.'
        path='/legal'
      />
      {/* PRD-006 M9: <main> previously opened after the <h1> below, so the
          page's own heading sat outside the main landmark. Now wraps the
          whole content column, heading included. */}
      <main className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Terms, Privacy, Refunds &amp; Disclaimers</h1>
        <p className='mt-3 text-sm text-muted-foreground'>
          Last updated: 23 September 2026 · Questions? Message us at{' '}
          <a href='mailto:support@licensedent.com' className='text-primary underline-offset-2 hover:underline'>
            support@licensedent.com
          </a>
          .
        </p>

        <div className='mt-10 space-y-12'>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className='scroll-mt-24'>
              <h2 className='text-xl font-semibold'>{section.title}</h2>
              <div className='mt-4 space-y-3'>
                {section.body.map((para, i) => (
                  <p key={i} className='text-sm leading-7 text-foreground/85'>
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className='mt-14 flex flex-wrap gap-3'>
          <Button asChild variant='outline'>
            <WaspRouterLink to={routes.LandingPageRoute.to}>Back to home</WaspRouterLink>
          </Button>
          <Button asChild>
            <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
          </Button>
        </div>
      </main>
    </div>
  );
}
