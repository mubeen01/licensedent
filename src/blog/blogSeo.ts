import { SITE_ORIGIN, DEFAULT_OG_IMAGE } from '../client/components/SeoHead';
import { formatTagLabel } from './blogUtils';

// Extracted from BlogPostPage.tsx so the live schema.org preview in the admin
// editor (BlogManagementPage.tsx) can show the *exact* JSON-LD a post will emit
// once published -- one builder, two callers, can't drift apart.
export interface BlogArticleInput {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  authorName: string;
  coverImageUrl: string | null;
  /** Real DB value when editing a saved post; a placeholder Date when previewing an unsaved draft. */
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildBlogArticleJsonLd(post: BlogArticleInput) {
  const canonicalUrl = `${SITE_ORIGIN}/blog/${post.slug || '<slug>'}`;

  // Same shape as ExamGuidePage's Article JSON-LD -- datePublished/dateModified
  // come from the post's real publishedAt/updatedAt DB columns, exact dates, no
  // git-log lookup needed (that workaround is only for the static *Content.ts
  // exam pages, which have no per-row timestamp of their own).
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url: canonicalUrl,
    image: post.coverImageUrl ?? DEFAULT_OG_IMAGE,
    // ISO 8601, not .toString() -- Google's structured-data guidelines require
    // it, and .toString() output fails real Rich Results validation.
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.map(formatTagLabel).join(', '),
    author: { '@type': 'EducationalOrganization', name: post.authorName, url: SITE_ORIGIN },
    // `publisher.logo` as an ImageObject (not a bare URL string) is what
    // Google's own Article rich-result guidelines ask for.
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'LicenseDent',
      url: SITE_ORIGIN,
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/logo/apple-touch-icon.png` },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  return { articleJsonLd, breadcrumbJsonLd, canonicalUrl };
}
