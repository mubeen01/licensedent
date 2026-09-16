import { CheckCircle2, NotebookPen, Star, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getCustomQuizQuestions,
  getDueReviewQuestions,
  getPracticeQuestions,
  saveQuestionNote,
  submitAnswer,
  useQuery,
} from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import ProtectedContent from '../client/components/ProtectedContent';
import type { CustomQuizFilters } from './operations';

type Option = { key: string; text: string };

type SubmitResult = {
  isCorrect: boolean;
  correctKey: string;
  explanation: string;
};

const OPTION_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6'];

export default function PracticeSession({
  subjectIds,
  count,
  mode = 'subjects',
  customFilters,
  onFinish,
}: {
  subjectIds?: string[];
  count: number;
  mode?: 'subjects' | 'dueReview' | 'custom';
  customFilters?: CustomQuizFilters;
  onFinish: (score: { correct: number; total: number }) => void;
}) {
  // Same answer-blind question shape either way -- the only difference is
  // which draw feeds the session: a subject-based random pick, whatever's due
  // today in the spaced-repetition queue (Smart Review), or a Quiz Builder
  // filter combination.
  const { data: subjectQuestions, isLoading: isLoadingSubjectQuestions } = useQuery(
    getPracticeQuestions,
    { subjectIds: subjectIds ?? [], count },
    { enabled: mode === 'subjects' }
  );
  const { data: dueReviewQuestions, isLoading: isLoadingDueReviewQuestions } = useQuery(
    getDueReviewQuestions,
    { count },
    { enabled: mode === 'dueReview' }
  );
  const { data: customQuizQuestions, isLoading: isLoadingCustomQuizQuestions } = useQuery(
    getCustomQuizQuestions,
    { filters: customFilters ?? { subjectIds: [], difficulties: [], include: {} }, count },
    { enabled: mode === 'custom' }
  );
  const fetchedQuestions =
    mode === 'dueReview' ? dueReviewQuestions : mode === 'custom' ? customQuizQuestions : subjectQuestions;
  const isLoading =
    mode === 'dueReview' ? isLoadingDueReviewQuestions : mode === 'custom' ? isLoadingCustomQuizQuestions : isLoadingSubjectQuestions;

  // The server shuffles randomly on every call. If this query ever refetches
  // in the background mid-session (e.g. on window refocus, react-query's
  // default behavior), we must NOT swap the live array out from under the
  // user -- that desyncs `index` from the question actually being shown and
  // causes stale explanations / repeated questions. Freeze the first load.
  const [questions, setQuestions] = useState<typeof fetchedQuestions>(undefined);
  useEffect(() => {
    if (fetchedQuestions && !questions) setQuestions(fetchedQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedQuestions]);

  const [index, setIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions?.[index];
  const options = (question?.options as unknown as Option[]) ?? [];
  const isLast = !!questions && index === questions.length - 1;

  // "Mark as important" + notepad -- independent of scoring, persists across
  // retries. Re-seeded from the question's own saved note each time we land
  // on a new one.
  const [noteText, setNoteText] = useState('');
  const [markedImportant, setMarkedImportant] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  useEffect(() => {
    if (question) {
      setNoteText(question.note ?? '');
      setMarkedImportant(question.markedImportant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  async function persistNote(next: { note?: string; markedImportant?: boolean }) {
    if (!question) return;
    const nextNote = next.note ?? noteText;
    const nextImportant = next.markedImportant ?? markedImportant;
    setIsSavingNote(true);
    try {
      await saveQuestionNote({ questionId: question.id, note: nextNote || null, markedImportant: nextImportant });
    } finally {
      setIsSavingNote(false);
    }
  }

  function toggleImportant() {
    const next = !markedImportant;
    setMarkedImportant(next);
    persistNote({ markedImportant: next });
  }

  async function handleSubmit() {
    if (!selectedKey || !question) return;
    setIsSubmitting(true);
    try {
      const res = await submitAnswer({ questionId: question.id, selectedKey, markedForReview: false });
      setResult(res);
      if (res.isCorrect) setCorrectCount((c) => c + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (!questions) return;
    if (noteText || markedImportant) persistNote({});
    if (isLast) {
      onFinish({ correct: correctCount, total: questions.length });
      return;
    }
    setIndex((i) => i + 1);
    setSelectedKey(null);
    setResult(null);
  }

  // Keyboard shortcuts: 1-6 select an option by position, Enter submits or advances.
  // Positional only -- never shown on screen, so it can't be confused with the
  // option's real key (which is what "Correct answer: X" refers to).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement;
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return;
      if (!result) {
        const optionIndex = OPTION_SHORTCUT_KEYS.indexOf(e.key);
        if (optionIndex !== -1 && options[optionIndex]) {
          setSelectedKey(options[optionIndex].key);
          return;
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (result) {
          handleNext();
        } else if (selectedKey && !isSubmitting) {
          handleSubmit();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, selectedKey, isSubmitting, options]);

  if (isLoading) return <LoadingSpinner />;

  if (!questions || questions.length === 0) {
    return (
      <div className='rounded-2xl border border-border bg-card shadow-sm p-8 text-center text-sm text-muted-foreground'>
        No questions matched your selection.
      </div>
    );
  }

  const answeredCount = index + (result ? 1 : 0);

  return (
    <ProtectedContent>
    <div className='overflow-hidden rounded-2xl border border-border bg-card shadow-lg'>
      <div className='bg-linear-to-r from-primary/10 via-secondary/10 to-gold/10 px-5 py-4 md:px-8 md:py-5 border-b border-border'>
        <div className='flex items-center justify-between text-xs text-muted-foreground mb-2.5'>
          <span className='inline-flex items-center gap-2'>
            <span className='rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary'>
              {question!.subjectName}
            </span>
            <span>
              Question {index + 1} of {questions.length}
            </span>
          </span>
          <span className='font-bold text-foreground'>
            Score: {correctCount}/{answeredCount}
          </span>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} />
      </div>

      <div className='p-5 md:p-8 flex flex-col gap-6'>
        <p className='text-lg md:text-xl leading-relaxed font-medium text-foreground'>{question!.stem}</p>

        {question!.imageUrl && (
          <img
            src={question!.imageUrl}
            alt=''
            className='max-h-80 rounded-lg border border-border object-contain'
          />
        )}

        <div className='flex flex-col gap-2.5'>
          {options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            const isTheCorrectOne = result && opt.key === result.correctKey;
            const isWrongSelected = result && isSelected && !result.isCorrect;
            return (
              <button
                key={opt.key}
                disabled={!!result}
                onClick={() => setSelectedKey(opt.key)}
                className={cn(
                  'flex items-center gap-3 text-left text-sm md:text-base rounded-xl px-4 py-3.5 border-2 transition-colors',
                  isTheCorrectOne
                    ? 'bg-green-50 border-green-400 text-green-900 dark:bg-green-950/60 dark:border-green-700 dark:text-green-200'
                    : isWrongSelected
                    ? 'bg-red-50 border-red-400 text-red-900 dark:bg-red-950/60 dark:border-red-700 dark:text-red-200'
                    : isSelected
                    ? 'border-primary bg-accent'
                    : 'border-border hover:bg-accent/50'
                )}
              >
                <span className='font-mono font-semibold text-muted-foreground shrink-0'>{opt.key}.</span>
                <span className='flex-1'>{opt.text}</span>
                {isTheCorrectOne && <CheckCircle2 className='h-5 w-5 shrink-0 text-green-600 dark:text-green-400' />}
                {isWrongSelected && <XCircle className='h-5 w-5 shrink-0 text-red-600 dark:text-red-400' />}
              </button>
            );
          })}
        </div>

        {result && (
          <div className='flex flex-col gap-4'>
            <div
              className={cn(
                'flex items-center gap-2 text-sm font-semibold',
                result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              )}
            >
              {result.isCorrect ? <CheckCircle2 className='h-5 w-5' /> : <XCircle className='h-5 w-5' />}
              <span>{result.isCorrect ? 'Correct' : 'Incorrect'} &mdash; Correct answer: {result.correctKey}</span>
            </div>
            <div className='rounded-xl bg-muted p-4'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5'>Explanation</p>
              <p className='text-sm leading-relaxed text-foreground'>{result.explanation}</p>
            </div>

            <div className='rounded-xl border border-border p-4 flex flex-col gap-2.5'>
              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-1.5 text-sm font-semibold text-foreground'>
                  <NotebookPen className='h-4 w-4 text-muted-foreground' />
                  Your notes
                </label>
                <button
                  onClick={toggleImportant}
                  className='flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400'
                >
                  <Star className={markedImportant ? 'h-4 w-4 fill-amber-500 text-amber-500' : 'h-4 w-4'} />
                  {markedImportant ? 'Important' : 'Mark important'}
                </button>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={() => persistNote({})}
                placeholder='Jot anything you want to remember -- it will be waiting for you on the Review page.'
                rows={2}
                className='select-text w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring'
              />
              {isSavingNote && <p className='text-[11px] text-muted-foreground'>Saving…</p>}
            </div>
          </div>
        )}

        <div className='flex items-center justify-end pt-2 border-t border-border'>
          {!result ? (
            <Button disabled={!selectedKey || isSubmitting} onClick={handleSubmit}>
              Submit
            </Button>
          ) : (
            <Button onClick={handleNext}>{isLast ? 'Finish' : 'Next'}</Button>
          )}
        </div>
      </div>
    </div>
    </ProtectedContent>
  );
}
