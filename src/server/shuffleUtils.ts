// Server-side attempt shuffling, shared by every real (DB-backed) attempt
// type: MockExamAttempt, CustomQuizAttempt, LessonPartQuizAttempt (PRD-002
// I5.4/I8.3). Question order was already shuffled at attempt-creation time
// for Mock Exams/Quiz Builder, but with `.sort(() => Math.random() - 0.5)`
// -- a well-known biased shuffle (Fisher-Yates is the correct algorithm,
// already used client-side-only in src/demo-exam/DemoExamPage.tsx). Option
// order was never shuffled at all for either. Both are fixed here for all
// three attempt types, applied server-side at attempt-creation and
// persisted (question order via the existing `order` field, option order
// via a new `optionOrder` column) so a mid-attempt refresh never reshuffles
// and desyncs from what the student already answered.

export type Option = { key: string; text: string };

export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Reorders a Question's live `options` JSON per an attempt item's persisted
// `optionOrder` (an array of keys). Falls back to natural order if
// optionOrder is missing (e.g. attempts created before this fix shipped),
// and never silently drops an option absent from optionOrder.
export function orderOptions(options: Option[], order: unknown): Option[] {
  if (!Array.isArray(order)) return options;
  const byKey = new Map(options.map((o) => [o.key, o]));
  const ordered: Option[] = [];
  for (const key of order as string[]) {
    const opt = byKey.get(key);
    if (opt) ordered.push(opt);
  }
  for (const opt of options) {
    if (!ordered.includes(opt)) ordered.push(opt);
  }
  return ordered;
}
