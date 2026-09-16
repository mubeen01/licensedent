// Shared by getMyStudyStats (streak/XP/badges) and getReadinessScore
// (mock-exams/operations.ts) -- both need "how many consecutive days has this
// student actually shown up", computed from real activity timestamps, never
// a stored/decayed counter.

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function computeStreak(dates: Date[]): { currentStreakDays: number; longestStreakDays: number } {
  if (dates.length === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

  const dayKeys = Array.from(new Set(dates.map(toDateKey)));
  const dayStarts = dayKeys
    .map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);

  const ONE_DAY = 86400000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Current streak: walk backward from today (or yesterday, so a student who
  // hasn't practiced yet today doesn't see their streak drop to 0 at midnight
  // before they've had a chance to) as long as each prior day is present.
  let currentStreakDays = 0;
  const mostRecent = dayStarts[dayStarts.length - 1];
  if (mostRecent === todayStart.getTime() || mostRecent === todayStart.getTime() - ONE_DAY) {
    let cursor = mostRecent;
    const daySet = new Set(dayStarts);
    while (daySet.has(cursor)) {
      currentStreakDays += 1;
      cursor -= ONE_DAY;
    }
  }

  // Longest streak: scan the sorted distinct days for the longest run of
  // consecutive calendar days.
  let longestStreakDays = 1;
  let run = 1;
  for (let i = 1; i < dayStarts.length; i++) {
    if (dayStarts[i] - dayStarts[i - 1] === ONE_DAY) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreakDays = Math.max(longestStreakDays, run);
  }

  return { currentStreakDays, longestStreakDays };
}
