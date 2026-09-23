import { type Testimonial } from 'wasp/entities';
import { type GetPublishedTestimonials } from 'wasp/server/operations';
import { getPublicImageUrl } from '../file-upload/s3Utils';

export type PublishedTestimonial = Testimonial & { avatarImageUrl: string | null };

export const getPublishedTestimonials: GetPublishedTestimonials<void, PublishedTestimonial[]> = async (
  _args,
  context
) => {
  const testimonials = await context.entities.Testimonial.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return testimonials.map((t) => ({ ...t, avatarImageUrl: getPublicImageUrl(t.avatarImageKey) }));
};
