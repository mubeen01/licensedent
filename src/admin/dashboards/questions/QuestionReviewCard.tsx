import { ImageIcon, RotateCcw, Sparkles, X } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  approveQuestion,
  deleteQuestion,
  draftAiSuggestion,
  getQuestionImageUploadUrl,
  rejectQuestion,
  setQuestionImage,
  unpublishQuestion,
  updateReviewQuestion,
} from 'wasp/client/operations';
import { type Question } from 'wasp/entities';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useConfirm } from './ConfirmDialog';
import DuplicateComparisonPanel from './DuplicateComparisonPanel';
import { hasIncompleteOptions, isIncompleteOption } from './optionValidation';
import VersionHistoryPanel from './VersionHistoryPanel';

type Option = { key: string; text: string };
type SubjectOption = { id: string; name: string };

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

interface QuestionReviewCardProps {
  question: Question & { possibleDuplicateOfPublished?: boolean; duplicateOfQuestionId?: string | null };
  /** All subjects for the current exam, so a "mixed" import dumped into
   * "Unsorted" can be retagged to its real subject during review. */
  subjects?: SubjectOption[];
  /** 'unreviewed' shows Save/Reject/Approve (today's review-queue flow).
   * 'published' shows Save/Send-back-to-review/Delete -- for fixing or
   * pulling a mistake found in already-live medical content, instead of it
   * being stuck live. 'rejected' shows the reason it was rejected plus
   * Restore-to-review/Delete-permanently. */
  mode: 'unreviewed' | 'published' | 'rejected';
  onDeleted?: () => void;
  /** Called after a successful Save or Approve, so the parent list can
   * refetch -- otherwise an approved/tagged question just sits in place
   * until some unrelated action reloads the list. */
  onSaved?: () => void;
  /** Called after Approve/Reject/Unpublish (not plain Save) succeeds -- the
   * two-pane review layout uses this to auto-advance to the next question,
   * so a reviewer working the queue with keyboard shortcuts never has to
   * manually reselect after each decision. Plain edits/tagging deliberately
   * don't advance, since the reviewer likely isn't done with that question. */
  onAdvance?: () => void;
  /** Only rendered when provided -- lets this card be used standalone
   * without wiring up the bulk-selection toolbar in QuestionsReviewPage. */
  selected?: boolean;
  onToggleSelect?: () => void;
  /** True if this question was in the most recent "Draft AI for selected"
   * run's skipped list with an actual AI-request failure -- distinguishes
   * "never attempted" from "attempted this run and failed", since both
   * otherwise look identical (no suggestion present). */
  aiDraftFailed?: boolean;
  /** "N of M" shown in the pane header -- purely positional context within
   * whatever list the reviewer is currently working through. */
  position?: { index: number; total: number };
}

// Exposed so the page-level keyboard shortcuts (useReviewShortcuts) can
// trigger Approve/Reject/Save from outside without lifting all of this
// component's save/approve/reject logic up to the parent -- each method is a
// no-op when the action wouldn't currently be valid (e.g. reject while
// already saving, approve while canApprove is false), same guards the
// on-screen buttons already use.
export type QuestionReviewCardHandle = {
  approve: () => void;
  reject: () => void;
  save: () => void;
};

const QuestionReviewCard = forwardRef<QuestionReviewCardHandle, QuestionReviewCardProps>(function QuestionReviewCard(
  { question, subjects, mode, onDeleted, onSaved, onAdvance, selected, onToggleSelect, aiDraftFailed, position },
  ref
) {
  const { confirm, ConfirmDialog } = useConfirm();
  const initialOptions = (question.options as unknown as Option[]) ?? [];

  const [stem, setStem] = useState(question.stem ?? '');
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [correctKey, setCorrectKey] = useState(question.correctKey ?? '');
  const [explanation, setExplanation] = useState(question.explanation ?? '');
  const [subjectId, setSubjectId] = useState(question.subjectId);
  const [difficulty, setDifficulty] = useState(question.difficulty ?? '');
  const [isHighYield, setIsHighYield] = useState(question.isHighYield);
  const [isCaseBased, setIsCaseBased] = useState(question.isCaseBased);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDuplicateCompare, setShowDuplicateCompare] = useState(false);

  // A question with no image is just a normal text-only MCQ -- imageUrl only
  // ever gets set here, on an explicit admin upload, never defaulted.
  const [imageUrl, setImageUrl] = useState(question.imageUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stemTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grows the stem box to fit its content -- it was previously fixed at
  // 2 rows, which forced anything longer (most real questions) into its own
  // tiny internal scrollbar, on top of the page's own scrolling. A textarea
  // has no native auto-height, so this measures scrollHeight and applies it
  // directly; runs on mount and every time the stem text changes.
  useEffect(() => {
    const el = stemTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [stem]);

  const hasIncompleteOption = hasIncompleteOptions(options);
  const canApprove =
    !!correctKey && options.some((o) => o.key === correctKey) && !hasIncompleteOption && !!difficulty;

  useImperativeHandle(ref, () => ({
    approve: () => {
      if (mode === 'unreviewed' && canApprove && !isSaving) handleApprove();
    },
    reject: () => {
      if (mode === 'unreviewed' && !isSaving) handleReject();
    },
    save: () => {
      if (isDirty && !isSaving) handleSave();
    },
  }));

  // Left edge reads as a lab-slip status stripe -- readiness at a glance
  // without having to read the card: red means something's actually
  // blocking, amber means it's close but still needs a tag, teal means it's
  // already live or ready to go.
  const stripeClass =
    mode === 'rejected'
      ? 'border-l-4 border-l-destructive'
      : mode === 'published'
        ? 'border-l-4 border-l-primary'
        : canApprove
          ? 'border-l-4 border-l-primary'
          : hasIncompleteOption || !correctKey || !options.some((o) => o.key === correctKey)
            ? 'border-l-4 border-l-destructive'
            : 'border-l-4 border-l-amber-400';
  // AI-suggestion fields are tracked separately from the props so an on-demand
  // draft (below) can update the amber box immediately without needing the
  // parent list to refetch.
  const [suggestedCorrectKey, setSuggestedCorrectKey] = useState(question.suggestedCorrectKey);
  const [suggestedExplanation, setSuggestedExplanation] = useState(question.suggestedExplanation);
  const [suggestionSource, setSuggestionSource] = useState(question.suggestionSource);
  const [suggestedDifficulty, setSuggestedDifficulty] = useState(question.suggestedDifficulty);
  const [suggestedIsHighYield, setSuggestedIsHighYield] = useState(question.suggestedIsHighYield);
  const [suggestedIsCaseBased, setSuggestedIsCaseBased] = useState(question.suggestedIsCaseBased);
  const [suggestedAt, setSuggestedAt] = useState(question.suggestedAt);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  // Two shapes of AI suggestion: a full answer+explanation draft (source gave
  // no answer at all), or an explanation-only draft (source's correctKey was
  // already real/confirmed -- the AI was only asked to explain it, not pick it).
  const hasAiSuggestion = !!suggestedExplanation && (!!suggestedCorrectKey || !!correctKey);
  const suggestedKey = suggestedCorrectKey ?? correctKey;
  // True from the moment "Use this suggestion" copies AI text into the real
  // fields until Approve/Save actually commits it -- the answer/explanation
  // below are AI-guessed, not reviewer-confirmed, and look identical to
  // manually-typed content otherwise. Cleared on submit, not on further
  // edits, since "I used AI, still needs my eyes before Approve" stays true
  // even if the reviewer tweaks the wording afterward.
  const [appliedSuggestionUnreviewed, setAppliedSuggestionUnreviewed] = useState(false);

  // All the state above only reads `question` once, on mount -- a bulk action
  // elsewhere on the page (draft-all-selected, accept-AI-suggestions, etc.)
  // updates the DB and the parent list refetches, but an already-mounted
  // card with the same id never re-reads the new prop values on its own.
  // That's what made bulk-drafted tags (and anything else changed in bulk)
  // look like they "didn't take" until you touched the card yourself. Skip
  // the resync while isDirty -- an in-progress edit must never be clobbered
  // by a refetch racing in behind it.
  useEffect(() => {
    if (isDirty) return;
    setStem(question.stem ?? '');
    setOptions((question.options as unknown as Option[]) ?? []);
    setCorrectKey(question.correctKey ?? '');
    setExplanation(question.explanation ?? '');
    setSubjectId(question.subjectId);
    setDifficulty(question.difficulty ?? '');
    setIsHighYield(question.isHighYield);
    setIsCaseBased(question.isCaseBased);
    setImageUrl(question.imageUrl);
    setSuggestedCorrectKey(question.suggestedCorrectKey);
    setSuggestedExplanation(question.suggestedExplanation);
    setSuggestionSource(question.suggestionSource);
    setSuggestedDifficulty(question.suggestedDifficulty);
    setSuggestedIsHighYield(question.suggestedIsHighYield);
    setSuggestedIsCaseBased(question.suggestedIsCaseBased);
    setSuggestedAt(question.suggestedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    question.id,
    question.stem,
    JSON.stringify(question.options),
    question.correctKey,
    question.explanation,
    question.subjectId,
    question.difficulty,
    question.isHighYield,
    question.isCaseBased,
    question.imageUrl,
    question.suggestedCorrectKey,
    question.suggestedExplanation,
    question.suggestionSource,
    question.suggestedDifficulty,
    question.suggestedIsHighYield,
    question.suggestedIsCaseBased,
    question.suggestedAt,
  ]);

  async function handleDraftWithAi() {
    setIsDrafting(true);
    setDraftError(null);
    try {
      // The server drafts from whatever's persisted, not from unsaved edits in
      // this form -- save first so a redraft after editing the stem/options
      // actually reflects those edits instead of the pre-edit content.
      if (isDirty) {
        await updateReviewQuestion(buildSavePayload());
        setIsDirty(false);
      }
      const updated = await draftAiSuggestion({ id: question.id });
      setSuggestedCorrectKey(updated.suggestedCorrectKey);
      setSuggestedExplanation(updated.suggestedExplanation);
      setSuggestionSource(updated.suggestionSource);
      setSuggestedDifficulty(updated.suggestedDifficulty);
      setSuggestedIsHighYield(updated.suggestedIsHighYield);
      setSuggestedIsCaseBased(updated.suggestedIsCaseBased);
      setSuggestedAt(updated.suggestedAt);
      // Drafting auto-applies tags (not the answer/explanation) when the
      // question was untagged -- sync the now-real values in from the server
      // response so the form doesn't keep showing "Not tagged" for a field
      // that's already saved.
      setDifficulty(updated.difficulty ?? '');
      setIsHighYield(updated.isHighYield);
      setIsCaseBased(updated.isCaseBased);
    } catch (e: any) {
      setDraftError(e?.message ?? 'Failed to draft an AI suggestion');
    } finally {
      setIsDrafting(false);
    }
  }

  function handleUseSuggestion() {
    if (suggestedCorrectKey) {
      setCorrectKey(suggestedCorrectKey);
    }
    setExplanation(suggestedExplanation ?? '');
    if (suggestedDifficulty) setDifficulty(suggestedDifficulty);
    if (suggestedIsHighYield !== null) setIsHighYield(!!suggestedIsHighYield);
    if (suggestedIsCaseBased !== null) setIsCaseBased(!!suggestedIsCaseBased);
    setIsDirty(true);
    setAppliedSuggestionUnreviewed(true);
  }

  function updateOptionText(key: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, text } : o)));
    setIsDirty(true);
  }

  // Recall-PDF sources sometimes only wrote down 2 of 4 options, or left a
  // placeholder like "." / "…" where a forgotten option should be -- this
  // lets a reviewer trim those out entirely instead of being stuck editing
  // text into a slot that shouldn't exist.
  function removeOption(key: string) {
    setOptions((prev) => prev.filter((o) => o.key !== key));
    if (correctKey === key) {
      setCorrectKey('');
    }
    setIsDirty(true);
  }

  function addOption() {
    const used = new Set(options.map((o) => o.key));
    const nextKey = 'ABCDEFGH'.split('').find((letter) => !used.has(letter)) ?? `Option ${options.length + 1}`;
    setOptions((prev) => [...prev, { key: nextKey, text: '' }]);
    setIsDirty(true);
  }

  function buildSavePayload() {
    return {
      id: question.id,
      stem: stem !== question.stem ? stem : undefined,
      options: JSON.stringify(options) !== JSON.stringify(initialOptions) ? options : undefined,
      correctKey: correctKey || null,
      explanation: explanation || null,
      subjectId: subjectId !== question.subjectId ? subjectId : undefined,
      difficulty: (difficulty || null) as 'easy' | 'medium' | 'hard' | null,
      isHighYield,
      isCaseBased,
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateReviewQuestion(buildSavePayload());
      setIsDirty(false);
      setAppliedSuggestionUnreviewed(false);
      onSaved?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprove() {
    setIsSaving(true);
    setError(null);
    try {
      if (isDirty) {
        await updateReviewQuestion(buildSavePayload());
        setIsDirty(false);
      }
      await approveQuestion({ id: question.id });
      setAppliedSuggestionUnreviewed(false);
      onSaved?.();
      onAdvance?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to approve');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setImageError('Only JPEG, PNG or WebP images are supported.');
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);
    try {
      const { s3UploadUrl, s3UploadFields, key } = await getQuestionImageUploadUrl({
        questionId: question.id,
        fileName: file.name,
        fileType: file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      });

      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([k, v]) => formData.append(k, v));
      formData.append('file', file);
      const uploadRes = await fetch(s3UploadUrl, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      const { imageUrl: resolvedUrl } = await setQuestionImage({ questionId: question.id, key });
      setImageUrl(resolvedUrl);
    } catch (e: any) {
      setImageError(e?.message ?? 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    setIsUploadingImage(true);
    setImageError(null);
    try {
      await setQuestionImage({ questionId: question.id, key: null });
      setImageUrl(null);
    } catch (e: any) {
      setImageError(e?.message ?? 'Failed to remove image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleReject() {
    setIsSaving(true);
    setError(null);
    try {
      await rejectQuestion({ id: question.id });
      onAdvance?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to reject');
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const message =
      mode === 'rejected'
        ? 'Delete this rejected question permanently? This cannot be undone.'
        : 'Delete this question permanently? This also removes any student attempts, notes, and mock-exam records tied to it. This cannot be undone.';
    const ok = await confirm({
      title: 'Delete question?',
      description: message,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteQuestion({ id: question.id });
      onDeleted?.();
      onAdvance?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete');
      setIsSaving(false);
    }
  }

  async function handleUnpublish() {
    const message =
      mode === 'rejected'
        ? 'Restore this question to "To review"? It\'ll need Approve again before going live.'
        : "Send this question back to review? It'll come off the live site immediately and need Approve again before it's visible to students. Its content, history and student attempt data are untouched.";
    const ok = await confirm({
      title: mode === 'rejected' ? 'Restore to review?' : 'Send back to review?',
      description: message,
    });
    if (!ok) return;
    setIsSaving(true);
    setError(null);
    try {
      await unpublishQuestion({ id: question.id });
      // Not onDeleted -- the question isn't gone, it just left this
      // (published/rejected) list. onSaved also refetches subjects, which
      // onDeleted doesn't, and unpublishing/restoring changes that subject's
      // published/reviewed counts.
      onSaved?.();
      onAdvance?.();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send back to review');
      setIsSaving(false);
    }
  }

  return (
    // Header / scrollable-middle / footer, each a plain flex-none or flex-1
    // block -- no sticky-position tricks needed here. This component now
    // only ever renders inside ReviewModal's own fixed-height flex column
    // (h-[88vh] flex flex-col), a self-contained box with no ancestor
    // scroll container to fight, unlike the old inline pane that lived
    // inside DefaultLayout's page-level scroll area.
    <div className={cn('flex h-full flex-col', stripeClass)}>
      {ConfirmDialog}
      {position && (
        <div className='flex flex-none items-center justify-between gap-4 border-b border-border px-5 py-3 md:px-7'>
          <span className='text-xs font-semibold tabular-nums text-muted-foreground'>
            Question {position.index + 1} of {position.total}
          </span>
          <span className='hidden text-[11px] text-muted-foreground sm:block'>
            <kbd className='rounded border border-border bg-muted px-1 py-0.5 font-mono'>J</kbd>/
            <kbd className='rounded border border-border bg-muted px-1 py-0.5 font-mono'>K</kbd> next/prev ·{' '}
            <kbd className='rounded border border-border bg-muted px-1 py-0.5 font-mono'>A</kbd> approve ·{' '}
            <kbd className='rounded border border-border bg-muted px-1 py-0.5 font-mono'>X</kbd> reject ·{' '}
            <kbd className='rounded border border-border bg-muted px-1 py-0.5 font-mono'>⌘S</kbd> save
          </span>
        </div>
      )}
      <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 md:p-7'>
      {/* shrink-0 on every direct child below is load-bearing, not cosmetic:
          any of these blocks that also has overflow-hidden (the AI
          suggestion box, VersionHistoryPanel) gets an automatic *minimum*
          size of 0 per the flexbox spec once it's a shrinkable flex item --
          meaning the browser is free to squeeze it down to nothing and
          silently clip its content, even though the content is genuinely in
          the DOM. shrink-0 opts every block out of that shrink pool, so
          "too much content" is handled by this container's own
          overflow-y-auto (scrolling), never by an individual block collapsing. */}
      <div className='flex shrink-0 items-start justify-between gap-4'>
        {onToggleSelect && (
          <Checkbox
            checked={!!selected}
            onCheckedChange={() => onToggleSelect()}
            className='mt-1 shrink-0'
            aria-label='Select question'
          />
        )}
        <Textarea
          ref={stemTextareaRef}
          value={stem}
          onChange={(e) => {
            setStem(e.currentTarget.value);
            setIsDirty(true);
          }}
          placeholder='(no stem detected)'
          rows={1}
          className='resize-none overflow-hidden font-serif text-[15px] leading-relaxed text-foreground'
        />
        <div className='flex shrink-0 flex-col items-end gap-1'>
          <span className='rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground'>
            {question.status}
          </span>
          {!difficulty && (
            <span className='rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'>
              Untagged
            </span>
          )}
        </div>
      </div>

      {mode === 'rejected' && (
        <p className='shrink-0 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive'>
          Rejected{question.rejectedAt && ` ${new Date(question.rejectedAt).toLocaleString()}`}
          {question.rejectionReason && `: ${question.rejectionReason}`}
        </p>
      )}

      {question.possibleDuplicateOfPublished && mode === 'unreviewed' && (
        <div className='flex shrink-0 flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-3 py-2'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-xs font-medium text-amber-800 dark:text-amber-300'>
              Reads very similar to a question already published in this subject -- likely a re-import of the same
              content. Reject this one if it's a repeat.
            </p>
            {question.duplicateOfQuestionId && (
              <button
                type='button'
                onClick={() => setShowDuplicateCompare((v) => !v)}
                className='shrink-0 text-xs font-semibold text-amber-800 hover:underline dark:text-amber-300'
              >
                {showDuplicateCompare ? 'Hide comparison' : 'Compare'}
              </button>
            )}
          </div>
          {showDuplicateCompare && question.duplicateOfQuestionId && (
            <DuplicateComparisonPanel duplicateOfQuestionId={question.duplicateOfQuestionId} />
          )}
        </div>
      )}

      <div className='flex shrink-0 items-center gap-3'>
        {imageUrl ? (
          <div className='relative'>
            <img src={imageUrl} alt='' className='h-24 rounded-md border border-border object-cover' />
            <button
              type='button'
              onClick={handleRemoveImage}
              disabled={isUploadingImage}
              className='absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow'
              title='Remove image'
            >
              <X className='h-3 w-3' />
            </button>
          </div>
        ) : (
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isUploadingImage}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className='h-3.5 w-3.5 mr-1.5' />
            {isUploadingImage ? 'Uploading…' : 'Add image'}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          className='hidden'
          onChange={handleImageSelected}
        />
        {imageError && <p className='text-xs text-destructive'>{imageError}</p>}
      </div>

      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-xl border',
          hasAiSuggestion
            ? 'border-amber-300/70 bg-gradient-to-br from-amber-50 via-amber-50/60 to-transparent dark:border-amber-900/70 dark:from-amber-950/50 dark:via-amber-950/20'
            : aiDraftFailed
              ? 'border-destructive/50 bg-destructive/5'
              : 'border-dashed border-border bg-muted/20'
        )}
      >
        <div className='flex items-center justify-between gap-3 px-4 py-3'>
          <div className='flex items-center gap-2.5'>
            <span
              className={cn(
                'flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm',
                hasAiSuggestion ? 'from-amber-500 to-orange-500' : 'from-primary to-secondary'
              )}
            >
              <Sparkles className='h-4 w-4' />
            </span>
            <div>
              <p className='text-sm font-semibold text-foreground leading-tight'>
                {hasAiSuggestion ? 'AI suggestion' : 'AI drafting'}
              </p>
              {hasAiSuggestion ? (
                <p className='text-[11px] text-amber-700/80 dark:text-amber-400/80'>
                  Unconfirmed — verify before using
                  {suggestedAt && ` · drafted ${new Date(suggestedAt).toLocaleString()}`}
                </p>
              ) : aiDraftFailed ? (
                <p className='text-[11px] font-semibold text-destructive'>
                  AI drafting failed for this question in the last run — click Draft with AI to retry
                </p>
              ) : (
                <p className='text-[11px] text-muted-foreground'>No draft yet for this question</p>
              )}
            </div>
          </div>
          <Button
            type='button'
            size='sm'
            variant={hasAiSuggestion ? 'outline' : 'default'}
            disabled={isDrafting}
            onClick={handleDraftWithAi}
            className={!hasAiSuggestion ? 'bg-gradient-to-r from-primary to-secondary text-white border-0' : ''}
          >
            {isDrafting ? (
              'Drafting…'
            ) : hasAiSuggestion ? (
              <>
                <RotateCcw className='h-3.5 w-3.5 mr-1.5' />
                Redraft
              </>
            ) : (
              <>
                <Sparkles className='h-3.5 w-3.5 mr-1.5' />
                Draft with AI
              </>
            )}
          </Button>
        </div>

        {hasAiSuggestion && (
          <div className='border-t border-amber-300/50 dark:border-amber-900/50 px-4 py-3 flex flex-col gap-2.5'>
            <p className='text-sm leading-6 text-amber-900 dark:text-amber-200'>
              <span className='inline-flex h-5 min-w-5 items-center justify-center rounded bg-amber-200/70 px-1 font-mono text-xs font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 mr-2 align-middle'>
                {suggestedKey}
              </span>
              {suggestedExplanation}
            </p>

            {(suggestedDifficulty || suggestedIsHighYield || suggestedIsCaseBased) && (
              <div className='flex flex-wrap items-center gap-1.5'>
                {suggestedDifficulty && (
                  <span className='rounded-full bg-amber-200/60 px-2 py-0.5 text-[11px] font-semibold capitalize text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'>
                    {suggestedDifficulty}
                  </span>
                )}
                {suggestedIsHighYield && (
                  <span className='rounded-full bg-amber-200/60 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'>
                    High-Yield
                  </span>
                )}
                {suggestedIsCaseBased && (
                  <span className='rounded-full bg-amber-200/60 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'>
                    Case-Based
                  </span>
                )}
              </div>
            )}

            {!suggestedCorrectKey && (
              <p className='text-[11px] text-amber-700/70 dark:text-amber-400/70'>
                Answer key ({suggestedKey}) is already confirmed from the source — only this explanation is
                AI-drafted.
              </p>
            )}
            <p className='text-[11px] text-amber-700/70 dark:text-amber-400/70'>Source: {suggestionSource}</p>

            {isDirty && (
              <p className='flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-[11px] font-semibold text-destructive'>
                You've edited the question or its options since this was drafted — it may no longer match. Redraft to
                refresh it.
              </p>
            )}

            <div className='flex items-center gap-2.5'>
              <Button
                type='button'
                size='sm'
                onClick={handleUseSuggestion}
                className='self-start bg-gradient-to-r from-primary to-secondary text-white border-0'
              >
                {appliedSuggestionUnreviewed ? 'Use this suggestion again' : 'Use this suggestion'}
              </Button>
              {appliedSuggestionUnreviewed && (
                <span className='text-[11px] font-semibold text-amber-700 dark:text-amber-400'>
                  Copied into the answer/explanation below (highlighted) — read them, then Approve.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {draftError && <p className='shrink-0 text-xs text-destructive'>{draftError}</p>}

      <div className='grid shrink-0 grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <p className='text-xs font-medium text-muted-foreground mb-2'>Options</p>
          <div className='flex flex-col gap-1.5'>
            {options.length === 0 && <p className='text-sm text-muted-foreground italic'>(none detected)</p>}
            {options.map((opt) => {
              const incomplete = isIncompleteOption(opt.text);
              return (
                <div
                  key={opt.key}
                  className={
                    'flex items-center gap-2 rounded-lg px-1.5 py-1.5 ' +
                    (incomplete
                      ? 'bg-destructive/10 ring-1 ring-destructive/40'
                      : opt.key === correctKey
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : '')
                  }
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-xs font-bold',
                      opt.key === correctKey ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {opt.key}
                  </span>
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOptionText(opt.key, e.currentTarget.value)}
                    placeholder='Incomplete -- fill in or remove'
                    className={'h-8 text-sm' + (incomplete ? ' border-destructive/60' : '')}
                  />
                  <button
                    type='button'
                    onClick={() => removeOption(opt.key)}
                    className='flex h-6 w-6 flex-none items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                    title='Remove this option'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type='button'
            onClick={addOption}
            className='mt-2 text-xs font-semibold text-primary hover:underline'
          >
            + Add option
          </button>
        </div>

        <div className='flex flex-col gap-3'>
          {subjects && subjects.length > 0 && (
            <div>
              <label className='text-xs font-medium text-muted-foreground'>Subject</label>
              <Select
                value={subjectId}
                onValueChange={(value) => {
                  setSubjectId(value);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className='w-full mt-1'>
                  <SelectValue placeholder='Subject' />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className='text-xs font-medium text-muted-foreground'>
              Correct answer
              {appliedSuggestionUnreviewed && (
                <span className='ml-1.5 font-semibold text-amber-700 dark:text-amber-400'>· from AI, verify</span>
              )}
            </label>
            <Select
              value={correctKey || undefined}
              onValueChange={(value) => {
                setCorrectKey(value);
                setIsDirty(true);
              }}
            >
              <SelectTrigger
                className={cn('w-full mt-1', appliedSuggestionUnreviewed && 'ring-2 ring-amber-400/70 border-amber-400')}
              >
                <SelectValue placeholder='Not set' />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.key}. {opt.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='text-xs font-medium text-muted-foreground'>
              Explanation
              {appliedSuggestionUnreviewed && (
                <span className='ml-1.5 font-semibold text-amber-700 dark:text-amber-400'>· from AI, verify</span>
              )}
            </label>
            <Textarea
              className={cn('mt-1', appliedSuggestionUnreviewed && 'ring-2 ring-amber-400/70 border-amber-400')}
              rows={3}
              value={explanation}
              placeholder='No explanation from the source -- add one, or leave blank'
              onChange={(e) => {
                setExplanation(e.currentTarget.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div className='flex items-end gap-3'>
            <div className='flex-1'>
              <label className='text-xs font-medium text-muted-foreground'>Difficulty</label>
              <Select
                value={difficulty || undefined}
                onValueChange={(value) => {
                  setDifficulty(value as typeof difficulty);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className='w-full mt-1'>
                  <SelectValue placeholder='Not tagged' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='easy'>Easy</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='hard'>Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className='flex items-center gap-1.5 pb-2 text-xs font-medium text-foreground cursor-pointer'>
              <Checkbox
                checked={isHighYield}
                onCheckedChange={(v) => {
                  setIsHighYield(!!v);
                  setIsDirty(true);
                }}
              />
              High-Yield
            </label>
            <label className='flex items-center gap-1.5 pb-2 text-xs font-medium text-foreground cursor-pointer'>
              <Checkbox
                checked={isCaseBased}
                onCheckedChange={(v) => {
                  setIsCaseBased(!!v);
                  setIsDirty(true);
                }}
              />
              Case-Based
            </label>
          </div>
        </div>
      </div>

      <VersionHistoryPanel questionId={question.id} />
      </div>

      {/* Fixed footer, outside the scrollable middle -- Save/Reject/Approve
          are always visible without scrolling, no matter how long the
          question/AI-suggestion/history content above is. */}
      <div className='flex flex-none items-center justify-between gap-4 border-t border-border px-5 py-3 md:px-7'>
        <p className='truncate text-xs text-muted-foreground'>{question.sourceRef}</p>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        {!error && mode === 'unreviewed' && hasIncompleteOption && (
          <p className='text-xs text-destructive'>
            {options.length < 2 ? 'Needs at least 2 options' : 'Fix or remove the incomplete option(s) above'} before
            approving.
          </p>
        )}
        {!error && mode === 'unreviewed' && !hasIncompleteOption && !canApprove && (
          <p className='text-xs text-destructive'>
            {!correctKey || !options.some((o) => o.key === correctKey)
              ? 'Select a correct answer'
              : 'Set a Difficulty tag'}{' '}
            before approving.
          </p>
        )}
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' disabled={isSaving || !isDirty} onClick={handleSave}>
            Save
          </Button>
          {mode === 'unreviewed' ? (
            <>
              <Button variant='destructive' size='sm' disabled={isSaving} onClick={handleReject}>
                Reject
              </Button>
              <Button size='sm' disabled={isSaving || !canApprove} onClick={handleApprove}>
                Approve
              </Button>
            </>
          ) : mode === 'published' ? (
            <>
              <Button variant='outline' size='sm' disabled={isSaving} onClick={handleUnpublish}>
                <RotateCcw className='h-3.5 w-3.5 mr-1.5' />
                Send back to review
              </Button>
              <Button variant='destructive' size='sm' disabled={isSaving} onClick={handleDelete}>
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' size='sm' disabled={isSaving} onClick={handleUnpublish}>
                <RotateCcw className='h-3.5 w-3.5 mr-1.5' />
                Restore to review
              </Button>
              <Button variant='destructive' size='sm' disabled={isSaving} onClick={handleDelete}>
                Delete permanently
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default QuestionReviewCard;
