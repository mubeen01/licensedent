import { HttpError } from 'wasp/server';
import {
  type GetMyProgress,
  type GetMyDashboardOverview,
  type GetMyStudyStats,
  type GetMyStudyPlan,
} from 'wasp/server/operations';
import { computeStreak } from './streak';
import { getAccessibleExamIds } from '../payment/access';

export type SubjectProgress = {
  subjectId: string;
  subjectName: string;
  attempted: number;
  correct: number;
  accuracy: number;
};

// Per-subject accuracy for the logged-in user, scoped to their own attempts only.
// Subjects with zero attempts are omitted rather than shown as a fabricated 0%.
export const getMyProgress: GetMyProgress<void, SubjectProgress[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const attempts = await context.entities.UserAttempt.findMany({
    where: { userId: context.user.id },
    select: {
      isCorrect: true,
      question: { select: { subjectId: true, subject: { select: { name: true } } } },
    },
  });

  const bySubject = new Map<string, { subjectName: string; attempted: number; correct: number }>();
  for (const attempt of attempts) {
    const { subjectId, subject } = attempt.question;
    const entry = bySubject.get(subjectId) ?? { subjectName: subject.name, attempted: 0, correct: 0 };
    entry.attempted += 1;
    if (attempt.isCorrect) entry.correct += 1;
    bySubject.set(subjectId, entry);
  }

  return Array.from(bySubject.entries())
    .map(([subjectId, { subjectName, attempted, correct }]) => ({
      subjectId,
      subjectName,
      attempted,
      correct,
      accuracy: Math.round((correct / attempted) * 100),
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
};

export type RecentActivityItem = {
  id: string;
  subjectName: string;
  isCorrect: boolean;
  createdAt: string;
};

export type DailyActivity = {
  // Local calendar day on the server (same day boundaries as computeStreak), YYYY-MM-DD.
  date: string;
  attempted: number;
  correct: number;
};

export type DashboardOverview = {
  totalAttempted: number;
  totalCorrect: number;
  accuracy: number;
  subjectsCovered: number;
  thisWeekAttempted: number;
  todayAttempted: number;
  todayCorrect: number;
  // Oldest first, one entry per day (zeros included), last ACTIVITY_WINDOW_DAYS days ending today.
  dailyActivity: DailyActivity[];
  recentActivity: RecentActivityItem[];
};

const ACTIVITY_WINDOW_DAYS = 182; // 26 weeks: the dashboard's activity map + 14-day sparklines

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildDailyActivity(attempts: { isCorrect: boolean; createdAt: Date }[], now: Date): DailyActivity[] {
  const byDay = new Map<string, { attempted: number; correct: number }>();
  for (const a of attempts) {
    const key = localDateKey(a.createdAt);
    const entry = byDay.get(key) ?? { attempted: 0, correct: 0 };
    entry.attempted += 1;
    if (a.isCorrect) entry.correct += 1;
    byDay.set(key, entry);
  }
  const days: DailyActivity[] = [];
  for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = localDateKey(d);
    days.push({ date: key, ...(byDay.get(key) ?? { attempted: 0, correct: 0 }) });
  }
  return days;
}

// Real, DB-backed dashboard summary for the logged-in user only — no fabricated
// numbers (unlike adverizeo's Math.random() usage stats). Empty/zero fields just
// mean "no attempts yet", surfaced as empty states by the UI, not hidden as 0%.
export const getMyDashboardOverview: GetMyDashboardOverview<void, DashboardOverview> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const attempts = await context.entities.UserAttempt.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      isCorrect: true,
      createdAt: true,
      question: { select: { subjectId: true, subject: { select: { name: true } } } },
    },
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const subjectIds = new Set(attempts.map((a) => a.question.subjectId));
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const dailyActivity = buildDailyActivity(attempts, new Date());
  const today = dailyActivity[dailyActivity.length - 1];

  return {
    totalAttempted: attempts.length,
    totalCorrect,
    accuracy: attempts.length > 0 ? Math.round((totalCorrect / attempts.length) * 100) : 0,
    subjectsCovered: subjectIds.size,
    thisWeekAttempted: attempts.filter((a) => a.createdAt > weekAgo).length,
    todayAttempted: today.attempted,
    todayCorrect: today.correct,
    dailyActivity,
    recentActivity: attempts.slice(0, 5).map((a) => ({
      id: a.id,
      subjectName: a.question.subject.name,
      isCorrect: a.isCorrect,
      createdAt: a.createdAt.toISOString(),
    })),
  };
};

/* -------------------------------------------------------------------------- */
/*  GAMIFICATION  (streak, XP, badges)                                        */
/*  Nothing here is stored -- it's all computed on read from real             */
/*  UserAttempt/MockExamAttempt rows, same "never fabricated" rule as         */
/*  getMyDashboardOverview above.                                             */
/* -------------------------------------------------------------------------- */

export type Badge = {
  id: string;
  label: string;
  description: string;
  achieved: boolean;
};

export type StudyStats = {
  currentStreakDays: number;
  longestStreakDays: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  badges: Badge[];
};

const XP_PER_LEVEL = 1000;

export const getMyStudyStats: GetMyStudyStats<void, StudyStats> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  const userId = context.user.id;

  const [attempts, mockAttempts, progress] = await Promise.all([
    context.entities.UserAttempt.findMany({
      where: { userId },
      select: { createdAt: true, isCorrect: true },
    }),
    context.entities.MockExamAttempt.findMany({
      where: { userId },
      select: { createdAt: true, submittedAt: true, status: true },
    }),
    getMyProgress(undefined, context),
  ]);

  const activityDates = [
    ...attempts.map((a) => a.createdAt),
    ...mockAttempts.flatMap((m) => [m.createdAt, ...(m.submittedAt ? [m.submittedAt] : [])]),
  ];
  const { currentStreakDays, longestStreakDays } = computeStreak(activityDates);

  const totalAttempted = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const mockExamsSubmitted = mockAttempts.filter((m) => m.status === 'submitted').length;

  // Deterministic, documented formula -- not tuned/gamed further than this;
  // it exists to give practicing a visible score, not to model mastery.
  const xp = totalCorrect * 10 + totalAttempted * 2 + mockExamsSubmitted * 50;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;

  const bestSubjectAccuracy = progress.reduce(
    (best, s) => (s.attempted >= 30 && s.accuracy > best ? s.accuracy : best),
    0
  );

  const badges: Badge[] = [
    { id: 'first-steps', label: 'First Steps', description: 'Answer 10 practice questions', achieved: totalAttempted >= 10 },
    { id: 'century-club', label: 'Century Club', description: 'Answer 100 practice questions', achieved: totalAttempted >= 100 },
    { id: 'on-fire', label: 'On Fire', description: 'Practice 7 days in a row', achieved: longestStreakDays >= 7 },
    { id: 'unstoppable', label: 'Unstoppable', description: 'Practice 30 days in a row', achieved: longestStreakDays >= 30 },
    { id: 'mock-rookie', label: 'Mock Exam Rookie', description: 'Submit your first mock exam', achieved: mockExamsSubmitted >= 1 },
    { id: 'subject-master', label: 'Subject Master', description: '90%+ accuracy in a subject (30+ questions)', achieved: bestSubjectAccuracy >= 90 },
  ];

  return {
    currentStreakDays,
    longestStreakDays,
    xp,
    level,
    xpIntoLevel: xp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
    badges,
  };
};

/* -------------------------------------------------------------------------- */
/*  PERSONALIZED STUDY PLAN                                                   */
/*  Turns the targetExamDate captured at onboarding into a concrete daily     */
/*  target and a short list of weak/unattempted subjects to focus on.        */
/* -------------------------------------------------------------------------- */

export type StudyPlanFocusSubject = {
  subjectId: string;
  name: string;
  accuracy: number;
  attempted: number;
};

export type StudyPlan = {
  hasTargetDate: boolean;
  targetExamDate: string | null;
  daysRemaining: number | null;
  dailyTargetQuestions: number;
  focusSubjects: StudyPlanFocusSubject[];
};

const DEFAULT_DAILY_TARGET = 10;
const MAX_DAILY_TARGET = 50;
const WEAK_ACCURACY_THRESHOLD = 70;
const MAX_FOCUS_SUBJECTS = 3;

export const getMyStudyPlan: GetMyStudyPlan<void, StudyPlan> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  const userId = context.user.id;

  const [profile, accessibleExamIds, progress] = await Promise.all([
    context.entities.UserProfile.findUnique({ where: { userId }, select: { targetExamDate: true, examId: true } }),
    getAccessibleExamIds(userId, context.entities),
    getMyProgress(undefined, context),
  ]);
  // Only suggest subjects the student can actually practise: ones with published
  // questions in their plan's exam(s), or their onboarding exam if they have no
  // plan. Without this, a DHA student was pointed at IDC-only subjects.
  const examIds = accessibleExamIds.length > 0 ? accessibleExamIds : profile?.examId ? [profile.examId] : [];
  const activeSubjects = await context.entities.Subject.findMany({
    where: {
      isActive: true,
      ...(examIds.length > 0 && {
        questions: { some: { status: 'published', exams: { some: { id: { in: examIds } } } } },
      }),
    },
    select: { id: true, name: true },
  });

  const progressBySubjectId = new Map(progress.map((p) => [p.subjectId, p]));
  const weakOrUnattempted = activeSubjects
    .map((s) => {
      const p = progressBySubjectId.get(s.id);
      return { subjectId: s.id, name: s.name, attempted: p?.attempted ?? 0, accuracy: p?.accuracy ?? 0 };
    })
    .filter((s) => s.attempted === 0 || s.accuracy < WEAK_ACCURACY_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, MAX_FOCUS_SUBJECTS);

  const daysRemaining = profile?.targetExamDate
    ? Math.max(0, Math.ceil((profile.targetExamDate.getTime() - Date.now()) / 86400000))
    : null;

  const dailyTargetQuestions =
    daysRemaining !== null && weakOrUnattempted.length > 0
      ? Math.min(
          MAX_DAILY_TARGET,
          Math.max(DEFAULT_DAILY_TARGET, Math.ceil((weakOrUnattempted.length * 20) / Math.max(daysRemaining, 1)))
        )
      : DEFAULT_DAILY_TARGET;

  return {
    hasTargetDate: !!profile?.targetExamDate,
    targetExamDate: profile?.targetExamDate?.toISOString() ?? null,
    daysRemaining,
    dailyTargetQuestions,
    focusSubjects: weakOrUnattempted,
  };
};
