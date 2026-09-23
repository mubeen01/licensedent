import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Clock,
  FileText,
  FileUp,
  ListChecks,
  Loader2,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  bulkQuestionAction,
  getExamsForAdmin,
  getImportBatches,
  getQuestionsForReview,
  getSubjectsForExam,
  importQuestionsFromText,
  useQuery,
} from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import { useConfirm } from './ConfirmDialog';
import { extractTextFromFile } from './extractFileText';
import { type ParsedEntry, parseQuestionsFromText } from './importParsing';
import { ExamFlag } from '../../../client/components/ExamFlag';

type SubjectMode = 'single' | 'mixed';
type SingleSubjectSource = 'existing' | 'new';
type DuplicateSensitivity = 'aggressive' | 'balanced' | 'strict';
type AddMode = 'files' | 'paste';
type QueueStatus = 'pending' | 'importing' | 'done' | 'error';

const DUPLICATE_THRESHOLDS: Record<DuplicateSensitivity, number> = {
  aggressive: 0.9,
  balanced: 0.95,
  strict: 0.98,
};

const DUPLICATE_SENSITIVITY_HELP: Record<DuplicateSensitivity, string> = {
  aggressive: 'Catches more near-matches (paraphrased stems), at the risk of skipping a few real questions.',
  balanced: 'Default — flags only stems that are almost identical to one already in the bank.',
  strict: 'Only skips near-exact text matches. Fewer false positives, more manual dedup later.',
};

interface ImportResult {
  batchId: string;
  totalDetected: number;
  inserted: number;
  pendingCount: number;
  flaggedCount: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  subjectName: string;
  subjectId: string;
  aiSuggested: number;
  aiDeclined: number;
  aiErrors: number;
  aiSkippedCap: number;
  aiSkipped: boolean;
}

interface QueueItem {
  id: string;
  fileName: string;
  file: File | null;
  text: string | null;
  isExtracting: boolean;
  extractError: string | null;
  status: QueueStatus;
  importError: string | null;
  result: ImportResult | null;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function summarizeFlagReasons(flagged: ParsedEntry[]): { reason: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of flagged) {
    const reasons = (entry.flagReason ?? '')
      .split(';')
      .map((r) => r.trim())
      .filter(Boolean);
    for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count }));
}

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function ImportQuestionsPage({ user }: { user: AuthUser }) {
  const { data: exams, isLoading: examsLoading } = useQuery(getExamsForAdmin);
  const { data: recentBatches, isLoading: batchesLoading, refetch: refetchBatches } = useQuery(getImportBatches);
  const { confirm, ConfirmDialog } = useConfirm();
  const [rollingBackBatchId, setRollingBackBatchId] = useState<string | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const [examId, setExamId] = useState<string>('');
  const [subjectMode, setSubjectMode] = useState<SubjectMode>('single');
  const [singleSubjectSource, setSingleSubjectSource] = useState<SingleSubjectSource>('existing');
  const [subjectId, setSubjectId] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const { data: subjects, isLoading: subjectsLoading } = useQuery(
    getSubjectsForExam,
    { examId },
    { enabled: !!examId }
  );

  const [addMode, setAddMode] = useState<AddMode>('files');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pasteLabel, setPasteLabel] = useState('');
  const [pasteText, setPasteText] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewBeforeImport, setPreviewBeforeImport] = useState(true);
  const [skipAiSuggestions, setSkipAiSuggestions] = useState(false);
  const [duplicateSensitivity, setDuplicateSensitivity] = useState<DuplicateSensitivity>('balanced');

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  async function addFiles(files: FileList | File[]) {
    const picked = Array.from(files);
    if (picked.length === 0) return;

    const newItems: QueueItem[] = picked.map((file) => ({
      id: makeId(),
      fileName: file.name,
      file,
      text: null,
      isExtracting: true,
      extractError: null,
      status: 'pending',
      importError: null,
      result: null,
    }));
    setQueue((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      try {
        const text = await extractTextFromFile(item.file!);
        updateItem(item.id, { text, isExtracting: false });
      } catch (err: any) {
        updateItem(item.id, { isExtracting: false, extractError: err?.message ?? 'Failed to extract text' });
      }
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function addPastedText() {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    const label = pasteLabel.trim() || `Pasted text ${queue.length + 1}`;
    setQueue((prev) => [
      ...prev,
      {
        id: makeId(),
        fileName: label,
        file: null,
        text: trimmed,
        isExtracting: false,
        extractError: null,
        status: 'pending',
        importError: null,
        result: null,
      },
    ]);
    setPasteText('');
    setPasteLabel('');
  }

  const previews = useMemo(() => {
    const map = new Map<string, { parsed: ParsedEntry[]; flagged: ParsedEntry[] }>();
    for (const item of queue) {
      if (!item.text) continue;
      try {
        map.set(item.id, parseQuestionsFromText(item.text, item.fileName));
      } catch {
        // Preview is best-effort only — the server re-parses independently on import.
      }
    }
    return map;
  }, [queue]);

  const readyItems = queue.filter((q) => !!q.text && q.status !== 'done');
  const anyExtracting = queue.some((q) => q.isExtracting);
  const subjectConfigValid =
    subjectMode === 'mixed' || (singleSubjectSource === 'existing' ? !!subjectId : newSubjectName.trim().length > 0);
  const canSubmit = !!examId && subjectConfigValid && readyItems.length > 0 && !isImporting && !anyExtracting;

  async function handleImportAll() {
    if (!canSubmit) return;
    setIsImporting(true);
    setImportProgress({ done: 0, total: readyItems.length });

    const threshold = DUPLICATE_THRESHOLDS[duplicateSensitivity];
    // Once the first file in a "new subject" run creates that subject, pin the
    // resulting id so a multi-file queue doesn't create a duplicate Subject
    // row per file — the server only finds-or-creates for the "mixed"/Unsorted
    // path, not for an explicit new-subject name.
    let pinnedSubjectId =
      subjectMode === 'single' && singleSubjectSource === 'existing' ? subjectId : undefined;
    let doneCount = 0;

    for (const item of readyItems) {
      if (!item.text) continue;
      updateItem(item.id, { status: 'importing', importError: null });
      try {
        const summary = await importQuestionsFromText({
          examId,
          subjectMode,
          subjectId: pinnedSubjectId,
          newSubjectName:
            subjectMode === 'single' && singleSubjectSource === 'new' && !pinnedSubjectId
              ? newSubjectName.trim()
              : undefined,
          fileName: item.fileName,
          text: item.text,
          skipAiSuggestions,
          duplicateThreshold: threshold,
        });
        if (subjectMode === 'single' && singleSubjectSource === 'new' && !pinnedSubjectId) {
          pinnedSubjectId = summary.subjectId;
        }
        updateItem(item.id, { status: 'done', result: summary });
      } catch (err: any) {
        updateItem(item.id, { status: 'error', importError: err?.message ?? 'Import failed' });
      }
      doneCount += 1;
      setImportProgress({ done: doneCount, total: readyItems.length });
    }

    setIsImporting(false);
  }

  async function handleRollbackBatch(batch: { id: string; fileName: string; remainingCount: number }) {
    const ok = await confirm({
      title: `Roll back "${batch.fileName}"?`,
      description: `This rejects the ${batch.remainingCount} not-yet-published question(s) still pending or flagged from this import. Anything already published is left untouched. Rejected questions aren't deleted — they show up in the Rejected tab and can be restored from there.`,
      confirmLabel: 'Roll back',
      variant: 'destructive',
    });
    if (!ok) return;

    setRollbackError(null);
    setRollingBackBatchId(batch.id);
    try {
      const ids: string[] = [];
      let skip = 0;
      // getQuestionsForReview caps `take` at 100 -- page through until a
      // short page confirms there's nothing left, so a big batch doesn't
      // silently only reject its first 100.
      for (;;) {
        const page = await getQuestionsForReview({
          importBatchId: batch.id,
          status: 'unreviewed',
          sortBy: 'oldest',
          needsTagging: false,
          missingAiDraft: false,
          skip,
          take: 100,
        });
        ids.push(...page.map((q) => q.id));
        if (page.length < 100) break;
        skip += 100;
      }
      // bulkQuestionAction caps questionIds at 200 per call -- chunk larger
      // batches instead of assuming a single import ever stays under that.
      const BULK_CHUNK_SIZE = 200;
      for (let i = 0; i < ids.length; i += BULK_CHUNK_SIZE) {
        await bulkQuestionAction({ questionIds: ids.slice(i, i + BULK_CHUNK_SIZE), action: 'reject' });
      }
      await refetchBatches();
    } catch (err: any) {
      setRollbackError(err?.message ?? 'Rollback failed');
    } finally {
      setRollingBackBatchId(null);
    }
  }

  const completedResults = queue.filter((q) => q.status === 'done' && q.result);
  const combinedResult =
    completedResults.length > 0
      ? completedResults.reduce(
          (acc, q) => {
            const r = q.result!;
            acc.totalDetected += r.totalDetected;
            acc.inserted += r.inserted;
            acc.pendingCount += r.pendingCount;
            acc.flaggedCount += r.flaggedCount;
            acc.skippedDuplicate += r.skippedDuplicate;
            acc.skippedInvalid += r.skippedInvalid;
            acc.aiSuggested += r.aiSuggested;
            acc.aiDeclined += r.aiDeclined;
            acc.aiErrors += r.aiErrors;
            acc.aiSkippedCap += r.aiSkippedCap;
            if (r.aiSkipped) acc.aiSkipped = true;
            return acc;
          },
          {
            totalDetected: 0,
            inserted: 0,
            pendingCount: 0,
            flaggedCount: 0,
            skippedDuplicate: 0,
            skippedInvalid: 0,
            aiSuggested: 0,
            aiDeclined: 0,
            aiErrors: 0,
            aiSkippedCap: 0,
            aiSkipped: false,
          }
        )
      : null;

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Import Questions' />

      <div className='max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start'>
        <div className='flex flex-col gap-6 min-w-0'>
          {/* Step 1 — destination */}
          <div className='rounded-2xl border border-border bg-card shadow-xs p-6 flex flex-col gap-5'>
            <SectionHeading step={1} title='Destination' subtitle='Where these questions should land' />

            <div>
              <Label>Exam</Label>
              <Select value={examId || undefined} onValueChange={(v) => { setExamId(v); setSubjectId(''); }}>
                <SelectTrigger className='w-full mt-1'>
                  <SelectValue placeholder={examsLoading ? 'Loading exams…' : 'Choose an exam'} />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      <span className='inline-flex items-center gap-1.5'>
                        <ExamFlag emoji={exam.flagEmoji} /> {exam.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subjects in this batch</Label>
              <div className='mt-1.5 grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => setSubjectMode('single')}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                    subjectMode === 'single'
                      ? 'border-primary/40 bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20'
                      : 'border-input text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <p className='font-medium'>Single subject</p>
                  <p className='text-xs mt-0.5'>Every file/question here is the same subject.</p>
                </button>
                <button
                  type='button'
                  onClick={() => setSubjectMode('mixed')}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                    subjectMode === 'mixed'
                      ? 'border-primary/40 bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20'
                      : 'border-input text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <p className='font-medium'>Mixed</p>
                  <p className='text-xs mt-0.5'>Questions span multiple subjects, tag them later.</p>
                </button>
              </div>
            </div>

            {subjectMode === 'single' && (
              <div className='flex flex-col gap-3 pl-4 border-l-2 border-border'>
                <div className='flex gap-4 text-sm'>
                  <label className='flex items-center gap-1.5 cursor-pointer'>
                    <input
                      type='radio'
                      checked={singleSubjectSource === 'existing'}
                      onChange={() => setSingleSubjectSource('existing')}
                    />
                    Existing subject
                  </label>
                  <label className='flex items-center gap-1.5 cursor-pointer'>
                    <input
                      type='radio'
                      checked={singleSubjectSource === 'new'}
                      onChange={() => setSingleSubjectSource('new')}
                    />
                    New subject
                  </label>
                </div>

                {singleSubjectSource === 'existing' ? (
                  <Select value={subjectId || undefined} onValueChange={setSubjectId} disabled={!examId}>
                    <SelectTrigger className='w-full'>
                      <SelectValue
                        placeholder={
                          !examId ? 'Pick an exam first' : subjectsLoading ? 'Loading subjects…' : 'Choose a subject'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder='e.g. Oral Pathology'
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                )}
              </div>
            )}

            {subjectMode === 'mixed' && (
              <p className='text-xs text-muted-foreground pl-4 border-l-2 border-border'>
                Questions land in this exam's "Unsorted" subject bucket, pending status. Tag each one to its real
                subject from the Question Review page — a subject picker is right there on each card.
              </p>
            )}
          </div>

          {/* Step 2 — add source material */}
          <div className='rounded-2xl border border-border bg-card shadow-xs p-6 flex flex-col gap-4'>
            <SectionHeading
              step={2}
              title='Add source material'
              subtitle='Queue as many files as you like, or paste text directly'
            />

            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => setAddMode('files')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                  addMode === 'files'
                    ? 'border-primary/40 bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20'
                    : 'border-input text-muted-foreground hover:border-primary/40'
                )}
              >
                <FileUp className='h-4 w-4' /> Upload files
              </button>
              <button
                type='button'
                onClick={() => setAddMode('paste')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                  addMode === 'paste'
                    ? 'border-primary/40 bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20'
                    : 'border-input text-muted-foreground hover:border-primary/40'
                )}
              >
                <ClipboardPaste className='h-4 w-4' /> Paste text
              </button>
            </div>

            {addMode === 'files' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors',
                  isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <Upload className={cn('h-6 w-6', isDragging ? 'text-primary' : 'text-muted-foreground')} />
                <p className='text-sm font-medium text-foreground'>Drag & drop PDF or TXT files here</p>
                <p className='text-xs text-muted-foreground'>or click to browse — multiple files are queued together</p>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.pdf,.txt'
                  multiple
                  onChange={handleFileInputChange}
                  className='hidden'
                />
              </div>
            ) : (
              <div className='flex flex-col gap-2'>
                <Input
                  placeholder='Label for this text (optional) — e.g. "Oral Path — Chapter 4"'
                  value={pasteLabel}
                  onChange={(e) => setPasteLabel(e.target.value)}
                />
                <Textarea
                  placeholder='Paste raw question text here…'
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                />
                <Button type='button' variant='outline' className='self-start' onClick={addPastedText} disabled={!pasteText.trim()}>
                  Add to queue
                </Button>
              </div>
            )}

            {queue.length > 0 && (
              <div className='flex flex-col gap-2 mt-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                    Queued ({queue.length})
                  </p>
                  {!isImporting && (
                    <button
                      type='button'
                      onClick={() => setQueue((prev) => prev.filter((q) => q.status === 'importing'))}
                      className='text-xs text-muted-foreground hover:text-destructive flex items-center gap-1'
                    >
                      <Trash2 className='h-3 w-3' /> Clear all
                    </button>
                  )}
                </div>
                <ul className='flex flex-col gap-1.5'>
                  {queue.map((item) => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      preview={previews.get(item.id)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Step 3 — preview (optional) */}
          {previewBeforeImport && queue.some((q) => previews.has(q.id)) && (
            <div className='rounded-2xl border border-border bg-card shadow-xs p-6 flex flex-col gap-4'>
              <SectionHeading
                step={3}
                title='Preview'
                subtitle='What the parser detected — the server re-checks everything again at import time'
              />
              <Accordion type='multiple' className='w-full'>
                {queue.map((item) => {
                  const preview = previews.get(item.id);
                  if (!preview) return null;
                  return <PreviewAccordionItem key={item.id} item={item} preview={preview} />;
                })}
              </Accordion>
            </div>
          )}

          {/* Advanced options */}
          <div className='rounded-2xl border border-border bg-card shadow-xs overflow-hidden'>
            <button
              type='button'
              onClick={() => setShowAdvanced((v) => !v)}
              className='w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors'
            >
              <span className='flex items-center gap-2'>
                <Settings2 className='h-4 w-4 text-muted-foreground' /> Advanced options
              </span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showAdvanced && 'rotate-180')} />
            </button>
            {showAdvanced && (
              <div className='px-6 pb-6 flex flex-col gap-5 border-t border-border pt-5'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>Preview before importing</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Show the parsed breakdown for each queued source before you commit it.
                    </p>
                  </div>
                  <Switch checked={previewBeforeImport} onCheckedChange={setPreviewBeforeImport} />
                </div>

                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>Skip AI-drafted suggestions</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Flagged questions are normally sent for an AI-drafted answer/explanation (capped, unconfirmed,
                      still reviewed by a human). Turn this off to import faster and cheaper, or when you'll review
                      manually anyway.
                    </p>
                  </div>
                  <Switch checked={skipAiSuggestions} onCheckedChange={setSkipAiSuggestions} />
                </div>

                <div>
                  <Label>Duplicate detection sensitivity</Label>
                  <Select value={duplicateSensitivity} onValueChange={(v) => setDuplicateSensitivity(v as DuplicateSensitivity)}>
                    <SelectTrigger className='w-full mt-1'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='aggressive'>Aggressive</SelectItem>
                      <SelectItem value='balanced'>Balanced (default)</SelectItem>
                      <SelectItem value='strict'>Strict</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground mt-1.5'>
                    {DUPLICATE_SENSITIVITY_HELP[duplicateSensitivity]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Import action */}
          <div className='rounded-2xl border border-border bg-card shadow-xs p-6 flex flex-col gap-4'>
            <div className='flex items-center justify-between flex-wrap gap-3'>
              <div>
                <p className='text-sm font-medium text-foreground'>
                  {readyItems.length > 0
                    ? `Ready to import ${readyItems.length} source${readyItems.length === 1 ? '' : 's'}`
                    : 'Nothing queued yet'}
                </p>
                {isImporting && importProgress && (
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Importing {importProgress.done} of {importProgress.total}…
                  </p>
                )}
                {!isImporting && anyExtracting && (
                  <p className='text-xs text-muted-foreground mt-0.5'>Waiting for text extraction to finish…</p>
                )}
              </div>
              <Button onClick={handleImportAll} disabled={!canSubmit}>
                {isImporting ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Upload className='h-4 w-4 mr-2' />}
                {isImporting ? 'Importing…' : `Import ${readyItems.length || ''} source${readyItems.length === 1 ? '' : 's'}`}
              </Button>
            </div>
            {isImporting && importProgress && (
              <div className='h-1.5 w-full rounded-full bg-muted overflow-hidden'>
                <div
                  className='h-full bg-primary transition-all'
                  style={{ width: `${(importProgress.done / Math.max(1, importProgress.total)) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Results */}
          {combinedResult && (
            <div className='rounded-2xl border border-border bg-card shadow-xs p-6 flex flex-col gap-3'>
              <div className='flex items-center gap-2 text-foreground font-medium'>
                <CheckCircle2 className='h-5 w-5 text-secondary' />
                Imported {completedResults.length} source{completedResults.length === 1 ? '' : 's'}
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm'>
                <Stat label='Detected' value={combinedResult.totalDetected} />
                <Stat label='Inserted' value={combinedResult.inserted} />
                <Stat label='Ready to publish' value={combinedResult.pendingCount} />
                <Stat label='Needs review' value={combinedResult.flaggedCount} />
                <Stat label='Duplicate (skipped)' value={combinedResult.skippedDuplicate} />
                <Stat label='Invalid (skipped)' value={combinedResult.skippedInvalid} />
              </div>

              {combinedResult.aiSkipped ? (
                <p className='text-xs text-muted-foreground flex items-center gap-1.5 mt-1'>
                  <Sparkles className='h-3.5 w-3.5' /> AI-drafted suggestions were skipped for this import.
                </p>
              ) : (
                (combinedResult.aiSuggested > 0 ||
                  combinedResult.aiDeclined > 0 ||
                  combinedResult.aiErrors > 0 ||
                  combinedResult.aiSkippedCap > 0) && (
                  <div className='mt-1'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2'>
                      AI-drafted suggestions for flagged questions (unconfirmed — reviewed like everything else)
                    </p>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm'>
                      <Stat label='Drafted' value={combinedResult.aiSuggested} />
                      <Stat label='Model declined' value={combinedResult.aiDeclined} />
                      <Stat label='Errors' value={combinedResult.aiErrors} />
                      <Stat label='Skipped (cap)' value={combinedResult.aiSkippedCap} />
                    </div>
                  </div>
                )
              )}

              {completedResults.length > 1 && (
                <div className='mt-2 border-t border-border pt-3 flex flex-col gap-1.5'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Per source</p>
                  {completedResults.map((q) => (
                    <div key={q.id} className='flex items-center justify-between text-sm'>
                      <span className='truncate text-foreground'>{q.fileName}</span>
                      <span className='text-muted-foreground tabular-nums flex-none ml-3'>
                        {q.result!.inserted}/{q.result!.totalDetected} inserted
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {queue.some((q) => q.status === 'error') && (
                <div className='mt-2 border-t border-border pt-3 flex flex-col gap-1.5'>
                  <p className='text-xs font-semibold uppercase tracking-wide text-destructive'>Failed</p>
                  {queue
                    .filter((q) => q.status === 'error')
                    .map((q) => (
                      <div key={q.id} className='text-sm text-destructive'>
                        {q.fileName}: {q.importError}
                      </div>
                    ))}
                </div>
              )}

              <WaspRouterLink to={routes.AdminQuestionsRoute.to}>
                <Button variant='outline' className='self-start mt-1'>
                  Go review these questions
                </Button>
              </WaspRouterLink>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='flex flex-col gap-6'>
          <div className='rounded-2xl border border-border bg-card shadow-xs p-5'>
            <p className='text-sm font-medium text-foreground flex items-center gap-1.5 mb-3'>
              <Clock className='h-4 w-4 text-muted-foreground' /> Recent imports
            </p>
            {batchesLoading && <p className='text-xs text-muted-foreground'>Loading…</p>}
            {!batchesLoading && (!recentBatches || recentBatches.length === 0) && (
              <p className='text-xs text-muted-foreground'>Nothing imported yet.</p>
            )}
            <ul className='flex flex-col gap-2.5'>
              {recentBatches?.slice(0, 6).map((batch) => (
                <li key={batch.id} className='text-xs'>
                  <p className='font-medium text-foreground truncate'>{batch.fileName}</p>
                  <p className='text-muted-foreground flex items-center justify-between gap-2'>
                    <span>{batch.subjectName}</span>
                    <span className='flex-none'>{relativeTime(batch.createdAt)}</span>
                  </p>
                  <p className='text-muted-foreground flex items-center justify-between gap-2'>
                    <span>
                      {batch.totalParsed} parsed
                      {batch.remainingCount > 0 ? ` · ${batch.remainingCount} still need review` : ' · fully reviewed'}
                    </span>
                    {batch.remainingCount > 0 && (
                      <button
                        type='button'
                        onClick={() => handleRollbackBatch(batch)}
                        disabled={rollingBackBatchId === batch.id}
                        className='flex-none flex items-center gap-1 text-muted-foreground hover:text-destructive disabled:opacity-50'
                        title='Reject all not-yet-published questions from this import'
                      >
                        {rollingBackBatchId === batch.id ? (
                          <Loader2 className='h-3 w-3 animate-spin' />
                        ) : (
                          <RotateCcw className='h-3 w-3' />
                        )}
                        Roll back
                      </button>
                    )}
                  </p>
                </li>
              ))}
            </ul>
            {rollbackError && <p className='text-xs text-destructive mt-2'>{rollbackError}</p>}
            {recentBatches && recentBatches.length > 0 && (
              <WaspRouterLink to={routes.AdminQuestionsRoute.to}>
                <Button variant='ghost' size='sm' className='mt-3 w-full'>
                  View all in Review
                </Button>
              </WaspRouterLink>
            )}
          </div>

          <div className='rounded-2xl border border-border bg-muted/30 p-5 flex flex-col gap-2'>
            <p className='text-sm font-medium text-foreground flex items-center gap-1.5'>
              <ListChecks className='h-4 w-4 text-muted-foreground' /> How this works
            </p>
            <ul className='text-xs text-muted-foreground list-disc pl-4 flex flex-col gap-1'>
              <li>Nothing is guessed — a question only skips review when its answer and explanation are unambiguous.</li>
              <li>Duplicates are checked against every question ever imported, not just this batch.</li>
              <li>Everything lands as "pending" or "flagged" — publishing always happens from the Review page.</li>
            </ul>
          </div>
        </div>
      </div>
      {ConfirmDialog}
    </DefaultLayout>
  );
}

function SectionHeading({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold'>
        {step}
      </div>
      <div>
        <p className='font-medium text-foreground leading-tight'>{title}</p>
        <p className='text-xs text-muted-foreground leading-tight'>{subtitle}</p>
      </div>
    </div>
  );
}

function QueueRow({
  item,
  preview,
  onRemove,
}: {
  item: QueueItem;
  preview?: { parsed: ParsedEntry[]; flagged: ParsedEntry[] };
  onRemove: () => void;
}) {
  return (
    <li className='flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2'>
      <FileText className='h-4 w-4 flex-none text-muted-foreground' />
      <div className='min-w-0 flex-1'>
        <p className='text-sm text-foreground truncate'>{item.fileName}</p>
        <p className='text-xs text-muted-foreground'>
          {item.isExtracting && 'Extracting text…'}
          {item.extractError && <span className='text-destructive'>{item.extractError}</span>}
          {!item.isExtracting && !item.extractError && preview && (
            <>
              {preview.parsed.length + preview.flagged.length} question(s) detected · {preview.parsed.length} ready ·{' '}
              {preview.flagged.length} flagged
            </>
          )}
          {!item.isExtracting && !item.extractError && !preview && item.text && 'Parsing…'}
        </p>
      </div>
      <StatusBadge status={item.status} />
      {item.status !== 'importing' && (
        <button type='button' onClick={onRemove} className='text-muted-foreground hover:text-destructive flex-none'>
          <X className='h-4 w-4' />
        </button>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const config: Record<QueueStatus, { label: string; className: string }> = {
    pending: { label: 'Ready', className: 'bg-muted text-muted-foreground' },
    importing: { label: 'Importing…', className: 'bg-primary/10 text-primary' },
    done: { label: 'Imported', className: 'bg-secondary/10 text-secondary' },
    error: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  };
  const c = config[status];
  return (
    <span className={cn('flex-none rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', c.className)}>
      {status === 'importing' && <Loader2 className='h-3 w-3 mr-1 inline animate-spin' />}
      {c.label}
    </span>
  );
}

function PreviewAccordionItem({
  item,
  preview,
}: {
  item: QueueItem;
  preview: { parsed: ParsedEntry[]; flagged: ParsedEntry[] };
}) {
  const reasonCounts = summarizeFlagReasons(preview.flagged);
  const total = preview.parsed.length + preview.flagged.length;

  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger>
        <div className='flex items-center gap-2 flex-wrap text-left'>
          <span className='font-medium text-sm'>{item.fileName}</span>
          <span className='text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground'>{total} detected</span>
          <span className='text-xs rounded-full bg-secondary/10 px-2 py-0.5 text-secondary'>
            {preview.parsed.length} ready
          </span>
          {preview.flagged.length > 0 && (
            <span className='text-xs rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400'>
              {preview.flagged.length} flagged
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {total === 0 && (
          <p className='text-sm text-muted-foreground flex items-center gap-1.5'>
            <AlertTriangle className='h-3.5 w-3.5' /> No question blocks detected in this source.
          </p>
        )}

        {reasonCounts.length > 0 && (
          <div className='mb-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5'>
              Why questions were flagged
            </p>
            <ul className='flex flex-wrap gap-1.5'>
              {reasonCounts.map(({ reason, count }) => (
                <li key={reason} className='text-xs rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5'>
                  {reason} × {count}
                </li>
              ))}
            </ul>
          </div>
        )}

        {preview.parsed.length > 0 && (
          <div className='mb-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5'>
              Sample — ready to publish
            </p>
            <div className='flex flex-col gap-2'>
              {preview.parsed.slice(0, 2).map((entry, i) => (
                <SampleEntry key={i} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {preview.flagged.length > 0 && (
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5'>
              Sample — needs review
            </p>
            <div className='flex flex-col gap-2'>
              {preview.flagged.slice(0, 2).map((entry, i) => (
                <SampleEntry key={i} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function SampleEntry({ entry }: { entry: ParsedEntry }) {
  return (
    <div className='rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs'>
      <p className='text-foreground line-clamp-2'>{entry.stem || <span className='italic text-muted-foreground'>No stem detected</span>}</p>
      <p className='text-muted-foreground mt-1'>
        {entry.options.length} option{entry.options.length === 1 ? '' : 's'}
        {entry.correctKey ? ` · answer hint: ${entry.correctKey}` : ' · no answer hint'}
      </p>
      {entry.flagReason && <p className='text-amber-700 dark:text-amber-400 mt-0.5'>{entry.flagReason}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-xl bg-muted/60 px-3 py-2.5'>
      <p className='text-xl font-bold tracking-tight text-foreground'>{value}</p>
      <p className='text-xs text-muted-foreground'>{label}</p>
    </div>
  );
}

export default ImportQuestionsPage;
