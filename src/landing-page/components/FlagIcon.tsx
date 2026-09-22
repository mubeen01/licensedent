/**
 * Small flag icons drawn as real SVG, not Unicode flag emoji.
 *
 * Windows' system emoji font (Segoe UI Emoji) deliberately renders flag
 * emoji as plain two-letter country codes instead of pictures -- a
 * long-standing Microsoft policy, not a bug in this app -- so any Gulf/
 * Ireland flag shown via emoji looks broken on every Windows Chrome/Edge
 * user. These are simplified but recognizable vector flags instead:
 * correct colors and proportions, no fine emblem detail (illegible at
 * icon size anyway), rendered identically on every OS and browser.
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
