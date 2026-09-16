import { Award, Clock, ListChecks, PlayCircle, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type AuthUser } from 'wasp/auth';
import { getExamReadiness, getMockExams, useQuery } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import DashboardLayout from '../dashboard/DashboardLayout';
import LoadingSpinner from '../admin/layout/LoadingSpinner';

function readinessAckKey(userId: string) {
  return `mockexam-readiness-ack-${userId}`;
}

function MockExamsPage({ user }: { user: AuthUser }) {
  const { data: mockExams, isLoading } = useQuery(getMockExams);
  const { data: readiness } = useQuery(getExamReadiness);
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [showReadinessPopup, setShowReadinessPopup] = useState(false);
  useEffect(() => {
    if (readiness?.ready && localStorage.getItem(readinessAckKey(user.id)) !== 'true') {
      setShowReadinessPopup(true);
    }
  }, [readiness, user.id]);

  function dismissReadinessPopup() {
    localStorage.setItem(readinessAckKey(user.id), 'true');
    setShowReadinessPopup(false);
  }

  const active = mockExams?.find((m) => m.id === activeId) ?? mockExams?.[0];
  const attemptsRemaining = active ? Math.max(0, active.attemptsCap - active.attemptsUsed) : 0;
  const capReached = !!active && !active.inProgressAttemptId && attemptsRemaining <= 0;

  function handleStartOrResume() {
    if (!active) return;
    if (active.inProgressAttemptId) {
      navigate(`/mock-exams/${active.inProgressAttemptId}`);
      return;
    }
    navigate(`/mock-exams/start/${active.id}`);
  }

  return (
    <DashboardLayout user={user} pageTitle='Mock Exams'>
      <div className='max-w-4xl mx-auto p-6 flex flex-col gap-6'>
        {isLoading && <LoadingSpinner />}

        {!isLoading && (!mockExams || mockExams.length === 0) && (
          <div className='rounded-sm border border-border bg-card shadow p-6 text-sm text-muted-foreground'>
            No mock exams are available yet.
          </div>
        )}

        {mockExams && mockExams.length > 0 && (
          <>
            {/* Tab bar -- one tab per unlocked mock exam, in order */}
            <div className='no-scrollbar flex gap-2 overflow-x-auto pb-1'>
              {mockExams.map((mockExam) => {
                const isActive = mockExam.id === active?.id;
                return (
                  <button
                    key={mockExam.id}
                    onClick={() => setActiveId(mockExam.id)}
                    className={cn(
                      'flex-none rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                      isActive
                        ? 'border-transparent bg-gradient-to-r from-primary to-secondary text-white shadow'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    )}
                  >
                    {mockExam.title}
                  </button>
                );
              })}
            </div>

            {active && (
              <Card className='shadow-lg'>
                <CardContent className='p-6 md:p-8 flex flex-col gap-6'>
                  <div>
                    <h2 className='text-xl font-black text-foreground'>{active.title}</h2>
                    <p className='text-sm text-muted-foreground mt-1'>{active.examName}</p>
                  </div>

                  <div className='flex flex-wrap gap-6 text-sm'>
                    <span className='flex items-center gap-2 text-muted-foreground'>
                      <ListChecks className='h-4 w-4' />
                      {active.questionCount} questions, drawn fresh from the current question bank each attempt
                    </span>
                    <span className='flex items-center gap-2 text-muted-foreground'>
                      <Clock className='h-4 w-4' />
                      {Math.floor(active.durationMinutes / 60)}h {active.durationMinutes % 60}m
                    </span>
                    <span className='flex items-center gap-2 text-muted-foreground'>
                      <Award className='h-4 w-4' />
                      {active.attemptsCap > 0
                        ? `${active.attemptsUsed}/${active.attemptsCap} attempts used`
                        : 'No active plan'}
                    </span>
                  </div>

                  {capReached && (
                    <p className='text-sm text-muted-foreground'>
                      {active.attemptsCap > 0
                        ? "You've used all the mock exam attempts included in your plan."
                        : 'Buy a plan to take this mock exam.'}
                    </p>
                  )}

                  <Button
                    onClick={handleStartOrResume}
                    disabled={capReached}
                    className='self-start bg-gradient-to-r from-primary to-secondary font-semibold text-white'
                  >
                    <PlayCircle className='h-4 w-4 mr-2' />
                    {active.inProgressAttemptId ? 'Resume exam' : 'Start exam'}
                  </Button>

                  {active.submittedAttempts.length > 0 && (
                    <div className='pt-4 border-t border-border'>
                      <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
                        Past attempts
                      </p>
                      <ul className='flex flex-col gap-2'>
                        {active.submittedAttempts.map((attempt) => (
                          <li key={attempt.id}>
                            <Link
                              to={`/mock-exams/${attempt.id}/results`}
                              className='flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm hover:border-primary/40 hover:bg-accent/40 transition-colors'
                            >
                              <span className='flex items-center gap-2 text-foreground font-medium'>
                                <Award className='h-4 w-4 text-gold' />
                                {attempt.correctCount}/{attempt.totalQuestions}
                              </span>
                              <span className='text-muted-foreground text-xs'>
                                {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : ''}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {showReadinessPopup && readiness && (
        <div className='fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4'>
          <div className='relative w-full max-w-md rounded-2xl bg-card border border-gold/40 shadow-2xl p-8 flex flex-col items-center text-center gap-4'>
            <button
              onClick={dismissReadinessPopup}
              className='absolute right-4 top-4 text-muted-foreground hover:text-foreground'
            >
              <X className='h-4 w-4' />
            </button>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gold text-gold-foreground'>
              <Trophy className='h-8 w-8' />
            </div>
            <h3 className='text-xl font-black text-foreground'>You're ready for the licensing exam</h3>
            <p className='text-sm text-muted-foreground'>
              You've passed {readiness.passedCount} of the first {readiness.totalConsidered} mock exams at 95% or
              higher. That's a strong sign you're prepared for the real thing.
            </p>
            <p className='text-xs text-muted-foreground'>
              Want more practice? Mock Exam 11 and beyond are unlocked -- take as many more as you'd like.
            </p>
            <Button onClick={dismissReadinessPopup} className='w-full mt-2'>
              Got it
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default MockExamsPage;
