import { PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import PracticeSetup from './PracticeSetup';
import PracticeSession from './PracticeSession';

type Stage =
  | { name: 'setup' }
  | { name: 'session'; subjectIds: string[]; count: number }
  | { name: 'complete'; correct: number; total: number };

function PracticePage({ user }: { user: AuthUser }) {
  const [stage, setStage] = useState<Stage>({ name: 'setup' });

  return (
    <DashboardLayout user={user} pageTitle='Practice'>
      <div className='max-w-4xl mx-auto p-6'>
        {stage.name === 'setup' && (
          <PracticeSetup onStart={(subjectIds, count) => setStage({ name: 'session', subjectIds, count })} />
        )}

        {stage.name === 'session' && (
          <PracticeSession
            subjectIds={stage.subjectIds}
            count={stage.count}
            onFinish={({ correct, total }) => setStage({ name: 'complete', correct, total })}
          />
        )}

        {stage.name === 'complete' && (
          <div className='card-elevated overflow-hidden text-center'>
            <div className='bg-linear-to-r from-primary via-primary to-secondary p-8 md:p-10 text-primary-foreground flex flex-col items-center gap-3'>
              <PartyPopper className='h-8 w-8' />
              <h2 className='text-xl font-black'>Practice complete</h2>
              <p className='text-4xl font-black'>
                {stage.correct} / {stage.total}
              </p>
              <p className='text-sm opacity-90'>
                {Math.round((stage.correct / Math.max(1, stage.total)) * 100)}% correct
              </p>
            </div>
            <div className='p-6'>
              <Button onClick={() => setStage({ name: 'setup' })} className='bg-linear-to-r from-primary to-secondary text-white font-semibold'>
                Practice again
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PracticePage;
