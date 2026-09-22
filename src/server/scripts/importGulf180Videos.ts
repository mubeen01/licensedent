/**
 * Gulf-180 video-lesson importer (see D:\Dental\lessons\GULF-180-MASTER-REFERENCE.md
 * and MASTER-180-DETAILED-LESSONS.md). Each folder on disk is one ~10-minute
 * video: `<prefix>-<slug>-video<N>/` containing a 10-slide script (.json/.md),
 * a PPT, `Notes-short.md`, and `MCQs-5.md` (5 questions). This is a different
 * shape from both importLessonFolder.ts (book-chapter Lessons with 3 Parts of
 * ~35 MCQs each, JSON MCQs) and importMcqBatches.ts (flat question-pool-only
 * batches, no Lesson) -- one video maps to one LessonPart, and all videos for
 * a subject share one Lesson.
 *
 * Usage (from ~/LicenseDent/app):
 *   LESSONS_DIR=/mnt/d/Dental/lessons \
 *   EXAM_SLUG=general_dentist \
 *   DIFFICULTY=medium \
 *   DRY_RUN=1 \
 *   wasp db seed importGulf180Videos
 *
 * Folder naming (matches GULF-180-MASTER-REFERENCE.md section 4): scans
 * LESSONS_DIR's immediate subfolders for `<prefix>-<anything>-video<N>`
 * (e.g. `endo-pulp-biology-video1`, `perio-aggressive-video31`). prefix maps
 * to a Subject + a global-video-number offset via PREFIX_CONFIG (shared with
 * importMcqBatches.ts, see ./gulf180Config.ts), so a video's LessonPart
 * order is always (videoNum - offset) regardless of which videos happen to
 * exist on disk yet -- stable across reruns as more videos are added. A
 * folder with a prefix not in PREFIX_CONFIG is skipped with a warning, not
 * guessed at.
 *
 * Each subject's videos share ONE Lesson (title = the Subject name) under
 * EXAM_SLUG; each video becomes one LessonPart (find-or-create by
 * {lessonId, order}). Expects per folder:
 *   <prefix>-*-video<N>/
 *     <anything>-script.json   -- array of {slide_title, ..., example?}; block[0].slide_title -> Part title, block[0].example -> sourceBook
 *     Notes-short.md           -- -> Part.notesMarkdown
 *     MCQs-5.md                -- "**Q1.** stem / A. .. B. .. / **Correct: B** -- explanation" x5 -> Questions, assigned to this Part
 * Safe to re-run: Lesson/Part lookups are find-or-create and
 * importQuestionsFromText already dedups new stems against every existing
 * Question in the DB.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';

import { createLesson, createLessonPart, assignQuestionToLessonPart } from '../../admin/dashboards/lessons/operations';
import {
  approveQuestion,
  getQuestionsForReview,
  importQuestionsFromText,
  updateReviewQuestion,
} from '../../admin/dashboards/questions/operations';
import { parseQuestionsFromText } from '../../admin/dashboards/questions/importParsing';
import { PREFIX_CONFIG } from './gulf180Config';

type Difficulty = 'easy' | 'medium' | 'hard';

const FOLDER_PATTERN = /^([a-z]+)-.+-video(\d+)$/;

interface McqEntry {
  stem: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

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

// Three MCQs-5.md shapes exist on disk so far (the template keeps getting
// refined mid-pipeline):
//   Format A: "**Q1.** stem" / "A. text" / "**Correct: B** -- explanation"
//   Format B: "## Q1" / "Stem: stem" / "- A) text" / "Correct: B" (own line)
//             / "Explanation: text" (own line)
//   Format C: five ```json fenced blocks, each already a full
//             {stem, options, correctKey, explanation, ...} object (the
//             same shape as mcq-batches/*.json) -- parsed directly, no
//             line-based extraction needed.
// Neither A nor B is the markup parseQuestionsFromText expects (a trailing
// `**` on the correct OPTION line itself), so their entries are extracted
// here with a unified line-by-line parser and re-serialized via
// mcqsToPlainText into the format that parser does understand.
function parseMcqsMarkdown(raw: string): McqEntry[] {
  const jsonBlocks = [...raw.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (jsonBlocks.length > 0) {
    const entries: McqEntry[] = [];
    for (const [, blockText] of jsonBlocks) {
      try {
        const obj = JSON.parse(blockText);
        if (obj.stem && obj.correctKey && Array.isArray(obj.options) && obj.options.length >= 2) {
          entries.push({ stem: obj.stem, options: obj.options, correctKey: obj.correctKey, explanation: obj.explanation ?? '' });
        }
      } catch {
        // Malformed fenced block -- skip it; the caller logs a "parsed 0"
        // warning if this leaves the file with too few entries.
      }
    }
    return entries;
  }

  const entries: McqEntry[] = [];
  let cur: { stem?: string; options: { key: string; text: string }[]; correctKey?: string; explanation?: string } | null = null;

  const flush = () => {
    if (cur && cur.stem && cur.correctKey && cur.options.length >= 2) {
      entries.push({ stem: cur.stem, options: cur.options, correctKey: cur.correctKey, explanation: cur.explanation ?? '' });
    }
  };
  const appendExplanation = (text: string) => {
    if (!cur || !text) return;
    cur.explanation = cur.explanation ? `${cur.explanation} ${text}` : text;
  };

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // New question: "## Q1" (format B, stem follows on its own line) or
    // "**Q1.** stem text" (format A, stem inline).
    const hashQMatch = /^#+\s*Q\d+\s*$/.exec(line);
    const boldQMatch = /^\*\*Q\d+\.\*\*\s*(.*)$/.exec(line);
    if (hashQMatch || boldQMatch) {
      flush();
      cur = { options: [] };
      if (boldQMatch && boldQMatch[1]) cur.stem = boldQMatch[1];
      continue;
    }
    if (!cur) continue;

    const stemMatch = /^Stem:\s*(.*)$/i.exec(line);
    if (stemMatch) {
      cur.stem = stemMatch[1];
      continue;
    }

    // Option: "- A) text" (format B) or "A. text" (format A).
    const optMatch = /^-?\s*([A-D])[.)]\s+(.*)$/.exec(line);
    if (optMatch) {
      cur.options.push({ key: optMatch[1], text: optMatch[2].replace(/\*{2,3}\s*$/, '').trim() });
      continue;
    }

    // Correct-answer marker, with or without bold asterisks, optionally
    // followed inline by an em-dash + explanation (format A).
    const correctMatch = /^\*{0,2}Correct:\s*([A-D])\*{0,2}\s*[—-]?\s*(.*)$/i.exec(line);
    if (correctMatch) {
      cur.correctKey = correctMatch[1];
      appendExplanation(correctMatch[2]);
      continue;
    }

    const explanationMatch = /^Explanation:\s*(.*)$/i.exec(line);
    if (explanationMatch) {
      appendExplanation(explanationMatch[1]);
      continue;
    }
  }
  flush();
  return entries;
}

interface ScriptBlock {
  slide_title?: string;
  example?: string;
}

interface Summary {
  lessonsCreated: number;
  partsCreated: number;
  partsSkipped: number;
  published: number;
  duplicates: number;
  invalid: number;
  flagged: { folder: string; stem: string; reason: string }[];
}

export async function importGulf180Videos(prismaClient: PrismaClient) {
  const { LESSONS_DIR, EXAM_SLUG = 'general_dentist', DIFFICULTY = 'medium', DRY_RUN } = process.env;

  if (!LESSONS_DIR) {
    throw new Error('Required env var: LESSONS_DIR (EXAM_SLUG, DIFFICULTY, DRY_RUN optional). See file header for usage.');
  }
  if (!existsSync(LESSONS_DIR)) {
    throw new Error(`LESSONS_DIR does not exist: ${LESSONS_DIR}`);
  }
  const dryRun = DRY_RUN === '1' || DRY_RUN === 'true';
  const difficulty = DIFFICULTY as Difficulty;
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(`DIFFICULTY must be easy|medium|hard, got "${DIFFICULTY}"`);
  }

  console.log(`=== importGulf180Videos ${dryRun ? '(DRY RUN)' : ''} ===`);
  console.log(`dir=${LESSONS_DIR} exam=${EXAM_SLUG} difficulty=${difficulty}`);

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

  const entries = readdirSync(LESSONS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
  const byPrefix = new Map<string, { folder: string; videoNum: number }[]>();
  const unmappedPrefixes = new Set<string>();

  for (const entry of entries) {
    const m = FOLDER_PATTERN.exec(entry.name);
    if (!m) continue;
    const [, prefix, numStr] = m;
    if (!PREFIX_CONFIG[prefix]) {
      unmappedPrefixes.add(prefix);
      continue;
    }
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix)!.push({ folder: entry.name, videoNum: parseInt(numStr, 10) });
  }

  if (unmappedPrefixes.size > 0) {
    console.log(`\n[skip] unmapped prefixes (no Subject decided yet): ${[...unmappedPrefixes].join(', ')}`);
  }
  if (byPrefix.size === 0) {
    throw new Error(`No video folders matched a known prefix under ${LESSONS_DIR}`);
  }

  const summary: Summary = { lessonsCreated: 0, partsCreated: 0, partsSkipped: 0, published: 0, duplicates: 0, invalid: 0, flagged: [] };

  for (const [prefix, videos] of byPrefix) {
    const { subject: subjectName, offset } = PREFIX_CONFIG[prefix];
    videos.sort((a, b) => a.videoNum - b.videoNum);
    console.log(`\n=== ${subjectName} (${videos.length} videos, prefix "${prefix}") ===`);

    let subject = await prismaClient.subject.findFirst({ where: { name: subjectName, examId: exam.id } });
    if (!subject) {
      console.log(`  [subject] "${subjectName}" not found${dryRun ? ' (dry-run: would create)' : ''}`);
      if (!dryRun) subject = await prismaClient.subject.create({ data: { name: subjectName, examId: exam.id } });
    } else {
      console.log(`  [subject] found existing "${subject.name}" (${subject.id})`);
    }

    let lesson = await prismaClient.lesson.findFirst({ where: { examId: exam.id, title: subjectName } });
    if (!lesson) {
      console.log(`  [lesson] "${subjectName}" not found${dryRun ? ' (dry-run: would create)' : ''}`);
      if (!dryRun) {
        lesson = await createLesson(
          { examId: exam.id, subjectId: subject?.id ?? null, title: subjectName, order: 1, passThresholdPercent: 70 },
          context
        );
        summary.lessonsCreated += 1;
      }
    } else {
      console.log(`  [lesson] found existing "${lesson.title}" (${lesson.id})`);
    }

    for (const { folder, videoNum } of videos) {
      const dir = path.join(LESSONS_DIR, folder);
      const order = videoNum - offset;
      if (order < 1) {
        console.log(`  [warn] ${folder}: videoNum ${videoNum} - offset ${offset} = ${order} < 1, skipping`);
        summary.partsSkipped += 1;
        continue;
      }

      const scriptFile = readdirSync(dir).find((f) => f.endsWith('-script.json'));
      const mcqsPath = path.join(dir, 'MCQs-5.md');
      const notesPath = path.join(dir, 'Notes-short.md');
      if (!scriptFile || !existsSync(mcqsPath)) {
        console.log(`  [warn] ${folder}: missing *-script.json or MCQs-5.md, skipping`);
        summary.partsSkipped += 1;
        continue;
      }

      const blocks: ScriptBlock[] = JSON.parse(readFileSync(path.join(dir, scriptFile), 'utf-8'));
      const slideTitle = blocks[0]?.slide_title?.trim() || folder;
      const sourceBook = blocks[0]?.example?.trim() || null;
      const notesMarkdown = existsSync(notesPath) ? readFileSync(notesPath, 'utf-8') : null;
      const partTitle = `Video ${videoNum}: ${slideTitle}`;

      let part = lesson ? await prismaClient.lessonPart.findFirst({ where: { lessonId: lesson.id, order } }) : null;
      if (!part) {
        console.log(`  [part ${order}] "${partTitle}" not found${dryRun ? ' (dry-run: would create)' : ''}`);
        if (!dryRun && lesson) {
          part = await createLessonPart(
            { lessonId: lesson.id, title: partTitle, order, durationMinutes: 10, notesMarkdown, sourceBook, sourcePages: null },
            context
          );
          summary.partsCreated += 1;
        }
      } else {
        console.log(`  [part ${order}] found existing "${part.title}" (${part.id})`);
      }

      const mcqs = parseMcqsMarkdown(readFileSync(mcqsPath, 'utf-8'));
      if (mcqs.length === 0) {
        console.log(`  [warn] ${folder}: MCQs-5.md parsed 0 questions`);
        continue;
      }

      const text = mcqsToPlainText(mcqs);
      const { parsed, flagged } = parseQuestionsFromText(text, folder);

      if (dryRun) {
        console.log(`  [dry-run] ${folder}: ${parsed.length} parsed, ${flagged.length} flagged (subject/part resolution not simulated further)`);
        for (const f of flagged) summary.flagged.push({ folder, stem: f.stem, reason: f.flagReason ?? 'unknown' });
        continue;
      }
      if (!subject?.id) throw new Error(`subjectId must be resolved before a non-dry-run import (subject "${subjectName}")`);

      const result = await importQuestionsFromText(
        { examId: exam.id, subjectMode: 'single', subjectId: subject.id, fileName: folder, text, skipAiSuggestions: true },
        context
      );
      console.log(
        `  [import] ${folder}: inserted=${result.inserted} pending=${result.pendingCount} flagged=${result.flaggedCount} duplicate=${result.skippedDuplicate} invalid=${result.skippedInvalid}`
      );
      summary.duplicates += result.skippedDuplicate;
      summary.invalid += result.skippedInvalid;
      for (const f of flagged) summary.flagged.push({ folder, stem: f.stem, reason: f.flagReason ?? 'unknown' });

      while (true) {
        const created = await getQuestionsForReview(
          { importBatchId: result.batchId, status: 'unreviewed', needsTagging: false, missingAiDraft: false, sortBy: 'oldest', skip: 0, take: 100 },
          context
        );
        if (created.length === 0) break;
        const clean = created.filter((q) => q.status === 'pending');
        for (const q of clean) {
          await updateReviewQuestion({ id: q.id, difficulty }, context);
          await approveQuestion({ id: q.id }, context);
          if (part?.id) await assignQuestionToLessonPart({ lessonPartId: part.id, questionId: q.id }, context);
          summary.published += 1;
        }
        if (clean.length === 0 || created.length < 100) break;
      }
    }
  }

  console.log(`\n=== SUMMARY ${dryRun ? '(DRY RUN -- nothing written)' : ''} ===`);
  console.log(`Lessons created: ${summary.lessonsCreated}`);
  console.log(`Parts created: ${summary.partsCreated}, skipped: ${summary.partsSkipped}`);
  console.log(`Published: ${summary.published}`);
  console.log(`Skipped as duplicate: ${summary.duplicates}`);
  console.log(`Skipped as invalid: ${summary.invalid}`);
  console.log(`Flagged (${summary.flagged.length}):`);
  for (const f of summary.flagged) {
    console.log(`  - [${f.folder}] "${f.stem.slice(0, 70)}" -- ${f.reason}`);
  }
}
