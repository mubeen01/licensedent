import { type Testimonial } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type CreateTestimonial,
  type DeleteTestimonial,
  type GetTestimonialImageUploadUrl,
  type GetTestimonialsForAdmin,
  type UpdateTestimonial,
} from 'wasp/server/operations';
import * as z from 'zod';
import { getPublicImageUrl, getTestimonialImageUploadSignedURL } from '../../../file-upload/s3Utils';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';

// Same list as blog/questions operations' ALLOWED_IMAGE_TYPES -- duplicated
// rather than shared, matching this codebase's existing convention.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

export type TestimonialWithImage = Testimonial & { avatarImageUrl: string | null };
function withImageUrl(t: Testimonial): TestimonialWithImage {
  return { ...t, avatarImageUrl: getPublicImageUrl(t.avatarImageKey) };
}

const getTestimonialImageUploadUrlInputSchema = z.object({
  fileName: z.string().nonempty(),
  fileType: z.enum(ALLOWED_IMAGE_TYPES),
});
type GetTestimonialImageUploadUrlInput = z.infer<typeof getTestimonialImageUploadUrlInputSchema>;

export const getTestimonialImageUploadUrl: GetTestimonialImageUploadUrl<
  GetTestimonialImageUploadUrlInput,
  { s3UploadUrl: string; s3UploadFields: Record<string, string>; key: string; publicUrl: string | null }
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getTestimonialImageUploadUrlInputSchema, rawArgs);
  return getTestimonialImageUploadSignedURL(args);
};

export const getTestimonialsForAdmin: GetTestimonialsForAdmin<void, TestimonialWithImage[]> = async (
  _args,
  context
) => {
  ensureAdmin(context.user);
  const testimonials = await context.entities.Testimonial.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return testimonials.map(withImageUrl);
};

const createInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  context: z.string().trim().min(1, 'Context is required').max(150),
  quote: z.string().trim().min(1, 'Quote is required').max(1000),
  avatarImageKey: z.string().nonempty().nullable().optional(),
  isPublished: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});
type CreateInput = z.infer<typeof createInputSchema>;

export const createTestimonial: CreateTestimonial<CreateInput, TestimonialWithImage> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createInputSchema, rawArgs);

  const testimonial = await context.entities.Testimonial.create({
    data: {
      name: args.name,
      context: args.context,
      quote: args.quote,
      avatarImageKey: args.avatarImageKey ?? null,
      isPublished: args.isPublished,
      displayOrder: args.displayOrder,
    },
  });

  await logAdminAction(context, {
    action: 'testimonial.create',
    entityType: 'Testimonial',
    entityId: testimonial.id,
    details: { name: testimonial.name, isPublished: testimonial.isPublished },
  });

  return withImageUrl(testimonial);
};

const updateInputSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().trim().min(1).max(120),
  context: z.string().trim().min(1).max(150),
  quote: z.string().trim().min(1).max(1000),
  avatarImageKey: z.string().nonempty().nullable().optional(),
  isPublished: z.boolean(),
  displayOrder: z.number().int(),
});
type UpdateInput = z.infer<typeof updateInputSchema>;

export const updateTestimonial: UpdateTestimonial<UpdateInput, TestimonialWithImage> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateInputSchema, rawArgs);

  const before = await context.entities.Testimonial.findUniqueOrThrow({ where: { id: args.id } });

  const updated = await context.entities.Testimonial.update({
    where: { id: args.id },
    data: {
      name: args.name,
      context: args.context,
      quote: args.quote,
      avatarImageKey: args.avatarImageKey ?? null,
      isPublished: args.isPublished,
      displayOrder: args.displayOrder,
    },
  });

  const changedFields = (Object.keys(args) as (keyof UpdateInput)[]).filter(
    (key) => key !== 'id' && String(before[key as keyof Testimonial]) !== String(args[key])
  );
  if (changedFields.length > 0) {
    await logAdminAction(context, {
      action: 'testimonial.update',
      entityType: 'Testimonial',
      entityId: args.id,
      details: { changedFields },
    });
  }

  return withImageUrl(updated);
};

const testimonialIdInputSchema = z.object({ id: z.string().nonempty() });
type TestimonialIdInput = z.infer<typeof testimonialIdInputSchema>;

export const deleteTestimonial: DeleteTestimonial<TestimonialIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(testimonialIdInputSchema, rawArgs);

  const testimonial = await context.entities.Testimonial.findUniqueOrThrow({ where: { id } });
  await context.entities.Testimonial.delete({ where: { id } });

  await logAdminAction(context, {
    action: 'testimonial.delete',
    entityType: 'Testimonial',
    entityId: id,
    details: { name: testimonial.name },
  });
};
