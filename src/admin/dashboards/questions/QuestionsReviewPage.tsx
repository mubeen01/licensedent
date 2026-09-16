import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Check,
  CheckCheck,
  Ellipsis,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { type AuthUser } from 'wasp/auth';
import {
  bulkQuestionAction,
  createSubject,
  deleteSubject,
  draftAiSuggestionsForSubject,
  getImportBatches,
  getQuestionBankStats,
  getQuestionById,
  getQuestionsForReview,
  getSubjectsForReview,
  updateSubject,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';
import { useConfirm } from './ConfirmDialog';
import QuestionBankStatsCards from './QuestionBankStatsCards';
import QuestionReviewCard, { type QuestionReviewCardHandle } from './QuestionReviewCard';
import QuestionRow from './QuestionRow';
import QuestionSearchBar from './QuestionSearchBar';
import ReviewerActivityTile from './ReviewerActivityTile';
import { useReviewShortcuts } from './useReviewShortcuts';

const PAGE_SIZE = 20;

type Selection = { kind: 'subject'; id: string } | { kind: 'batch'; id: string } | null;
type View = 'unreviewed' | 'published' | 'rejected';

function QuestionsReviewPage({ user }: { user: AuthUser }) {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>('unreviewed');
  const [selection, setSelection] = useState<Selection>(null);
  const [skip, setSkip] = useState(0);
  // When on, only questions with no difficulty set yet are shown -- for
  // backfilling tags onto content that predates difficulty/High-Yield/
  // Case-Based. Combined with the refetch-on-save below, each tagged
  // question drops out of view immediately and the next one takes its
  // place, instead of staying in a long list you have to keep scrolling
  // past to find what's left.
  const [needsTaggingOnly, setNeedsTaggingOnly] = useState(false);
  // Same idea, for AI drafting: shows exactly which questions "Draft AI
  // suggestions for this subject" will hit next (and lets you watch them
  // disappear from view as they get drafted), instead of guessing which of
  // the ones on screen actually got a suggestion.
  const [missingAiDraftOnly, setMissingAiDraftOnly] = useState(false);
  // 'oldest' preserves original import order (the historical default).
  // 'brokenFirst' surfaces questions with no correct answer set yet ahead of
  // ones only missing a tag, so review time goes to what needs the most
  // work first instead of whatever happened to be imported first.
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'brokenFirst'>('oldest');
  const [isBulkDrafting, setIsBulkDrafting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [addSubjectError, setAddSubjectError] = useState<string | null>(null);

  // Bulk selection is scoped to the current page of results -- cleared on any
  // subject/batch switch, view switch, or page turn, so it can never silently
  // carry over to a different filter than the one the admin was looking at.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [moveTargetSubjectId, setMoveTargetSubjectId] = useState('');
  const [bulkTagDifficulty, setBulkTagDifficulty] = useState('');
  // Which question IDs failed AI drafting on the most recent "Draft AI for
  // selected" run -- so each affected card can say so directly instead of
  // the failure only existing in the easily-missed aggregate banner above
  // the (often long, scrolled-past) list.
  const [draftAiFailedIds, setDraftAiFailedIds] = useState<Set<string>>(new Set());

  // The middle column is a compact, scannable row list; clicking a row opens
  // the full editor in a large "Review Mode" overlay (near-full-screen, not
  // a cramped inline column competing with the sidebar/list for width) --
  // decoupled from the list's own pagination/filters so a search result
  // (which can be on any page, or a different tab entirely) can still be
  // opened directly. Approve/Reject/Save keep the overlay open and advance
  // to the next question, so a reviewer never has to close and reopen it.
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const detailCardRef = useRef<QuestionReviewCardHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: subjects, isLoading: subjectsLoading, refetch: refetchSubjects } = useQuery(getSubjectsForReview);
  const { data: batches, isLoading: batchesLoading } = useQuery(getImportBatches);
  const { data: bankStats, isLoading: bankStatsLoading } = useQuery(getQuestionBankStats);

  const { data: questions, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery(
    getQuestionsForReview,
    selection?.kind === 'subject'
      ? {
          subjectId: selection.id,
          status: view,
          needsTagging: needsTaggingOnly,
          missingAiDraft: missingAiDraftOnly,
          sortBy,
          skip,
          take: PAGE_SIZE,
        }
      : {
          importBatchId: selection?.id ?? '',
          status: view,
          needsTagging: needsTaggingOnly,
          missingAiDraft: missingAiDraftOnly,
          sortBy,
          skip,
          take: PAGE_SIZE,
        },
    { enabled: !!selection }
  );

  // Auto-select the first row whenever nothing is explicitly chosen (a fresh
  // subject/batch/tab/page load, or the previously-selected question just
  // left this list) -- the detail pane is never left empty when there's
  // something to show, so a keyboard-only reviewer can start immediately.
  useEffect(() => {
    if (selectedQuestionId === null && questions && questions.length > 0) {
      setSelectedQuestionId(questions[0].id);
    }
  }, [questions, selectedQuestionId]);

  const selectedIndexInList = questions?.findIndex((q) => q.id === selectedQuestionId) ?? -1;
  const selectedFromList = selectedIndexInList >= 0 ? questions![selectedIndexInList] : undefined;

  // Fallback for a question not on the currently loaded page/filter --
  // reached via search jump-to, where a match can be anywhere in the bank.
  const { data: fallbackQuestion } = useQuery(
    getQuestionById,
    { id: selectedQuestionId ?? '' },
    { enabled: !!selectedQuestionId && !selectedFromList }
  );

  const detailQuestion = selectedFromList ?? fallbackQuestion ?? undefined;
  const subjectNameById = new Map((subjects ?? []).map((s) => [s.id, s.name]));

  function select(next: Selection) {
    setSelection(next);
    setSkip(0);
    setSelectedIds(new Set());
    setSelectedQuestionId(null);
  }

  function switchView(next: View) {
    setView(next);
    setSkip(0);
    setBulkResult(null);
    setSelectedIds(new Set());
    setSelectedQuestionId(null);
    // Both toggles' checkboxes are hidden on the Rejected tab (tagging and AI
    // drafts aren't a thing for rejected content) -- reset them so a filter
    // left on from another tab can't silently empty this one out with no way
    // to see or clear it.
    if (next === 'rejected') {
      setNeedsTaggingOnly(false);
      setMissingAiDraftOnly(false);
    }
  }

  // Deep-link support: /admin/questions?subject=Unsorted jumps straight into
  // that subject's queue instead of landing on the bare page with nothing
  // selected -- used by the dashboard's "Review Unsorted" quick action.
  // Only fires while nothing is selected yet, so it can't override a
  // subject the admin already clicked into.
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (!subjectParam || !subjects || selection !== null) return;
    const match = subjects.find((s) => s.name.toLowerCase() === subjectParam.toLowerCase());
    if (match) select({ kind: 'subject', id: match.id });
  }, [searchParams, subjects, selection]);

  function toggleNeedsTaggingOnly() {
    setNeedsTaggingOnly((prev) => !prev);
    setSkip(0);
    setSelectedIds(new Set());
    setSelectedQuestionId(null);
  }

  function toggleMissingAiDraftOnly() {
    setMissingAiDraftOnly((prev) => !prev);
    setSkip(0);
    setSelectedIds(new Set());
    setSelectedQuestionId(null);
  }

  function changeSortBy(next: 'oldest' | 'newest' | 'brokenFirst') {
    setSortBy(next);
    setSkip(0);
    setSelectedIds(new Set());
    setSelectedQuestionId(null);
  }

  // Individual Save/Approve previously didn't refetch this list at all -- an
  // approved question (or, with needsTaggingOnly on, a newly-tagged one)
  // just sat there unchanged until some unrelated action reloaded the page,
  // forcing a scroll past everything already done to find what's left.
  function handleQuestionSaved() {
    refetchQuestions();
    refetchSubjects();
  }

  function changePage(next: number) {
    setSkip(next);
    setSelectedIds(new Set());
    setSelectedQuestionId(null);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Moves the detail pane to the question right after the one that was just
  // acted on (or the one before, if that was the last on the page) -- so
  // Approve/Reject/Delete/Send-back-to-review can be chained via keyboard
  // shortcuts without ever needing to reselect from the list by hand.
  function advanceFrom(questionId: string) {
    if (!questions) {
      setSelectedQuestionId(null);
      return;
    }
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx === -1) {
      setSelectedQuestionId(null);
      return;
    }
    const next = questions[idx + 1] ?? questions[idx - 1];
    setSelectedQuestionId(next ? next.id : null);
  }

  function selectNext() {
    if (!questions || questions.length === 0) return;
    const idx = questions.findIndex((q) => q.id === selectedQuestionId);
    if (idx === -1) {
      setSelectedQuestionId(questions[0].id);
    } else if (idx + 1 < questions.length) {
      setSelectedQuestionId(questions[idx + 1].id);
    } else if (questions.length === PAGE_SIZE) {
      changePage(skip + PAGE_SIZE);
    }
  }

  function selectPrev() {
    if (!questions || questions.length === 0) return;
    const idx = questions.findIndex((q) => q.id === selectedQuestionId);
    if (idx > 0) {
      setSelectedQuestionId(questions[idx - 1].id);
    } else if (idx <= 0 && skip > 0) {
      changePage(Math.max(0, skip - PAGE_SIZE));
    }
  }

  // Jump straight to a question found via full-bank search -- switches the
  // sidebar/tab/filters to wherever that question actually lives, then opens
  // it directly in the detail pane regardless of which page it'd land on.
  function handleSearchJump(result: { id: string; subjectId: string; status: string }) {
    setSelection({ kind: 'subject', id: result.subjectId });
    setView(result.status === 'published' ? 'published' : result.status === 'rejected' ? 'rejected' : 'unreviewed');
    setSkip(0);
    setNeedsTaggingOnly(false);
    setMissingAiDraftOnly(false);
    setSelectedIds(new Set());
    setSelectedQuestionId(result.id);
    // Was missing until this recheck -- a search result would silently
    // update the selection without ever opening Review Mode, so clicking a
    // search hit looked like nothing happened.
    setIsReviewOpen(true);
  }

  useReviewShortcuts(
    {
      onNext: selectNext,
      onPrev: selectPrev,
      // Guarded on isReviewOpen (not the hook's own `enabled`, which also
      // gates "/" for search -- that one should keep working while just
      // browsing the list, not only mid-review) so "a"/"x" can never
      // accidentally approve/reject something while Review Mode is closed.
      onApprove: () => isReviewOpen && detailCardRef.current?.approve(),
      onReject: () => isReviewOpen && detailCardRef.current?.reject(),
      onSave: () => isReviewOpen && detailCardRef.current?.save(),
      onFocusSearch: () => searchInputRef.current?.focus(),
    },
    !!selection
  );

  function describeBulkResult(
    actionLabel: string,
    result: { attempted: number; succeeded: number; skipped: { id: string; reason: string }[] }
  ) {
    let msg = `${actionLabel} ${result.succeeded} of ${result.attempted}.`;
    if (result.skipped.length > 0) {
      const reasonCounts = new Map<string, number>();
      for (const s of result.skipped) reasonCounts.set(s.reason, (reasonCounts.get(s.reason) ?? 0) + 1);
      const reasons = [...reasonCounts.entries()].map(([reason, count]) => `${reason}: ${count}`).join(', ');
      msg += ` Skipped ${result.skipped.length} (${reasons}).`;
    }
    return msg;
  }

  const { confirm: confirmBulk, ConfirmDialog: BulkConfirmDialog } = useConfirm();

  async function runBulkAction(
    actionLabel: string,
    args: Parameters<typeof bulkQuestionAction>[0],
    confirmOptions?: { title: string; description: string }
  ) {
    if (selectedIds.size === 0) return;
    if (confirmOptions) {
      const ok = await confirmBulk({ ...confirmOptions, confirmLabel: actionLabel, variant: 'destructive' });
      if (!ok) return;
    }
    setIsBulkActing(true);
    setBulkResult(null);
    try {
      const result = await bulkQuestionAction(args);
      setBulkResult(describeBulkResult(actionLabel, result));
      setDraftAiFailedIds(
        args.action === 'draftAi'
          ? new Set(result.skipped.filter((s) => s.reason === 'AI request failed').map((s) => s.id))
          : new Set()
      );
      setSelectedIds(new Set());
      setMoveTargetSubjectId('');
      setBulkTagDifficulty('');
      refetchQuestions();
      refetchSubjects();
    } catch (e: any) {
      setBulkResult(e?.message ?? `${actionLabel} failed`);
    } finally {
      setIsBulkActing(false);
    }
  }

  async function handleBulkDraft() {
    if (!selection) return;
    setIsBulkDrafting(true);
    setBulkResult(null);
    try {
      const summary = await draftAiSuggestionsForSubject(
        selection.kind === 'subject' ? { subjectId: selection.id } : { importBatchId: selection.id }
      );
      const scopeLabel = selection.kind === 'subject' ? 'this subject' : 'this import';
      setBulkResult(
        summary.remainingAfterThisCall === 0
          ? `Done — drafted ${summary.suggested} this run (${summary.declined} declined, ${summary.errors} errors). ` +
              `Every question in ${scopeLabel} that can be AI-drafted now has one.`
          : `Drafted ${summary.suggested} of ${summary.attempted} attempted this run ` +
              `(${summary.declined} declined, ${summary.errors} errors). ` +
              `${summary.remainingAfterThisCall} still need a draft — click "Auto-draft" again to continue.`
      );
      refetchQuestions();
      refetchSubjects();
    } catch (e: any) {
      setBulkResult(e?.message ?? 'Bulk draft failed');
    } finally {
      setIsBulkDrafting(false);
    }
  }

  async function handleCreateSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    setIsCreatingSubject(true);
    setAddSubjectError(null);
    try {
      const created = await createSubject({ name });
      setNewSubjectName('');
      setIsAddingSubject(false);
      await refetchSubjects();
      select({ kind: 'subject', id: created.id });
    } catch (e: any) {
      setAddSubjectError(e?.message ?? 'Failed to create subject');
    } finally {
      setIsCreatingSubject(false);
    }
  }

  const selectedSubject = selection?.kind === 'subject' ? subjects?.find((s) => s.id === selection.id) : undefined;
  const selectedBatch = selection?.kind === 'batch' ? batches?.find((b) => b.id === selection.id) : undefined;

  return (
    <DefaultLayout user={user}>
      {BulkConfirmDialog}
      <div className='flex items-center justify-between gap-3 mb-4 flex-wrap'>
        <Breadcrumb pageName='Question Review' />
        <div className='flex items-center gap-3'>
          <ReviewerActivityTile />
          <WaspRouterLink to={routes.AdminImportQuestionsRoute.to}>
            <Button size='sm'>Import questions</Button>
          </WaspRouterLink>
        </div>
      </div>

      <div className='mb-4 flex items-center justify-between gap-4 flex-wrap'>
        {/* Tab switcher -- same page, same subject/batch selection, just a
            different status filter. Lets an already-published question with
            a mistake still be found and corrected (or deleted) instead of
            being stuck live forever. */}
        <div className='inline-flex rounded-full border border-border bg-muted/40 p-1'>
          {(['unreviewed', 'published', 'rejected'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
                view === v
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'unreviewed' ? 'To review' : v === 'published' ? 'Published' : 'Rejected'}
            </button>
          ))}
        </div>
        <div className='w-full sm:w-80'>
          <QuestionSearchBar ref={searchInputRef} onJump={handleSearchJump} />
        </div>
      </div>

      <div className='mb-4 md:mb-6'>
        <QuestionBankStatsCards stats={bankStats} isLoading={bankStatsLoading} />
      </div>

      {/* items-start (not the flex default of stretch) -- each column manages
          its own height/scroll independently instead of being force-stretched
          to match whichever is tallest. Heights below use vh, which is always
          relative to the real browser viewport regardless of DefaultLayout's
          own nested scroll container, unlike the previous 100vh-minus-a-guessed-
          offset approach that silently broke against that ancestor. */}
      <div className='flex flex-col lg:flex-row lg:items-start gap-4'>
        {/* Left: subjects + recent imports */}
        <div className='lg:w-64 shrink-0 flex flex-col gap-4 lg:max-h-[85vh] lg:overflow-y-auto lg:pr-1'>
          <div className='rounded-2xl border border-border bg-card shadow-sm p-4'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-sm font-medium'>Subjects</p>
              {!isAddingSubject && (
                <button
                  onClick={() => setIsAddingSubject(true)}
                  className='flex items-center gap-1 text-xs font-semibold text-primary hover:underline'
                >
                  <Plus className='h-3.5 w-3.5' />
                  Add subject
                </button>
              )}
            </div>

            {isAddingSubject && (
              <div className='mb-3 flex flex-col gap-1.5'>
                <div className='flex items-center gap-1'>
                  <Input
                    autoFocus
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSubject()}
                    placeholder='e.g. Oral Pathology'
                    className='h-8 text-sm'
                  />
                  <button
                    onClick={handleCreateSubject}
                    disabled={isCreatingSubject || !newSubjectName.trim()}
                    className='flex h-7 w-7 flex-none items-center justify-center rounded text-success hover:bg-accent disabled:opacity-40'
                  >
                    <Check className='h-3.5 w-3.5' />
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingSubject(false);
                      setNewSubjectName('');
                      setAddSubjectError(null);
                    }}
                    className='flex h-7 w-7 flex-none items-center justify-center rounded text-muted-foreground hover:bg-accent'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                </div>
                {addSubjectError && <p className='text-xs text-destructive'>{addSubjectError}</p>}
              </div>
            )}

            {subjectsLoading && <LoadingSpinner />}
            {!subjectsLoading && (!subjects || subjects.length === 0) && (
              <p className='text-sm text-muted-foreground'>No subjects yet.</p>
            )}
            <ul className='flex flex-col gap-1'>
              {/* Active subjects first, archived ones after -- archived stay
                  fully manageable here, just visually deprioritized. */}
              {[...(subjects ?? [])]
                .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name))
                .map((subject) => {
                  const isSelected = selection?.kind === 'subject' && subject.id === selection.id;
                  return (
                    <SubjectRow
                      key={subject.id}
                      subject={subject}
                      allSubjects={subjects}
                      view={view}
                      isSelected={isSelected}
                      onSelect={() => select({ kind: 'subject', id: subject.id })}
                      onChanged={refetchSubjects}
                    />
                  );
                })}
            </ul>
          </div>

          <div className='rounded-2xl border border-border bg-card shadow-sm p-4'>
            <p className='text-sm font-medium mb-3'>Recent imports</p>
            {batchesLoading && <LoadingSpinner />}
            {!batchesLoading && (!batches || batches.length === 0) && (
              <p className='text-sm text-muted-foreground'>Nothing imported yet.</p>
            )}
            <ul className='flex flex-col gap-1'>
              {batches?.map((batch) => {
                const isSelected = selection?.kind === 'batch' && batch.id === selection.id;
                return (
                  <li key={batch.id}>
                    <button
                      onClick={() => select({ kind: 'batch', id: batch.id })}
                      className={
                        'w-full text-left rounded px-3 py-2 text-sm transition-colors ' +
                        (isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-foreground')
                      }
                    >
                      <p className='font-medium truncate'>{batch.fileName}</p>
                      <p className='text-xs text-muted-foreground'>
                        {batch.subjectName} · {batch.totalPublished}/{batch.totalParsed} reviewed
                        {batch.remainingCount > 0 && ` (${batch.remainingCount} left)`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {!selection && (
          <div className='flex-1 rounded-2xl border border-border bg-card shadow-sm p-6 text-sm text-muted-foreground'>
            Select a subject or a recent import on the left to review its questions, or search for one above.
          </div>
        )}

        {selection && (
          <>
            {/* Middle: compact, scannable row list */}
            {/* Fills the remaining width now that there's no competing
                always-visible 3rd column -- each row gets much more room to
                show the actual question text. */}
            <div className='flex-1 min-w-0 flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:max-h-[85vh]'>
              <div className='flex flex-col gap-2.5 border-b border-border p-3'>
                {(selectedSubject || selectedBatch) && (
                  <p
                    className={cn(
                      'text-sm tabular-nums leading-snug',
                      view === 'unreviewed' &&
                        (selectedSubject
                          ? selectedSubject.totalCount > 0 && selectedSubject.remainingCount === 0
                          : (selectedBatch?.totalParsed ?? 0) > 0 && selectedBatch?.remainingCount === 0)
                        ? 'font-semibold text-success'
                        : 'text-muted-foreground'
                    )}
                  >
                    {selectedSubject && (
                      <>
                        <span className='font-semibold text-foreground'>{selectedSubject.name}</span>
                        {view === 'unreviewed' &&
                          ` — ${selectedSubject.totalCount - selectedSubject.remainingCount}/${selectedSubject.totalCount} reviewed${
                            selectedSubject.remainingCount === 0 ? ' — fully reviewed' : ''
                          }`}
                        {view === 'published' && ` — ${selectedSubject.publishedCount} published`}
                        {(() => {
                          if (view === 'rejected') return null;
                          const needsTaggingHere =
                            view === 'unreviewed'
                              ? selectedSubject.needsTaggingUnreviewedCount
                              : selectedSubject.needsTaggingPublishedCount;
                          return (
                            needsTaggingHere > 0 && (
                              <span className='block text-amber-700 dark:text-amber-400'>
                                {needsTaggingHere} need{needsTaggingHere === 1 ? 's' : ''} tagging
                              </span>
                            )
                          );
                        })()}
                        {view === 'unreviewed' && selectedSubject.needsAiDraftCount > 0 && (
                          <span className='block text-amber-700 dark:text-amber-400'>
                            {selectedSubject.needsAiDraftCount} need{selectedSubject.needsAiDraftCount === 1 ? 's' : ''}{' '}
                            an AI draft
                          </span>
                        )}
                      </>
                    )}
                    {selectedBatch && (
                      <>
                        <span className='font-semibold text-foreground'>{selectedBatch.fileName}</span>
                        {view === 'unreviewed' &&
                          ` — ${selectedBatch.totalPublished}/${selectedBatch.totalParsed} reviewed${
                            selectedBatch.remainingCount === 0 ? ' — fully reviewed' : ''
                          }`}
                        {view === 'published' && ` — ${selectedBatch.totalPublished} published`}
                      </>
                    )}
                  </p>
                )}

                <div className='flex items-center gap-3 flex-wrap'>
                  {view !== 'rejected' && (
                    <label className='flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground cursor-pointer'>
                      <Checkbox checked={needsTaggingOnly} onCheckedChange={toggleNeedsTaggingOnly} />
                      Untagged only
                    </label>
                  )}
                  {view === 'unreviewed' && (
                    <label className='flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground cursor-pointer'>
                      <Checkbox checked={missingAiDraftOnly} onCheckedChange={toggleMissingAiDraftOnly} />
                      Missing AI draft
                    </label>
                  )}
                  <Select value={sortBy} onValueChange={changeSortBy}>
                    <SelectTrigger className='h-7 w-auto gap-1.5 border-none bg-transparent px-0 text-[11px] font-medium text-muted-foreground shadow-none hover:text-foreground'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='oldest'>Oldest first</SelectItem>
                      <SelectItem value='newest'>Newest first</SelectItem>
                      <SelectItem value='brokenFirst'>Missing answer first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {view === 'unreviewed' && (
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={isBulkDrafting}
                    onClick={handleBulkDraft}
                    title="Drafts across the whole subject/import, not just what's checked below -- click repeatedly to work through all of it 30 at a time"
                  >
                    <Sparkles className='h-3.5 w-3.5 mr-1.5' />
                    {isBulkDrafting
                      ? 'Drafting…'
                      : selectedSubject
                        ? selectedSubject.needsAiDraftCount > 0
                          ? `Auto-draft (${Math.min(selectedSubject.needsAiDraftCount, 30)} of ${selectedSubject.needsAiDraftCount})`
                          : 'Auto-draft whole subject'
                        : 'Auto-draft this import'}
                  </Button>
                )}

                {questions && questions.length > 0 && (
                  <label className='flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground cursor-pointer'>
                    <Checkbox
                      checked={questions.every((q) => selectedIds.has(q.id))}
                      onCheckedChange={(checked) =>
                        setSelectedIds(checked ? new Set(questions.map((q) => q.id)) : new Set())
                      }
                      aria-label='Select all on this page'
                    />
                    Select all on this page
                  </label>
                )}
              </div>

              {bulkResult && (
                <p
                  className={cn(
                    'mx-3 mt-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-sm',
                    bulkResult.startsWith('Done —')
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-border bg-muted/40 text-foreground'
                  )}
                >
                  {bulkResult}
                </p>
              )}

              {selectedIds.size > 0 && (
                <div className='mx-3 mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-2'>
                  <span className='text-xs font-semibold tabular-nums mr-1'>{selectedIds.size} selected</span>
                  {view === 'unreviewed' && (
                    <>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() => runBulkAction('Drafted', { action: 'draftAi', questionIds: [...selectedIds] })}
                      >
                        <Sparkles className='h-3 w-3 mr-1' />
                        Draft AI
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() =>
                          runBulkAction('Applied suggestions to', {
                            action: 'acceptAiSuggestions',
                            questionIds: [...selectedIds],
                          })
                        }
                      >
                        <CheckCheck className='h-3 w-3 mr-1' />
                        Accept AI
                      </Button>
                      <Button
                        size='sm'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() => runBulkAction('Approved', { action: 'approve', questionIds: [...selectedIds] })}
                      >
                        Approve
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() => runBulkAction('Rejected', { action: 'reject', questionIds: [...selectedIds] })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {view === 'published' && (
                    <>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() =>
                          runBulkAction(
                            'Sent back to review',
                            { action: 'unpublish', questionIds: [...selectedIds] },
                            {
                              title: 'Send back to review?',
                              description: `Send ${selectedIds.size} question(s) back to review? They'll come off the live site immediately and need Approve again before students see them.`,
                            }
                          )
                        }
                      >
                        <RotateCcw className='h-3 w-3 mr-1' />
                        Send back
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() =>
                          runBulkAction(
                            'Deleted',
                            { action: 'delete', questionIds: [...selectedIds] },
                            {
                              title: 'Delete published questions?',
                              description: `Delete ${selectedIds.size} published question(s) permanently? This also removes any student attempts, notes, and mock-exam records tied to them. This cannot be undone.`,
                            }
                          )
                        }
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {view === 'rejected' && (
                    <>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() =>
                          runBulkAction(
                            'Restored to review',
                            { action: 'unpublish', questionIds: [...selectedIds] },
                            {
                              title: 'Restore to review?',
                              description: `Restore ${selectedIds.size} question(s) to "To review"? They'll need Approve again before going live.`,
                            }
                          )
                        }
                      >
                        <RotateCcw className='h-3 w-3 mr-1' />
                        Restore
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing}
                        onClick={() =>
                          runBulkAction(
                            'Deleted',
                            { action: 'delete', questionIds: [...selectedIds] },
                            {
                              title: 'Delete rejected questions?',
                              description: `Delete ${selectedIds.size} rejected question(s) permanently? This cannot be undone.`,
                            }
                          )
                        }
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {subjects && subjects.length > 0 && (
                    <div className='flex items-center gap-1 w-full mt-1'>
                      <Select value={moveTargetSubjectId} onValueChange={setMoveTargetSubjectId}>
                        <SelectTrigger className='h-7 flex-1 text-xs'>
                          <SelectValue placeholder='Move to subject…' />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-7 px-2 text-xs'
                        disabled={isBulkActing || !moveTargetSubjectId}
                        onClick={() =>
                          runBulkAction('Moved', {
                            action: 'move',
                            questionIds: [...selectedIds],
                            targetSubjectId: moveTargetSubjectId,
                          })
                        }
                      >
                        Move
                      </Button>
                    </div>
                  )}
                  {/* Bulk tagging works regardless of status -- difficulty/High-Yield/
                      Case-Based are independent of review state, unlike every other
                      bulk action above which is gated to one tab. */}
                  <div className='flex items-center gap-1 w-full'>
                    <Select value={bulkTagDifficulty} onValueChange={setBulkTagDifficulty}>
                      <SelectTrigger className='h-7 flex-1 text-xs'>
                        <SelectValue placeholder='Set difficulty…' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='easy'>Easy</SelectItem>
                        <SelectItem value='medium'>Medium</SelectItem>
                        <SelectItem value='hard'>Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      disabled={isBulkActing || !bulkTagDifficulty}
                      onClick={() =>
                        runBulkAction('Tagged', {
                          action: 'tag',
                          questionIds: [...selectedIds],
                          difficulty: bulkTagDifficulty as 'easy' | 'medium' | 'hard',
                        })
                      }
                    >
                      Apply
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      disabled={isBulkActing}
                      onClick={() =>
                        runBulkAction('Tagged', { action: 'tag', questionIds: [...selectedIds], isHighYield: true })
                      }
                    >
                      + High-Yield
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 px-2 text-xs'
                      disabled={isBulkActing}
                      onClick={() =>
                        runBulkAction('Tagged', { action: 'tag', questionIds: [...selectedIds], isCaseBased: true })
                      }
                    >
                      + Case-Based
                    </Button>
                  </div>
                </div>
              )}

              <div className='min-h-0 flex-1 overflow-y-auto p-2 flex flex-col gap-0.5'>
                {questionsLoading && <LoadingSpinner />}
                {!questionsLoading && questions?.length === 0 && (
                  <p className='p-4 text-sm text-muted-foreground'>
                    {needsTaggingOnly
                      ? 'Nothing left to tag here — every question already has a difficulty set.'
                      : missingAiDraftOnly
                        ? 'Nothing left here — every question already has an AI draft (or was already answered without needing one).'
                        : view === 'unreviewed'
                          ? 'Nothing left to review in this batch.'
                          : view === 'published'
                            ? 'Nothing published here yet.'
                            : 'Nothing rejected here.'}
                  </p>
                )}
                {questions?.map((question) => (
                  <QuestionRow
                    key={question.id}
                    question={question}
                    mode={view}
                    isActive={question.id === selectedQuestionId}
                    onSelect={() => {
                      setSelectedQuestionId(question.id);
                      setIsReviewOpen(true);
                    }}
                    selected={selectedIds.has(question.id)}
                    onToggleSelect={() => toggleSelected(question.id)}
                    subjectName={selection.kind === 'batch' ? subjectNameById.get(question.subjectId) : undefined}
                  />
                ))}
              </div>

              {questions && questions.length > 0 && (
                <div className='flex items-center justify-between border-t border-border p-2.5'>
                  <button
                    className='text-xs text-muted-foreground hover:text-foreground disabled:opacity-40'
                    disabled={skip === 0}
                    onClick={() => changePage(Math.max(0, skip - PAGE_SIZE))}
                  >
                    &larr; Previous
                  </button>
                  <button
                    className='text-xs text-muted-foreground hover:text-foreground disabled:opacity-40'
                    disabled={questions.length < PAGE_SIZE}
                    onClick={() => changePage(skip + PAGE_SIZE)}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Review Mode -- a near-full-screen overlay instead of a narrow
          always-visible column competing with the sidebar/list for width.
          Approve/Reject/Save/unpublish all call onAdvance, which moves
          selectedQuestionId to the next question without touching
          isReviewOpen -- so the overlay stays open and simply shows the next
          question, letting a reviewer approve and keep going without ever
          closing and reopening it. Portaled straight to document.body (Radix
          Dialog), so unlike the old inline pane it has no DefaultLayout
          ancestor scroll container to fight -- the fixed h-[88vh] here is
          real and reliable. */}
      <Dialog open={isReviewOpen && !!selection} onOpenChange={setIsReviewOpen}>
        <DialogContent className='flex h-[88vh] max-h-[88vh] w-[94vw] max-w-5xl flex-col gap-0 overflow-hidden p-0'>
          <DialogTitle className='sr-only'>Question review</DialogTitle>
          {questionsLoading && !detailQuestion && (
            <div className='flex flex-1 items-center justify-center'>
              <LoadingSpinner />
            </div>
          )}
          {!questionsLoading && !detailQuestion && (
            <div className='flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center'>
              <p className='text-base font-semibold text-foreground'>You're all caught up here.</p>
              <p className='text-sm text-muted-foreground'>
                Nothing left in this list. Close this and pick another subject or tab.
              </p>
            </div>
          )}
          {detailQuestion && (
            <QuestionReviewCard
              ref={detailCardRef}
              key={detailQuestion.id}
              question={detailQuestion}
              subjects={subjects}
              mode={view}
              onDeleted={refetchQuestions}
              onSaved={handleQuestionSaved}
              onAdvance={() => advanceFrom(detailQuestion.id)}
              aiDraftFailed={draftAiFailedIds.has(detailQuestion.id)}
              position={selectedIndexInList >= 0 ? { index: selectedIndexInList, total: questions!.length } : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </DefaultLayout>
  );
}

type SubjectWithProgress = {
  id: string;
  name: string;
  isActive: boolean;
  remainingCount: number;
  publishedCount: number;
  totalCount: number;
  needsTaggingUnreviewedCount: number;
  needsTaggingPublishedCount: number;
  needsAiDraftCount: number;
};

function SubjectRow({
  subject,
  allSubjects,
  view,
  isSelected,
  onSelect,
  onChanged,
}: {
  subject: SubjectWithProgress;
  allSubjects: SubjectWithProgress[] | undefined;
  view: View;
  isSelected: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deleting a subject with questions still in it requires saying where those
  // questions go first -- the backend rejects a bare delete in that case, so
  // this modal is the only way to clear it (see deleteSubject in operations.ts).
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveToSubjectId, setMoveToSubjectId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const otherSubjects = (allSubjects ?? []).filter((s) => s.id !== subject.id);

  async function handleRename() {
    if (!name.trim() || name === subject.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateSubject({ id: subject.id, name: name.trim() });
      setIsEditing(false);
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to rename');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteClick() {
    if (subject.totalCount === 0) {
      const ok = await confirm({
        title: 'Delete subject?',
        description: `Delete subject "${subject.name}"? It has no questions.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (!ok) return;
      performDelete();
      return;
    }
    setMoveToSubjectId('');
    setDeleteError(null);
    setShowMoveModal(true);
  }

  async function performDelete(withMoveToSubjectId?: string) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteSubject({ id: subject.id, moveToSubjectId: withMoveToSubjectId });
      setShowMoveModal(false);
      onChanged();
    } catch (e: any) {
      setDeleteError(e?.message ?? 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  }

  // Archiving hides a subject's published questions from students (practice
  // picker, mock-exam draws) without touching a single row -- a reversible
  // alternative to the hard-delete flow above.
  async function handleToggleArchive() {
    await updateSubject({ id: subject.id, isActive: !subject.isActive });
    onChanged();
  }

  if (isEditing) {
    return (
      <li className='flex items-center gap-1 px-1 py-1'>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          className='h-8 text-sm'
        />
        <button
          onClick={handleRename}
          disabled={isSaving}
          className='flex h-7 w-7 flex-none items-center justify-center rounded text-success hover:bg-accent'
        >
          <Check className='h-3.5 w-3.5' />
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setName(subject.name);
          }}
          className='flex h-7 w-7 flex-none items-center justify-center rounded text-muted-foreground hover:bg-accent'
        >
          <X className='h-3.5 w-3.5' />
        </button>
        {error && <p className='text-xs text-destructive'>{error}</p>}
      </li>
    );
  }

  return (
    <li className={cn('group relative', !subject.isActive && 'opacity-60')}>
      {ConfirmDialog}
      <button
        onClick={onSelect}
        className={cn(
          'w-full text-left rounded px-3 py-2 text-sm transition-colors pr-10',
          isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-foreground'
        )}
      >
        <p className='font-medium truncate flex items-center gap-1.5'>
          {subject.name}
          {!subject.isActive && (
            <span className='rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground'>
              Archived
            </span>
          )}
        </p>
        <p
          className={cn(
            'text-xs',
            view === 'unreviewed' && subject.totalCount > 0 && subject.remainingCount === 0
              ? 'font-semibold text-success'
              : 'text-muted-foreground'
          )}
        >
          {view === 'unreviewed'
            ? `${subject.totalCount - subject.remainingCount}/${subject.totalCount} reviewed${
                subject.remainingCount > 0 ? ` (${subject.remainingCount} left)` : ''
              }`
            : `${subject.publishedCount} published`}
          {(() => {
            const needsTaggingHere =
              view === 'unreviewed' ? subject.needsTaggingUnreviewedCount : subject.needsTaggingPublishedCount;
            return (
              needsTaggingHere > 0 && (
                <span className='block text-amber-700 dark:text-amber-400'>
                  {needsTaggingHere} need{needsTaggingHere === 1 ? 's' : ''} tagging
                </span>
              )
            );
          })()}
          {view === 'unreviewed' && subject.needsAiDraftCount > 0 && (
            <span className='block text-amber-700 dark:text-amber-400'>
              {subject.needsAiDraftCount} need{subject.needsAiDraftCount === 1 ? 's' : ''} an AI draft
            </span>
          )}
        </p>
      </button>
      <div className='absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground'>
              <Ellipsis className='h-3.5 w-3.5' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className='size-4 mr-2' />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleArchive}>
              {subject.isActive ? (
                <>
                  <Archive className='size-4 mr-2' />
                  Archive
                </>
              ) : (
                <>
                  <ArchiveRestore className='size-4 mr-2' />
                  Unarchive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteClick} className='text-destructive focus:text-destructive'>
              <Trash2 className='size-4 mr-2' />
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showMoveModal && (
        <div
          className='fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4'
          onClick={() => !isDeleting && setShowMoveModal(false)}
        >
          <div
            className='w-full max-w-sm rounded-xl bg-card border border-border shadow-2xl p-6 flex flex-col gap-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center gap-2'>
              <Trash2 className='h-5 w-5 text-destructive' />
              <h3 className='text-base font-bold text-foreground'>Delete "{subject.name}"?</h3>
            </div>
            <p className='text-sm text-muted-foreground'>
              This subject still has {subject.totalCount} question{subject.totalCount === 1 ? '' : 's'}. Move them to
              another subject to delete it -- this reassigns every question here in one step.
            </p>
            <div>
              <label className='text-xs font-medium text-muted-foreground'>Move questions to</label>
              {otherSubjects.length === 0 ? (
                <p className='mt-1 text-xs text-destructive'>
                  No other subjects exist yet -- create one first to move these questions into.
                </p>
              ) : (
                <Select value={moveToSubjectId} onValueChange={setMoveToSubjectId}>
                  <SelectTrigger className='w-full mt-1'>
                    <SelectValue placeholder='Select a subject' />
                  </SelectTrigger>
                  <SelectContent>
                    {otherSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {deleteError && <p className='text-xs text-destructive'>{deleteError}</p>}
            <div className='flex items-center justify-end gap-2'>
              <Button variant='outline' onClick={() => setShowMoveModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant='destructive'
                disabled={isDeleting || !moveToSubjectId}
                onClick={() => performDelete(moveToSubjectId)}
              >
                {isDeleting ? 'Moving & deleting…' : 'Move & delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export default QuestionsReviewPage;
