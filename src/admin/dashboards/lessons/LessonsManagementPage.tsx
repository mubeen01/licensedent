import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  approveQuestion,
  assignQuestionToLessonPart,
  createLesson,
  createLessonPart,
  getExamsForAdmin,
  getLessonPartQuestions,
  getLessonsForAdmin,
  getQuestionsForReview,
  getSubjectsForExam,
  importQuestionsFromText,
  searchPublishedQuestionsForExam,
  unassignQuestionFromLessonPart,
  updateLesson,
  updateLessonPart,
  updateReviewQuestion,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

// Accepts whatever a real user pastes -- a full watch/share/embed URL or a
// bare 11-char id -- so the admin doesn't have to manually strip a URL down
// to the id LessonsPage's `youtube.com/embed/${youtubeId}` player needs.
// Falls back to the trimmed input as-is if nothing recognizable matches, so
// a genuinely bare id (or an unrecognized format) still saves rather than
// silently becoming empty.
function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (match) return match[1];
  }
  return trimmed;
}

type AdminLessonPart = {
  id: string;
  order: number;
  title: string;
  youtubeId: string | null;
  durationMinutes: number | null;
  notesMarkdown: string | null;
  questionCount: number;
};
type AdminLesson = {
  id: string;
  examId: string;
  examName: string;
  examFlagEmoji: string | null;
  examStandalonePackOnly: boolean;
  subjectNames: string[];
  title: string;
  order: number;
  passThresholdPercent: number;
  isActive: boolean;
  parts: AdminLessonPart[];
};
type AdminExamOption = { id: string; name: string; flagEmoji: string | null; standalonePackOnly: boolean };

function LessonsManagementPage({ user }: { user: AuthUser }) {
  const { data: lessons, isLoading, refetch } = useQuery(getLessonsForAdmin);
  const { data: exams } = useQuery(getExamsForAdmin);

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Lessons' />
      <p className='-mt-4 mb-6 text-sm text-muted-foreground'>
        Structured video + notes + gating-quiz content (PRD-002 Phase I5). A student must score at or above a
        Lesson's pass threshold on a Part's quiz before the next Part unlocks. Quiz questions are the normal Question
        bank -- only already-<strong>published</strong>, exam-matching questions can be attached to a Part.
      </p>

      <AddLessonCard exams={exams ?? []} onCreated={refetch} />

      {isLoading && <LoadingSpinner />}

      <div className='mt-4 flex flex-col gap-4'>
        {lessons?.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} onSaved={refetch} />
        ))}
      </div>
    </DefaultLayout>
  );
}

function AddLessonCard({
  exams,
  onCreated,
}: {
  exams: AdminExamOption[];
  onCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [examId, setExamId] = useState('');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState('1');
  const [passThresholdPercent, setPassThresholdPercent] = useState('70');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setExamId('');
    setTitle('');
    setOrder('1');
    setPassThresholdPercent('70');
    setError(null);
  }

  async function handleCreate() {
    if (!examId || !title.trim()) {
      setError('Exam and title are required');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createLesson({
        examId,
        title: title.trim(),
        order: parseInt(order, 10) || 1,
        passThresholdPercent: parseInt(passThresholdPercent, 10) || 70,
      });
      reset();
      setIsOpen(false);
      onCreated();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create lesson');
    } finally {
      setIsCreating(false);
    }
  }

  if (!isOpen) {
    return (
      <Button variant='outline' size='sm' className='mb-4' onClick={() => setIsOpen(true)}>
        <Plus className='h-4 w-4 mr-1.5' />
        Add lesson
      </Button>
    );
  }

  return (
    <div className='mb-4 rounded-2xl border border-primary/30 bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4'>
      <p className='font-semibold text-foreground'>New lesson</p>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div>
          <Label className='text-xs text-muted-foreground'>Exam * (which dashboard this Lesson appears on)</Label>
          <select
            className='mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={examId}
            onChange={(e) => setExamId(e.currentTarget.value)}
          >
            <option value=''>Select exam…</option>
            <optgroup label='Standalone (own dashboard, e.g. Ireland)'>
              {exams
                .filter((e) => e.standalonePackOnly)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.flagEmoji ?? ''} {e.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label='Gulf (shared, all-exams dashboard)'>
              {exams
                .filter((e) => !e.standalonePackOnly)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.flagEmoji ?? ''} {e.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Title *</Label>
          <Input
            className='mt-1'
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder='e.g. Endodontics: Pulp Diagnosis'
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Order</Label>
          <Input className='mt-1' type='number' min={1} value={order} onChange={(e) => setOrder(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Pass threshold %</Label>
          <Input
            className='mt-1'
            type='number'
            min={1}
            max={100}
            value={passThresholdPercent}
            onChange={(e) => setPassThresholdPercent(e.currentTarget.value)}
          />
        </div>
      </div>
      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        <div className='ml-auto flex gap-2'>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => {
              reset();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button size='sm' disabled={isCreating} onClick={handleCreate}>
            {isCreating ? 'Creating…' : 'Create lesson'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LessonCard({ lesson, onSaved }: { lesson: AdminLesson; onSaved: () => void }) {
  const [title, setTitle] = useState(lesson.title);
  const [order, setOrder] = useState(String(lesson.order));
  const [passThresholdPercent, setPassThresholdPercent] = useState(String(lesson.passThresholdPercent));
  const [isActive, setIsActive] = useState(lesson.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);

  const isDirty =
    title !== lesson.title ||
    order !== String(lesson.order) ||
    passThresholdPercent !== String(lesson.passThresholdPercent) ||
    isActive !== lesson.isActive;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateLesson({
        id: lesson.id,
        title,
        order: parseInt(order, 10) || 1,
        passThresholdPercent: parseInt(passThresholdPercent, 10) || 70,
        isActive,
      });
      setJustSaved(true);
      onSaved();
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='rounded-2xl border border-border bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <span className='flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 shadow-xs'>
            <BookOpen className='h-5 w-5 text-muted-foreground' />
          </span>
          <div>
            <p className='font-bold text-foreground'>{lesson.title}</p>
            <div className='mt-1 flex flex-wrap items-center gap-1.5'>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                  lesson.examStandalonePackOnly
                    ? 'bg-secondary/15 text-secondary-foreground dark:text-secondary'
                    : 'bg-primary/15 text-primary'
                )}
              >
                {lesson.examFlagEmoji} {lesson.examName}
                {lesson.examStandalonePackOnly ? ' · own dashboard' : ' · Gulf dashboard'}
              </span>
              {lesson.subjectNames.map((name) => (
                <span key={name} className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                  {name}
                </span>
              ))}
              <span className='text-xs text-muted-foreground'>
                · {lesson.parts.length} part{lesson.parts.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Label htmlFor={`active-${lesson.id}`} className='text-sm text-muted-foreground'>
            Active
          </Label>
          <Switch id={`active-${lesson.id}`} checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div>
          <Label className='text-xs text-muted-foreground'>Title</Label>
          <Input className='mt-1' value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Order</Label>
          <Input className='mt-1' type='number' min={1} value={order} onChange={(e) => setOrder(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Pass threshold %</Label>
          <Input
            className='mt-1'
            type='number'
            min={1}
            max={100}
            value={passThresholdPercent}
            onChange={(e) => setPassThresholdPercent(e.currentTarget.value)}
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-4 pb-2 border-b border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        {justSaved && !error && (
          <p className='flex items-center gap-1.5 text-xs font-medium text-success'>
            <CheckCircle2 className='h-3.5 w-3.5' /> Saved
          </p>
        )}
        <div className='ml-auto'>
          <Button size='sm' disabled={isSaving || !isDirty} onClick={handleSave}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        {lesson.parts.map((part) => (
          <PartRow key={part.id} part={part} examId={lesson.examId} onSaved={onSaved} />
        ))}

        {showAddPart ? (
          <AddPartForm
            lessonId={lesson.id}
            nextOrder={lesson.parts.length + 1}
            onDone={() => {
              setShowAddPart(false);
              onSaved();
            }}
            onCancel={() => setShowAddPart(false)}
          />
        ) : (
          <Button variant='outline' size='sm' className='self-start' onClick={() => setShowAddPart(true)}>
            <Plus className='h-4 w-4 mr-1.5' />
            Add part
          </Button>
        )}
      </div>
    </div>
  );
}

function AddPartForm({
  lessonId,
  nextOrder,
  onDone,
  onCancel,
}: {
  lessonId: string;
  nextOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(String(nextOrder));
  const [youtubeId, setYoutubeId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notesMarkdown, setNotesMarkdown] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createLessonPart({
        lessonId,
        title: title.trim(),
        order: parseInt(order, 10) || nextOrder,
        youtubeId: youtubeId.trim() ? extractYoutubeId(youtubeId) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        notesMarkdown: notesMarkdown.trim() || null,
      });
      onDone();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create part');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className='rounded-xl border border-dashed border-primary/40 bg-muted/30 p-4 flex flex-col gap-3'>
      <p className='text-sm font-semibold text-foreground'>New part</p>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div>
          <Label className='text-xs text-muted-foreground'>Title *</Label>
          <Input className='mt-1' value={title} onChange={(e) => setTitle(e.currentTarget.value)} placeholder='Part 1' />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Order</Label>
          <Input className='mt-1' type='number' min={1} value={order} onChange={(e) => setOrder(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Duration (min)</Label>
          <Input
            className='mt-1'
            type='number'
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.currentTarget.value)}
          />
        </div>
      </div>
      <div>
        <Label className='text-xs text-muted-foreground'>YouTube link or ID (leave blank -- "coming soon")</Label>
        <Input
          className='mt-1'
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.currentTarget.value)}
          placeholder='https://youtu.be/dQw4w9WgXcQ or dQw4w9WgXcQ'
        />
      </div>
      <div>
        <Label className='text-xs text-muted-foreground'>Notes (markdown)</Label>
        <Textarea className='mt-1' rows={4} value={notesMarkdown} onChange={(e) => setNotesMarkdown(e.currentTarget.value)} />
      </div>
      <div className='flex items-center justify-between gap-4 pt-2 border-t border-border'>
        {error && <p className='text-xs text-destructive'>{error}</p>}
        <div className='ml-auto flex gap-2'>
          <Button size='sm' variant='ghost' onClick={onCancel}>
            Cancel
          </Button>
          <Button size='sm' disabled={isCreating} onClick={handleCreate}>
            {isCreating ? 'Creating…' : 'Create part'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PartRow({ part, examId, onSaved }: { part: AdminLessonPart; examId: string; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(part.title);
  const [order, setOrder] = useState(String(part.order));
  const [youtubeId, setYoutubeId] = useState(part.youtubeId ?? '');
  const [durationMinutes, setDurationMinutes] = useState(part.durationMinutes ? String(part.durationMinutes) : '');
  const [notesMarkdown, setNotesMarkdown] = useState(part.notesMarkdown ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    title !== part.title ||
    order !== String(part.order) ||
    youtubeId !== (part.youtubeId ?? '') ||
    durationMinutes !== (part.durationMinutes ? String(part.durationMinutes) : '') ||
    notesMarkdown !== (part.notesMarkdown ?? '');

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateLessonPart({
        id: part.id,
        title,
        order: parseInt(order, 10) || part.order,
        youtubeId: youtubeId.trim() ? extractYoutubeId(youtubeId) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        notesMarkdown: notesMarkdown.trim() || null,
      });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='rounded-xl border border-border bg-background/60 p-4 flex flex-col gap-3'>
      <button
        className='flex items-center justify-between gap-3 text-left'
        onClick={() => setExpanded((v) => !v)}
      >
        <div className='flex items-center gap-2'>
          <span className='rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
            Part {part.order}
          </span>
          <span className='font-semibold text-foreground'>{part.title}</span>
          <span className='text-xs text-muted-foreground'>
            {part.questionCount} question{part.questionCount === 1 ? '' : 's'} · {part.youtubeId ? 'video set' : 'coming soon'}
          </span>
        </div>
        {expanded ? <ChevronUp className='h-4 w-4 text-muted-foreground' /> : <ChevronDown className='h-4 w-4 text-muted-foreground' />}
      </button>

      {expanded && (
        <div className='flex flex-col gap-4 pt-2 border-t border-border'>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div>
              <Label className='text-xs text-muted-foreground'>Title</Label>
              <Input className='mt-1' value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Order</Label>
              <Input className='mt-1' type='number' min={1} value={order} onChange={(e) => setOrder(e.currentTarget.value)} />
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Duration (min)</Label>
              <Input
                className='mt-1'
                type='number'
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.currentTarget.value)}
              />
            </div>
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>YouTube link or ID</Label>
            <Input
              className='mt-1'
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.currentTarget.value)}
              placeholder='https://youtu.be/dQw4w9WgXcQ or dQw4w9WgXcQ'
            />
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>Notes (markdown)</Label>
            <Textarea className='mt-1' rows={5} value={notesMarkdown} onChange={(e) => setNotesMarkdown(e.currentTarget.value)} />
          </div>
          <div className='flex items-center justify-between gap-4'>
            {error && <p className='text-xs text-destructive'>{error}</p>}
            <div className='ml-auto'>
              <Button size='sm' disabled={isSaving || !isDirty} onClick={handleSave}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          <QuestionAssignmentPanel lessonPartId={part.id} examId={examId} onChanged={onSaved} />
        </div>
      )}
    </div>
  );
}

function QuestionAssignmentPanel({
  lessonPartId,
  examId,
  onChanged,
}: {
  lessonPartId: string;
  examId: string;
  onChanged: () => void;
}) {
  const { data: assigned, refetch: refetchAssigned } = useQuery(getLessonPartQuestions, { lessonPartId });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ id: string; stem: string; subjectName: string }[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setIsSearching(true);
    setError(null);
    try {
      const found = await searchPublishedQuestionsForExam({ examId, query: search, limit: 20 });
      setResults(found);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAssign(questionId: string) {
    setError(null);
    try {
      await assignQuestionToLessonPart({ lessonPartId, questionId });
      refetchAssigned();
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to assign');
    }
  }

  async function handleUnassign(questionId: string) {
    setError(null);
    try {
      await unassignQuestionFromLessonPart({ lessonPartId, questionId });
      refetchAssigned();
      onChanged();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove');
    }
  }

  const assignedIds = new Set((assigned ?? []).map((q) => q.id));

  return (
    <div className='rounded-lg bg-muted/40 p-3 flex flex-col gap-3'>
      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Assigned questions</p>
      <div className='flex flex-col gap-1.5'>
        {(assigned ?? []).length === 0 && <p className='text-xs text-muted-foreground'>None yet.</p>}
        {(assigned ?? []).map((q) => (
          <div key={q.id} className='flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm'>
            <span className='truncate'>
              <span className='text-xs text-muted-foreground mr-2'>[{q.subjectName}]</span>
              {q.stem}
            </span>
            <button onClick={() => handleUnassign(q.id)} className='shrink-0 text-muted-foreground hover:text-destructive'>
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          </div>
        ))}
      </div>

      <div className='flex items-center gap-2 pt-2 border-t border-border'>
        <Input
          placeholder='Search published questions for this exam…'
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className='h-8 text-sm'
        />
        <Button size='sm' variant='outline' disabled={isSearching} onClick={handleSearch}>
          <Search className='h-3.5 w-3.5' />
        </Button>
      </div>

      {error && <p className='text-xs text-destructive'>{error}</p>}

      {results && (
        <div className='flex flex-col gap-1.5 max-h-56 overflow-y-auto'>
          {results.length === 0 && <p className='text-xs text-muted-foreground'>No matches.</p>}
          {results.map((q) => (
            <div key={q.id} className='flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm'>
              <span className='truncate'>
                <span className='text-xs text-muted-foreground mr-2'>[{q.subjectName}]</span>
                {q.stem}
              </span>
              {assignedIds.has(q.id) ? (
                <span className='shrink-0 text-xs text-muted-foreground'>Added</span>
              ) : (
                <Button size='sm' variant='ghost' className='h-7 shrink-0' onClick={() => handleAssign(q.id)}>
                  <Plus className='h-3.5 w-3.5' />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <QuickAddMcqsForm
        examId={examId}
        lessonPartId={lessonPartId}
        onAdded={() => {
          refetchAssigned();
          onChanged();
        }}
      />
    </div>
  );
}

const MCQ_PASTE_PLACEHOLDER = `1- 22-year-old, short cold 3 sec, no night pain. Best plan?
A. Root canal treatment immediately
B. Adjust occlusion, desensitise, review**
C. Extraction
D. No treatment
* Short, non-lingering cold with no percussion pain is reversible pulpitis -- manage conservatively and review.

2- Next question...
A. ...
B. ...**
C. ...
D. ...
* Explanation.`;

// Lets an admin paste new MCQs (same plain-text format as the Import
// Questions page) and get them imported, reviewed (difficulty set),
// approved, and assigned to THIS Part in one step -- previously the only
// path was Import Questions -> manual review queue -> come back here and
// search for it, which is fine for a big/mixed batch but heavy friction for
// "add a few more questions to this one Part." Cleanly-parsed questions
// (no flagReason) are auto-approved with the chosen difficulty; anything
// the parser flags is left in the normal review queue, not silently
// dropped -- this is still real human-in-the-loop review, just fast-pathed
// for the common case where the pasted text already parses perfectly.
function QuickAddMcqsForm({
  examId,
  lessonPartId,
  onAdded,
}: {
  examId: string;
  lessonPartId: string;
  onAdded: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: subjects } = useQuery(getSubjectsForExam, { examId }, { enabled: isOpen });
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ added: number; flagged: number; duplicates: number } | null>(null);

  async function handleSubmit() {
    if (!subjectId || !text.trim()) {
      setError('Pick a subject and paste at least one MCQ');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSummary(null);
    try {
      const result = await importQuestionsFromText({
        examId,
        subjectMode: 'single',
        subjectId,
        fileName: 'Quick add via Lessons page',
        text,
        skipAiSuggestions: true,
      });

      const created = await getQuestionsForReview({
        importBatchId: result.batchId,
        status: 'unreviewed',
        needsTagging: false,
        missingAiDraft: false,
        sortBy: 'oldest',
        skip: 0,
        take: 100,
      });
      const clean = created.filter((q) => q.status === 'pending');

      for (const q of clean) {
        await updateReviewQuestion({ id: q.id, difficulty });
        await approveQuestion({ id: q.id });
        await assignQuestionToLessonPart({ lessonPartId, questionId: q.id });
      }

      setSummary({ added: clean.length, flagged: result.flaggedCount, duplicates: result.skippedDuplicate });
      setText('');
      onAdded();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add questions');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <Button size='sm' variant='outline' className='self-start' onClick={() => setIsOpen(true)}>
        <Plus className='h-3.5 w-3.5 mr-1.5' />
        Add new MCQs
      </Button>
    );
  }

  return (
    <div className='rounded-lg border border-dashed border-primary/40 bg-background p-3 flex flex-col gap-2.5'>
      <p className='text-xs font-semibold text-foreground'>
        Paste new MCQs (same format as Import Questions: mark the correct option with{' '}
        <code className='font-mono'>**</code>, explanation on a <code className='font-mono'>*</code> line)
      </p>
      <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Subject *</Label>
          <select
            className='mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={subjectId}
            onChange={(e) => setSubjectId(e.currentTarget.value)}
          >
            <option value=''>Select subject…</option>
            {(subjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Difficulty</Label>
          <select
            className='mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={difficulty}
            onChange={(e) => setDifficulty(e.currentTarget.value as 'easy' | 'medium' | 'hard')}
          >
            <option value='easy'>Easy</option>
            <option value='medium'>Medium</option>
            <option value='hard'>Hard</option>
          </select>
        </div>
      </div>
      <Textarea
        className='font-mono text-xs'
        rows={8}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder={MCQ_PASTE_PLACEHOLDER}
      />
      {error && <p className='text-xs text-destructive'>{error}</p>}
      {summary && (
        <p className='text-xs text-muted-foreground'>
          Added + assigned {summary.added}.
          {summary.flagged > 0 && ` ${summary.flagged} didn't parse cleanly -- review them in Import Questions.`}
          {summary.duplicates > 0 && ` ${summary.duplicates} skipped as likely duplicates.`}
        </p>
      )}
      <div className='flex items-center justify-between gap-4 pt-1'>
        <Button
          size='sm'
          variant='ghost'
          onClick={() => {
            setIsOpen(false);
            setText('');
            setError(null);
            setSummary(null);
          }}
        >
          Close
        </Button>
        <Button size='sm' disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? 'Adding…' : 'Add + assign to this Part'}
        </Button>
      </div>
    </div>
  );
}

export default LessonsManagementPage;
