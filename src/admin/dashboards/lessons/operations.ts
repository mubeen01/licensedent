import { type Lesson, type LessonPart } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type AssignQuestionToLessonPart,
  type CreateLesson,
  type CreateLessonPart,
  type GetLessonPartQuestions,
  type GetLessonsForAdmin,
  type SearchPublishedQuestionsForExam,
  type UnassignQuestionFromLessonPart,
  type UpdateLesson,
  type UpdateLessonPart,
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

function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'lesson';
}

/* -------------------------------------------------------------------------- */
/*  LIST (admin overview: every Lesson -> Parts -> assigned question count)    */
/* -------------------------------------------------------------------------- */

type AdminLessonPart = LessonPart & { questionCount: number };
type AdminLesson = Lesson & { examName: string; parts: AdminLessonPart[] };

export const getLessonsForAdmin: GetLessonsForAdmin<void, AdminLesson[]> = async (_args, context) => {
  ensureAdmin(context.user);

  const lessons = await context.entities.Lesson.findMany({
    orderBy: [{ examId: 'asc' }, { order: 'asc' }],
    include: {
      exam: { select: { name: true } },
      parts: { orderBy: { order: 'asc' }, include: { questions: { select: { id: true } } } },
    },
  });

  return lessons.map((lesson) => ({
    ...lesson,
    examName: lesson.exam.name,
    parts: lesson.parts.map((part) => ({ ...part, questionCount: part.questions.length })),
  }));
};

/* -------------------------------------------------------------------------- */
/*  Lesson CRUD                                                                */
/* -------------------------------------------------------------------------- */

const createLessonInputSchema = z.object({
  examId: z.string().nonempty(),
  title: z.string().trim().nonempty(),
  order: z.number().int().min(1),
  passThresholdPercent: z.number().int().min(1).max(100),
});
type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

export const createLesson: CreateLesson<CreateLessonInput, Lesson> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createLessonInputSchema, rawArgs);

  const baseSlug = slugify(args.title);
  let slug = baseSlug;
  let suffix = 2;
  while (await context.entities.Lesson.findFirst({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const created = await context.entities.Lesson.create({
    data: {
      examId: args.examId,
      title: args.title,
      slug,
      order: args.order,
      passThresholdPercent: args.passThresholdPercent,
    },
  });
  await logAdminAction(context, {
    action: 'lesson.create',
    entityType: 'Lesson',
    entityId: created.id,
    details: { title: args.title, examId: args.examId },
  });
  return created;
};

const updateLessonInputSchema = z.object({
  id: z.string().nonempty(),
  title: z.string().trim().nonempty(),
  order: z.number().int().min(1),
  passThresholdPercent: z.number().int().min(1).max(100),
  isActive: z.boolean(),
});
type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>;

export const updateLesson: UpdateLesson<UpdateLessonInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateLessonInputSchema, rawArgs);

  await context.entities.Lesson.update({
    where: { id: args.id },
    data: {
      title: args.title,
      order: args.order,
      passThresholdPercent: args.passThresholdPercent,
      isActive: args.isActive,
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  LessonPart CRUD                                                            */
/* -------------------------------------------------------------------------- */

const createLessonPartInputSchema = z.object({
  lessonId: z.string().nonempty(),
  title: z.string().trim().nonempty(),
  order: z.number().int().min(1),
  youtubeId: z.string().trim().nullable().optional(),
  durationMinutes: z.number().int().min(1).nullable().optional(),
  notesMarkdown: z.string().nullable().optional(),
});
type CreateLessonPartInput = z.infer<typeof createLessonPartInputSchema>;

export const createLessonPart: CreateLessonPart<CreateLessonPartInput, LessonPart> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createLessonPartInputSchema, rawArgs);

  const existing = await context.entities.LessonPart.findUnique({
    where: { lessonId_order: { lessonId: args.lessonId, order: args.order } },
  });
  if (existing) {
    throw new HttpError(400, `Part ${args.order} already exists for this lesson`);
  }

  const created = await context.entities.LessonPart.create({
    data: {
      lessonId: args.lessonId,
      title: args.title,
      order: args.order,
      youtubeId: args.youtubeId || null,
      durationMinutes: args.durationMinutes ?? null,
      notesMarkdown: args.notesMarkdown || null,
    },
  });
  await logAdminAction(context, {
    action: 'lessonPart.create',
    entityType: 'LessonPart',
    entityId: created.id,
    details: { lessonId: args.lessonId, order: args.order },
  });
  return created;
};

const updateLessonPartInputSchema = z.object({
  id: z.string().nonempty(),
  title: z.string().trim().nonempty(),
  order: z.number().int().min(1),
  youtubeId: z.string().trim().nullable().optional(),
  durationMinutes: z.number().int().min(1).nullable().optional(),
  notesMarkdown: z.string().nullable().optional(),
});
type UpdateLessonPartInput = z.infer<typeof updateLessonPartInputSchema>;

export const updateLessonPart: UpdateLessonPart<UpdateLessonPartInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateLessonPartInputSchema, rawArgs);

  await context.entities.LessonPart.update({
    where: { id: args.id },
    data: {
      title: args.title,
      order: args.order,
      youtubeId: args.youtubeId || null,
      durationMinutes: args.durationMinutes ?? null,
      notesMarkdown: args.notesMarkdown || null,
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  Question assignment -- server-side enforced, not just a filtered UI list.  */
/*  A direct API call must not be able to attach an unreviewed or wrong-exam   */
/*  question to a Lesson Part, per PRD-002's Phase I5 plan.                    */
/* -------------------------------------------------------------------------- */

const searchPublishedQuestionsForExamInputSchema = z.object({
  examId: z.string().nonempty(),
  query: z.string().trim().default(''),
  limit: z.number().int().min(1).max(50).default(20),
});
type SearchPublishedQuestionsForExamInput = z.infer<typeof searchPublishedQuestionsForExamInputSchema>;

type PublishedQuestionSearchResult = { id: string; stem: string; subjectName: string };

export const searchPublishedQuestionsForExam: SearchPublishedQuestionsForExam<
  SearchPublishedQuestionsForExamInput,
  PublishedQuestionSearchResult[]
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(searchPublishedQuestionsForExamInputSchema, rawArgs);

  const matches = await context.entities.Question.findMany({
    where: {
      status: 'published',
      exams: { some: { id: args.examId } },
      ...(args.query ? { stem: { contains: args.query, mode: 'insensitive' } } : {}),
    },
    select: { id: true, stem: true, subject: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: args.limit,
  });

  return matches.map((m) => ({ id: m.id, stem: m.stem, subjectName: m.subject.name }));
};

const getLessonPartQuestionsInputSchema = z.object({ lessonPartId: z.string().nonempty() });
type GetLessonPartQuestionsInput = z.infer<typeof getLessonPartQuestionsInputSchema>;

export const getLessonPartQuestions: GetLessonPartQuestions<
  GetLessonPartQuestionsInput,
  PublishedQuestionSearchResult[]
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getLessonPartQuestionsInputSchema, rawArgs);

  const part = await context.entities.LessonPart.findUnique({
    where: { id: args.lessonPartId },
    include: { questions: { select: { id: true, stem: true, subject: { select: { name: true } } } } },
  });
  if (!part) {
    throw new HttpError(404, 'Lesson part not found');
  }
  return part.questions.map((q) => ({ id: q.id, stem: q.stem, subjectName: q.subject.name }));
};

const assignQuestionToLessonPartInputSchema = z.object({
  lessonPartId: z.string().nonempty(),
  questionId: z.string().nonempty(),
});
type AssignQuestionToLessonPartInput = z.infer<typeof assignQuestionToLessonPartInputSchema>;

export const assignQuestionToLessonPart: AssignQuestionToLessonPart<AssignQuestionToLessonPartInput, void> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(assignQuestionToLessonPartInputSchema, rawArgs);

  const part = await context.entities.LessonPart.findUnique({
    where: { id: args.lessonPartId },
    include: { lesson: { select: { examId: true } } },
  });
  if (!part) {
    throw new HttpError(404, 'Lesson part not found');
  }

  const question = await context.entities.Question.findUnique({
    where: { id: args.questionId },
    include: { exams: { select: { id: true } } },
  });
  if (!question) {
    throw new HttpError(404, 'Question not found');
  }
  // Reject, don't just hide -- a direct API call must not be able to attach a
  // non-published or wrong-exam question, matching the "trust the server, not
  // the client" pattern used everywhere else in this codebase's access control.
  if (question.status !== 'published') {
    throw new HttpError(400, 'Only published questions can be assigned to a lesson part');
  }
  if (!question.exams.some((e) => e.id === part.lesson.examId)) {
    throw new HttpError(400, "This question isn't tagged to the lesson's exam");
  }

  await context.entities.LessonPart.update({
    where: { id: args.lessonPartId },
    data: { questions: { connect: { id: args.questionId } } },
  });
  await logAdminAction(context, {
    action: 'lessonPart.assignQuestion',
    entityType: 'LessonPart',
    entityId: args.lessonPartId,
    details: { questionId: args.questionId },
  });
};

const unassignQuestionFromLessonPartInputSchema = z.object({
  lessonPartId: z.string().nonempty(),
  questionId: z.string().nonempty(),
});
type UnassignQuestionFromLessonPartInput = z.infer<typeof unassignQuestionFromLessonPartInputSchema>;

export const unassignQuestionFromLessonPart: UnassignQuestionFromLessonPart<
  UnassignQuestionFromLessonPartInput,
  void
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(unassignQuestionFromLessonPartInputSchema, rawArgs);

  await context.entities.LessonPart.update({
    where: { id: args.lessonPartId },
    data: { questions: { disconnect: { id: args.questionId } } },
  });
};
