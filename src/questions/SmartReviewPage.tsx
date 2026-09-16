import { PartyPopper, RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import { getDueReviewCount, useQuery } from 'wasp/client/operations';
import DashboardLayout from '../dashboard/DashboardLayout';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import PracticeSession from './PracticeSession';

type Stage = { name: 'intro' } | { name: 'session'; count: number } | { name: 'complete'; correct: number; total: number };

function SmartReviewPage({ user }: { user: AuthUser }) {
  const [stage, setStage] = useState<Stage>({ name: 'intro' });
  const { data: dueCount, isLoading } = useQuery(getDueReviewCount, undefined, { enabled: stage.name === 'intro' });

  return (
    <DashboardLayout user={user} pageTitle='Smart Review'>
      <div className='max-w-4xl mx-auto p-6'>
        {stage.name === 'intro' && (
          <div className='overflow-hidden rounded-2xl border border-border bg-card shadow-lg text-center'>
            <div className='bg-gradient-to-r from-primary via-primary to-secondary p-8 md:p-10 text-primary-foreground flex flex-col items-center gap-3'>
              <RotateCcw className='h-8 w-8' />
              <h2 className='text-xl font-black'>Smart Review</h2>
              <p className='text-sm opacity-90 max-w-md'>
                Questions you've gotten wrong resurface sooner; ones you've nailed keep getting
                pushed further out. Just review what's actually due today.
              </p>
            </div>
            <div className='p-8 flex flex-col items-center gap-4'>
              {isLoading ? (
                <LoadingSpinner />
              ) : !dueCount ? (
                <p className='text-sm text-muted-foreground'>
                  Nothing due for review right now — come back after your next practice session.
                </p>
              ) : (
                <>
                  <p className='text-4xl font-black text-foreground'>{dueCount}</p>
                  <p className='text-sm text-muted-foreground'>question{dueCount === 1 ? '' : 's'} due for review</p>
                  <Button
                    size='lg'
                    onClick={() => setStage({ name: 'session', count: dueCount })}
                    className='bg-gradient-to-r from-primary to-secondary font-bold text-white'
                  >
                    <Sparkles className='w-4 h-4 mr-2' />
                    Start Smart Review
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {stage.name === 'session' && (
          <PracticeSession
            mode='dueReview'
            count={stage.count}
            onFinish={({ correct, total }) => setStage({ name: 'complete', correct, total })}
          />
        )}

        {stage.name === 'complete' && (
          <div className='overflow-hidden rounded-2xl border border-border bg-card shadow-lg text-center'>
            <div className='bg-gradient-to-r from-primary via-primary to-secondary p-8 md:p-10 text-primary-foreground flex flex-col items-center gap-3'>
              <PartyPopper className='h-8 w-8' />
              <h2 className='text-xl font-black'>Review complete</h2>
              <p className='text-4xl font-black'>
                {stage.correct} / {stage.total}
              </p>
              <p className='text-sm opacity-90'>
                {Math.round((stage.correct / Math.max(1, stage.total)) * 100)}% correct
              </p>
            </div>
            <div className='p-6'>
              <Button
                onClick={() => setStage({ name: 'intro' })}
                className='bg-gradient-to-r from-primary to-secondary text-white font-semibold'
              >
                Back to Smart Review
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SmartReviewPage;
