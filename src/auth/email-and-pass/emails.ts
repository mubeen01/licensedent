import { type GetVerificationEmailContentFn, type GetPasswordResetEmailContentFn } from 'wasp/server/auth';
import { inviteTemplate, passwordResetTemplate, verifyEmailTemplate } from '../../email/templates';

// Wasp's auth email hooks only receive the link (and must be synchronous), so
// they can't look up the user. The link's JWT payload is { email } (Wasp's
// createEmailVerificationLink/createPasswordResetLink), which is enough to show
// "This email was sent to ..." in the footer. Reading the payload does not need
// the secret; nothing here trusts it for anything but display.
function recipientFromLink(link: string): string | null {
  try {
    const token = new URL(link).searchParams.get('token');
    const payload = token?.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return typeof json.email === 'string' ? json.email : null;
  } catch {
    return null;
  }
}

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({ verificationLink }) =>
  verifyEmailTemplate({ verificationLink, email: recipientFromLink(verificationLink) });

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({ passwordResetLink }) =>
  passwordResetTemplate({ passwordResetLink, email: recipientFromLink(passwordResetLink) });

// Reuses the password-reset link mechanism (see inviteUser in
// admin/dashboards/users/operations.ts) with its own copy, since "reset your
// password" reads oddly for an account the recipient never created.
export function getInviteEmailContent({ passwordResetLink, email }: { passwordResetLink: string; email: string }) {
  return inviteTemplate({ passwordResetLink, email });
}
