import { FileClock, Lock, ShieldCheck, Target } from 'lucide-react';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

const trustPoints = [
  {
    name: 'Written by dentists, checked twice',
    description: 'Every answer key and explanation is written from real clinical practice, then checked by a second dentist before it ever reaches a student.',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    glow: 'hover:shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.4)]',
  },
  {
    name: 'Version-tracked content',
    description: 'If a published question is ever corrected, the previous version is kept on record — corrections are never silent.',
    icon: FileClock,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    glow: 'hover:shadow-[0_20px_40px_-20px_hsl(var(--secondary)/0.4)]',
  },
  {
    name: 'Exam-blueprint mapped',
    description: 'Questions are tagged by subject and exam so what you practice actually matches your authority’s real structure.',
    icon: Target,
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold/30',
    glow: 'hover:shadow-[0_20px_40px_-20px_hsl(var(--gold)/0.4)]',
  },
  {
    name: 'Your data, protected',
    description: 'Your practice history and scores are private to your account — never shared or sold.',
    icon: Lock,
    // Was hardcoded text-teal-700/bg-teal-500 -- now the `success` token, which
    // no other card in this row uses yet, keeping each card's color distinct.
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    glow: 'hover:shadow-[0_20px_40px_-20px_hsl(var(--success)/0.4)]',
  },
];

export default function TrustSection() {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Why trust us'
        title='Built on data integrity, not guesswork'
        description='The same standard you’d expect from a dental education product — nothing goes live without a second dentist checking it.'
      />
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {trustPoints.map((point, idx) => {
          const Icon = point.icon;
          return (
            <Reveal key={point.name} delay={Math.min(idx * 80, 320)} className='h-full'>
              <div
                className={`flex h-full flex-col items-center rounded-2xl border p-7 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${point.border} ${point.bg} ${point.glow}`}
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-card shadow-xs ${point.color}`}>
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
