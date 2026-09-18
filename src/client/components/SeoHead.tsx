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
  /** Overrides the default site-wide social preview image (path under SITE_ORIGIN, e.g. '/logo/og-image.png'). */
  ogImage?: string;
}

// PRD-01 Q1 (real production domain): answered 2026-09-16, licensedent.com.
// Exported so other JSON-LD builders (OrganizationJsonLd, breadcrumbs, Course)
// stay in sync with SeoHead's own canonical URLs -- one place to update.
export const SITE_ORIGIN = 'https://licensedent.com';

// Same asset main.wasp.ts's global <head> fallback points at (PRD-004 §2d) --
// real dimensions, not the "ideal" 1.91:1 large-card ratio (see that file's
// comment). Used here so every page gets correct per-page og:image:width/
// height tags, which didn't exist anywhere before this (only the
// twitter:-prefixed dimension tags did).
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo/og-image.png`;
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 348;

export default function SeoHead({ title, description, path, faqs, extraJsonLd, noindex, ogImage }: SeoHeadProps) {
  const canonicalUrl = `${SITE_ORIGIN}${path}`;
  const resolvedOgImage = ogImage ? `${SITE_ORIGIN}${ogImage}` : DEFAULT_OG_IMAGE;

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

      {/* Per-page Open Graph/Twitter tags -- overrides main.wasp.ts's global
          fallback (homepage-only copy) for every page that renders this
          component, so social shares of e.g. /pricing show that page's own
          title/description/url instead of the homepage's. */}
      <meta property='og:type' content='website' />
      <meta property='og:site_name' content='LicenseDent' />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={canonicalUrl} />
      <meta property='og:image' content={resolvedOgImage} />
      <meta property='og:image:width' content={String(DEFAULT_OG_IMAGE_WIDTH)} />
      <meta property='og:image:height' content={String(DEFAULT_OG_IMAGE_HEIGHT)} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={resolvedOgImage} />

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
