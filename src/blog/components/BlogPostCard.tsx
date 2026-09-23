import { ArrowRight, CalendarDays, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router';
import type { PublishedBlogPost } from '../operations';
import { estimateReadingTime, formatBlogDate, formatTagLabel } from '../blogUtils';
import Reveal from '../../landing-page/components/Reveal';

interface BlogPostCardProps {
  post: PublishedBlogPost;
  delay?: number;
  /** 'featured' is the wide spotlight treatment for the newest post -- same
   * visual language as FeaturesGrid's large card (top accent bar, corner
   * glow, image alongside copy instead of stacked above it). */
  variant?: 'default' | 'featured';
}

/**
 * The one post-preview card every blog surface builds on: the `/blog` grid,
 * `/blog/:slug`'s related-posts rail, and the homepage's BlogPreviewSection.
 * Kept to the site's own card-elevated + accent-token system, matching
 * ExamsGrid/FeaturesGrid rather than inventing a separate blog visual
 * language.
 */
export default function BlogPostCard({ post, delay = 0, variant = 'default' }: BlogPostCardProps) {
  const readingTime = estimateReadingTime(post.bodyMarkdown);
  const isFeatured = variant === 'featured';

  return (
    <Reveal delay={delay} className='h-full'>
      <Link
        to={`/blog/${post.slug}`}
        className={`card-elevated card-elevated-hover group relative flex h-full overflow-hidden ${
          isFeatured ? 'flex-col md:flex-row' : 'flex-col'
        }`}
      >
        <div className='absolute inset-x-0 top-0 z-10 h-1 bg-primary' aria-hidden='true' />

        <div
          className={
            isFeatured
              ? 'aspect-video w-full flex-none bg-muted/50 md:aspect-auto md:w-2/5'
              : 'aspect-video w-full flex-none bg-muted/50'
          }
        >
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt=''
              className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-linear-to-br from-primary/15 to-secondary/10'>
              <FileText className='h-10 w-10 text-primary/40' strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className={`flex flex-1 flex-col ${isFeatured ? 'p-7 md:p-8' : 'p-6'}`}>
          {post.tags.length > 0 && (
            <div className='flex flex-wrap items-center gap-1.5'>
              {post.tags.slice(0, isFeatured ? 4 : 3).map((t) => (
                <span
                  key={t}
                  className='rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary'
                >
                  {formatTagLabel(t)}
                </span>
              ))}
            </div>
          )}

          {isFeatured && (
            <span className='mt-4 text-xs font-semibold uppercase tracking-widest text-secondary'>Latest post</span>
          )}

          <h3
            className={`font-semibold tracking-tight text-foreground ${
              isFeatured ? 'mt-2 text-2xl sm:text-3xl' : 'mt-3 text-xl'
            }`}
          >
            {post.title}
          </h3>
          <p
            className={`flex-1 leading-6 text-muted-foreground ${
              isFeatured ? 'mt-3 line-clamp-3 text-base' : 'mt-2 line-clamp-2 text-sm'
            }`}
          >
            {post.excerpt}
          </p>

          <div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground'>
            {post.publishedAt && (
              <span className='inline-flex items-center gap-1.5'>
                <CalendarDays className='h-3.5 w-3.5' />
                {formatBlogDate(post.publishedAt)}
              </span>
            )}
            <span className='inline-flex items-center gap-1.5'>
              <Clock className='h-3.5 w-3.5' />
              {readingTime} min read
            </span>
            <span className='ml-auto inline-flex items-center gap-1 font-semibold text-primary transition-all group-hover:gap-2'>
              Read <ArrowRight className='h-3.5 w-3.5' />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
