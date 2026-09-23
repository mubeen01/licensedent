import { type BlogPost } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { type GetPublishedBlogPostBySlug, type GetPublishedBlogPosts } from 'wasp/server/operations';
import { getPublicImageUrl } from '../file-upload/s3Utils';

export type PublishedBlogPost = BlogPost & { coverImageUrl: string | null };
function withCoverImageUrl(post: BlogPost): PublishedBlogPost {
  return { ...post, coverImageUrl: getPublicImageUrl(post.coverImageKey) };
}

export const getPublishedBlogPosts: GetPublishedBlogPosts<void, PublishedBlogPost[]> = async (_args, context) => {
  const posts = await context.entities.BlogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
  });
  return posts.map(withCoverImageUrl);
};

type GetBySlugInput = { slug: string };

export const getPublishedBlogPostBySlug: GetPublishedBlogPostBySlug<GetBySlugInput, PublishedBlogPost> = async (
  { slug },
  context
) => {
  const post = await context.entities.BlogPost.findFirst({ where: { slug, status: 'published' } });
  if (!post) {
    throw new HttpError(404, 'Post not found');
  }
  return withCoverImageUrl(post);
};
