import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  assignQuestionToLessonPart,
  createLesson,
  createLessonPart,
  getExamsForAdmin,
  getLessonPartQuestions,
  getLessonsForAdmin,
  searchPublishedQuestionsForExam,
  unassignQuestionFromLessonPart,
  updateLesson,
  updateLessonPart,
  useQuery,
} from 'wasp/client/operations';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

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
  title: string;
  order: number;
  passThresholdPercent: number;
  isActive: boolean;
  parts: AdminLessonPart[];
};

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
  exams: { id: string; name: string }[];
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
          <Label className='text-xs text-muted-foreground'>Exam *</Label>
          <select
            className='mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={examId}
            onChange={(e) => setExamId(e.currentTarget.value)}
          >
            <option value=''>Select exam…</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
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
            <p className='text-xs text-muted-foreground'>
              {lesson.examName} · {lesson.parts.length} part{lesson.parts.length === 1 ? '' : 's'}
            </p>
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
        youtubeId: youtubeId.trim() || null,
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
        <Label className='text-xs text-muted-foreground'>YouTube ID (leave blank -- "coming soon")</Label>
        <Input className='mt-1' value={youtubeId} onChange={(e) => setYoutubeId(e.currentTarget.value)} placeholder='dQw4w9WgXcQ' />
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
        youtubeId: youtubeId.trim() || null,
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
            <Label className='text-xs text-muted-foreground'>YouTube ID</Label>
            <Input className='mt-1' value={youtubeId} onChange={(e) => setYoutubeId(e.currentTarget.value)} placeholder='dQw4w9WgXcQ' />
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
    </div>
  );
}

export default LessonsManagementPage;
