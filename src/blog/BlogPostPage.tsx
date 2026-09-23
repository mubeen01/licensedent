import { ArrowLeft, CalendarDays } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router';
import { getPublishedBlogPostBySlug, useQuery } from 'wasp/client/operations';
import SeoHead, { DEFAULT_OG_IMAGE, SITE_ORIGIN } from '../client/components/SeoHead';
import LoadingSpinner from '../admin/layout/LoadingSpinner';

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data: post, isLoading, error } = useQuery(getPublishedBlogPostBySlug, { slug });

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
    datePublished: (post.publishedAt ?? post.createdAt).toString(),
    dateModified: post.updatedAt.toString(),
    author: { '@type': 'EducationalOrganization', name: post.authorName, url: SITE_ORIGIN },
    publisher: { '@type': 'EducationalOrganization', name: 'LicenseDent', url: SITE_ORIGIN },
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
        extraJsonLd={[articleJsonLd, breadcrumbJsonLd]}
      />
      <main className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
        <Link to='/blog' className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary'>
          <ArrowLeft className='h-4 w-4' /> Back to blog
        </Link>

        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt=''
            className='mt-6 aspect-video w-full rounded-2xl object-cover'
          />
        )}

        <div className='mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
          {post.tags.map((t) => (
            <span key={t} className='rounded-full bg-muted px-2 py-0.5'>
              {t}
            </span>
          ))}
        </div>

        <h1 className='mt-3 text-3xl font-bold tracking-tight sm:text-4xl'>{post.title}</h1>

        {post.publishedAt && (
          <div className='mt-3 flex items-center gap-1.5 text-sm text-muted-foreground'>
            <CalendarDays className='h-4 w-4' />
            {formatDate(post.publishedAt)}
            {post.updatedAt > post.publishedAt && <span>· updated {formatDate(post.updatedAt)}</span>}
          </div>
        )}

        <div className='prose prose-neutral dark:prose-invert mt-8 max-w-none prose-headings:font-bold prose-a:text-primary'>
          <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
