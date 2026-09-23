import { type BlogPost } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type CreateBlogPost,
  type DeleteBlogPost,
  type GetBlogPostForAdmin,
  type GetBlogPostsForAdmin,
  type UpdateBlogPost,
} from 'wasp/server/operations';
import * as z from 'zod';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

// Same shape as exams/operations.ts's slugify -- URL-safe, no invented
// uniqueness handling here since the DB's own @unique constraint on slug
// is the real source of truth (a duplicate throws a clear Prisma error the
// admin form surfaces, rather than silently renaming behind their back).
function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'post';
}

export const getBlogPostsForAdmin: GetBlogPostsForAdmin<void, BlogPost[]> = async (_args, context) => {
  ensureAdmin(context.user);
  return context.entities.BlogPost.findMany({ orderBy: { createdAt: 'desc' } });
};

const postIdInputSchema = z.object({ id: z.string().nonempty() });
type PostIdInput = z.infer<typeof postIdInputSchema>;

export const getBlogPostForAdmin: GetBlogPostForAdmin<PostIdInput, BlogPost> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(postIdInputSchema, rawArgs);
  return context.entities.BlogPost.findUniqueOrThrow({ where: { id } });
};

const createInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(500),
  bodyMarkdown: z.string().trim().min(1, 'Body is required'),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
});
type CreateInput = z.infer<typeof createInputSchema>;

export const createBlogPost: CreateBlogPost<CreateInput, BlogPost> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createInputSchema, rawArgs);

  const post = await context.entities.BlogPost.create({
    data: {
      title: args.title,
      slug: args.slug || slugify(args.title),
      excerpt: args.excerpt,
      bodyMarkdown: args.bodyMarkdown,
      tags: args.tags,
      status: args.status,
      publishedAt: args.status === 'published' ? new Date() : null,
    },
  });

  await logAdminAction(context, {
    action: 'blogPost.create',
    entityType: 'BlogPost',
    entityId: post.id,
    details: { title: post.title, status: post.status },
  });

  return post;
};

const updateInputSchema = z.object({
  id: z.string().nonempty(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  excerpt: z.string().trim().min(1).max(500),
  bodyMarkdown: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).max(20),
  status: z.enum(['draft', 'published']),
});
type UpdateInput = z.infer<typeof updateInputSchema>;

export const updateBlogPost: UpdateBlogPost<UpdateInput, BlogPost> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateInputSchema, rawArgs);

  const before = await context.entities.BlogPost.findUniqueOrThrow({ where: { id: args.id } });

  // publishedAt is set the first time status flips to published, and never
  // moved backward or re-stamped by a later edit -- updatedAt (Prisma's
  // @updatedAt) is what tracks edits after that, feeding dateModified.
  const publishedAt =
    before.publishedAt ?? (args.status === 'published' ? new Date() : null);

  const updated = await context.entities.BlogPost.update({
    where: { id: args.id },
    data: {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      bodyMarkdown: args.bodyMarkdown,
      tags: args.tags,
      status: args.status,
      publishedAt,
    },
  });

  const changedFields = (Object.keys(args) as (keyof UpdateInput)[]).filter(
    (key) => key !== 'id' && before[key as keyof BlogPost] !== args[key]
  );
  if (changedFields.length > 0) {
    await logAdminAction(context, {
      action: 'blogPost.update',
      entityType: 'BlogPost',
      entityId: args.id,
      details: { changedFields },
    });
  }

  return updated;
};

export const deleteBlogPost: DeleteBlogPost<PostIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(postIdInputSchema, rawArgs);

  const post = await context.entities.BlogPost.findUniqueOrThrow({ where: { id } });
  await context.entities.BlogPost.delete({ where: { id } });

  await logAdminAction(context, {
    action: 'blogPost.delete',
    entityType: 'BlogPost',
    entityId: id,
    details: { title: post.title, slug: post.slug },
  });
};
