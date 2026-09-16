import { AlertTriangle, CheckCircle2, Clock, ListChecks, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { type AuthUser } from 'wasp/auth';
import { getMockTestMeta, startMockExamAttempt, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';

function formatDurationWords(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  return parts.join(' ') || '0 minutes';
}

const RULES = [
  'This is a full, timed mock exam -- once you begin, the clock runs continuously until you submit or time runs out.',
  'You must complete the entire exam in one sitting. Closing the tab or losing connection does not pause the timer.',
  'Answers are NOT scored as you go -- you will not see whether you got a question right or wrong until you submit the whole exam.',
  'You can move freely between questions and change answers any time before you submit, using the question palette.',
  'Mark any question for review and revisit it later -- marking does not submit or lock in an answer.',
  'Once you submit, your answers are final. You cannot reopen this attempt.',
  'If the timer reaches zero, the exam auto-submits with whatever answers you have selected so far.',
];

function MockExamInstructionsPage({ user }: { user: AuthUser }) {
  const { mockTestId } = useParams<{ mockTestId: string }>();
  const navigate = useNavigate();
  const { data: meta, isLoading, error: metaError } = useQuery(getMockTestMeta, { mockTestId: mockTestId! });

  const [accepted, setAccepted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBegin() {
    if (!mockTestId || !accepted) return;
    setIsStarting(true);
    setError(null);
    try {
      const { attemptId } = await startMockExamAttempt({ mockTestId });
      navigate(`/mock-exams/${attemptId}`);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start mock exam');
      setIsStarting(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;

  if (metaError || !meta) {
    return (
      <div className='max-w-2xl mx-auto p-6'>
        <p className='text-sm text-destructive'>{(metaError as any)?.message ?? 'Mock exam not found'}</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4 md:p-8'>
      <div className='w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden'>
        <div className='bg-gradient-to-r from-primary via-primary to-secondary px-6 py-8 md:px-10 md:py-10 text-primary-foreground text-center'>
          <p className='text-xs font-bold uppercase tracking-[0.2em] opacity-80'>{meta.examName}</p>
          <h1 className='mt-2 text-2xl md:text-3xl font-black'>{meta.title}</h1>
          <div className='mt-5 flex items-center justify-center gap-6 text-sm font-semibold'>
            <span className='flex items-center gap-2'>
              <Clock className='h-4 w-4' /> {formatDurationWords(meta.durationMinutes)}
            </span>
            <span className='flex items-center gap-2'>
              <ListChecks className='h-4 w-4' /> {meta.questionCount} questions
            </span>
          </div>
        </div>

        <div className='p-6 md:p-10 flex flex-col gap-6'>
          <div className='flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4'>
            <ShieldAlert className='h-5 w-5 flex-none text-amber-700 dark:text-amber-400 mt-0.5' />
            <p className='text-sm text-amber-900 dark:text-amber-200'>
              Treat this exactly like the real licensing exam. Set aside{' '}
              <strong>{formatDurationWords(meta.durationMinutes)}</strong> of uninterrupted time before you begin.
            </p>
          </div>

          <div>
            <h2 className='text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3'>
              Before you start
            </h2>
            <ul className='flex flex-col gap-3'>
              {RULES.map((rule) => (
                <li key={rule} className='flex items-start gap-2.5 text-sm text-foreground leading-relaxed'>
                  <CheckCircle2 className='h-4 w-4 flex-none text-primary mt-0.5' />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className='flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>
              <AlertTriangle className='h-4 w-4 flex-none' />
              {error}
            </div>
          )}

          <label className='flex items-start gap-3 cursor-pointer rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors'>
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} className='mt-0.5' />
            <span className='text-sm text-foreground'>
              I have read and understood these instructions. I will complete this mock exam in one sitting, exactly
              as I would the real licensing exam.
            </span>
          </label>

          <Button
            size='lg'
            disabled={!accepted || isStarting}
            onClick={handleBegin}
            className='bg-gradient-to-r from-primary to-secondary font-bold text-white'
          >
            {isStarting ? 'Starting…' : 'Begin exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MockExamInstructionsPage;
