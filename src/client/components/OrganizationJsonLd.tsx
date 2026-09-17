import { SITE_ORIGIN } from './SeoHead';

/**
 * Site-wide EducationalOrganization JSON-LD (PRD-01 Phase S2.1). Rendered
 * once at the app root (see App.tsx) rather than per-page -- this describes
 * the site/brand itself, not any one page's content.
 *
 * `sameAs` (social profile links) is intentionally omitted: Footer.tsx's
 * social icons all point at '#' placeholders today (no real profiles yet),
 * and this project's rule is never to invent unverified facts/links. Add it
 * once real social URLs exist.
 */
export default function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'LicenseDent',
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/logo/licensedent-icon.svg`,
    description:
      'Human-verified practice questions, timed mock tests and subject-wise revision for Gulf and Ireland dental licensing exams. Never AI-guessed.',
  };

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
