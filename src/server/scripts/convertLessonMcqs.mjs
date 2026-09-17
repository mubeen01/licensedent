#!/usr/bin/env node
/**
 * PRD-002 Phase I5.2: converts a lesson Part's `part<N>-mcqs.json` (the pilot
 * content's own hand-authored shape -- { stem, options: [{key,text}],
 * correctKey, explanation, subjectName, sourceRef }) into the plain-text
 * format `src/admin/dashboards/questions/importParsing.ts` already parses,
 * so lesson MCQs flow through the EXISTING admin import UI
 * (ImportQuestionsPage -> importQuestionsFromText) and its full human-review
 * pipeline, rather than a new bespoke import path.
 *
 * Usage: node src/server/scripts/convertLessonMcqs.mjs <input.json> <output.txt>
 *
 * The output marks the correct option with a trailing `**` (importParsing's
 * ANSWER_HINT_SUFFIX_PATTERN) and puts the explanation on a `*`-led trailing
 * line -- the same convention the PDF/OCR pipeline produces. Every converted
 * question still lands as `pending` (or `flagged`, if something doesn't
 * parse cleanly) in the admin queue: this script never publishes anything,
 * it only reformats.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node convertLessonMcqs.mjs <input.json> <output.txt>');
  process.exit(1);
}

const raw = readFileSync(inputPath, 'utf-8');
/** @type {Array<{stem: string, options: {key: string, text: string}[], correctKey: string, explanation: string, subjectName?: string, sourceRef?: string}>} */
const mcqs = JSON.parse(raw);

if (!Array.isArray(mcqs) || mcqs.length === 0) {
  console.error(`No MCQ entries found in ${inputPath}`);
  process.exit(1);
}

const blocks = mcqs.map((mcq, i) => {
  const lines = [`${i + 1}- ${mcq.stem}`];
  for (const opt of mcq.options) {
    const isCorrect = opt.key === mcq.correctKey;
    lines.push(`${opt.key}. ${opt.text}${isCorrect ? '**' : ''}`);
  }
  if (mcq.explanation) {
    lines.push(`* ${mcq.explanation}`);
  }
  return lines.join('\n');
});

writeFileSync(outputPath, blocks.join('\n\n') + '\n', 'utf-8');

console.log(`Converted ${mcqs.length} question(s) from ${inputPath} -> ${outputPath}`);
console.log('Paste/upload this file via the admin Import Questions page, then tag the');
console.log('approved questions to the IDC Ireland exam and the right LessonPart.');
