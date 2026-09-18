import { type Lesson, type LessonPart, type Subject } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import {
  type AssignQuestionToLessonPart,
  type CreateLesson,
  type CreateLessonPart,
  type CreateSubjectForExam,
  type DeleteLesson,
  type DeleteLessonPart,
  type GetLessonPartQuestions,
  type GetLessonsForAdmin,
  type ReorderLesson,
  type ReorderLessonPart,
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
type AdminLesson = Lesson & {
  examName: string;
  examFlagEmoji: string | null;
  examStandalonePackOnly: boolean;
  subjectName: string | null;
  questionSubjectNames: string[];
  parts: AdminLessonPart[];
};

export const getLessonsForAdmin: GetLessonsForAdmin<void, AdminLesson[]> = async (_args, context) => {
  ensureAdmin(context.user);

  const lessons = await context.entities.Lesson.findMany({
    orderBy: [{ examId: 'asc' }, { order: 'asc' }],
    include: {
      exam: { select: { name: true, flagEmoji: true, standalonePackOnly: true } },
      subject: { select: { name: true } },
      parts: {
        orderBy: { order: 'asc' },
        include: { questions: { select: { id: true, subject: { select: { name: true } } } } },
      },
    },
  });

  return lessons.map((lesson) => ({
    ...lesson,
    examName: lesson.exam.name,
    examFlagEmoji: lesson.exam.flagEmoji,
    examStandalonePackOnly: lesson.exam.standalonePackOnly,
    subjectName: lesson.subject?.name ?? null,
    // Which Subject(s) this Lesson's assigned questions actually cover --
    // computed from real data, purely informational (e.g. to flag a Lesson
    // whose declared subject doesn't match what its questions are tagged
    // as) -- the declared subjectId above is the one used for grouping.
    questionSubjectNames: Array.from(
      new Set(lesson.parts.flatMap((part) => part.questions.map((q) => q.subject.name)))
    ).sort(),
    parts: lesson.parts.map((part) => ({ ...part, questionCount: part.questions.length })),
  }));
};

/* -------------------------------------------------------------------------- */
/*  Lesson CRUD                                                                */
/* -------------------------------------------------------------------------- */

async function ensureSubjectMatchesExam(
  context: { entities: { Subject: { findUnique: (args: any) => Promise<{ examId: string } | null> } } },
  subjectId: string,
  examId: string
) {
  const subject = await context.entities.Subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    throw new HttpError(400, 'Subject not found');
  }
  if (subject.examId !== examId) {
    throw new HttpError(400, "This subject doesn't belong to the selected exam");
  }
}

const createLessonInputSchema = z.object({
  examId: z.string().nonempty(),
  subjectId: z.string().nonempty().nullable().optional(),
  title: z.string().trim().nonempty(),
  order: z.number().int().min(1),
  passThresholdPercent: z.number().int().min(1).max(100),
});
type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

export const createLesson: CreateLesson<CreateLessonInput, Lesson> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createLessonInputSchema, rawArgs);

  if (args.subjectId) {
    await ensureSubjectMatchesExam(context, args.subjectId, args.examId);
  }

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
      subjectId: args.subjectId ?? null,
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
    details: { title: args.title, examId: args.examId, subjectId: args.subjectId ?? null },
  });
  return created;
};

const updateLessonInputSchema = z.object({
  id: z.string().nonempty(),
  subjectId: z.string().nonempty().nullable().optional(),
  title: z.string().trim().nonempty(),
  order: z.number().int().min(1),
  passThresholdPercent: z.number().int().min(1).max(100),
  isActive: z.boolean(),
});
type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>;

export const updateLesson: UpdateLesson<UpdateLessonInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateLessonInputSchema, rawArgs);

  if (args.subjectId !== undefined && args.subjectId !== null) {
    const lesson = await context.entities.Lesson.findUniqueOrThrow({ where: { id: args.id } });
    await ensureSubjectMatchesExam(context, args.subjectId, lesson.examId);
  }

  await context.entities.Lesson.update({
    where: { id: args.id },
    data: {
      title: args.title,
      order: args.order,
      passThresholdPercent: args.passThresholdPercent,
      isActive: args.isActive,
      ...(args.subjectId !== undefined ? { subjectId: args.subjectId } : {}),
    },
  });
};

export const deleteLesson: DeleteLesson<{ id: string }, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);

  const lesson = await context.entities.Lesson.findUniqueOrThrow({ where: { id: args.id } });
  // Parts (and their quiz attempts) cascade via the schema's onDelete:
  // Cascade on LessonPart.lesson / LessonPartQuizAttempt.lessonPart -- this
  // is a real destructive delete, not an isActive-style archive, matching
  // what the admin UI asks for ("delete the lesson").
  await context.entities.Lesson.delete({ where: { id: args.id } });
  await logAdminAction(context, {
    action: 'lesson.delete',
    entityType: 'Lesson',
    entityId: args.id,
    details: { title: lesson.title, examId: lesson.examId },
  });
};

const reorderLessonInputSchema = z.object({ id: z.string().nonempty(), otherId: z.string().nonempty() });
type ReorderLessonInput = z.infer<typeof reorderLessonInputSchema>;

// Swaps two Lessons' `order` values -- backs the admin page's move up/down
// arrows. `Lesson.order` has no DB-level uniqueness constraint (unlike
// LessonPart, see below), so a direct swap is always safe. The frontend
// picks which two ids to swap (the visible neighbor in its current subject
// tab), so this only needs to validate they're actually reorderable
// together, not recompute "adjacent" itself.
export const reorderLesson: ReorderLesson<ReorderLessonInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(reorderLessonInputSchema, rawArgs);
  if (args.id === args.otherId) return;

  const [a, b] = await Promise.all([
    context.entities.Lesson.findUniqueOrThrow({ where: { id: args.id } }),
    context.entities.Lesson.findUniqueOrThrow({ where: { id: args.otherId } }),
  ]);
  if (a.examId !== b.examId) {
    throw new HttpError(400, 'Can only reorder lessons within the same exam');
  }

  await prisma.$transaction([
    context.entities.Lesson.update({ where: { id: a.id }, data: { order: b.order } }),
    context.entities.Lesson.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
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
  sourceBook: z.string().trim().nullable().optional(),
  sourcePages: z.string().trim().nullable().optional(),
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
      sourceBook: args.sourceBook || null,
      sourcePages: args.sourcePages || null,
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
  sourceBook: z.string().trim().nullable().optional(),
  sourcePages: z.string().trim().nullable().optional(),
});
type UpdateLessonPartInput = z.infer<typeof updateLessonPartInputSchema>;

export const updateLessonPart: UpdateLessonPart<UpdateLessonPartInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(updateLessonPartInputSchema, rawArgs);

  const current = await context.entities.LessonPart.findUniqueOrThrow({ where: { id: args.id } });

  // Same check createLessonPart already does -- without it, a manually typed
  // order number that collides with a sibling part surfaced as a raw
  // "Unique constraint failed" Prisma error instead of a usable message.
  // (Reordering via the move up/down arrows goes through reorderLessonPart
  // below instead, which never hits this path.)
  if (args.order !== current.order) {
    const collision = await context.entities.LessonPart.findUnique({
      where: { lessonId_order: { lessonId: current.lessonId, order: args.order } },
    });
    if (collision) {
      throw new HttpError(
        400,
        `Part ${args.order} already exists for this lesson -- use the reorder arrows instead, or pick a different number`
      );
    }
  }

  await context.entities.LessonPart.update({
    where: { id: args.id },
    data: {
      title: args.title,
      order: args.order,
      youtubeId: args.youtubeId || null,
      durationMinutes: args.durationMinutes ?? null,
      notesMarkdown: args.notesMarkdown || null,
      sourceBook: args.sourceBook || null,
      sourcePages: args.sourcePages || null,
    },
  });
};

const reorderLessonPartInputSchema = z.object({ id: z.string().nonempty(), otherId: z.string().nonempty() });
type ReorderLessonPartInput = z.infer<typeof reorderLessonPartInputSchema>;

// Swaps two Parts' `order` values within the same Lesson -- backs the admin
// page's move up/down arrows. Unlike Lesson, LessonPart has a DB-level
// unique constraint on (lessonId, order), so a naive two-row swap would
// violate it mid-transaction (row A's target value is row B's current
// value, and vice versa -- whichever update runs first collides). Routed
// through a temporary out-of-range sentinel instead.
const REORDER_SENTINEL_ORDER = -1;

export const reorderLessonPart: ReorderLessonPart<ReorderLessonPartInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(reorderLessonPartInputSchema, rawArgs);
  if (args.id === args.otherId) return;

  const [a, b] = await Promise.all([
    context.entities.LessonPart.findUniqueOrThrow({ where: { id: args.id } }),
    context.entities.LessonPart.findUniqueOrThrow({ where: { id: args.otherId } }),
  ]);
  if (a.lessonId !== b.lessonId) {
    throw new HttpError(400, 'Can only reorder parts within the same lesson');
  }

  await prisma.$transaction([
    context.entities.LessonPart.update({ where: { id: a.id }, data: { order: REORDER_SENTINEL_ORDER } }),
    context.entities.LessonPart.update({ where: { id: b.id }, data: { order: a.order } }),
    context.entities.LessonPart.update({ where: { id: a.id }, data: { order: b.order } }),
  ]);
};

export const deleteLessonPart: DeleteLessonPart<{ id: string }, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);

  const part = await context.entities.LessonPart.findUniqueOrThrow({ where: { id: args.id } });
  await context.entities.LessonPart.delete({ where: { id: args.id } });
  await logAdminAction(context, {
    action: 'lessonPart.delete',
    entityType: 'LessonPart',
    entityId: args.id,
    details: { lessonId: part.lessonId, title: part.title },
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

/* -------------------------------------------------------------------------- */
/*  Subjects, for organizing the /admin/lessons page into per-subject tabs.    */
/*  Deliberately its own action rather than reusing the Questions Review      */
/*  page's `createSubject` -- that one always lands new subjects under the   */
/*  shared "general_dentist" exam (subjects there aren't really exam-scoped,  */
/*  Question.exams is), whereas a Lesson always belongs to one specific exam  */
/*  (Ireland, DHA, ...) so a Lesson's subject must be scoped to that exam.    */
/* -------------------------------------------------------------------------- */

const createSubjectForExamInputSchema = z.object({
  examId: z.string().nonempty(),
  name: z.string().trim().nonempty(),
});
type CreateSubjectForExamInput = z.infer<typeof createSubjectForExamInputSchema>;

export const createSubjectForExam: CreateSubjectForExam<CreateSubjectForExamInput, Subject> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createSubjectForExamInputSchema, rawArgs);

  const existing = await context.entities.Subject.findFirst({ where: { name: args.name, examId: args.examId } });
  if (existing) {
    throw new HttpError(400, `A subject named "${args.name}" already exists for this exam.`);
  }

  const created = await context.entities.Subject.create({ data: { name: args.name, examId: args.examId } });
  await logAdminAction(context, {
    action: 'subject.create',
    entityType: 'Subject',
    entityId: created.id,
    details: { name: args.name, examId: args.examId },
  });
  return created;
};
