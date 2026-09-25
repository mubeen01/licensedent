// Email layout renderer: produces client-safe HTML (tables + inline styles,
// Outlook-safe button, hidden preheader, light/dark hints) and a matching
// plain-text part from one list of content blocks. Every email LicenseDent
// sends goes through here, so they all look and read the same.
import { EMAIL_BRAND as B, type EmailCategory, publicAssetUrl, siteUrl } from './brand';

export type EmailBlock =
  | { type: 'paragraph'; text: string } // supports **bold** and [label](url)
  | { type: 'heading'; text: string }
  | { type: 'button'; label: string; url: string; fallbackLink?: boolean }
  | { type: 'details'; rows: { label: string; value: string }[] }
  | { type: 'stats'; items: { label: string; value: string; sub?: string }[] }
  | { type: 'list'; items: string[] }
  | { type: 'note'; text: string; tone?: 'neutral' | 'warning' | 'success' }
  | { type: 'divider' };

export type EmailFooter = {
  // One sentence: why this person is getting this email.
  reason: string;
  recipientEmail?: string | null;
  preferencesUrl?: string | null;
  unsubscribeUrl?: string | null;
};

export type RenderEmailInput = {
  category: EmailCategory;
  subject: string;
  preheader: string;
  heading: string;
  greetingName?: string | null; // "Hi Aisha," -- falls back to "Hi there,"
  blocks: EmailBlock[];
  signoff?: string | null; // default "The LicenseDent team"; null to omit
  footer: EmailFooter;
};

export type RenderedEmail = { subject: string; html: string; text: string };

/* ------------------------------------------------------------------ */
/*  Inline formatting                                                  */
/* ------------------------------------------------------------------ */

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeUrl(url: string): string {
  const u = url.trim();
  return /^(https?:|mailto:)/i.test(u) ? u : '#';
}

// **bold** and [label](url) only; everything else is escaped.
export function inlineHtml(text: string, linkColor: string = B.colors.brandText): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong class="ld-ink" style="font-weight:600;color:' + B.colors.ink + ';">$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    const href = safeUrl(url.replace(/&amp;/g, '&'));
    return `<a href="${escapeHtml(href)}" style="color:${linkColor};text-decoration:underline;">${label}</a>`;
  });
  return out;
}

export function inlineText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)');
}

/* ------------------------------------------------------------------ */
/*  Blocks                                                             */
/* ------------------------------------------------------------------ */

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;
const P = `margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:${B.colors.body};`;

function blockHtml(b: EmailBlock): string {
  switch (b.type) {
    case 'paragraph':
      return `<p class="ld-body" style="${P}">${inlineHtml(b.text)}</p>`;
    case 'heading':
      return `<h2 class="ld-ink" style="margin:28px 0 10px;font-family:${FONT};font-size:17px;line-height:24px;font-weight:600;color:${B.colors.ink};">${escapeHtml(b.text)}</h2>`;
    case 'button': {
      const href = escapeHtml(safeUrl(b.url));
      const label = escapeHtml(b.label);
      return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;">
  <tr><td>
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" fillcolor="${B.colors.brand}" stroke="f">
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="${href}" class="ld-btn" style="display:inline-block;background:${B.colors.brand};color:#ffffff;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;text-decoration:none;padding:12px 22px;border-radius:8px;">${label} &rarr;</a>
    <!--<![endif]-->
  </td></tr>
</table>${
        b.fallbackLink
          ? `<p class="ld-muted" style="margin:-8px 0 20px;font-family:${FONT};font-size:12px;line-height:18px;color:${B.colors.muted};word-break:break-all;">Button not working? Paste this link into your browser:<br><a href="${href}" style="color:${B.colors.muted};">${escapeHtml(b.url)}</a></p>`
          : ''
      }`;
    }
    case 'details':
      return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="ld-subtle" style="margin:4px 0 24px;background:${B.colors.subtle};border:1px solid ${B.colors.line};border-radius:10px;">
  ${b.rows
    .map(
      (r, i) => `<tr>
    <td style="padding:12px 16px;${i ? `border-top:1px solid ${B.colors.line};` : ''}font-family:${FONT};font-size:13px;line-height:20px;color:${B.colors.muted};white-space:nowrap;" class="ld-muted ld-cell">${escapeHtml(r.label)}</td>
    <td align="right" style="padding:12px 16px;${i ? `border-top:1px solid ${B.colors.line};` : ''}font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:${B.colors.ink};" class="ld-ink ld-cell">${escapeHtml(r.value)}</td>
  </tr>`
    )
    .join('')}
</table>`;
    case 'stats': {
      const w = Math.floor(100 / b.items.length);
      return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;border:1px solid ${B.colors.line};border-radius:10px;" class="ld-subtle">
  <tr>${b.items
    .map(
      (s, i) => `<td width="${w}%" valign="top" class="ld-cell" style="padding:14px 16px;${i ? `border-left:1px solid ${B.colors.line};` : ''}">
      <div class="ld-muted" style="font-family:${FONT};font-size:12px;line-height:16px;color:${B.colors.muted};">${escapeHtml(s.label)}</div>
      <div class="ld-ink" style="font-family:${FONT};font-size:22px;line-height:30px;font-weight:600;color:${B.colors.ink};">${escapeHtml(s.value)}</div>
      ${s.sub ? `<div class="ld-muted" style="font-family:${FONT};font-size:12px;line-height:16px;color:${B.colors.muted};">${escapeHtml(s.sub)}</div>` : ''}
    </td>`
    )
    .join('')}</tr>
</table>`;
    }
    case 'list':
      return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
  ${b.items
    .map(
      (it) => `<tr><td valign="top" style="padding:0 10px 8px 2px;font-family:${FONT};font-size:15px;line-height:24px;color:${B.colors.brand};">&bull;</td><td class="ld-body" style="padding:0 0 8px;font-family:${FONT};font-size:15px;line-height:24px;color:${B.colors.body};">${inlineHtml(it)}</td></tr>`
    )
    .join('')}
</table>`;
    case 'note': {
      const bar = b.tone === 'warning' ? B.colors.warning : b.tone === 'success' ? B.colors.success : B.colors.faint;
      return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;">
  <tr><td class="ld-subtle ld-body" style="padding:12px 16px;background:${B.colors.subtle};border-left:3px solid ${bar};border-radius:4px;font-family:${FONT};font-size:14px;line-height:22px;color:${B.colors.body};">${inlineHtml(b.text)}</td></tr>
</table>`;
    }
    case 'divider':
      return `<div style="height:1px;line-height:1px;font-size:1px;background:${B.colors.line};margin:24px 0;" class="ld-line">&nbsp;</div>`;
  }
}

function blockText(b: EmailBlock): string {
  switch (b.type) {
    case 'paragraph':
      return inlineText(b.text);
    case 'heading':
      return `${b.text.toUpperCase()}`;
    case 'button':
      return `${b.label}: ${b.url}`;
    case 'details':
      return b.rows.map((r) => `${r.label}: ${r.value}`).join('\n');
    case 'stats':
      return b.items.map((s) => `${s.label}: ${s.value}${s.sub ? ` (${s.sub})` : ''}`).join('\n');
    case 'list':
      return b.items.map((i) => `- ${inlineText(i)}`).join('\n');
    case 'note':
      return inlineText(b.text);
    case 'divider':
      return '---';
  }
}

/* ------------------------------------------------------------------ */
/*  Document                                                           */
/* ------------------------------------------------------------------ */

export function renderEmail(input: RenderEmailInput): RenderedEmail {
  const { category, subject, preheader, heading, greetingName, blocks, footer } = input;
  const signoff = input.signoff === undefined ? `The ${B.name} team` : input.signoff;
  const greeting = `Hi ${greetingName?.trim() ? greetingName.trim() : 'there'},`;
  const f = footer;
  const address = B.postalAddress ? `${B.legalName} · ${B.postalAddress}` : `${B.name} is operated by ${B.legalName}`;
  const footerLinks = [
    f.preferencesUrl ? `<a href="${escapeHtml(f.preferencesUrl)}" style="color:${B.colors.muted};text-decoration:underline;">Email preferences</a>` : '',
    f.unsubscribeUrl ? `<a href="${escapeHtml(f.unsubscribeUrl)}" style="color:${B.colors.muted};text-decoration:underline;">Unsubscribe</a>` : '',
    `<a href="mailto:${B.supportEmail}" style="color:${B.colors.muted};text-decoration:underline;">Contact support</a>`,
  ]
    .filter(Boolean)
    .join(' &nbsp;·&nbsp; ');
  const social = B.social.length
    ? `<p style="margin:0 0 10px;">${B.social.map((s) => `<a href="${escapeHtml(s.url)}" style="color:${B.colors.muted};text-decoration:none;font-weight:600;">${escapeHtml(s.label)}</a>`).join(' &nbsp;·&nbsp; ')}</p>`
    : '';
  const serviceNote =
    category === 'transactional'
      ? `This is a service email about your ${B.name} account, so it is sent even if you have unsubscribed from newsletters.`
      : '';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;}
  a{color:${B.colors.brandText};}
  @media (max-width:620px){
    .ld-container{width:100%!important;}
    .ld-pad{padding-left:24px!important;padding-right:24px!important;}
    .ld-h1{font-size:22px!important;line-height:30px!important;}
  }
  @media (prefers-color-scheme:dark){
    .ld-canvas{background:#0B1220!important;}
    .ld-card{background:#111827!important;border-color:#1F2937!important;}
    .ld-ink{color:#F1F5F9!important;}
    .ld-body{color:#CBD5E1!important;}
    .ld-muted{color:#94A3B8!important;}
    .ld-subtle{background:#0F172A!important;border-color:#1F2937!important;}
    .ld-line{background:#1F2937!important;}
    .ld-cell{border-color:#1F2937!important;}
    .ld-btn{background:#2DD4BF!important;color:#042F2E!important;}
  }
</style>
</head>
<body class="ld-canvas" style="margin:0;padding:0;background:${B.colors.canvas};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${B.colors.canvas};opacity:0;">${escapeHtml(preheader)}${'&#8203;&zwnj;&nbsp;'.repeat(40)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="ld-canvas" style="background:${B.colors.canvas};">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="ld-container" style="width:600px;max-width:600px;">
      <tr><td class="ld-pad" style="padding:0 8px 18px;">
        <a href="${escapeHtml(siteUrl('/'))}" style="text-decoration:none;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
            <td style="padding-right:10px;"><img src="${publicAssetUrl('/logo/apple-touch-icon.png')}" width="32" height="32" alt="" style="display:block;border:0;border-radius:8px;"></td>
            <td class="ld-ink" style="font-family:${FONT};font-size:17px;font-weight:700;letter-spacing:-0.2px;color:${B.colors.ink};">${B.name}</td>
          </tr></table>
        </a>
      </td></tr>
      <tr><td class="ld-card ld-pad" style="background:${B.colors.card};border:1px solid ${B.colors.line};border-radius:12px;padding:36px 40px 32px;">
        <h1 class="ld-ink ld-h1" style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:600;letter-spacing:-0.3px;color:${B.colors.ink};">${escapeHtml(heading)}</h1>
        <p class="ld-body" style="${P}">${escapeHtml(greeting)}</p>
        ${blocks.map(blockHtml).join('\n')}
        ${signoff ? `<p class="ld-body" style="margin:8px 0 0;font-family:${FONT};font-size:15px;line-height:24px;color:${B.colors.body};">${escapeHtml(signoff)}</p>` : ''}
      </td></tr>
      <tr><td class="ld-pad ld-muted" style="padding:24px 8px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${B.colors.muted};">
        ${social}
        <p style="margin:0 0 10px;">${escapeHtml(f.reason)}${serviceNote ? ` ${escapeHtml(serviceNote)}` : ''}</p>
        <p style="margin:0 0 10px;">${footerLinks}</p>
        <p style="margin:0 0 4px;">${escapeHtml(B.name)} · ${escapeHtml(B.tagline)}</p>
        <p style="margin:0 0 4px;">${escapeHtml(address)}</p>
        ${f.recipientEmail ? `<p style="margin:0;">This email was sent to ${escapeHtml(f.recipientEmail)}.</p>` : ''}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    heading,
    '',
    greeting,
    '',
    ...blocks.map(blockText).flatMap((t) => [t, '']),
    signoff ?? '',
    '',
    '—',
    f.reason + (serviceNote ? ` ${serviceNote}` : ''),
    f.preferencesUrl ? `Email preferences: ${f.preferencesUrl}` : '',
    f.unsubscribeUrl ? `Unsubscribe: ${f.unsubscribeUrl}` : '',
    `Support: ${B.supportEmail}`,
    `${B.name} · ${address}`,
    f.recipientEmail ? `This email was sent to ${f.recipientEmail}.` : '',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim();

  return { subject, html, text };
}
