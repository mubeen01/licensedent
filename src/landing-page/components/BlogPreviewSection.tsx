import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getPublishedBlogPosts, useQuery } from 'wasp/client/operations';
import BlogPostCard from '../../blog/components/BlogPostCard';
import SectionTitle from './SectionTitle';

// Same "render nothing while empty" rule as TestimonialsSection -- while
// there are zero published posts this section simply doesn't exist on the
// homepage, rather than showing an empty-state placeholder on the most
// important page on the site.
export default function BlogPreviewSection() {
  const { data: posts } = useQuery(getPublishedBlogPosts);

  if (!posts || posts.length === 0) return null;

  const latestPosts = posts.slice(0, 3);

  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='From the blog'
        title='Exam-format facts and prep guidance'
        description='Cross-country comparisons and dentist-reviewed answers to the questions candidates actually ask — pulled from the same content as our exam guides.'
      />

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {latestPosts.map((post, idx) => (
          <BlogPostCard key={post.id} post={post} delay={Math.min(idx * 80, 240)} />
        ))}
      </div>

      <div className='mt-10 flex justify-center'>
        <WaspRouterLink
          to={routes.BlogIndexRoute.to}
          className='group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5'
        >
          Read more on the blog <ArrowRight className='h-4 w-4' />
        </WaspRouterLink>
      </div>
    </div>
  );
}
