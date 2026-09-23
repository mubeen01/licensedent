/**
 * Ad-hoc MCQ batch importer for the Gulf general-dentist question bank (see
 * D:\Dental\lessons\GULF-180-MASTER-REFERENCE.md). Unlike
 * importLessonFolder.ts, batches here have no Lesson/Part structure -- each
 * file under BATCH_DIR is a flat array of McqEntry (same shape used
 * everywhere else in this pipeline) dropped straight into the question pool
 * for its subjectName, scoped to EXAM_SLUG (general_dentist by default, the
 * shared Gulf bank -- see docs/09-work-changelog.md).
 *
 * Usage (from ~/LicenseDent/app):
 *   BATCH_DIR=/mnt/d/Dental/lessons/mcq-batches/endo \
 *   EXAM_SLUG=general_dentist \
 *   DIFFICULTY=medium \
 *   DRY_RUN=1 \
 *   wasp db seed importMcqBatches
 *
 * Each *.json file under BATCH_DIR (searched recursively) must be a flat
 * array of:
 *   {
 *     stem, options: [{key, text}], correctKey, explanation, subjectName, sourceRef,
 *     difficulty?: "easy"|"medium"|"hard", isHighYield?: boolean, isCaseBased?: boolean,
 *   }
 * difficulty/isHighYield/isCaseBased are optional per question -- omit them
 * and the DIFFICULTY env var (default "medium") applies to every question in
 * the run, same as before this field existed. Set them per-question to mix
 * difficulties/tags within one batch file.
 *
 * Subject resolution: if a file lives directly under a `mcq-batches/<prefix>/`
 * folder whose prefix is a known key in PREFIX_CONFIG (./gulf180Config.ts,
 * shared with importGulf180Videos.ts), EVERY question in that file is filed
 * under that prefix's canonical Subject -- the file's own per-question
 * `subjectName` is ignored for this. This matters because content batches
 * have repeatedly invented slightly different labels per drop (e.g.
 * "Oral Surgery + LA" instead of the actual existing Subject "Oral and
 * Maxillofacial Surgery"); trusting the folder instead of the label is what
 * keeps every batch merging into the same Subject instead of forking a new
 * one on every naming drift. A file NOT under a known-prefix folder (e.g. a
 * genuinely mixed-subject folder like `mcq-batches/operpros/`) falls back to
 * grouping by each question's own `subjectName`, normalized through
 * SUBJECT_LABEL_ALIASES (./gulf180Config.ts) first so the same off-label
 * drift is still caught there too (find-or-create against Subject rows
 * scoped to EXAM_SLUG's Exam, "one broad Subject per dental domain"
 * convention, docs/09-work-changelog.md line ~189). Safe to re-run: Subject
 * lookup is find-or-create and
 * importQuestionsFromText already dedups new stems against every existing
 * Question in the DB.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';

import {
  approveQuestion,
  getQuestionsForReview,
  importQuestionsFromText,
  updateReviewQuestion,
} from '../../admin/dashboards/questions/operations';
import { isDuplicate, normalizeStem, parseQuestionsFromText } from '../../admin/dashboards/questions/importParsing';
import { PREFIX_CONFIG, SUBJECT_LABEL_ALIASES } from './gulf180Config';

type Difficulty = 'easy' | 'medium' | 'hard';

interface McqEntry {
  stem: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
  subjectName?: string;
  sourceRef?: string;
  // Optional per-question overrides -- fall back to the DIFFICULTY env var
  // (and false/false) when omitted, so older batch files without these
  // still import exactly as before.
  difficulty?: Difficulty;
  isHighYield?: boolean;
  isCaseBased?: boolean;
}

interface BatchSummary {
  published: number;
  duplicates: number;
  invalid: number;
  flagged: { file: string; stem: string; reason: string }[];
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

function findJsonFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...findJsonFilesRecursive(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out.sort();
}

export async function importMcqBatches(prismaClient: PrismaClient) {
  const { BATCH_DIR, EXAM_SLUG = 'general_dentist', DIFFICULTY = 'medium', DRY_RUN } = process.env;

  if (!BATCH_DIR) {
    throw new Error('Required env var: BATCH_DIR (EXAM_SLUG, DIFFICULTY, DRY_RUN optional). See file header for usage.');
  }
  if (!existsSync(BATCH_DIR)) {
    throw new Error(`BATCH_DIR does not exist: ${BATCH_DIR}`);
  }
  const dryRun = DRY_RUN === '1' || DRY_RUN === 'true';
  const difficulty = DIFFICULTY as Difficulty;
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(`DIFFICULTY must be easy|medium|hard, got "${DIFFICULTY}"`);
  }

  console.log(`=== importMcqBatches ${dryRun ? '(DRY RUN)' : ''} ===`);
  console.log(`dir=${BATCH_DIR} exam=${EXAM_SLUG} difficulty=${difficulty}`);

  const admin = await prismaClient.user.findFirst({ where: { isAdmin: true } });
  if (!admin) throw new Error('No admin user found in the database -- cannot attribute verifiedById/AdminAuditLog');

  const exam = await prismaClient.exam.findUnique({ where: { slug: EXAM_SLUG } });
  if (!exam) throw new Error(`No Exam found with slug "${EXAM_SLUG}"`);

  const context: any = {
    user: admin,
    entities: {
      Question: prismaClient.question,
      Exam: prismaClient.exam,
      Subject: prismaClient.subject,
      ImportBatch: prismaClient.importBatch,
    },
  };

  const files = findJsonFilesRecursive(BATCH_DIR);
  if (files.length === 0) {
    throw new Error(`No *.json files found under ${BATCH_DIR}`);
  }

  const summary: BatchSummary = { published: 0, duplicates: 0, invalid: 0, flagged: [] };
  const subjectCache = new Map<string, string>(); // name -> id

  // RESUME_BATCH_IDS: comma-separated ImportBatch ids left stuck in
  // 'unreviewed' by a prior crashed run (importQuestionsFromText already
  // inserted them, but the run died before the approve loop). Re-running
  // the normal file loop can't fix these itself -- their stems now already
  // exist in the DB, so a fresh importQuestionsFromText call would just
  // dedup-skip them, never re-surfacing them for approval. Drain and
  // approve them explicitly first.
  if (!dryRun && process.env.RESUME_BATCH_IDS) {
    for (const batchId of process.env.RESUME_BATCH_IDS.split(',').map((s) => s.trim()).filter(Boolean)) {
      console.log(`\n--- resuming stuck batch ${batchId} ---`);
      while (true) {
        const created = await getQuestionsForReview(
          { importBatchId: batchId, status: 'unreviewed', needsTagging: false, missingAiDraft: false, sortBy: 'oldest', skip: 0, take: 100 },
          context
        );
        if (created.length === 0) break;
        const clean = created.filter((q) => q.status === 'pending');
        for (const q of clean) {
          await updateReviewQuestion({ id: q.id, difficulty }, context);
          await approveQuestion({ id: q.id }, context);
          summary.published += 1;
        }
        console.log(`  approved ${clean.length}/${created.length} from this page`);
        if (clean.length === 0 || created.length < 100) break;
      }
    }
  }

  for (const file of files) {
    const relName = path.relative(BATCH_DIR, file);
    const mcqs: McqEntry[] = JSON.parse(readFileSync(file, 'utf-8'));
    console.log(`\n--- ${relName} (${mcqs.length} MCQs) ---`);

    // Folder-prefix subject wins over each question's own `subjectName` --
    // see the file header. path.dirname(file) is the immediate parent dir;
    // its basename is the "<prefix>" of "mcq-batches/<prefix>/*.json".
    const folderPrefix = path.basename(path.dirname(file));
    const folderSubject = PREFIX_CONFIG[folderPrefix]?.subject;

    const bySubject = new Map<string, McqEntry[]>();
    if (folderSubject) {
      bySubject.set(folderSubject, mcqs);
      const offLabelNames = new Set(mcqs.map((m) => m.subjectName?.trim()).filter((n) => n && n !== folderSubject));
      if (offLabelNames.size > 0) {
        console.log(`  [subject] folder "${folderPrefix}" -> "${folderSubject}" (overriding in-file subjectName(s): ${[...offLabelNames].join(', ')})`);
      }
    } else {
      for (const mcq of mcqs) {
        // A genuinely missing subjectName (as opposed to an off-label one
        // SUBJECT_LABEL_ALIASES already normalizes) used to default to
        // "Unsorted" -- but that's the same Subject the PDF-import pipeline
        // uses for its human-review queue (0 published questions there by
        // convention, see docs/05-status-and-gaps.md), which would silently
        // strand these MCQs unpublished forever instead of going through
        // this script's normal auto-approve loop like every other batch.
        // "General" is its own Subject (find-or-create below, same as any
        // other), published immediately like the rest of this pipeline.
        const rawName = mcq.subjectName?.trim() || 'General';
        const name = SUBJECT_LABEL_ALIASES[rawName] ?? rawName;
        if (!bySubject.has(name)) bySubject.set(name, []);
        bySubject.get(name)!.push(mcq);
      }
    }

    for (const [subjectName, group] of bySubject) {
      let subjectId = subjectCache.get(subjectName);
      if (!subjectId) {
        let subject = await prismaClient.subject.findFirst({ where: { name: subjectName, examId: exam.id } });
        if (!subject) {
          console.log(`  [subject] "${subjectName}" not found for this exam${dryRun ? ' (dry-run: would create)' : ''}`);
          if (!dryRun) {
            subject = await prismaClient.subject.create({ data: { name: subjectName, examId: exam.id } });
          }
        } else {
          console.log(`  [subject] found existing "${subject.name}" (${subject.id})`);
        }
        subjectId = subject?.id;
        if (subjectId) subjectCache.set(subjectName, subjectId);
      }

      const text = mcqsToPlainText(group);
      const fileName = `${path.basename(file, '.json')}-${subjectName}`;
      const { parsed, flagged } = parseQuestionsFromText(text, fileName);

      // Per-question difficulty/isHighYield/isCaseBased overrides, keyed by
      // normalized stem so they survive the plain-text round-trip through
      // parseQuestionsFromText/importQuestionsFromText (which only know
      // stem/options/correctKey/explanation, not these tag fields).
      const overridesByStem = new Map<string, Pick<McqEntry, 'difficulty' | 'isHighYield' | 'isCaseBased'>>();
      for (const mcq of group) {
        if (mcq.difficulty !== undefined || mcq.isHighYield !== undefined || mcq.isCaseBased !== undefined) {
          overridesByStem.set(normalizeStem(mcq.stem), {
            difficulty: mcq.difficulty,
            isHighYield: mcq.isHighYield,
            isCaseBased: mcq.isCaseBased,
          });
        }
      }

      if (dryRun) {
        const existing = await prismaClient.question.findMany({ select: { stem: true } });
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
          `  [dry-run] ${subjectName}: ${wouldPending} would-be-pending, ${wouldFlagged} would-be-flagged, ${dupCount} would-be-duplicate, ${invalidCount} would-be-invalid`
        );
        for (const f of flagged) {
          console.log(`    FLAGGED: "${f.stem.slice(0, 70)}" -- ${f.flagReason}`);
          summary.flagged.push({ file: relName, stem: f.stem, reason: f.flagReason ?? 'unknown' });
        }
        summary.duplicates += dupCount;
        summary.invalid += invalidCount;
        continue;
      }

      if (!subjectId) throw new Error(`subjectId must be resolved before a non-dry-run import (subject "${subjectName}")`);

      const result = await importQuestionsFromText(
        { examId: exam.id, subjectMode: 'single', subjectId, fileName, text, skipAiSuggestions: true },
        context
      );
      console.log(
        `  [import] ${subjectName}: inserted=${result.inserted} pending=${result.pendingCount} flagged=${result.flaggedCount} duplicate=${result.skippedDuplicate} invalid=${result.skippedInvalid}`
      );
      summary.duplicates += result.skippedDuplicate;
      summary.invalid += result.skippedInvalid;
      for (const f of flagged) {
        summary.flagged.push({ file: relName, stem: f.stem, reason: f.flagReason ?? 'unknown' });
      }

      // Paginated (max page size is 100) so a batch file larger than 100
      // entries still gets every pending question approved, not just the
      // first page. skip stays 0 on every call: approving a question flips
      // it out of the 'unreviewed' filter, so the next page-0 fetch is
      // naturally the next unprocessed slice, not a re-fetch of what's
      // already done.
      while (true) {
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
          context
        );
        if (created.length === 0) break;
        const clean = created.filter((q) => q.status === 'pending');
        for (const q of clean) {
          const overrides = overridesByStem.get(normalizeStem(q.stem));
          await updateReviewQuestion(
            {
              id: q.id,
              difficulty: overrides?.difficulty ?? difficulty,
              isHighYield: overrides?.isHighYield,
              isCaseBased: overrides?.isCaseBased,
            },
            context
          );
          await approveQuestion({ id: q.id }, context);
          summary.published += 1;
        }
        // Stop once a page makes no more progress (e.g. only flagged
        // entries remain) or the page wasn't full -- otherwise a page of
        // all-flagged entries would loop forever re-fetching itself, since
        // flagged rows never leave the 'unreviewed' filter.
        if (clean.length === 0 || created.length < 100) break;
      }
    }
  }

  console.log(`\n=== SUMMARY ${dryRun ? '(DRY RUN -- nothing written)' : ''} ===`);
  console.log(`Files processed: ${files.length}`);
  console.log(`Published: ${summary.published}`);
  console.log(`Skipped as duplicate: ${summary.duplicates}`);
  console.log(`Skipped as invalid: ${summary.invalid}`);
  console.log(`Flagged (${summary.flagged.length}):`);
  for (const f of summary.flagged) {
    console.log(`  - [${f.file}] "${f.stem.slice(0, 70)}" -- ${f.reason}`);
  }
}
