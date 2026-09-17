import { BookOpen, Target, Timer, Trophy, UserPlus } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

const milestones = [
  {
    icon: UserPlus,
    title: 'Create a free account',
    description: 'No card required — see the platform before you pay for anything.',
  },
  {
    icon: Target,
    title: 'Pick your exam & plan',
    description: 'DHA, HAAD, SMLE and more — scoped to the licence you actually need.',
  },
  {
    icon: BookOpen,
    title: 'Practice, recall & watch',
    description: 'Question bank, recall bank, flashcards and video lectures, subject by subject.',
  },
  {
    icon: Timer,
    title: 'Sit timed mock exams',
    description: 'Full-length, Prometric-style mocks so exam day feels familiar.',
  },
  {
    icon: Trophy,
    title: 'Walk in ready',
    description: 'Track your weak subjects, close the gaps, and take the real exam prepared.',
  },
];

export default function JourneyMap() {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Your path'
        title='From sign-up to exam day'
        description="One route, five stops — here's what the journey looks like."
      />

      <div className='relative mt-4'>
        {/* Connecting track — desktop only */}
        <div className='pointer-events-none absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-border lg:block' />
        <div className='pointer-events-none absolute top-8 left-8 right-8 hidden h-px bg-border lg:block' />

        <ol className='grid grid-cols-1 gap-8 lg:grid-cols-5'>
          {milestones.map((stop, idx) => {
            const Icon = stop.icon;
            return (
              <Reveal key={stop.title} as='li' delay={idx * 80} className='relative flex flex-col items-start gap-4 lg:items-center'>
                <div className='relative z-10 flex h-16 w-16 flex-none items-center justify-center rounded-2xl border-4 border-background bg-linear-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/25'>
                  <Icon className='h-6 w-6' />
                  <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-gold-foreground'>
                    {idx + 1}
                  </span>
                </div>
                <div className='card-elevated card-elevated-hover w-full p-5 lg:text-center'>
                  <h3 className='text-base font-semibold text-foreground'>{stop.title}</h3>
                  <p className='mt-1.5 text-sm leading-6 text-muted-foreground'>{stop.description}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>

      <div className='mt-12 flex justify-center'>
        <Button asChild size='lg'>
          <WaspRouterLink to={routes.SignupRoute.to}>Start your journey — it's free</WaspRouterLink>
        </Button>
      </div>
    </div>
  );
}
