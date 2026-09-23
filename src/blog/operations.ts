import { type BlogPost } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { type GetPublishedBlogPostBySlug, type GetPublishedBlogPosts } from 'wasp/server/operations';

export const getPublishedBlogPosts: GetPublishedBlogPosts<void, BlogPost[]> = async (_args, context) => {
  return context.entities.BlogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
  });
};

type GetBySlugInput = { slug: string };

export const getPublishedBlogPostBySlug: GetPublishedBlogPostBySlug<GetBySlugInput, BlogPost> = async (
  { slug },
  context
) => {
  const post = await context.entities.BlogPost.findFirst({ where: { slug, status: 'published' } });
  if (!post) {
    throw new HttpError(404, 'Post not found');
  }
  return post;
};
