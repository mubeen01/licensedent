/**
 * TypeScript port of D:\Dental\tools\pdf_import\import_questions.py's block-splitting
 * and stem/option/hint-extraction heuristics, so the in-app upload path and the
 * standalone Python pipeline behave identically on the same source text. Keep the
 * two in sync if either changes — this is a deliberate duplication, not a shared
 * import, since one runs in Python and the other in the Wasp server/browser.
 *
 * Never invents a confirmed answer or explanation: a question only gets a real
 * `correctKey`/`explanation` when unambiguous (a "***" hint on exactly one option,
 * plus real explanation text). Everything else comes back flagged, with hints only.
 */

export interface ParsedOption {
  key: string;
  text: string;
}

export interface ParsedEntry {
  stem: string;
  options: ParsedOption[];
  correctKey: string | null;
  explanation: string | null;
  sourceRef: string;
  /** Only set on flagged entries — why this one needs human review. */
  flagReason?: string;
}

const OPTION_LETTER_PATTERN = /^([a-eA-E])\s*[.)]\s*(.*)$/;
const OPTION_BULLET_PATTERN = /^[·•]\s*(.*)$/;
const DIGIT_MARKER_PATTERN = /^(\d{1,3})\s*([.)\-–])\s*(.*)$/;
const ANSWER_HINT_SUFFIX_PATTERN = /\*{2,3}\s*$/;
const OPTION_TRAILING_NOTE_PATTERN = /^(.*?)\s*\(([^()]{2,120})\)\s*\.?\s*$/;
const MIN_EXPLANATION_LENGTH = 20;

interface Block {
  lines: string[];
}

function splitIntoQuestionBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let current: Block = { lines: [] };
  let expectingNumericOption: number | null = null;

  function startNewBlock(line: string) {
    if (current.lines.length > 0) blocks.push(current);
    current = { lines: [line] };
  }

  for (const line of lines) {
    const letterMatch = OPTION_LETTER_PATTERN.exec(line);
    const bulletMatch = OPTION_BULLET_PATTERN.exec(line);
    const digitMatch = DIGIT_MARKER_PATTERN.exec(line);

    if (letterMatch) {
      expectingNumericOption = null;
      if (current.lines.length > 0) current.lines.push(line);
      continue;
    }
    if (bulletMatch) {
      if (current.lines.length > 0) current.lines.push(line);
      continue;
    }
    if (digitMatch) {
      const number = parseInt(digitMatch[1], 10);
      const delim = digitMatch[2];
      if (delim === '-' || delim === '–') {
        startNewBlock(line);
        expectingNumericOption = 1;
        continue;
      }
      if (expectingNumericOption !== null && number === expectingNumericOption) {
        expectingNumericOption += 1;
        current.lines.push(line);
        continue;
      }
      startNewBlock(line);
      expectingNumericOption = 1;
      continue;
    }

    if (current.lines.length > 0) current.lines.push(line);
  }

  if (current.lines.length > 0) blocks.push(current);
  return blocks;
}

function cleanOptionText(text: string): { text: string; note: string | null; hasHint: boolean } {
  const hasHint = ANSWER_HINT_SUFFIX_PATTERN.test(text);
  text = text.replace(ANSWER_HINT_SUFFIX_PATTERN, '').trim();

  const noteMatch = OPTION_TRAILING_NOTE_PATTERN.exec(text);
  let note: string | null = null;
  if (noteMatch) {
    text = noteMatch[1].trim();
    note = noteMatch[2].trim();
  }
  return { text, note, hasHint };
}

function parseQuestionBlock(block: Block, sourceLabel: string): ParsedEntry {
  const lines = block.lines;
  const sourceRef = sourceLabel;

  // The first line is always the question-number marker that started this
  // block — strip just that prefix rather than re-running it through option
  // detection (otherwise a question starting with "1." misreads as option "1").
  const firstMarkerMatch = DIGIT_MARKER_PATTERN.exec(lines[0]);
  const stemLines: string[] = firstMarkerMatch && firstMarkerMatch[3] ? [firstMarkerMatch[3]] : [];

  const options: ParsedOption[] = [];
  const optionNotes: Record<string, string> = {};
  // Every option whose text ends in `**`/`***`, in detection order — normally
  // exactly one. Collected as a list (not a single overwritten variable) so a
  // source with two marked options is caught as ambiguous instead of silently
  // trusting whichever one happened to be parsed last as the answer.
  const answerHintKeys: string[] = [];
  const trailingNotes: string[] = [];
  let nextNumericKey = 1;
  let mode: 'stem' | 'options' | 'notes' = 'stem';

  for (const line of lines.slice(1)) {
    const letterMatch = OPTION_LETTER_PATTERN.exec(line);
    const bulletMatch = OPTION_BULLET_PATTERN.exec(line);
    const digitMatch = DIGIT_MARKER_PATTERN.exec(line);

    const isNumericOption =
      digitMatch !== null &&
      (digitMatch[2] === '.' || digitMatch[2] === ')') &&
      parseInt(digitMatch[1], 10) === nextNumericKey &&
      (mode === 'stem' || mode === 'options');

    if (letterMatch || bulletMatch || isNumericOption) {
      mode = 'options';
      let key: string;
      let rawOptionText: string;
      if (letterMatch) {
        key = letterMatch[1].toUpperCase();
        rawOptionText = letterMatch[2];
      } else if (isNumericOption) {
        key = String(nextNumericKey);
        nextNumericKey += 1;
        rawOptionText = digitMatch![3];
      } else {
        key = String.fromCharCode('A'.charCodeAt(0) + options.length);
        rawOptionText = bulletMatch![1];
      }

      const { text: cleanText, note, hasHint } = cleanOptionText(rawOptionText);
      options.push({ key, text: cleanText });
      if (note) optionNotes[key] = note;
      if (hasHint) answerHintKeys.push(key);
      continue;
    }

    if (mode === 'stem') {
      stemLines.push(line);
    } else if (mode === 'options') {
      if (line.startsWith('*') || line.startsWith('(')) {
        mode = 'notes';
        trailingNotes.push(line.replace(/^\*+\s*/, '').trim());
      } else if (options.length > 0) {
        options[options.length - 1].text = (options[options.length - 1].text + ' ' + line).trim();
      } else {
        stemLines.push(line);
      }
    } else {
      trailingNotes.push(line);
    }
  }

  const stem = stemLines.join(' ').trim();

  for (const [key, note] of Object.entries(optionNotes)) {
    trailingNotes.push(`[option ${key}] ${note}`);
  }
  const explanationHint = trailingNotes.join(' ').trim();

  // A single unambiguous hint resolves to that key; zero or multiple hints
  // both mean "don't guess" -- reasons[] below explains which case it was.
  const answerHintKey = answerHintKeys.length === 1 ? answerHintKeys[0] : null;

  const reasons: string[] = [];
  if (!stem) reasons.push('no question stem detected');
  if (options.length < 2) reasons.push(`only ${options.length} option(s) detected (need at least 2)`);
  if (!explanationHint) reasons.push('no explanation text found');
  else if (explanationHint.length < MIN_EXPLANATION_LENGTH)
    reasons.push(`explanation suspiciously short (${explanationHint.length} chars)`);
  if (answerHintKeys.length > 1)
    reasons.push(`multiple answer hints marked (${answerHintKeys.join(', ')}) — ambiguous, pick manually`);
  else if (answerHintKey === null) reasons.push('no confirmed or hinted answer key');
  else if (!options.some((o) => o.key === answerHintKey))
    reasons.push(`answer hint '${answerHintKey}' does not match any detected option`);

  if (reasons.length > 0) {
    // Even when flagged, carry through whatever hint we did find — a "***"
    // answer marker or explanation-ish trailing text — the same way the
    // Python pipeline's import_to_db.py does (`correctKey or answerHint`).
    // It's still surfaced as unconfirmed (status stays 'flagged'), but a
    // reviewer/AI-suggestion pass shouldn't have to start from nothing.
    return {
      stem,
      options,
      correctKey: answerHintKey && options.some((o) => o.key === answerHintKey) ? answerHintKey : null,
      explanation: explanationHint || null,
      sourceRef,
      flagReason: reasons.join('; '),
    };
  }

  return {
    stem,
    options,
    correctKey: answerHintKey,
    explanation: explanationHint,
    sourceRef,
  };
}

export function parseQuestionsFromText(
  text: string,
  sourceLabel: string
): { parsed: ParsedEntry[]; flagged: ParsedEntry[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed: ParsedEntry[] = [];
  const flagged: ParsedEntry[] = [];

  for (const block of splitIntoQuestionBlocks(lines)) {
    const entry = parseQuestionBlock(block, sourceLabel);
    if (entry.flagReason) {
      flagged.push(entry);
    } else {
      parsed.push(entry);
    }
  }

  return { parsed, flagged };
}

/** Lowercase, collapse whitespace, strip punctuation — for comparison only. */
export function normalizeStem(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dice's coefficient (bigram overlap) — a cheap, dependency-free stand-in for
 * Python's difflib.SequenceMatcher ratio, close enough for near-duplicate detection. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (s: string) => {
    const counts = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      counts.set(bg, (counts.get(bg) ?? 0) + 1);
    }
    return counts;
  };

  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  let overlap = 0;
  for (const [bg, countA] of aBigrams) {
    const countB = bBigrams.get(bg);
    if (countB) overlap += Math.min(countA, countB);
  }

  const totalBigrams = a.length - 1 + (b.length - 1);
  return totalBigrams === 0 ? 0 : (2 * overlap) / totalBigrams;
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.95;

/** `threshold` defaults to DUPLICATE_SIMILARITY_THRESHOLD — callers only pass
 * one when a caller-facing "duplicate sensitivity" option overrides it. */
export function isDuplicate(
  candidateNorm: string,
  existingNorms: string[],
  threshold: number = DUPLICATE_SIMILARITY_THRESHOLD
): boolean {
  if (!candidateNorm) return false;
  return existingNorms.some((existing) => similarity(candidateNorm, existing) >= threshold);
}
