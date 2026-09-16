import { CheckCircle2, NotebookPen, Star, XCircle } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import { getMyMarkedQuestions, saveQuestionNote, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import DashboardLayout from '../dashboard/DashboardLayout';
import ProtectedContent from '../client/components/ProtectedContent';

type Option = { key: string; text: string };

function ReviewPage({ user }: { user: AuthUser }) {
  const { data: marked, isLoading, refetch } = useQuery(getMyMarkedQuestions);

  return (
    <DashboardLayout user={user} pageTitle='Review'>
      <ProtectedContent>
      <div className='max-w-3xl mx-auto p-6 flex flex-col gap-6'>
        {isLoading && <LoadingSpinner />}

        {!isLoading && (!marked || marked.length === 0) && (
          <div className='rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center'>
            <NotebookPen className='h-8 w-8 mx-auto text-muted-foreground mb-3' />
            <p className='font-semibold text-foreground'>Nothing saved yet</p>
            <p className='text-sm text-muted-foreground mt-1'>
              While practicing, star a question or add a note and it'll show up here for later review.
            </p>
          </div>
        )}

        {marked?.map((q) => (
          <MarkedQuestionCard key={q.questionId} question={q} onChanged={refetch} />
        ))}
      </div>
      </ProtectedContent>
    </DashboardLayout>
  );
}

type MarkedQuestion = Awaited<ReturnType<typeof getMyMarkedQuestions>>[number];

function MarkedQuestionCard({
  question,
  onChanged,
}: {
  question: MarkedQuestion;
  onChanged: () => void;
}) {
  const options = (question.options as unknown as Option[]) ?? [];
  const [showAnswer, setShowAnswer] = useState(false);
  const [note, setNote] = useState(question.note ?? '');
  const [markedImportant, setMarkedImportant] = useState(question.markedImportant);
  const [isSaving, setIsSaving] = useState(false);

  async function persist(next: { note?: string; markedImportant?: boolean }) {
    const nextNote = next.note ?? note;
    const nextImportant = next.markedImportant ?? markedImportant;
    setIsSaving(true);
    try {
      await saveQuestionNote({ questionId: question.questionId, note: nextNote || null, markedImportant: nextImportant });
      if (!nextNote && !nextImportant) onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  function toggleImportant() {
    const next = !markedImportant;
    setMarkedImportant(next);
    persist({ markedImportant: next });
  }

  return (
    <Card className='shadow-md'>
      <CardContent className='p-5 md:p-6 flex flex-col gap-4'>
        <div className='flex items-start justify-between gap-3'>
          <span className='rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground'>
            {question.subjectName}
          </span>
          <button
            onClick={toggleImportant}
            className='flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400'
          >
            <Star className={markedImportant ? 'h-4 w-4 fill-amber-500 text-amber-500' : 'h-4 w-4'} />
            {markedImportant ? 'Important' : 'Mark important'}
          </button>
        </div>

        <p className='text-base font-medium text-foreground leading-relaxed'>{question.stem}</p>

        <div className='flex flex-col gap-2'>
          {options.map((opt) => {
            const isCorrectOne = opt.key === question.correctKey;
            return (
              <div
                key={opt.key}
                className={
                  'flex items-center gap-3 text-sm rounded-lg px-4 py-2.5 border ' +
                  (showAnswer && isCorrectOne
                    ? 'bg-green-50 border-green-400 text-green-900 dark:bg-green-950/60 dark:border-green-700 dark:text-green-200'
                    : 'border-border')
                }
              >
                <span className='font-mono font-semibold shrink-0'>{opt.key}.</span>
                <span className='flex-1'>{opt.text}</span>
                {showAnswer && isCorrectOne && <CheckCircle2 className='h-4 w-4 shrink-0' />}
              </div>
            );
          })}
        </div>

        {!showAnswer ? (
          <Button variant='outline' size='sm' className='self-start' onClick={() => setShowAnswer(true)}>
            Show answer & explanation
          </Button>
        ) : (
          <div className='rounded-lg bg-muted p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5'>
              Explanation
            </p>
            <p className='text-sm leading-relaxed text-foreground'>{question.explanation}</p>
          </div>
        )}

        <div>
          <label className='text-xs font-medium text-muted-foreground'>Your notes</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => persist({ note })}
            placeholder='Write anything you want to remember about this question…'
            rows={2}
            className='select-text mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring'
          />
          {isSaving && <p className='text-[11px] text-muted-foreground mt-1'>Saving…</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReviewPage;
