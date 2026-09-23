import { FileText } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getPublishedBlogPosts, useQuery } from 'wasp/client/operations';
import SeoHead, { SITE_ORIGIN } from '../client/components/SeoHead';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import Eyebrow from '../landing-page/components/Eyebrow';
import Reveal from '../landing-page/components/Reveal';
import BlogPostCard from './components/BlogPostCard';
import { formatTagLabel } from './blogUtils';

// Not `prerender: true` on this file's data -- the post list itself comes
// from a live useQuery, which (per PRD-01 S2.2's own established finding)
// doesn't resolve during Wasp's build-time prerender pass, only after
// client hydration. The route is still marked prerender: true in
// main.wasp.ts because the surrounding shell (title, intro copy, JSON-LD
// for the blog itself) IS static and worth freezing -- same partial-
// prerender shape as AllExamsPage's live bank-stats overlay. See
// docs/18-blog-content-plan-PRD-007.md for the full tradeoff writeup.
export default function BlogIndexPage() {
  const { data: posts, isLoading } = useQuery(getPublishedBlogPosts);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts?.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return posts;
    if (!activeTag) return posts;
    return posts.filter((p) => p.tags.includes(activeTag));
  }, [posts, activeTag]);

  // The newest post gets the wide spotlight treatment -- only when browsing
  // unfiltered (a tag filter should show a plain, predictable grid of every
  // match, not single one out again).
  const showFeatured = !activeTag && !!filteredPosts && filteredPosts.length > 0;
  const featuredPost = showFeatured ? filteredPosts![0] : undefined;
  const restPosts = showFeatured ? filteredPosts!.slice(1) : filteredPosts ?? [];

  function setTag(tag: string | null) {
    if (tag) {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'LicenseDent Blog',
    description: 'Exam-format facts, cross-country comparisons and prep guidance for Gulf and Ireland dental licensing exams.',
    url: `${SITE_ORIGIN}/blog`,
  };

  const seoKeywords = [
    'dental licensing exam blog',
    'DHA exam prep',
    'Gulf dental licensing exam',
    'IDC Ireland dental exam',
    ...allTags.map(formatTagLabel),
  ];

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='Blog — Dental Licensing Exam Guides | LicenseDent'
        description='Exam-format facts, cross-country comparisons and prep guidance for DHA, HAAD, MOH, SMLE, QCHP, NHRA, OMSB, KMLE, SHA and IDC Ireland.'
        path='/blog'
        keywords={seoKeywords}
        extraJsonLd={[collectionJsonLd]}
      />

      <header className='mx-auto max-w-3xl px-6 pt-16 text-center sm:pt-20'>
        <Reveal className='flex justify-center'>
          <Eyebrow>The LicenseDent Blog</Eyebrow>
        </Reveal>
        <Reveal delay={60}>
          <h1 className='mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl'>
            Exam-format facts, straight from the source
          </h1>
          <p className='mt-5 text-base leading-8 text-muted-foreground sm:text-lg text-pretty'>
            Cross-country comparisons and prep guidance — every post sourced from the same dentist-reviewed
            content as our exam guides, never guessed at.
          </p>
        </Reveal>
      </header>

      <main className='mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8'>
        {isLoading && (
          <div className='py-16'>
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && (!posts || posts.length === 0) && (
          <div className='card-elevated mx-auto max-w-lg p-10 text-center'>
            <FileText className='mx-auto h-8 w-8 text-muted-foreground/50' />
            <p className='mt-4 text-sm text-muted-foreground'>
              No posts published yet — check back soon, or browse our{' '}
              <Link to='/exams' className='font-semibold text-primary hover:underline'>
                exam guides
              </Link>{' '}
              in the meantime.
            </p>
          </div>
        )}

        {!isLoading && posts && posts.length > 0 && (
          <>
            {allTags.length > 1 && (
              <div className='mb-10 flex flex-wrap items-center justify-center gap-2'>
                <button
                  type='button'
                  onClick={() => setTag(null)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    !activeTag
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  All posts
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type='button'
                    onClick={() => setTag(tag)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      activeTag === tag
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {formatTagLabel(tag)}
                  </button>
                ))}
              </div>
            )}

            {filteredPosts && filteredPosts.length === 0 && (
              <p className='py-16 text-center text-sm text-muted-foreground'>
                No posts tagged &ldquo;{formatTagLabel(activeTag ?? '')}&rdquo; yet.
              </p>
            )}

            {featuredPost && (
              <div className='mb-8'>
                <BlogPostCard post={featuredPost} variant='featured' />
              </div>
            )}

            {restPosts.length > 0 && (
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {restPosts.map((post, idx) => (
                  <BlogPostCard key={post.id} post={post} delay={Math.min(idx * 70, 350)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
