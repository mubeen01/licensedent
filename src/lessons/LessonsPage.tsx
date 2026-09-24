import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Clock, ListChecks, Lock, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import ReactMarkdown from 'react-markdown';
import { type AuthUser } from 'wasp/auth';
import { getLessons, startLessonPartQuizAttempt, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { cn } from '../lib/utils';

function LessonsPage({ user }: { user: AuthUser }) {
  const { data: lessons, isLoading, error } = useQuery(getLessons);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  return (
    <DashboardLayout user={user} pageTitle='Lessons'>
      <div className='max-w-4xl mx-auto p-6 flex flex-col gap-4'>
        {isLoading && <LoadingSpinner />}

        {error && <p className='text-sm text-destructive'>{(error as any)?.message ?? 'Failed to load lessons'}</p>}

        {!isLoading && (!lessons || lessons.length === 0) && (
          <Card>
            <CardContent className='p-6'>
              <p className='font-bold text-foreground'>Lessons are coming soon</p>
              <p className='mt-1.5 text-sm text-muted-foreground leading-6'>
                Structured video lessons with topic quizzes are being produced. They'll appear here the moment
                they're ready — your access already includes them.
              </p>
            </CardContent>
          </Card>
        )}

        {lessons && lessons.length > 0 && !lessons[0].hasAccess && (
          <Card>
            <CardContent className='p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='font-bold text-foreground'>Unlock the video lessons</p>
                <p className='mt-1 text-sm text-muted-foreground leading-6'>
                  Every lesson below comes with notes and a short quiz. Any plan for your exam unlocks them.
                </p>
              </div>
              <Button asChild className='shrink-0'>
                <WaspRouterLink to={routes.PricingPageRoute.to}>See plans</WaspRouterLink>
              </Button>
            </CardContent>
          </Card>
        )}

        {lessons?.map((lesson) => {
          const isExpanded = expandedLessonId === lesson.id || (expandedLessonId === null && lesson === lessons[0]);
          const passedCount = lesson.parts.filter((p) => p.passed).length;
          return (
            <Card key={lesson.id} className='shadow-md overflow-hidden'>
              <button
                className='w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left'
                onClick={() => setExpandedLessonId(isExpanded ? '' : lesson.id)}
              >
                <div className='flex items-center gap-3'>
                  <span className='flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-linear-to-br from-primary/15 to-secondary/15'>
                    <BookOpen className='h-5 w-5 text-primary' />
                  </span>
                  <div>
                    <h3 className='text-lg font-black text-foreground'>{lesson.title}</h3>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      {passedCount}/{lesson.parts.length} parts passed · {lesson.passThresholdPercent}% to unlock
                      the next part
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className='h-5 w-5 text-muted-foreground shrink-0' />
                ) : (
                  <ChevronDown className='h-5 w-5 text-muted-foreground shrink-0' />
                )}
              </button>

              {isExpanded && (
                <CardContent className='p-5 md:p-6 pt-0 flex flex-col gap-3'>
                  {lesson.parts.map((part) => (
                    <LessonPartRow key={part.id} part={part} />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

function LessonPartRow({
  part,
}: {
  part: {
    id: string;
    order: number;
    title: string;
    youtubeId: string | null;
    durationMinutes: number | null;
    notesMarkdown: string | null;
    questionCount: number;
    isLocked: boolean;
    lockReason: 'plan' | 'previous-part' | null;
    bestPercent: number | null;
    passed: boolean;
    inProgressAttemptId: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleStartQuiz() {
    setIsStarting(true);
    setError(null);
    try {
      const { attemptId } = await startLessonPartQuizAttempt({ lessonPartId: part.id });
      navigate(`/lessons/quiz/${attemptId}`);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start quiz');
      setIsStarting(false);
    }
  }

  if (part.isLocked) {
    return (
      <div className='flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 opacity-70'>
        <Lock className='h-4 w-4 text-muted-foreground shrink-0' />
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-muted-foreground'>
            Part {part.order} · {part.title}
          </p>
          <p className='text-xs text-muted-foreground'>
            {part.lockReason === 'plan'
              ? 'Needs an active plan'
              : 'Locked until you pass the part before this one'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-border bg-card'>
      <button
        className='w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left'
        onClick={() => setOpen((v) => !v)}
      >
        <div className='flex items-center gap-3 min-w-0'>
          {part.passed ? (
            <CheckCircle2 className='h-4 w-4 text-success shrink-0' />
          ) : (
            <PlayCircle className='h-4 w-4 text-primary shrink-0' />
          )}
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-foreground truncate'>
              Part {part.order} · {part.title}
            </p>
            <p className='text-xs text-muted-foreground flex items-center gap-2 flex-wrap'>
              {part.durationMinutes && (
                <span className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' /> {part.durationMinutes} min
                </span>
              )}
              <span className='flex items-center gap-1'>
                <ListChecks className='h-3 w-3' /> {part.questionCount} question{part.questionCount === 1 ? '' : 's'}
              </span>
              {part.bestPercent !== null && (
                <span className={cn('font-semibold', part.passed ? 'text-success' : 'text-muted-foreground')}>
                  Best: {part.bestPercent}%
                </span>
              )}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className='h-4 w-4 text-muted-foreground shrink-0' /> : <ChevronDown className='h-4 w-4 text-muted-foreground shrink-0' />}
      </button>

      {open && (
        <div className='px-4 pb-4 flex flex-col gap-4 border-t border-border pt-4'>
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
            <div className='flex h-40 items-center justify-center rounded-lg bg-linear-to-br from-primary/80 to-secondary/80 text-white'>
              <span className='rounded-full bg-black/30 px-3 py-1 text-xs font-semibold'>Video coming soon</span>
            </div>
          )}

          {part.notesMarkdown && (
            <div className='prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted p-4 leading-relaxed prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 first:prose-headings:mt-0'>
              <ReactMarkdown>{part.notesMarkdown}</ReactMarkdown>
            </div>
          )}

          {error && <p className='text-xs text-destructive'>{error}</p>}

          {part.questionCount > 0 ? (
            <Button onClick={handleStartQuiz} disabled={isStarting} className='self-start'>
              {isStarting
                ? 'Starting…'
                : part.inProgressAttemptId
                ? 'Resume quiz'
                : part.passed
                ? 'Retake quiz'
                : 'Take the quiz'}
            </Button>
          ) : (
            <p className='text-xs text-muted-foreground'>Quiz questions for this part aren't published yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonsPage;
