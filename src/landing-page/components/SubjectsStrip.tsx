import {
  Award,
  Dna,
  Drill,
  Globe,
  Microscope,
  Pill,
  Ruler,
  ScanLine,
  Scissors,
  Shield,
  Smile,
  Syringe,
  TestTube,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

export interface Subject {
  name: string;
  emoji: string;
}

const subjectIcons: Partial<Record<string, LucideIcon>> = {
  'Oral Pathology': Microscope,
  'Oral Medicine & Radiology': ScanLine,
  Endodontics: Drill,
  Periodontics: Shield,
  Prosthodontics: Award,
  'Conservative & Operative': Wrench,
  'Oral & Maxillofacial Surgery': Scissors,
  Orthodontics: Ruler,
  Pedodontics: Smile,
  'Dental Materials': TestTube,
  'Oral Anatomy & Histology': Dna,
  'Community Dentistry': Globe,
  Pharmacology: Pill,
  'Local Anaesthesia': Syringe,
};

const colorCycle = [
  { border: 'border-primary/25 hover:border-primary/50', icon: 'bg-primary/10 text-primary' },
  { border: 'border-secondary/25 hover:border-secondary/50', icon: 'bg-secondary/10 text-secondary' },
  { border: 'border-gold/25 hover:border-gold/50', icon: 'bg-gold/10 text-gold' },
];

export default function SubjectsStrip({ subjects }: { subjects: Subject[] }) {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-8'>
      <SectionTitle
        eyebrow='Coverage'
        title='Every subject on the blueprint'
        description={`${subjects.length} dental subjects, each mapped to the exam authority that tests it.`}
      />
      <div className='flex flex-wrap justify-center gap-3'>
        {subjects.map((subject, i) => {
          const Icon = subjectIcons[subject.name];
          const color = colorCycle[i % colorCycle.length];
          return (
            <Reveal key={subject.name} delay={Math.min(i * 40, 400)} className='inline-flex'>
              <div
                className={`group flex items-center gap-2.5 rounded-full border bg-card/90 py-2 pl-2 pr-4 text-sm font-medium text-foreground shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_hsl(var(--primary)/0.35)] ${color.border}`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${color.icon}`}
                  aria-hidden='true'
                >
                  {Icon ? <Icon className='h-3.5 w-3.5' strokeWidth={2} /> : subject.emoji}
                </span>
                {subject.name}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
