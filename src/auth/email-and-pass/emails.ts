import { type GetVerificationEmailContentFn, type GetPasswordResetEmailContentFn } from 'wasp/server/auth';

const BRAND = 'LicenseDent';
const SUPPORT_EMAIL = 'support@licensedent.com';

function emailShell({ heading, bodyHtml, ctaLabel, ctaLink }: {
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaLink: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background-color: #F8FAFC;">
      <div style="background: linear-gradient(135deg, #0F766E, #0EA5E9); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <span style="color: #ffffff; font-size: 20px; font-weight: 700;">${BRAND}</span>
      </div>
      <div style="background: #ffffff; padding: 32px 24px; border-radius: 0 0 12px 12px;">
        <h1 style="font-size: 20px; color: #0F172A; margin: 0 0 16px;">${heading}</h1>
        <div style="font-size: 14px; line-height: 1.6; color: #334155;">${bodyHtml}</div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #D4A017; color: #1E293B; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
            ${ctaLabel}
          </a>
        </div>
        <p style="font-size: 12px; color: #94A3B8; word-break: break-all;">
          Or paste this link into your browser: ${ctaLink}
        </p>
      </div>
      <p style="text-align: center; font-size: 12px; color: #94A3B8; margin-top: 16px;">
        This email was sent from ${BRAND} · Gulf Dental Licensing Exam Prep<br />
        Need help? Contact us at ${SUPPORT_EMAIL}
      </p>
    </div>
  `;
}

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({ verificationLink }) => ({
  subject: `Verify your ${BRAND} account`,
  text: `Welcome to ${BRAND}! Click the link below to verify your email and start practicing: ${verificationLink}`,
  html: emailShell({
    heading: `Welcome to ${BRAND}!`,
    bodyHtml: `
      <p>Thanks for signing up. Confirm your email address to unlock the full question bank, timed mock tests and progress analytics for your Gulf dental licensing exam.</p>
    `,
    ctaLabel: 'Verify email',
    ctaLink: verificationLink,
  }),
});

// Reuses the password-reset link mechanism under the hood (see inviteUser in
// admin/dashboards/users/operations.ts) but with its own copy, since "reset
// your password" reads oddly for an account the recipient never created.
export function getInviteEmailContent({ passwordResetLink }: { passwordResetLink: string }) {
  return {
    subject: `You've been invited to ${BRAND}`,
    text: `An admin created an account for you on ${BRAND}. Click the link below to set your password and log in: ${passwordResetLink}`,
    html: emailShell({
      heading: `You've been invited to ${BRAND}`,
      bodyHtml: `
        <p>An admin created an account for you to help prepare for your Gulf dental licensing exam. Click the button below to set your password and get started — this link expires in 1 hour.</p>
      `,
      ctaLabel: 'Set your password',
      ctaLink: passwordResetLink,
    }),
  };
}

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({ passwordResetLink }) => ({
  subject: `Reset your ${BRAND} password`,
  text: `Click the link below to reset your password (expires in 1 hour): ${passwordResetLink}`,
  html: emailShell({
    heading: 'Reset your password',
    bodyHtml: `
      <p>We received a request to reset your password. Click the button below to choose a new one — this link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email; your password won't change.</p>
    `,
    ctaLabel: 'Reset password',
    ctaLink: passwordResetLink,
  }),
});
