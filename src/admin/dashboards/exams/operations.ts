import { type Exam } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { type CreateExam, type UpdateExam } from 'wasp/server/operations';
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

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base || 'exam';
}

const updateExamInputSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  flagEmoji: z.string().nullable().optional(),
  authorityLabel: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  standalonePackOnly: z.boolean().optional(),
});
type UpdateExamInput = z.infer<typeof updateExamInputSchema>;

export const updateExam: UpdateExam<UpdateExamInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateExamInputSchema, rawArgs);

  const before = await context.entities.Exam.findUniqueOrThrow({ where: { id: args.id } });

  const nextValues = {
    name: args.name,
    code: args.code,
    country: args.country,
    flagEmoji: args.flagEmoji,
    authorityLabel: args.authorityLabel,
    description: args.description,
    isActive: args.isActive,
    ...(args.standalonePackOnly !== undefined ? { standalonePackOnly: args.standalonePackOnly } : {}),
  };

  await context.entities.Exam.update({ where: { id: args.id }, data: nextValues });

  // Only log fields that actually changed -- this edit form always submits
  // every field, so logging unconditionally would fill the audit trail with
  // no-op "updates" every time an admin opens and re-saves the form without
  // changing anything.
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(nextValues) as (keyof typeof nextValues)[]) {
    if (before[key] !== nextValues[key]) changes[key] = { before: before[key], after: nextValues[key] };
  }
  if (Object.keys(changes).length > 0) {
    await logAdminAction(context, {
      action: 'exam.update',
      entityType: 'Exam',
      entityId: args.id,
      details: { name: args.name, changes },
    });
  }
};

const createExamInputSchema = z.object({
  name: z.string().trim().nonempty(),
  code: z.string().trim().nullable().optional(),
  country: z.string().trim().nullable().optional(),
  flagEmoji: z.string().trim().nullable().optional(),
  authorityLabel: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
  standalonePackOnly: z.boolean().optional(),
});
type CreateExamInput = z.infer<typeof createExamInputSchema>;

// New exams appear everywhere Exam is already read from the DB (landing page's
// exams grid, pricing/checkout exam pickers, practice/mock-exam/quiz-builder exam
// filters, admin's own dropdowns) with zero extra wiring, since none of those
// hardcode the 9 exams. The one place this does NOT reach is the per-exam
// marketing guide page (`/exams/dha`, `/exams/haad`, ...) -- those are
// hand-written content files with their own routes (see
// `src/exam-pages/examGuideRoute.ts`), a deliberate content-authoring task, not
// something a DB row can produce. A new exam without a matching `code` in that
// switch just has no dedicated guide page yet; it still works everywhere else.
export const createExam: CreateExam<CreateExamInput, Exam> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createExamInputSchema, rawArgs);

  const baseSlug = slugify(args.name);
  let slug = baseSlug;
  let suffix = 2;
  while (await context.entities.Exam.findFirst({ where: { slug } })) {
    slug = `${baseSlug}_${suffix}`;
    suffix += 1;
  }

  const created = await context.entities.Exam.create({
    data: {
      name: args.name,
      slug,
      code: args.code || null,
      country: args.country || null,
      flagEmoji: args.flagEmoji || null,
      authorityLabel: args.authorityLabel || null,
      description: args.description || null,
      isActive: args.isActive ?? true,
      standalonePackOnly: args.standalonePackOnly ?? false,
    },
  });
  await logAdminAction(context, { action: 'exam.create', entityType: 'Exam', entityId: created.id, details: { name: args.name, slug } });
  return created;
};
