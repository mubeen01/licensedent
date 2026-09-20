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
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';
import Reveal from './Reveal';
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

// PRD-006 M3: this "tabs" section previously used 9 plain buttons + a
// panel with no tab semantics at all -- role="tablist"/"tab"/"tabpanel",
// aria-selected, aria-controls and arrow-key navigation are all added
// below, following the WAI-ARIA APG tabs pattern, so a screen-reader user
// gets the same "these are tabs, this one's selected" signal a sighted
// user gets from the highlighted pill.
export default function StudyTools({ tools }: { tools: StudyTool[] }) {
  const [activeId, setActiveId] = useState(tools[0]?.id);
  const active = tools.find((tool) => tool.id === activeId) ?? tools[0];
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Set only by keyboard navigation (never on initial mount or a mouse
  // click, which already has real focus) -- a ref, not state, so setting
  // it doesn't itself trigger a re-render; the effect below runs after
  // React's OWN re-render (triggered by setActiveId) has already committed
  // the new tabIndex values, so the target button is focusable by the time
  // .focus() runs. Calling .focus() synchronously in the same handler that
  // calls setActiveId (the first version of this code did) focused the
  // OLD DOM node before React updated it to tabIndex={-1}, and lost focus
  // entirely once the re-render landed -- confirmed with a live keyboard
  // test (ArrowRight moved aria-selected correctly but left
  // document.activeElement empty).
  const pendingFocusId = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocusId.current === activeId) {
      tabRefs.current[activeId]?.focus();
      pendingFocusId.current = null;
    }
  }, [activeId]);

  if (!active) return null;

  const ActiveIcon = toolIcons[active.id];

  function focusTab(index: number) {
    const tool = tools[index];
    pendingFocusId.current = tool.id;
    setActiveId(tool.id);
  }

  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusTab((index + 1) % tools.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusTab((index - 1 + tools.length) % tools.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTab(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTab(tools.length - 1);
    }
  }

  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow='Everything you get'
        title='One platform, every study tool you need'
        description='Click through to see exactly what comes with your subscription.'
      />

      {/* Tab bar */}
      <Reveal
        role='tablist'
        aria-label='Study tools'
        className='no-scrollbar flex justify-start gap-2 overflow-x-auto pb-2 sm:justify-center'
      >
        {tools.map((tool, index) => {
          const isActive = tool.id === active.id;
          const Icon = toolIcons[tool.id];
          return (
            <button
              key={tool.id}
              ref={(el) => {
                tabRefs.current[tool.id] = el;
              }}
              role='tab'
              id={`studytools-tab-${tool.id}`}
              aria-selected={isActive}
              // Fixed id, not per-tool: there's only ever one panel element
              // in the DOM at a time (its *content* swaps, keyed on
              // active.id for the enter animation) -- pointing every tab's
              // aria-controls at a per-tool id meant 8 of the 9 referenced
              // an id that didn't exist while that tab was inactive.
              aria-controls='studytools-panel'
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(tool.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={cn(
                'flex flex-none items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200',
                isActive
                  ? 'border-transparent bg-linear-to-r from-primary to-secondary text-primary-foreground shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.6)]'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {Icon ? <Icon className='h-4 w-4' strokeWidth={2} aria-hidden='true' /> : <span aria-hidden='true'>{tool.emoji}</span>}
              {tool.name}
            </button>
          );
        })}
      </Reveal>

      {/* Active panel — keyed on the active tool so switching tabs animates
          the new content in instead of an instant, jarring swap. */}
      <div
        key={active.id}
        role='tabpanel'
        id='studytools-panel'
        aria-labelledby={`studytools-tab-${active.id}`}
        tabIndex={0}
        className='card-elevated mt-8 animate-in fade-in-0 slide-in-from-bottom-2 p-8 duration-300 sm:p-10'>
        <div className='grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start'>
          <div className='flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-secondary/15 text-primary'>
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
