import { ClipboardCheck, ListChecks, Timer, TrendingUp } from 'lucide-react';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

const steps = [
  {
    icon: ClipboardCheck,
    title: 'Choose your exam & plan',
    description: 'Pick DHA, HAAD, MOH or any of the 9 Gulf exams we cover, then choose Fast Track, Standard or Extended access.',
  },
  {
    icon: ListChecks,
    title: 'Practice subject by subject',
    description: 'Work through Oral Pathology, Endodontics, Periodontics and more — every answer comes with a clear, dentist-written explanation.',
  },
  {
    icon: Timer,
    title: 'Sit full-length timed mocks',
    description: 'Simulate exam-day pressure with Prometric-style mock tests, then review every right and wrong answer afterward.',
  },
  {
    icon: TrendingUp,
    title: 'Track weak subjects & improve',
    description: 'See your accuracy by subject, revisit questions you marked for review, and walk in on exam day prepared.',
  },
];

export default function ProcessSteps() {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle title='How LicenseDent works' description='From sign-up to exam day, in four steps.' />
      <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.title} delay={idx * 120} className='h-full'>
              <div className='card-elevated card-elevated-hover flex h-full flex-col p-6'>
                <span className='text-4xl font-bold tracking-tight text-primary/15' aria-hidden='true'>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className='mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-secondary/15 text-primary'>
                  <Icon className='h-5 w-5' strokeWidth={1.75} />
                </div>
                <h3 className='mt-4 text-base font-semibold text-foreground'>{step.title}</h3>
                <p className='mt-2 text-sm leading-6 text-muted-foreground'>{step.description}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
