import { Clock, PlayCircle } from 'lucide-react';
import { type AuthUser } from 'wasp/auth';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { hasExtendedPlanAccess } from '../payment/planAccess';
import ExtendedPlanUpsell from '../client/components/ExtendedPlanUpsell';
import { videoLectures } from './videoLecturesContent';

function VideoLibrary() {
  const bySubject = videoLectures.reduce<Record<string, typeof videoLectures>>((acc, lecture) => {
    (acc[lecture.subject] ??= []).push(lecture);
    return acc;
  }, {});

  const anyLive = videoLectures.some((l) => l.youtubeId != null);

  return (
    <div className='mx-auto max-w-7xl px-6 py-10 space-y-10'>
      {!anyLive && (
        <Card>
          <CardContent className='p-6'>
            <p className='font-bold text-foreground'>The lecture library is in production</p>
            <p className='mt-1.5 text-sm text-muted-foreground leading-6'>
              These are the subjects and topics we've planned first. New lectures appear here the moment
              they're recorded and verified — your access includes the library as it launches.
            </p>
          </CardContent>
        </Card>
      )}
      {Object.entries(bySubject).map(([subject, lectures]) => (
        <div key={subject}>
          <h3 className='mb-4 text-lg font-black text-foreground'>{subject}</h3>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {lectures.map((lecture) => (
              <Card key={lecture.id} className='overflow-hidden shadow-md'>
                <div className='relative flex h-40 items-center justify-center bg-gradient-to-br from-primary/80 to-secondary/80 text-white'>
                  {lecture.youtubeId ? (
                    <PlayCircle className='h-12 w-12' />
                  ) : (
                    <span className='rounded-full bg-black/30 px-3 py-1 text-xs font-semibold'>Coming soon</span>
                  )}
                </div>
                <CardContent className='p-5'>
                  <h4 className='font-bold text-foreground leading-snug'>{lecture.title}</h4>
                  <p className='mt-1.5 text-sm text-muted-foreground leading-6'>{lecture.description}</p>
                  <div className='mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
                    <Clock className='h-3.5 w-3.5' />
                    {lecture.durationMinutes} min
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VideoLecturesPage({ user }: { user: AuthUser }) {
  const unlocked = hasExtendedPlanAccess(user);

  return (
    <DashboardLayout user={user} pageTitle='Video Lectures'>
      {unlocked ? (
        <VideoLibrary />
      ) : (
        <ExtendedPlanUpsell
          feature='Video Lectures'
          description='Recorded, subject-wise video lectures are coming to the Extended plan, alongside access to every exam we cover. The Extended plan includes the lecture library as it launches.'
        />
      )}
    </DashboardLayout>
  );
}
