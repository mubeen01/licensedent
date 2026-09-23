import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { type AuthUser } from 'wasp/auth';
import {
  approveQuestion,
  assignQuestionToLessonPart,
  createLesson,
  createLessonPart,
  createSubjectForExam,
  deleteLesson,
  deleteLessonPart,
  getExamsForAdmin,
  getLessonPartQuestions,
  getLessonsForAdmin,
  getQuestionsForReview,
  getSubjectsForExam,
  importQuestionsFromText,
  reorderLesson,
  reorderLessonPart,
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
import { useConfirm } from '../questions/ConfirmDialog';
import { ExamFlag } from '../../../client/components/ExamFlag';

// Accepts whatever a real user pastes -- YouTube's own <iframe> embed-code
// snippet (Share -> Embed), a plain watch/share/embed URL, or a bare 11-char
// id -- so the admin can paste straight from YouTube without hand-editing it
// down to the id LessonsPage's `youtube.com/embed/${youtubeId}` player needs.
// The embed-code snippet's `src="https://www.youtube.com/embed/ID?..."` (or
// the privacy-enhanced `youtube-nocookie.com` domain YouTube sometimes uses)
// matches the same "youtube...com/embed/" pattern as a plain embed link, so
// one pattern list covers both. Falls back to the trimmed input as-is if
// nothing recognizable matches, so a genuinely bare id (or an unrecognized
// format) still saves rather than silently becoming empty.
function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/watch\?(?:.*&)?v=|youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (match) return match[1];
  }
  return trimmed;
}

type ConfirmFn = (options: {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
}) => Promise<boolean>;

type AdminLessonPart = {
  id: string;
  order: number;
  title: string;
  youtubeId: string | null;
  durationMinutes: number | null;
  notesMarkdown: string | null;
  sourceBook: string | null;
  sourcePages: string | null;
  questionCount: number;
};
type AdminLesson = {
  id: string;
  examId: string;
  examName: string;
  examFlagEmoji: string | null;
  examStandalonePackOnly: boolean;
  subjectId: string | null;
  subjectName: string | null;
  questionSubjectNames: string[];
  title: string;
  order: number;
  passThresholdPercent: number;
  isActive: boolean;
  parts: AdminLessonPart[];
};
type AdminSubjectOption = { id: string; name: string; isActive: boolean; examId: string };

function LessonsManagementPage({ user }: { user: AuthUser }) {
  const { data: lessons, isLoading, refetch } = useQuery(getLessonsForAdmin);
  const { data: exams } = useQuery(getExamsForAdmin);
  const { confirm, ConfirmDialog } = useConfirm();

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>('all');

  const lessonCountByExam = useMemo(() => {
    const counts = new Map<string, number>();
    (lessons ?? []).forEach((l) => counts.set(l.examId, (counts.get(l.examId) ?? 0) + 1));
    return counts;
  }, [lessons]);

  // Default to whichever exam already has the most Lessons (today, Ireland)
  // rather than always the alphabetically-first exam -- that's almost always
  // where an admin lands here wanting to work.
  useEffect(() => {
    if (selectedExamId || !exams || exams.length === 0) return;
    if (lessons && lessons.length > 0) {
      const top = [...lessonCountByExam.entries()].sort((a, b) => b[1] - a[1])[0];
      setSelectedExamId(top[0]);
    } else {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, lessons, lessonCountByExam, selectedExamId]);

  const { data: subjects, refetch: refetchSubjects } = useQuery(
    getSubjectsForExam,
    { examId: selectedExamId },
    { enabled: !!selectedExamId }
  );

  const examLessons = useMemo(
    () => (lessons ?? []).filter((l) => l.examId === selectedExamId).sort((a, b) => a.order - b.order),
    [lessons, selectedExamId]
  );

  const subjectTabs = useMemo(() => {
    const tabs: { key: string; label: string; count: number }[] = [
      { key: 'all', label: 'All lessons', count: examLessons.length },
    ];
    (subjects ?? []).forEach((s) => {
      tabs.push({ key: s.id, label: s.name, count: examLessons.filter((l) => l.subjectId === s.id).length });
    });
    const unassignedCount = examLessons.filter((l) => !l.subjectId).length;
    if (unassignedCount > 0) {
      tabs.push({ key: 'unassigned', label: 'Unassigned', count: unassignedCount });
    }
    return tabs;
  }, [subjects, examLessons]);

  const visibleLessons = examLessons.filter((l) => {
    if (selectedSubjectTab === 'all') return true;
    if (selectedSubjectTab === 'unassigned') return !l.subjectId;
    return l.subjectId === selectedSubjectTab;
  });

  const currentSubjectFilter =
    selectedSubjectTab !== 'all' && selectedSubjectTab !== 'unassigned' ? selectedSubjectTab : null;

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Lessons' />
      <p className='-mt-4 mb-6 text-sm text-muted-foreground'>
        Structured video + notes + gating-quiz content (PRD-002 Phase I5). A student must score at or above a
        Lesson's pass threshold on a Part's quiz before the next Part unlocks. Quiz questions are the normal Question
        bank -- only already-<strong>published</strong>, exam-matching questions can be attached to a Part. Lessons
        are organized by Subject below -- add a Subject first (e.g. Endodontics), then add Lessons under it.
      </p>

      {exams && exams.length > 0 && (
        <div className='mb-4 flex flex-wrap gap-2'>
          {exams.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setSelectedExamId(e.id);
                setSelectedSubjectTab('all');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                selectedExamId === e.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <ExamFlag emoji={e.flagEmoji} /> {e.name}
              <span className={cn('rounded-full px-1.5 text-xs', selectedExamId === e.id ? 'bg-primary/15' : 'bg-muted')}>
                {lessonCountByExam.get(e.id) ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedExamId && (
        <>
          <SubjectTabsRow
            key={`tabs-${selectedExamId}`}
            examId={selectedExamId}
            tabs={subjectTabs}
            selected={selectedSubjectTab}
            onSelect={setSelectedSubjectTab}
            onSubjectCreated={refetchSubjects}
          />

          <AddLessonCard
            key={`add-${selectedExamId}`}
            examId={selectedExamId}
            subjects={subjects ?? []}
            defaultSubjectId={currentSubjectFilter}
            onCreated={refetch}
            onSubjectCreated={refetchSubjects}
          />

          {isLoading && <LoadingSpinner />}

          <div className='mt-4 flex flex-col gap-4'>
            {visibleLessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                subjects={subjects ?? []}
                onSaved={refetch}
                confirm={confirm}
                prevId={index > 0 ? visibleLessons[index - 1].id : null}
                nextId={index < visibleLessons.length - 1 ? visibleLessons[index + 1].id : null}
              />
            ))}
            {!isLoading && visibleLessons.length === 0 && (
              <p className='rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
                No lessons yet {currentSubjectFilter ? 'for this subject' : 'for this exam'}. Use "Add lesson" above
                to create the first one.
              </p>
            )}
          </div>
        </>
      )}
      {ConfirmDialog}
    </DefaultLayout>
  );
}

function SubjectTabsRow({
  examId,
  tabs,
  selected,
  onSelect,
  onSubjectCreated,
}: {
  examId: string;
  tabs: { key: string; label: string; count: number }[];
  selected: string;
  onSelect: (key: string) => void;
  onSubjectCreated: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const created = await createSubjectForExam({ examId, name: name.trim() });
      setName('');
      setIsAdding(false);
      onSubjectCreated();
      onSelect(created.id);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create subject');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className='mb-4 flex flex-col gap-2 border-b border-border pb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selected === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {t.label}
            <span
              className={cn('rounded-full px-1.5 text-xs', selected === t.key ? 'bg-primary-foreground/20' : 'bg-background/60')}
            >
              {t.count}
            </span>
          </button>
        ))}

        {isAdding ? (
          <div className='flex items-center gap-1.5'>
            <Input
              autoFocus
              className='h-8 w-48 text-sm'
              placeholder='New subject name'
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button size='sm' className='h-8' disabled={isCreating} onClick={handleCreate}>
              {isCreating ? '…' : 'Add'}
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='h-8'
              onClick={() => {
                setIsAdding(false);
                setName('');
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button size='sm' variant='outline' className='h-8 rounded-full' onClick={() => setIsAdding(true)}>
            <Plus className='h-3.5 w-3.5 mr-1' />
            Add subject
          </Button>
        )}
      </div>
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
}

function AddLessonCard({
  examId,
  subjects,
  defaultSubjectId,
  onCreated,
  onSubjectCreated,
}: {
  examId: string;
  subjects: AdminSubjectOption[];
  defaultSubjectId: string | null;
  onCreated: () => void;
  onSubjectCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? '');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState('1');
  const [passThresholdPercent, setPassThresholdPercent] = useState('70');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);

  function reset() {
    setSubjectId(defaultSubjectId ?? '');
    setTitle('');
    setOrder('1');
    setPassThresholdPercent('70');
    setError(null);
    setIsAddingSubject(false);
    setNewSubjectName('');
  }

  async function handleCreateSubject() {
    if (!newSubjectName.trim()) return;
    setIsCreatingSubject(true);
    setError(null);
    try {
      const created = await createSubjectForExam({ examId, name: newSubjectName.trim() });
      onSubjectCreated();
      setSubjectId(created.id);
      setNewSubjectName('');
      setIsAddingSubject(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create subject');
    } finally {
      setIsCreatingSubject(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createLesson({
        examId,
        subjectId: subjectId || null,
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
          <Label className='text-xs text-muted-foreground'>Subject (for organizing this page)</Label>
          {isAddingSubject ? (
            <div className='mt-1 flex items-center gap-1.5'>
              <Input
                autoFocus
                className='h-9 text-sm'
                placeholder='New subject name'
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSubject()}
              />
              <Button size='sm' className='h-9' disabled={isCreatingSubject} onClick={handleCreateSubject}>
                {isCreatingSubject ? '…' : 'Add'}
              </Button>
            </div>
          ) : (
            <select
              className='mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={subjectId}
              onChange={(e) => {
                if (e.currentTarget.value === '__new__') {
                  setIsAddingSubject(true);
                } else {
                  setSubjectId(e.currentTarget.value);
                }
              }}
            >
              <option value=''>No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value='__new__'>+ New subject…</option>
            </select>
          )}
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

function LessonCard({
  lesson,
  subjects,
  onSaved,
  confirm,
  prevId,
  nextId,
}: {
  lesson: AdminLesson;
  subjects: AdminSubjectOption[];
  onSaved: () => void;
  confirm: ConfirmFn;
  prevId: string | null;
  nextId: string | null;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [order, setOrder] = useState(String(lesson.order));
  const [subjectId, setSubjectId] = useState(lesson.subjectId ?? '');
  const [passThresholdPercent, setPassThresholdPercent] = useState(String(lesson.passThresholdPercent));
  const [isActive, setIsActive] = useState(lesson.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);

  // Swaps `order` with the given neighbor lesson -- the neighbor is whichever
  // lesson sits next to this one in the currently visible (subject-filtered)
  // list, not necessarily adjacent in the exam's raw order sequence.
  async function handleReorder(otherId: string | null) {
    if (!otherId) return;
    setIsReordering(true);
    setError(null);
    try {
      await reorderLesson({ id: lesson.id, otherId });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to reorder');
    } finally {
      setIsReordering(false);
    }
  }

  const isDirty =
    title !== lesson.title ||
    order !== String(lesson.order) ||
    subjectId !== (lesson.subjectId ?? '') ||
    passThresholdPercent !== String(lesson.passThresholdPercent) ||
    isActive !== lesson.isActive;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await updateLesson({
        id: lesson.id,
        title,
        subjectId: subjectId || null,
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

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${lesson.title}"?`,
      description: `This permanently deletes the lesson, all ${lesson.parts.length} of its part${
        lesson.parts.length === 1 ? '' : 's'
      } (notes + video links), and any student quiz attempts on them. Assigned questions stay in the question bank. This cannot be undone.`,
      confirmLabel: 'Delete lesson',
      variant: 'destructive',
    });
    if (!ok) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteLesson({ id: lesson.id });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete lesson');
      setIsDeleting(false);
    }
  }

  // Extra Subject(s) the Lesson's assigned questions are actually tagged
  // with, beyond its declared Subject -- a QA signal (mistagged question, or
  // a Lesson still missing its Subject) rather than something to act on here.
  const mismatchedSubjectNames = lesson.questionSubjectNames.filter((n) => n !== lesson.subjectName);

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card shadow-xs p-5 md:p-6 flex flex-col gap-4',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
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
              {lesson.subjectName ? (
                <span className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground'>
                  {lesson.subjectName}
                </span>
              ) : (
                <span className='inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400'>
                  No subject set
                </span>
              )}
              {mismatchedSubjectNames.map((name) => (
                <span
                  key={name}
                  title="This Lesson's questions are tagged to a different subject than the one set above"
                  className='inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400'
                >
                  questions: {name}
                </span>
              ))}
              <span className='text-xs text-muted-foreground'>
                · {lesson.parts.length} part{lesson.parts.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1'>
            <Button
              size='sm'
              variant='ghost'
              className='h-8 w-8 p-0 text-muted-foreground'
              disabled={isReordering || !prevId}
              onClick={() => handleReorder(prevId)}
              title='Move up'
            >
              <ArrowUp className='h-4 w-4' />
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='h-8 w-8 p-0 text-muted-foreground'
              disabled={isReordering || !nextId}
              onClick={() => handleReorder(nextId)}
              title='Move down'
            >
              <ArrowDown className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <Label htmlFor={`active-${lesson.id}`} className='text-sm text-muted-foreground'>
              Active
            </Label>
            <Switch id={`active-${lesson.id}`} checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button
            size='sm'
            variant='ghost'
            className='text-muted-foreground hover:text-destructive'
            disabled={isDeleting}
            onClick={handleDelete}
            title='Delete lesson'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div>
          <Label className='text-xs text-muted-foreground'>Title</Label>
          <Input className='mt-1' value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Subject</Label>
          <select
            className='mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={subjectId}
            onChange={(e) => setSubjectId(e.currentTarget.value)}
          >
            <option value=''>No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
        {lesson.parts.map((part, index) => (
          <PartRow
            key={part.id}
            part={part}
            examId={lesson.examId}
            onSaved={onSaved}
            confirm={confirm}
            prevId={index > 0 ? lesson.parts[index - 1].id : null}
            nextId={index < lesson.parts.length - 1 ? lesson.parts[index + 1].id : null}
          />
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
  const [sourceBook, setSourceBook] = useState('');
  const [sourcePages, setSourcePages] = useState('');
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
        sourceBook: sourceBook.trim() || null,
        sourcePages: sourcePages.trim() || null,
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
        <Label className='text-xs text-muted-foreground'>
          YouTube embed code (leave blank -- "coming soon")
        </Label>
        <Textarea
          className='mt-1 font-mono text-xs'
          rows={2}
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.currentTarget.value)}
          placeholder='Paste the <iframe> code from YouTube&apos;s Share -&gt; Embed button (a plain link or bare id also works)'
        />
      </div>
      <div>
        <Label className='text-xs text-muted-foreground'>Notes (markdown)</Label>
        <Textarea className='mt-1' rows={4} value={notesMarkdown} onChange={(e) => setNotesMarkdown(e.currentTarget.value)} />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Source book (provenance)</Label>
          <Input
            className='mt-1'
            value={sourceBook}
            onChange={(e) => setSourceBook(e.currentTarget.value)}
            placeholder="Harty's Endodontics 7th ed"
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Source pages</Label>
          <Input className='mt-1' value={sourcePages} onChange={(e) => setSourcePages(e.currentTarget.value)} placeholder='112-130' />
        </div>
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

function PartRow({
  part,
  examId,
  onSaved,
  confirm,
  prevId,
  nextId,
}: {
  part: AdminLessonPart;
  examId: string;
  onSaved: () => void;
  confirm: ConfirmFn;
  prevId: string | null;
  nextId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [title, setTitle] = useState(part.title);
  const [order, setOrder] = useState(String(part.order));
  const [youtubeId, setYoutubeId] = useState(part.youtubeId ?? '');
  const [durationMinutes, setDurationMinutes] = useState(part.durationMinutes ? String(part.durationMinutes) : '');
  const [notesMarkdown, setNotesMarkdown] = useState(part.notesMarkdown ?? '');
  const [sourceBook, setSourceBook] = useState(part.sourceBook ?? '');
  const [sourcePages, setSourcePages] = useState(part.sourcePages ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReorder(otherId: string | null) {
    if (!otherId) return;
    setIsReordering(true);
    setError(null);
    try {
      await reorderLessonPart({ id: part.id, otherId });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to reorder');
    } finally {
      setIsReordering(false);
    }
  }

  const isDirty =
    title !== part.title ||
    order !== String(part.order) ||
    youtubeId !== (part.youtubeId ?? '') ||
    durationMinutes !== (part.durationMinutes ? String(part.durationMinutes) : '') ||
    notesMarkdown !== (part.notesMarkdown ?? '') ||
    sourceBook !== (part.sourceBook ?? '') ||
    sourcePages !== (part.sourcePages ?? '');

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
        sourceBook: sourceBook.trim() || null,
        sourcePages: sourcePages.trim() || null,
      });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${part.title}"?`,
      description: `This permanently deletes this part and its ${part.questionCount} assigned question link${
        part.questionCount === 1 ? '' : 's'
      } (the questions themselves stay in the question bank). Any student quiz attempts on this part are also deleted. This cannot be undone.`,
      confirmLabel: 'Delete part',
      variant: 'destructive',
    });
    if (!ok) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteLessonPart({ id: part.id });
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete part');
      setIsDeleting(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background/60 p-4 flex flex-col gap-3',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <button className='flex flex-1 items-center gap-2 text-left' onClick={() => setExpanded((v) => !v)}>
          <span className='rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
            Part {part.order}
          </span>
          <span className='font-semibold text-foreground'>{part.title}</span>
          <span className='text-xs text-muted-foreground'>
            {part.questionCount} question{part.questionCount === 1 ? '' : 's'} · {part.youtubeId ? 'video set' : 'coming soon'}
          </span>
        </button>
        <div className='flex shrink-0 items-center gap-0.5'>
          <button
            className='p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
            disabled={isReordering || !prevId}
            onClick={() => handleReorder(prevId)}
            title='Move up'
          >
            <ArrowUp className='h-3.5 w-3.5' />
          </button>
          <button
            className='p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
            disabled={isReordering || !nextId}
            onClick={() => handleReorder(nextId)}
            title='Move down'
          >
            <ArrowDown className='h-3.5 w-3.5' />
          </button>
        </div>
        <button
          className={cn('shrink-0 text-muted-foreground hover:text-foreground', previewing && 'text-primary')}
          onClick={() => setPreviewing((v) => !v)}
          title='Preview what students see'
        >
          <Eye className='h-4 w-4' />
        </button>
        <button
          className='shrink-0 text-muted-foreground hover:text-destructive'
          disabled={isDeleting}
          onClick={handleDelete}
          title='Delete part'
        >
          <Trash2 className='h-4 w-4' />
        </button>
        <button onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp className='h-4 w-4 text-muted-foreground' /> : <ChevronDown className='h-4 w-4 text-muted-foreground' />}
        </button>
      </div>

      {previewing && (
        <div className='flex flex-col gap-3 rounded-lg border border-dashed border-primary/40 bg-muted/30 p-3'>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Student preview -- exactly what /lessons renders for this part
          </p>
          {part.youtubeId ? (
            <div className='aspect-video w-full overflow-hidden rounded-lg bg-black'>
              <iframe
                className='h-full w-full'
                src={`https://www.youtube.com/embed/${part.youtubeId}`}
                title={part.title}
                allowFullScreen
              />
            </div>
          ) : (
            <div className='flex h-32 items-center justify-center rounded-lg bg-linear-to-br from-primary/80 to-secondary/80 text-white'>
              <span className='rounded-full bg-black/30 px-3 py-1 text-xs font-semibold'>Video coming soon</span>
            </div>
          )}
          {part.notesMarkdown ? (
            <div className='prose prose-sm dark:prose-invert max-w-none rounded-lg bg-background p-4 leading-relaxed prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 first:prose-headings:mt-0'>
              <ReactMarkdown>{part.notesMarkdown}</ReactMarkdown>
            </div>
          ) : (
            <p className='text-xs text-muted-foreground'>No notes yet -- nothing renders below the video for students.</p>
          )}
        </div>
      )}

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
            <Label className='text-xs text-muted-foreground'>YouTube embed code</Label>
            <Textarea
              className='mt-1 font-mono text-xs'
              rows={2}
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.currentTarget.value)}
              placeholder='Paste the <iframe> code from YouTube&apos;s Share -&gt; Embed button (a plain link or bare id also works)'
            />
          </div>
          <div>
            <Label className='text-xs text-muted-foreground'>Notes (markdown)</Label>
            <Textarea className='mt-1' rows={5} value={notesMarkdown} onChange={(e) => setNotesMarkdown(e.currentTarget.value)} />
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div>
              <Label className='text-xs text-muted-foreground'>Source book (provenance)</Label>
              <Input
                className='mt-1'
                value={sourceBook}
                onChange={(e) => setSourceBook(e.currentTarget.value)}
                placeholder="Harty's Endodontics 7th ed"
              />
            </div>
            <div>
              <Label className='text-xs text-muted-foreground'>Source pages</Label>
              <Input className='mt-1' value={sourcePages} onChange={(e) => setSourcePages(e.currentTarget.value)} placeholder='112-130' />
            </div>
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
