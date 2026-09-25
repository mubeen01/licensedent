// Single source of truth for everything an email says about the company.
// Owner decisions: docs/21-email-system-PRD-008.md §2 (E-D3 sender, E-D4 address).

export const EMAIL_BRAND = {
  name: 'LicenseDent',
  tagline: 'Gulf & Ireland dental licensing exam prep',
  legalName: 'ThreePeak Group LLC', // matches LegalPage.tsx (Wyoming, USA)
  // CAN-SPAM requires a valid postal address in every marketing email. Left blank
  // on purpose (E-D4): while it is empty, sendEmail() refuses marketing sends.
  postalAddress: '',
  supportEmail: 'support@licensedent.com',
  // Social profiles appear in the footer only once real URLs exist (docs/20-social-media-kit.md §11).
  social: [] as { label: string; url: string }[],
  colors: {
    brand: '#0F756D', // hsl(175 77% 26%) = --primary (Gulf theme)
    brandText: '#0B5E57',
    ink: '#0F172A',
    body: '#334155',
    muted: '#64748B',
    faint: '#94A3B8',
    line: '#E2E8F0',
    canvas: '#F3F5F7',
    card: '#FFFFFF',
    subtle: '#F7F9FA',
    success: '#15803D',
    warning: '#B45309',
  },
} as const;

export type EmailCategory = 'transactional' | 'lifecycle' | 'marketing';

// E-D3. Marketing gets its own subdomain so newsletter complaints can never hurt
// the reputation of password-reset and verification emails.
export const EMAIL_SENDERS: Record<EmailCategory, { name: string; email: string }> = {
  transactional: { name: 'LicenseDent', email: 'hello@licensedent.com' },
  lifecycle: { name: 'LicenseDent', email: 'hello@licensedent.com' },
  marketing: { name: 'LicenseDent', email: 'news@news.licensedent.com' },
};
export const EMAIL_REPLY_TO = 'support@licensedent.com';

export function siteUrl(path = ''): string {
  const base = (process.env.WASP_WEB_CLIENT_URL || 'https://licensedent.com').replace(/\/$/, '');
  return `${base}${path}`;
}

// Emails must link to the public site even in dev (localhost images and links
// don't work in a real inbox), except for action links that carry a token.
export function publicAssetUrl(path: string): string {
  const base = process.env.WASP_WEB_CLIENT_URL?.startsWith('https://') ? process.env.WASP_WEB_CLIENT_URL : 'https://licensedent.com';
  return `${base.replace(/\/$/, '')}${path}`;
}
