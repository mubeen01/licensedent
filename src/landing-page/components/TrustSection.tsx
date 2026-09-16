import { FileClock, Lock, ShieldCheck, Target } from 'lucide-react';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

const trustPoints = [
  {
    name: 'Human-verified answers',
    description: 'Every answer key and explanation is checked by a dentist before it ever reaches a student — nothing is AI-guessed and auto-published.',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  {
    name: 'Version-tracked content',
    description: 'If a published question is ever corrected, the previous version is kept on record — corrections are never silent.',
    icon: FileClock,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
  },
  {
    name: 'Exam-blueprint mapped',
    description: 'Questions are tagged by subject and exam so what you practice actually matches your authority’s real structure.',
    icon: Target,
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/30',
  },
  {
    name: 'Your data, protected',
    description: 'Your practice history and scores are private to your account — never shared or sold.',
    icon: Lock,
    color: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
  },
];

export default function TrustSection() {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Why trust us'
        title='Built on data integrity, not guesswork'
        description='The same standard you’d expect from a dental education product — nothing goes live without a human check.'
      />
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {trustPoints.map((point, idx) => {
          const Icon = point.icon;
          return (
            <Reveal key={point.name} delay={Math.min(idx * 80, 320)} className='h-full'>
              <div
                className={`flex h-full flex-col items-center rounded-2xl border p-7 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${point.border} ${point.bg}`}
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-card shadow-sm ${point.color}`}>
                  <Icon className='h-6 w-6' />
                </div>
                <h3 className='mb-2 text-base font-semibold text-foreground'>{point.name}</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>{point.description}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
