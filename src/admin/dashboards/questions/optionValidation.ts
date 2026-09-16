// Hand-written recall-PDF sources sometimes leave an option blank or with just
// a placeholder ("." / ".." / "…") where the writer forgot to fill it in --
// the same known DHA-022019 data-quality pattern documented in FEATURES.md,
// which already slipped 2 bad questions into Published before being caught.
// Shared by the client review card (visual flag + disabled Approve) and the
// server (approveQuestion / bulkQuestionAction) so the rule can't be bypassed
// through the bulk-select path, which doesn't render individual option fields.
export function isIncompleteOption(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length === 0 || /^[.…]{1,3}$/.test(trimmed);
}

export function hasIncompleteOptions(options: { key: string; text: string }[]): boolean {
  return options.length < 2 || options.some((o) => isIncompleteOption(o.text));
}
