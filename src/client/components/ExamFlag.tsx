/**
 * Small flag icons drawn as real SVG, not Unicode flag emoji.
 *
 * Windows' system emoji font (Segoe UI Emoji) deliberately renders flag
 * emoji as plain two-letter country codes instead of pictures -- a
 * long-standing Microsoft policy, not a bug in this app -- so any Gulf/
 * Ireland flag shown via emoji looks broken (a colored circle with "AE"/
 * "SA"/etc. text in it) on every Windows Chrome/Edge user, which is most of
 * this app's audience. These are simplified but recognizable vector flags
 * instead: correct colors and proportions, no fine emblem detail (illegible
 * at icon size anyway), rendered identically on every OS and browser.
 *
 * Moved here (was `landing-page/components/FlagIcon.tsx`) once it became
 * clear the same emoji-as-text bug was present app-wide -- dashboard,
 * onboarding, fast-track, admin -- not just the landing page, so this is
 * now a shared `client/components` primitive like SeoHead/OrganizationJsonLd,
 * not a landing-page-only one.
 */

import type { ReactNode } from 'react';

export type FlagCode = 'AE' | 'SA' | 'OM' | 'QA' | 'KW' | 'BH' | 'IE';

const flagPaths: Record<FlagCode, ReactNode> = {
  AE: (
    <>
      <rect width='3' height='2' fill='#00732f' />
      <rect width='3' height='0.667' fill='#00732f' />
      <rect y='0.667' width='3' height='0.667' fill='#fff' />
      <rect y='1.333' width='3' height='0.667' fill='#000' />
      <rect width='0.85' height='2' fill='#ff0000' />
    </>
  ),
  SA: (
    <>
      <rect width='3' height='2' fill='#0b7a3e' />
      <rect x='0.35' y='0.85' width='2.3' height='0.3' fill='#fff' rx='0.05' />
    </>
  ),
  OM: (
    <>
      <rect width='3' height='2' fill='#fff' />
      <rect y='0.667' width='3' height='0.667' fill='#db161b' />
      <rect y='1.333' width='3' height='0.667' fill='#00732f' />
      <rect width='0.75' height='2' fill='#db161b' />
    </>
  ),
  QA: (
    <>
      <rect width='3' height='2' fill='#8a1538' />
      <polygon points='0,0 0.7,0 1.0,0.25 0.7,0.5 1.0,0.75 0.7,1.0 1.0,1.25 0.7,1.5 1.0,1.75 0.7,2 0,2' fill='#fff' />
    </>
  ),
  KW: (
    <>
      <rect width='3' height='2' fill='#fff' />
      <rect width='3' height='0.667' fill='#00732f' />
      <rect y='1.333' width='3' height='0.667' fill='#ce1126' />
      <polygon points='0,0 0.9,0 0,1 0.9,2 0,2' fill='#000' />
    </>
  ),
  BH: (
    <>
      <rect width='3' height='2' fill='#ce1126' />
      <polygon points='0,0 0.7,0 1.0,0.286 0.7,0.571 1.0,0.857 0.7,1.143 1.0,1.429 0.7,1.714 1.0,2 0.7,2 0,2' fill='#fff' />
    </>
  ),
  IE: (
    <>
      <rect width='1' height='2' fill='#169b62' />
      <rect x='1' width='1' height='2' fill='#fff' />
      <rect x='2' width='1' height='2' fill='#ff883e' />
    </>
  ),
};

const flagLabels: Record<FlagCode, string> = {
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  OM: 'Oman',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  IE: 'Ireland',
};

export default function FlagIcon({ code, className = 'h-3.5 w-[1.3125rem]' }: { code: FlagCode; className?: string }) {
  return (
    <svg
      viewBox='0 0 3 2'
      className={`inline-block flex-none rounded-[1px] ${className}`}
      role='img'
      aria-label={flagLabels[code]}
    >
      {flagPaths[code]}
    </svg>
  );
}

// Every exam's `flagEmoji` (static EXAM_GUIDES content, or the admin-typed
// `Exam.flagEmoji` DB column) is still stored/passed around as the literal
// Unicode emoji -- this maps the ones this project actually uses to a real
// FlagIcon code, so call sites don't need a data-model change (a second
// `flagCode` column, a migration, backfilling 10+ rows) just to stop
// rendering broken text on Windows.
const EMOJI_TO_FLAG_CODE: Record<string, FlagCode> = {
  '🇦🇪': 'AE',
  '🇸🇦': 'SA',
  '🇴🇲': 'OM',
  '🇶🇦': 'QA',
  '🇰🇼': 'KW',
  '🇧🇭': 'BH',
  '🇮🇪': 'IE',
};

/**
 * Drop-in replacement for rendering `{exam.flagEmoji}` directly. Renders the
 * real SVG flag when the emoji is one of this project's known
 * countries; falls back to the raw emoji/text unchanged for anything else
 * (a future exam's country not yet added above, or a null/empty value) --
 * never worse than the pre-fix behavior, just not fixed for that one case
 * until it's added to the map above.
 */
export function ExamFlag({ emoji, className }: { emoji: string | null | undefined; className?: string }) {
  if (!emoji) return null;
  const code = EMOJI_TO_FLAG_CODE[emoji];
  if (!code) return <>{emoji}</>;
  return <FlagIcon code={code} className={className} />;
}
