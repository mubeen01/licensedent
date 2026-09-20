/**
 * Per-exam accent colors for the exam guide pages.
 *
 * Every value here MUST be a complete, literal Tailwind class (including any
 * variant prefix like `hover:` or `data-[state=open]:`). Tailwind's JIT
 * scanner finds classes by regex-matching literal substrings in source files
 * -- it can't see a class assembled at runtime from `hover:${x}`, because the
 * combined token "hover:border-amber-500/40" never appears as contiguous
 * text in any scanned file. So nothing here gets built by string
 * concatenation; every entry is spelled out in full, even though that means
 * some repetition across the three palettes.
 */
export type AccentId = 'amber' | 'teal' | 'cyan' | 'emerald' | 'blue' | 'rose' | 'indigo' | 'orange' | 'violet';

export interface AccentPalette {
  text: string;
  textDark: string;
  bg10: string;
  border30: string;
  border40: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  glow: string;
  /** Gradient "from" stop at 10% opacity, for the closing CTA panel background. */
  glowFrom10: string;

  hoverBorder30: string;
  hoverBorder40: string;
  hoverText: string;
  hoverTextDark: string;
  dataOpenBorder40: string;
  dataOpenBg: string;
  dataOpenText: string;
  dataOpenTextDark: string;
}

export const accentPalettes: Record<AccentId, AccentPalette> = {
  amber: {
    // PRD-006 Phase 8: text-amber-700 measured 4.45:1 against this
    // palette's own bg-amber-500/10 badge background (Lighthouse
    // color-contrast audit on /exams/dha, run against the real
    // production build) -- just short of WCAG AA's 4.5:1 minimum for
    // normal text. One shade darker clears it with margin. The other 8
    // accent palettes weren't specifically measured (Lighthouse only
    // exercised the one exam guide page audited) -- worth a spot-check
    // in a follow-up rather than blanket-guessed here.
    text: 'text-amber-800',
    textDark: 'dark:text-amber-400',
    bg10: 'bg-amber-500/10',
    border30: 'border-amber-500/30',
    border40: 'border-amber-500/40',
    gradientFrom: 'from-amber-500',
    gradientVia: 'via-amber-400',
    gradientTo: 'to-amber-400',
    glow: 'bg-amber-500/15',
    glowFrom10: 'from-amber-500/10',

    hoverBorder30: 'hover:border-amber-500/30',
    hoverBorder40: 'hover:border-amber-500/40',
    hoverText: 'hover:text-amber-600',
    hoverTextDark: 'dark:hover:text-amber-400',
    dataOpenBorder40: 'data-[state=open]:border-amber-500/40',
    dataOpenBg: 'data-[state=open]:bg-amber-500/4',
    dataOpenText: 'data-[state=open]:text-amber-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-amber-400',
  },
  teal: {
    text: 'text-teal-700',
    textDark: 'dark:text-teal-400',
    bg10: 'bg-teal-500/10',
    border30: 'border-teal-500/30',
    border40: 'border-teal-500/40',
    gradientFrom: 'from-teal-500',
    gradientVia: 'via-teal-600',
    gradientTo: 'to-teal-700',
    glow: 'bg-teal-500/15',
    glowFrom10: 'from-teal-500/10',

    hoverBorder30: 'hover:border-teal-500/30',
    hoverBorder40: 'hover:border-teal-500/40',
    hoverText: 'hover:text-teal-600',
    hoverTextDark: 'dark:hover:text-teal-400',
    dataOpenBorder40: 'data-[state=open]:border-teal-500/40',
    dataOpenBg: 'data-[state=open]:bg-teal-500/4',
    dataOpenText: 'data-[state=open]:text-teal-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-teal-400',
  },
  cyan: {
    text: 'text-cyan-700',
    textDark: 'dark:text-cyan-400',
    bg10: 'bg-cyan-500/10',
    border30: 'border-cyan-500/30',
    border40: 'border-cyan-500/40',
    gradientFrom: 'from-cyan-500',
    gradientVia: 'via-cyan-500',
    gradientTo: 'to-sky-500',
    glow: 'bg-cyan-500/15',
    glowFrom10: 'from-cyan-500/10',

    hoverBorder30: 'hover:border-cyan-500/30',
    hoverBorder40: 'hover:border-cyan-500/40',
    hoverText: 'hover:text-cyan-600',
    hoverTextDark: 'dark:hover:text-cyan-400',
    dataOpenBorder40: 'data-[state=open]:border-cyan-500/40',
    dataOpenBg: 'data-[state=open]:bg-cyan-500/4',
    dataOpenText: 'data-[state=open]:text-cyan-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-cyan-400',
  },
  emerald: {
    text: 'text-emerald-700',
    textDark: 'dark:text-emerald-400',
    bg10: 'bg-emerald-500/10',
    border30: 'border-emerald-500/30',
    border40: 'border-emerald-500/40',
    gradientFrom: 'from-emerald-500',
    gradientVia: 'via-emerald-600',
    gradientTo: 'to-emerald-600',
    glow: 'bg-emerald-500/15',
    glowFrom10: 'from-emerald-500/10',

    hoverBorder30: 'hover:border-emerald-500/30',
    hoverBorder40: 'hover:border-emerald-500/40',
    hoverText: 'hover:text-emerald-600',
    hoverTextDark: 'dark:hover:text-emerald-400',
    dataOpenBorder40: 'data-[state=open]:border-emerald-500/40',
    dataOpenBg: 'data-[state=open]:bg-emerald-500/4',
    dataOpenText: 'data-[state=open]:text-emerald-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-emerald-400',
  },
  blue: {
    text: 'text-blue-700',
    textDark: 'dark:text-blue-400',
    bg10: 'bg-blue-500/10',
    border30: 'border-blue-500/30',
    border40: 'border-blue-500/40',
    gradientFrom: 'from-sky-500',
    gradientVia: 'via-sky-500',
    gradientTo: 'to-blue-500',
    glow: 'bg-blue-500/15',
    glowFrom10: 'from-sky-500/10',

    hoverBorder30: 'hover:border-blue-500/30',
    hoverBorder40: 'hover:border-blue-500/40',
    hoverText: 'hover:text-blue-600',
    hoverTextDark: 'dark:hover:text-blue-400',
    dataOpenBorder40: 'data-[state=open]:border-blue-500/40',
    dataOpenBg: 'data-[state=open]:bg-blue-500/4',
    dataOpenText: 'data-[state=open]:text-blue-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-blue-400',
  },
  rose: {
    text: 'text-rose-700',
    textDark: 'dark:text-rose-400',
    bg10: 'bg-rose-500/10',
    border30: 'border-rose-500/30',
    border40: 'border-rose-500/40',
    gradientFrom: 'from-rose-500',
    gradientVia: 'via-rose-600',
    gradientTo: 'to-rose-600',
    glow: 'bg-rose-500/15',
    glowFrom10: 'from-rose-500/10',

    hoverBorder30: 'hover:border-rose-500/30',
    hoverBorder40: 'hover:border-rose-500/40',
    hoverText: 'hover:text-rose-600',
    hoverTextDark: 'dark:hover:text-rose-400',
    dataOpenBorder40: 'data-[state=open]:border-rose-500/40',
    dataOpenBg: 'data-[state=open]:bg-rose-500/4',
    dataOpenText: 'data-[state=open]:text-rose-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-rose-400',
  },
  indigo: {
    text: 'text-indigo-700',
    textDark: 'dark:text-indigo-400',
    bg10: 'bg-indigo-500/10',
    border30: 'border-indigo-500/30',
    border40: 'border-indigo-500/40',
    gradientFrom: 'from-indigo-500',
    gradientVia: 'via-indigo-600',
    gradientTo: 'to-indigo-600',
    glow: 'bg-indigo-500/15',
    glowFrom10: 'from-indigo-500/10',

    hoverBorder30: 'hover:border-indigo-500/30',
    hoverBorder40: 'hover:border-indigo-500/40',
    hoverText: 'hover:text-indigo-600',
    hoverTextDark: 'dark:hover:text-indigo-400',
    dataOpenBorder40: 'data-[state=open]:border-indigo-500/40',
    dataOpenBg: 'data-[state=open]:bg-indigo-500/4',
    dataOpenText: 'data-[state=open]:text-indigo-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-indigo-400',
  },
  orange: {
    text: 'text-orange-700',
    textDark: 'dark:text-orange-400',
    bg10: 'bg-orange-500/10',
    border30: 'border-orange-500/30',
    border40: 'border-orange-500/40',
    gradientFrom: 'from-orange-500',
    gradientVia: 'via-orange-600',
    gradientTo: 'to-orange-600',
    glow: 'bg-orange-500/15',
    glowFrom10: 'from-orange-500/10',

    hoverBorder30: 'hover:border-orange-500/30',
    hoverBorder40: 'hover:border-orange-500/40',
    hoverText: 'hover:text-orange-600',
    hoverTextDark: 'dark:hover:text-orange-400',
    dataOpenBorder40: 'data-[state=open]:border-orange-500/40',
    dataOpenBg: 'data-[state=open]:bg-orange-500/4',
    dataOpenText: 'data-[state=open]:text-orange-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-orange-400',
  },
  violet: {
    text: 'text-violet-700',
    textDark: 'dark:text-violet-400',
    bg10: 'bg-violet-500/10',
    border30: 'border-violet-500/30',
    border40: 'border-violet-500/40',
    gradientFrom: 'from-violet-500',
    gradientVia: 'via-violet-600',
    gradientTo: 'to-purple-600',
    glow: 'bg-violet-500/15',
    glowFrom10: 'from-violet-500/10',

    hoverBorder30: 'hover:border-violet-500/30',
    hoverBorder40: 'hover:border-violet-500/40',
    hoverText: 'hover:text-violet-600',
    hoverTextDark: 'dark:hover:text-violet-400',
    dataOpenBorder40: 'data-[state=open]:border-violet-500/40',
    dataOpenBg: 'data-[state=open]:bg-violet-500/4',
    dataOpenText: 'data-[state=open]:text-violet-600',
    dataOpenTextDark: 'dark:data-[state=open]:text-violet-400',
  },
};
