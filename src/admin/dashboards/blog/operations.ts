import { type BlogPost } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type CreateBlogPost,
  type DeleteBlogPost,
  type GetBlogImageUploadUrl,
  type GetBlogPostForAdmin,
  type GetBlogPostsForAdmin,
  type UpdateBlogPost,
} from 'wasp/server/operations';
import * as z from 'zod';
import { getBlogImageUploadSignedURL, getPublicImageUrl } from '../../../file-upload/s3Utils';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';

// Same list as QuestionReviewCard.tsx/questions/operations.ts's
// ALLOWED_IMAGE_TYPES -- duplicated rather than shared, matching this
// codebase's existing convention for that constant.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

export type BlogPostWithCoverImage = BlogPost & { coverImageUrl: string | null };
function withCoverImageUrl(post: BlogPost): BlogPostWithCoverImage {
  return { ...post, coverImageUrl: getPublicImageUrl(post.coverImageKey) };
}

const getBlogImageUploadUrlInputSchema = z.object({
  fileName: z.string().nonempty(),
  fileType: z.enum(ALLOWED_IMAGE_TYPES),
});
type GetBlogImageUploadUrlInput = z.infer<typeof getBlogImageUploadUrlInputSchema>;

export const getBlogImageUploadUrl: GetBlogImageUploadUrl<
  GetBlogImageUploadUrlInput,
  { s3UploadUrl: string; s3UploadFields: Record<string, string>; key: string; publicUrl: string | null }
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getBlogImageUploadUrlInputSchema, rawArgs);
  return getBlogImageUploadSignedURL(args);
};

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

export const getBlogPostsForAdmin: GetBlogPostsForAdmin<void, BlogPostWithCoverImage[]> = async (_args, context) => {
  ensureAdmin(context.user);
  const posts = await context.entities.BlogPost.findMany({ orderBy: { createdAt: 'desc' } });
  return posts.map(withCoverImageUrl);
};

const postIdInputSchema = z.object({ id: z.string().nonempty() });
type PostIdInput = z.infer<typeof postIdInputSchema>;

export const getBlogPostForAdmin: GetBlogPostForAdmin<PostIdInput, BlogPostWithCoverImage> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(postIdInputSchema, rawArgs);
  const post = await context.entities.BlogPost.findUniqueOrThrow({ where: { id } });
  return withCoverImageUrl(post);
};

const createInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(500),
  bodyMarkdown: z.string().trim().min(1, 'Body is required'),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  coverImageKey: z.string().nonempty().nullable().optional(),
});
type CreateInput = z.infer<typeof createInputSchema>;

export const createBlogPost: CreateBlogPost<CreateInput, BlogPostWithCoverImage> = async (rawArgs, context) => {
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
      coverImageKey: args.coverImageKey ?? null,
    },
  });

  await logAdminAction(context, {
    action: 'blogPost.create',
    entityType: 'BlogPost',
    entityId: post.id,
    details: { title: post.title, status: post.status },
  });

  return withCoverImageUrl(post);
};

const updateInputSchema = z.object({
  id: z.string().nonempty(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  excerpt: z.string().trim().min(1).max(500),
  bodyMarkdown: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).max(20),
  status: z.enum(['draft', 'published']),
  coverImageKey: z.string().nonempty().nullable().optional(),
});
type UpdateInput = z.infer<typeof updateInputSchema>;

export const updateBlogPost: UpdateBlogPost<UpdateInput, BlogPostWithCoverImage> = async (rawArgs, context) => {
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
      coverImageKey: args.coverImageKey ?? null,
    },
  });

  const changedFields = (Object.keys(args) as (keyof UpdateInput)[]).filter(
    (key) => key !== 'id' && String(before[key as keyof BlogPost]) !== String(args[key])
  );
  if (changedFields.length > 0) {
    await logAdminAction(context, {
      action: 'blogPost.update',
      entityType: 'BlogPost',
      entityId: args.id,
      details: { changedFields },
    });
  }

  return withCoverImageUrl(updated);
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
