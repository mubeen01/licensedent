import {
  BookOpen,
  CheckCircle2,
  LineChart,
  Layers,
  Puzzle,
  RefreshCw,
  ScanLine,
  Target,
  Timer,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import SectionTitle from './SectionTitle';

export interface StudyTool {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  points: string[];
  gradient: string;
}

const toolIcons: Partial<Record<string, LucideIcon>> = {
  quizbuilder: Puzzle,
  smartreview: RefreshCw,
  qbank: BookOpen,
  recalls: Target,
  mocks: Timer,
  images: ScanLine,
  flashcards: Layers,
  analytics: LineChart,
  videos: Video,
};

export default function StudyTools({ tools }: { tools: StudyTool[] }) {
  const [activeId, setActiveId] = useState(tools[0]?.id);
  const active = tools.find((tool) => tool.id === activeId) ?? tools[0];

  if (!active) return null;

  const ActiveIcon = toolIcons[active.id];

  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Everything you get'
        title='One platform, every study tool you need'
        description='Click through to see exactly what comes with your subscription.'
      />

      {/* Tab bar */}
      <div className='no-scrollbar flex justify-start gap-2 overflow-x-auto pb-2 sm:justify-center'>
        {tools.map((tool) => {
          const isActive = tool.id === active.id;
          const Icon = toolIcons[tool.id];
          return (
            <button
              key={tool.id}
              onClick={() => setActiveId(tool.id)}
              className={cn(
                'flex flex-none items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {Icon ? <Icon className='h-4 w-4' strokeWidth={2} aria-hidden='true' /> : <span aria-hidden='true'>{tool.emoji}</span>}
              {tool.name}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className='relative mt-8 overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10'>
        <div className='grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start'>
          <div className='flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary'>
            {ActiveIcon ? <ActiveIcon className='h-7 w-7' strokeWidth={1.75} /> : <span className='text-3xl'>{active.emoji}</span>}
          </div>
          <div>
            <h3 className='text-2xl font-semibold text-foreground'>{active.name}</h3>
            <p className='mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground'>{active.tagline}</p>
            <ul className='mt-6 grid gap-3 sm:grid-cols-2'>
              {active.points.map((point) => (
                <li key={point} className='flex items-start gap-2.5 text-sm leading-6 text-foreground/90'>
                  <CheckCircle2 className='mt-0.5 h-4 w-4 flex-none text-secondary' />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
