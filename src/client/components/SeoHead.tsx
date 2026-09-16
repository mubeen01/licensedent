/**
 * Per-page SEO metadata. Renders <title>/<meta>/<link> anywhere in the tree
 * -- React 19 automatically hoists these into <head> during both client
 * rendering and Wasp's build-time prerendering (PRD-01 Phase S0/S1), so no
 * react-helmet or similar library is needed.
 *
 * `path` must be the route's own path (e.g. '/exams/dha') so the canonical
 * URL is correct once PRD-01 §6 Q1 (real production domain) is answered --
 * see the TODO below for where to update it.
 */
interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  /** FAQPage JSON-LD, when the page has FAQ content to expose to search/AI crawlers. */
  faqs?: { question: string; answer: string }[];
}

// TODO(PRD-01 Q1): replace with the real production domain once decided.
const SITE_ORIGIN = 'https://licensedent.example.com';

export default function SeoHead({ title, description, path, faqs }: SeoHeadProps) {
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
      {faqJsonLd && (
        // JSON-LD is valid anywhere in the document per schema.org guidance --
        // no hoisting needed for this one, unlike title/meta/link above.
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
    </>
  );
}
