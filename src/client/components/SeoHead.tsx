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
  /**
   * PRD-006 H5: true for pages that don't correspond to a single real URL --
   * currently only the catch-all 404. `path` for such a page is a synthetic
   * placeholder (e.g. '/404'), and every unmatched URL on the site would
   * otherwise emit the exact same `canonical`/`og:url` pointing at that one
   * non-existent page -- a contradictory signal alongside `noindex` (which
   * already tells crawlers not to index the page at all) and a source of
   * "soft 404" reports in Search Console. When true, both tags are omitted.
   */
  noCanonical?: boolean;
}

// PRD-01 Q1 (real production domain): answered 2026-09-16, licensedent.com.
// Exported so other JSON-LD builders (OrganizationJsonLd, breadcrumbs, Course)
// stay in sync with SeoHead's own canonical URLs -- one place to update.
export const SITE_ORIGIN = 'https://licensedent.com';

// `public/logo/og-image.png`, the site's default social preview image
// (main.wasp.ts's global <head> no longer references it directly -- PRD-006
// C4/C5 removed its static OG/Twitter tags entirely, SeoHead is now the only
// source, on every page).
// PRD-006 H10: the asset used to be 1200x348 (3.45:1), a mismatch against
// `twitter:card=summary_large_image`'s ~1.91:1 expectation and Facebook/
// LinkedIn's recommended 1200x630 -- centre-cropped or downgraded to a small
// card on those platforms. Regenerated at 1200x630 (padded with the brand
// primary teal, `hsl(175 77% 26%)`, top/bottom -- the original artwork is
// unchanged/uncropped, just given a correctly-proportioned canvas) via
// `sharp`'s `contain` fit. Used here so every page gets correct per-page
// og:image:width/height tags, which didn't exist anywhere before this (only
// the twitter:-prefixed dimension tags did).
// Exported so other JSON-LD builders (Article, Product) can reuse the same
// real, correctly-proportioned asset instead of inventing their own.
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo/og-image.png`;
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;

export default function SeoHead({ title, description, path, faqs, extraJsonLd, noindex, ogImage, noCanonical }: SeoHeadProps) {
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
      {!noCanonical && <link rel='canonical' href={canonicalUrl} />}
      {noindex && <meta name='robots' content='noindex' />}

      {/* Per-page Open Graph/Twitter tags -- overrides main.wasp.ts's global
          fallback (homepage-only copy) for every page that renders this
          component, so social shares of e.g. /pricing show that page's own
          title/description/url instead of the homepage's. */}
      <meta property='og:type' content='website' />
      <meta property='og:site_name' content='LicenseDent' />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      {!noCanonical && <meta property='og:url' content={canonicalUrl} />}
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
