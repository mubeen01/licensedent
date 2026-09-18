/**
 * Per-page SEO metadata. Renders <title>/<meta>/<link> anywhere in the tree
 * -- React 19 automatically hoists these into <head> during both client
 * rendering and Wasp's build-time prerendering (PRD-01 Phase S0/S1), so no
 * react-helmet or similar library is needed.
 *
 * `path` must be the route's own path (e.g. '/exams/dha') so the canonical
 * URL is correct.
 */
interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  /** FAQPage JSON-LD, when the page has FAQ content to expose to search/AI crawlers. */
  faqs?: { question: string; answer: string }[];
  /** Any other JSON-LD objects for this page (Course, BreadcrumbList, etc. -- PRD-01 Phase S2). Each renders as its own <script> tag, per schema.org's own recommendation of one type per block over an @graph. */
  extraJsonLd?: Record<string, unknown>[];
  /** True for authRequired-but-publicly-rendered pages (checkout, auth funnel) that should never be indexed. */
  noindex?: boolean;
}

// PRD-01 Q1 (real production domain): answered 2026-09-16, licensedent.com.
// Exported so other JSON-LD builders (OrganizationJsonLd, breadcrumbs, Course)
// stay in sync with SeoHead's own canonical URLs -- one place to update.
export const SITE_ORIGIN = 'https://licensedent.com';

export default function SeoHead({ title, description, path, faqs, extraJsonLd, noindex }: SeoHeadProps) {
  const canonicalUrl = `${SITE_ORIGIN}${path}`;

  const faqJsonLd =
    faqs && faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null;

  return (
    <>
      <title>{title}</title>
      <meta name='description' content={description} />
      <link rel='canonical' href={canonicalUrl} />
      {noindex && <meta name='robots' content='noindex' />}
      {faqJsonLd && (
        // JSON-LD is valid anywhere in the document per schema.org guidance --
        // no hoisting needed for this one, unlike title/meta/link above.
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {extraJsonLd?.map((obj, i) => (
        <script key={i} type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
    </>
  );
}
