/**
 * PRD-003 Sprint 3 (see docs/11-lesson-content-pipeline-PRD-003.md): the
 * whole-lesson-at-once version of what QuickAddMcqsForm does one Part at a
 * time. Given a book-sourced lesson's on-disk folders (one `<prefix>-partN/`
 * per Part, plus one `<prefix>-complete/` holding the merged extra-20 MCQs),
 * this takes it all the way to a live Lesson with published, exam-tagged,
 * Part-assigned Question rows -- calling the SAME real operations a human
 * clicking through /admin/lessons would call (createLesson, createLessonPart,
 * importQuestionsFromText, getQuestionsForReview, updateReviewQuestion,
 * approveQuestion, assignQuestionToLessonPart), none of them reimplemented.
 *
 * Kept and reused (unlike PRD-002's historical one-off scripts, which were
 * created/run/deleted) because new book folders keep getting added over
 * time -- safe to re-run: Lesson/Part lookups are find-or-create, and
 * importQuestionsFromText already dedups new stems against every existing
 * Question in the DB.
 *
 * Usage (from ~/LicenseDent/app):
 *   LESSON_PREFIX=/mnt/d/Dental/lessons/endo-pulp \
 *   LESSON_TITLE="Endodontics: Pulp Diagnosis" \
 *   LESSON_ORDER=1 \
 *   EXAM_SLUG=idc-ireland \
 *   SUBJECT_NAME=Endodontics \
 *   DIFFICULTY=medium \
 *   DRY_RUN=1 \
 *   wasp db seed importLesson
 *
 * Directory convention this expects (matches every lesson already on disk
 * under D:\Dental\lessons):
 *   <prefix>-part1/part1-mcqs.json (+ part1-notes.md)
 *   <prefix>-part2/part2-mcqs.json (+ part2-notes.md)
 *   <prefix>-part3/part3-mcqs.json (+ part3-notes.md)
 *   <prefix>-complete/lesson*-extra-20-mcqs.json
 *   <prefix>-complete/meta.json   (optional: { sourceBook, parts: [{pages}] })
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';

import { createLesson, createLessonPart } from '../../admin/dashboards/lessons/operations';
import { assignQuestionToLessonPart } from '../../admin/dashboards/lessons/operations';
import {
  approveQuestion,
  getQuestionsForReview,
  importQuestionsFromText,
  updateReviewQuestion,
} from '../../admin/dashboards/questions/operations';
import { isDuplicate, normalizeStem, parseQuestionsFromText } from '../../admin/dashboards/questions/importParsing';

type Difficulty = 'easy' | 'medium' | 'hard';

interface McqEntry {
  stem: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
  subjectName?: string;
  sourceRef?: string;
}

interface LessonMeta {
  sourceBook?: string;
  parts?: { pages?: string }[];
}

interface BatchSummary {
  published: number;
  duplicates: number;
  invalid: number;
  flagged: { stem: string; reason: string }[];
}

// Same transform as the survivor script src/server/scripts/convertLessonMcqs.mjs
// (PRD-002 I5.2) -- not reimplemented logic, just inlined so this script has
// no cross-runtime shell-out.
function mcqsToPlainText(mcqs: McqEntry[]): string {
  const blocks = mcqs.map((mcq, i) => {
    const lines = [`${i + 1}- ${mcq.stem}`];
    for (const opt of mcq.options) {
      const isCorrect = opt.key === mcq.correctKey;
      lines.push(`${opt.key}. ${opt.text}${isCorrect ? '**' : ''}`);
    }
    if (mcq.explanation) lines.push(`* ${mcq.explanation}`);
    return lines.join('\n');
  });
  return blocks.join('\n\n') + '\n';
}

async function processQuestionBatch(opts: {
  prismaClient: PrismaClient;
  context: any;
  examId: string;
  subjectId: string | null;
  mcqs: McqEntry[];
  fileName: string;
  difficulty: Difficulty;
  dryRun: boolean;
  assignToPartId: string | null;
  summary: BatchSummary;
}) {
  const text = mcqsToPlainText(opts.mcqs);
  const { parsed, flagged } = parseQuestionsFromText(text, opts.fileName);

  if (opts.dryRun) {
    // Mirrors importQuestionsFromText's own loop exactly (parsed first, then
    // flagged, existingNorms growing as we go) -- a per-entry snapshot dedup
    // check undercounts, because two near-identical entries in the SAME
    // batch (e.g. a templated stem repeated with one word changed) only
    // collide against each other mid-loop, not against the DB snapshot taken
    // up front. Confirmed for real: an earlier version of this dry-run
    // reported "~0 likely duplicate" for a batch where the real (non-dry)
    // run then skipped one entry as an intra-batch duplicate.
    const existing = await opts.prismaClient.question.findMany({ select: { stem: true } });
    const existingNorms = existing.map((q) => normalizeStem(q.stem));
    let dupCount = 0;
    let invalidCount = 0;
    let wouldPending = 0;
    let wouldFlagged = 0;
    const allEntries = [
      ...parsed.map((entry) => ({ entry, status: 'pending' as const })),
      ...flagged.map((entry) => ({ entry, status: 'flagged' as const })),
    ];
    for (const { entry, status } of allEntries) {
      const stem = entry.stem.trim();
      if (!stem || entry.options.length < 1) {
        invalidCount += 1;
        continue;
      }
      const norm = normalizeStem(stem);
      if (isDuplicate(norm, existingNorms)) {
        dupCount += 1;
        continue;
      }
      existingNorms.push(norm);
      if (status === 'pending') wouldPending += 1;
      else wouldFlagged += 1;
    }
    console.log(
      `  [dry-run] ${opts.fileName}: ${wouldPending} would-be-pending, ${wouldFlagged} would-be-flagged, ${dupCount} would-be-duplicate, ${invalidCount} would-be-invalid`
    );
    for (const f of flagged) {
      console.log(`    FLAGGED: "${f.stem.slice(0, 70)}" -- ${f.flagReason}`);
      opts.summary.flagged.push({ stem: f.stem, reason: f.flagReason ?? 'unknown' });
    }
    opts.summary.duplicates += dupCount;
    opts.summary.invalid += invalidCount;
    return;
  }

  if (!opts.subjectId) {
    throw new Error('subjectId must be resolved before a non-dry-run import');
  }

  const result = await importQuestionsFromText(
    {
      examId: opts.examId,
      subjectMode: 'single',
      subjectId: opts.subjectId,
      fileName: opts.fileName,
      text,
      skipAiSuggestions: true,
    },
    opts.context
  );

  console.log(
    `  [import] ${opts.fileName}: inserted=${result.inserted} pending=${result.pendingCount} flagged=${result.flaggedCount} duplicate=${result.skippedDuplicate} invalid=${result.skippedInvalid}`
  );
  opts.summary.duplicates += result.skippedDuplicate;
  opts.summary.invalid += result.skippedInvalid;
  // The DB row never stores flagReason -- re-parse the same text purely for
  // reporting, so a flagged question's stem AND why never get printed apart.
  for (const f of flagged) {
    opts.summary.flagged.push({ stem: f.stem, reason: f.flagReason ?? 'unknown' });
  }

  const created = await getQuestionsForReview(
    {
      importBatchId: result.batchId,
      status: 'unreviewed',
      needsTagging: false,
      missingAiDraft: false,
      sortBy: 'oldest',
      skip: 0,
      take: 100,
    },
    opts.context
  );
  const clean = created.filter((q) => q.status === 'pending');

  for (const q of clean) {
    await updateReviewQuestion({ id: q.id, difficulty: opts.difficulty }, opts.context);
    await approveQuestion({ id: q.id }, opts.context);
    if (opts.assignToPartId) {
      await assignQuestionToLessonPart({ lessonPartId: opts.assignToPartId, questionId: q.id }, opts.context);
    }
    opts.summary.published += 1;
  }
}

export async function importLessonFolder(prismaClient: PrismaClient) {
  const { LESSON_PREFIX, LESSON_TITLE, LESSON_ORDER = '1', EXAM_SLUG, SUBJECT_NAME, DIFFICULTY = 'medium', DRY_RUN } =
    process.env;

  if (!LESSON_PREFIX || !LESSON_TITLE || !EXAM_SLUG || !SUBJECT_NAME) {
    throw new Error(
      'Required env vars: LESSON_PREFIX, LESSON_TITLE, EXAM_SLUG, SUBJECT_NAME (LESSON_ORDER, DIFFICULTY, DRY_RUN optional). See file header for the full example.'
    );
  }
  const dryRun = DRY_RUN === '1' || DRY_RUN === 'true';
  const difficulty = DIFFICULTY as Difficulty;
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(`DIFFICULTY must be easy|medium|hard, got "${DIFFICULTY}"`);
  }

  console.log(`=== importLessonFolder ${dryRun ? '(DRY RUN)' : ''} ===`);
  console.log(`prefix=${LESSON_PREFIX} title="${LESSON_TITLE}" exam=${EXAM_SLUG} subject=${SUBJECT_NAME}`);

  const admin = await prismaClient.user.findFirst({ where: { isAdmin: true } });
  if (!admin) throw new Error('No admin user found in the database -- cannot attribute verifiedById/AdminAuditLog');

  const exam = await prismaClient.exam.findUnique({ where: { slug: EXAM_SLUG } });
  if (!exam) throw new Error(`No Exam found with slug "${EXAM_SLUG}"`);

  const context: any = {
    user: admin,
    entities: {
      Lesson: prismaClient.lesson,
      LessonPart: prismaClient.lessonPart,
      Question: prismaClient.question,
      Exam: prismaClient.exam,
      Subject: prismaClient.subject,
      ImportBatch: prismaClient.importBatch,
    },
  };

  const completeDir = `${LESSON_PREFIX}-complete`;
  const metaPath = path.join(completeDir, 'meta.json');
  const meta: LessonMeta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {};

  // Subject: find-or-create ourselves -- importQuestionsFromText always
  // CREATES a new Subject when subjectId isn't passed (even if one with the
  // same name already exists), so a re-run must always pass a resolved
  // subjectId, never rely on newSubjectName after the first run.
  let subject = await prismaClient.subject.findFirst({ where: { name: SUBJECT_NAME, examId: exam.id } });
  if (!subject) {
    console.log(`[subject] "${SUBJECT_NAME}" not found for this exam${dryRun ? ' (dry-run: would create)' : ''}`);
    if (!dryRun) {
      subject = await prismaClient.subject.create({ data: { name: SUBJECT_NAME, examId: exam.id } });
    }
  } else {
    console.log(`[subject] found existing "${subject.name}" (${subject.id})`);
  }

  let lesson = await prismaClient.lesson.findFirst({ where: { examId: exam.id, title: LESSON_TITLE } });
  if (!lesson) {
    console.log(`[lesson] "${LESSON_TITLE}" not found${dryRun ? ' (dry-run: would create)' : ''}`);
    if (!dryRun) {
      lesson = await createLesson(
        {
          examId: exam.id,
          subjectId: subject?.id ?? null,
          title: LESSON_TITLE,
          order: parseInt(LESSON_ORDER, 10),
          passThresholdPercent: 70,
        },
        context
      );
    }
  } else {
    console.log(`[lesson] found existing "${lesson.title}" (${lesson.id})`);
  }

  const summary: BatchSummary = { published: 0, duplicates: 0, invalid: 0, flagged: [] };
  let partsSeen = 0;

  let partNum = 1;
  while (true) {
    const partDir = `${LESSON_PREFIX}-part${partNum}`;
    const mcqsPath = path.join(partDir, `part${partNum}-mcqs.json`);
    if (!existsSync(mcqsPath)) break;
    partsSeen += 1;

    const notesPath = path.join(partDir, `part${partNum}-notes.md`);
    const mcqs: McqEntry[] = JSON.parse(readFileSync(mcqsPath, 'utf-8'));
    const notesMarkdown = existsSync(notesPath) ? readFileSync(notesPath, 'utf-8') : null;
    const pages = meta.parts?.[partNum - 1]?.pages ?? null;

    console.log(`\n--- Part ${partNum} (${mcqs.length} MCQs) ---`);

    let part = lesson ? await prismaClient.lessonPart.findFirst({ where: { lessonId: lesson.id, order: partNum } }) : null;
    if (!part) {
      console.log(`  [part] not found${dryRun ? ' (dry-run: would create)' : ''}`);
      if (!dryRun && lesson) {
        part = await createLessonPart(
          {
            lessonId: lesson.id,
            title: `Part ${partNum}`,
            order: partNum,
            notesMarkdown,
            sourceBook: meta.sourceBook ?? null,
            sourcePages: pages,
          },
          context
        );
      }
    } else {
      console.log(`  [part] found existing (${part.id})`);
    }

    await processQuestionBatch({
      prismaClient,
      context,
      examId: exam.id,
      subjectId: subject?.id ?? null,
      mcqs,
      fileName: `${path.basename(LESSON_PREFIX)}-part${partNum}-mcqs.json`,
      difficulty,
      dryRun,
      assignToPartId: part?.id ?? null,
      summary,
    });

    partNum += 1;
  }

  if (partsSeen === 0) {
    throw new Error(`No part*-mcqs.json found under ${LESSON_PREFIX}-part1, -part2, ... -- check LESSON_PREFIX`);
  }

  // Extra-20 -> general practice pool, NOT gated to any one Part (matches
  // PRD-002 I7.1's 60-to-Parts / 80-to-pool split for the 4 existing lessons).
  if (existsSync(completeDir)) {
    const extraFile = readdirSync(completeDir).find((f) => /extra-20-mcqs\.json$/.test(f));
    if (extraFile) {
      const extraMcqs: McqEntry[] = JSON.parse(readFileSync(path.join(completeDir, extraFile), 'utf-8'));
      console.log(`\n--- Extra pool (${extraMcqs.length} MCQs, general practice bank) ---`);
      await processQuestionBatch({
        prismaClient,
        context,
        examId: exam.id,
        subjectId: subject?.id ?? null,
        mcqs: extraMcqs,
        fileName: `${path.basename(LESSON_PREFIX)}-extra-20-mcqs.json`,
        difficulty,
        dryRun,
        assignToPartId: null,
        summary,
      });
    }
  }

  console.log(`\n=== SUMMARY ${dryRun ? '(DRY RUN -- nothing written)' : ''} ===`);
  console.log(`Parts processed: ${partsSeen}`);
  console.log(`Published+assigned: ${summary.published}`);
  console.log(`Skipped as duplicate: ${summary.duplicates}`);
  console.log(`Skipped as invalid: ${summary.invalid}`);
  console.log(`Flagged (${summary.flagged.length}):`);
  for (const f of summary.flagged) {
    console.log(`  - "${f.stem.slice(0, 70)}" -- ${f.reason}`);
  }
}
