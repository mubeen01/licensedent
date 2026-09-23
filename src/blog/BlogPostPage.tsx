import { ArrowRight, CalendarDays, Check, ChevronRight, Clock, Link2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router';
import { getPublishedBlogPostBySlug, getPublishedBlogPosts, useQuery } from 'wasp/client/operations';
import SeoHead, { DEFAULT_OG_IMAGE, SITE_ORIGIN } from '../client/components/SeoHead';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import Reveal from '../landing-page/components/Reveal';
import BlogPostCard from './components/BlogPostCard';
import { estimateReadingTime, formatBlogDate, formatTagLabel } from './blogUtils';
import { getSnapshotPost, getSnapshotPostList } from './blogSnapshot';

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) --
      // silently no-op rather than throwing in front of a reader.
    }
  }

  return (
    <button
      type='button'
      onClick={handleCopy}
      className='inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary'
    >
      {copied ? <Check className='h-3.5 w-3.5' /> : <Link2 className='h-3.5 w-3.5' />}
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  // `initialData` (PRD-007 S12) is what actually makes prerendering work for
  // this page -- see blogBuildTimeData.ts's header comment. Wasp's prerender
  // pass can't resolve a live useQuery on its own; this gives react-query a
  // value to render with immediately (including during that pass), while a
  // live browser still refetches right after hydration for freshness.
  const { data: post, isLoading, error } = useQuery(getPublishedBlogPostBySlug, { slug }, { initialData: getSnapshotPost(slug) });
  const { data: allPosts } = useQuery(getPublishedBlogPosts, undefined, { initialData: getSnapshotPostList() });

  const relatedPosts = useMemo(() => {
    if (!post || !allPosts) return [];
    return allPosts
      .filter((p) => p.slug !== post.slug)
      .map((p) => ({ post: p, overlap: p.tags.filter((t) => post.tags.includes(t)).length }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map((r) => r.post);
  }, [post, allPosts]);

  if (isLoading) {
    return (
      <div className='mx-auto max-w-3xl px-6 py-24'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className='mx-auto max-w-3xl px-6 py-24 text-center'>
        <SeoHead title='Post Not Found — LicenseDent' description='This blog post could not be found.' path={`/blog/${slug}`} noindex />
        <h1 className='text-2xl font-bold text-foreground'>Post not found</h1>
        <p className='mt-3 text-sm text-muted-foreground'>
          This post may have been unpublished or moved.{' '}
          <Link to='/blog' className='font-semibold text-primary hover:underline'>
            Back to the blog
          </Link>
          .
        </p>
      </div>
    );
  }

  const canonicalUrl = `${SITE_ORIGIN}/blog/${post.slug}`;
  const readingTime = estimateReadingTime(post.bodyMarkdown);

  // Same shape as ExamGuidePage's Article JSON-LD, with one real
  // improvement: datePublished/dateModified come from this post's actual
  // publishedAt/updatedAt DB columns -- exact dates, no git-log lookup
  // needed (that workaround was only ever necessary for the static
  // *Content.ts exam pages, which have no per-row timestamp of their own).
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url: canonicalUrl,
    image: post.coverImageUrl ?? DEFAULT_OG_IMAGE,
    // .toISOString(), not .toString() -- Google's structured-data
    // guidelines require ISO 8601 for datePublished/dateModified.
    // .toString() (confirmed live, e.g. "Wed Sep 16 2026 00:00:00 GMT+0000
    // (Coordinated Universal Time)") is not valid ISO 8601 and would fail
    // real Rich Results validation.
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.map(formatTagLabel).join(', '),
    author: { '@type': 'EducationalOrganization', name: post.authorName, url: SITE_ORIGIN },
    // `publisher.logo` as an ImageObject (not a bare URL string) is what
    // Google's own Article rich-result guidelines ask for -- the same
    // PNG/112x112-minimum reasoning as OrganizationJsonLd.tsx's site-wide
    // `logo` field, reused here rather than picking a different asset.
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

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title={`${post.title} | LicenseDent`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        ogImage={post.coverImageUrl ?? undefined}
        keywords={['dental licensing exam', ...post.tags.map(formatTagLabel)]}
        ogType='article'
        articlePublishedTime={(post.publishedAt ?? post.createdAt).toISOString()}
        articleModifiedTime={post.updatedAt.toISOString()}
        articleTags={post.tags.map(formatTagLabel)}
        extraJsonLd={[articleJsonLd, breadcrumbJsonLd]}
      />

      <article className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
        <Reveal className='flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground'>
          <Link to='/' className='hover:text-primary'>
            Home
          </Link>
          <ChevronRight className='h-3.5 w-3.5' />
          <Link to='/blog' className='hover:text-primary'>
            Blog
          </Link>
          <ChevronRight className='h-3.5 w-3.5' />
          <span className='truncate text-foreground/70'>{post.title}</span>
        </Reveal>

        <Reveal delay={40}>
          {post.tags.length > 0 && (
            <div className='mt-6 flex flex-wrap gap-1.5'>
              {post.tags.map((t) => (
                <Link
                  key={t}
                  to={`/blog?tag=${encodeURIComponent(t)}`}
                  className='rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors hover:border-primary/50'
                >
                  {formatTagLabel(t)}
                </Link>
              ))}
            </div>
          )}

          <h1 className='mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl'>
            {post.title}
          </h1>

          <div className='mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground'>
            {post.publishedAt && (
              <span className='inline-flex items-center gap-1.5'>
                <CalendarDays className='h-4 w-4' />
                {formatBlogDate(post.publishedAt)}
                {post.updatedAt > post.publishedAt && <span>&nbsp;· updated {formatBlogDate(post.updatedAt)}</span>}
              </span>
            )}
            <span className='inline-flex items-center gap-1.5'>
              <Clock className='h-4 w-4' />
              {readingTime} min read
            </span>
            <span className='text-muted-foreground/70'>By {post.authorName}</span>
            <span className='ml-auto'>
              <CopyLinkButton url={canonicalUrl} />
            </span>
          </div>
        </Reveal>

        {post.coverImageUrl && (
          <Reveal delay={80}>
            <img
              src={post.coverImageUrl}
              alt=''
              className='mt-8 aspect-video w-full rounded-2xl border border-border/60 object-cover shadow-[0_16px_32px_-20px_rgba(0,0,0,0.25)]'
            />
          </Reveal>
        )}

        <Reveal delay={100}>
          <div className='prose prose-neutral dark:prose-invert mt-10 max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-2xl prose-a:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-img:rounded-xl'>
            <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className='card-elevated mt-12 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left'>
            <div>
              <h2 className='text-lg font-semibold text-foreground'>Ready to start practicing?</h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                Subject-wise questions and timed mocks, written and reviewed by practicing dentists.
              </p>
            </div>
            <Link
              to='/signup'
              className='inline-flex flex-none items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105'
            >
              Get started <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        </Reveal>
      </article>

      {relatedPosts.length > 0 && (
        <div className='border-t border-border/60 bg-muted/30'>
          <div className='mx-auto max-w-7xl px-6 py-16 lg:px-8'>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>Keep reading</h2>
            <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {relatedPosts.map((p, idx) => (
                <BlogPostCard key={p.id} post={p} delay={Math.min(idx * 70, 210)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
