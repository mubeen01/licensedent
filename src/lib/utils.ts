import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Real attempts (Mock Exams, Quiz Builder, Lesson quizzes) shuffle option
// ORDER server-side but each option keeps its original `key` (A/B/C/D) tied
// to its text -- so the array can come back e.g. [C, A, D, B]. Rendering
// `opt.key` directly would show that literal, confusing sequence instead of
// a normal exam's always-sequential A/B/C/D labels. Use this for the VISIBLE
// label only; keep using the option's own `key` for onClick/selectedKey/
// correctKey comparisons, which must stay tied to the original key.
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
