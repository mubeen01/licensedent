import { CalendarDays, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { getPublishedBlogPosts, useQuery } from 'wasp/client/operations';
import SeoHead, { SITE_ORIGIN } from '../client/components/SeoHead';
import LoadingSpinner from '../admin/layout/LoadingSpinner';

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

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'LicenseDent Blog',
    description: 'Exam-format facts, cross-country comparisons and prep guidance for Gulf and Ireland dental licensing exams.',
    url: `${SITE_ORIGIN}/blog`,
  };

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='Blog — Dental Licensing Exam Guides | LicenseDent'
        description='Exam-format facts, cross-country comparisons and prep guidance for DHA, HAAD, MOH, SMLE, QCHP, NHRA, OMSB, KMLE, SHA and IDC Ireland.'
        path='/blog'
        extraJsonLd={[collectionJsonLd]}
      />
      <main className='mx-auto max-w-3xl px-6 py-16 sm:py-20'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>The LicenseDent Blog</h1>
        <p className='mt-3 text-base leading-7 text-muted-foreground'>
          Exam-format facts, cross-country comparisons and prep guidance — every post sourced from the same
          dentist-reviewed content as our exam guides.
        </p>

        {isLoading && <LoadingSpinner />}

        {!isLoading && posts?.length === 0 && (
          <p className='mt-10 text-sm text-muted-foreground'>No posts published yet — check back soon.</p>
        )}

        <div className='mt-10 flex flex-col gap-6'>
          {posts?.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className='card-elevated card-elevated-hover block overflow-hidden'
            >
              {post.coverImageUrl && (
                <img src={post.coverImageUrl} alt='' className='aspect-video w-full object-cover' />
              )}
              <div className='p-6'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <FileText className='h-3.5 w-3.5' />
                {post.tags.slice(0, 3).map((t) => (
                  <span key={t} className='rounded-full bg-muted px-2 py-0.5'>
                    {t}
                  </span>
                ))}
              </div>
              <h2 className='mt-3 text-xl font-semibold text-foreground'>{post.title}</h2>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>{post.excerpt}</p>
              {post.publishedAt && (
                <div className='mt-3 flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <CalendarDays className='h-3.5 w-3.5' />
                  {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
