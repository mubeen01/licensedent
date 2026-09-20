import { SITE_ORIGIN } from './SeoHead';

/**
 * Site-wide EducationalOrganization + WebSite JSON-LD (PRD-01 Phase S2.1;
 * WebSite + contactPoint added PRD-006 M2). Rendered once at the app root
 * (see App.tsx) rather than per-page -- this describes the site/brand
 * itself, not any one page's content.
 *
 * `sameAs` (social profile links) is intentionally omitted: Footer.tsx's
 * social icons all point at '#' placeholders today (no real profiles yet),
 * and this project's rule is never to invent unverified facts/links. Add it
 * once real social URLs exist.
 *
 * PRD-006 M2: `contactPoint` uses support@licensedent.com, the same real
 * address already used sitewide (footer, legal page, cookie consent) --
 * no new/invented contact info. A separate `WebSite` node (its own
 * `@type`, per schema.org's own guidance of one type per JSON-LD block
 * over a single `@graph`) helps AI/search entity resolution distinguish
 * "the organization" from "the website" even though both currently
 * describe the same one property.
 */
export default function OrganizationJsonLd() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'LicenseDent',
    url: SITE_ORIGIN,
    // Google's Logo structured data requires the same formats as Google
    // Images (JPEG/PNG/WEBP/GIF, at least 112x112px) -- SVG isn't supported
    // there, unlike the favicon <link> tag which does accept it. Points at
    // the 180x180 PNG generated for apple-touch-icon instead of the SVG icon.
    logo: `${SITE_ORIGIN}/logo/apple-touch-icon.png`,
    description:
      'Human-verified practice questions, timed mock tests and subject-wise revision for Gulf and Ireland dental licensing exams. Never AI-guessed.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@licensedent.com',
      contactType: 'customer support',
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LicenseDent',
    url: SITE_ORIGIN,
  };

  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
    </>
  );
}
