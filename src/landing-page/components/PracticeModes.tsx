import {
  Baby,
  BookOpen,
  Dumbbell,
  Flame,
  Gauge,
  Image,
  Scale,
  Shuffle,
  Sparkles,
  Star,
  Stethoscope,
  Timer,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import Reveal from './Reveal';
import SectionTitle from './SectionTitle';

export interface PracticeMode {
  emoji: string;
  label: string;
}

const modeIcons: Partial<Record<string, LucideIcon>> = {
  'Random Mix': Shuffle,
  'Subject-wise': BookOpen,
  'Previously Wrong': XCircle,
  Bookmarked: Star,
  'Never Attempted': Sparkles,
  'High-Yield': Flame,
  'Weak Areas Only': Gauge,
  Easy: Baby,
  Medium: Scale,
  Hard: Dumbbell,
  'Clinical Case': Stethoscope,
  'Image-Based': Image,
  'Timed or Practice Mode': Timer,
};

const colorCycle = [
  { border: 'border-primary/25 hover:border-primary/50', icon: 'bg-primary/10 text-primary' },
  { border: 'border-secondary/25 hover:border-secondary/50', icon: 'bg-secondary/10 text-secondary' },
  { border: 'border-gold/25 hover:border-gold/50', icon: 'bg-gold/10 text-gold' },
];

export default function PracticeModes({ modes }: { modes: PracticeMode[] }) {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-8'>
      <SectionTitle
        eyebrow='Study your way'
        title='Practice however you learn best'
        description="Mix and match filters in Quiz Builder, or jump straight into one of these from Practice — same verified question bank, sliced the way you need it."
      />
      <div className='flex flex-wrap justify-center gap-3'>
        {modes.map((mode, i) => {
          const Icon = modeIcons[mode.label];
          const color = colorCycle[i % colorCycle.length];
          return (
            <Reveal key={mode.label} delay={Math.min(i * 40, 400)} className='inline-flex'>
              <div
                className={`group flex items-center gap-2.5 rounded-full border bg-card py-2 pl-2 pr-4 text-sm font-medium text-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${color.border}`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${color.icon}`}
                  aria-hidden='true'
                >
                  {Icon ? <Icon className='h-3.5 w-3.5' strokeWidth={2} /> : mode.emoji}
                </span>
                {mode.label}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
