// Pure, client-only -- no server round-trip needed for either helper.

export function getTimeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

// Local (not UTC) today, formatted for a native <input type="date">'s min
// attribute -- toISOString() would shift by timezone offset and can be
// off-by-one-day. Used to stop a target exam date from being set in the
// past, which would make "days remaining" negative/meaningless.
export function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Whole days remaining until target (rounded, calendar-day based so "today"
// reads as 0 rather than a negative fraction). Returns null when there's no
// date or it's already in the past -- callers decide whether to render
// anything for that case (the dashboard just hides the pill).
export function getDaysUntil(target: Date | string | null | undefined): number | null {
  if (!target) return null;
  const targetDate = typeof target === 'string' ? new Date(target) : target;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}
