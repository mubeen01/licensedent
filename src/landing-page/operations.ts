import { type GetPublicBankStats, type GetPublicExams } from 'wasp/server/operations';

export type PublicExam = {
  id: string;
  slug: string;
  code: string;
  name: string;
  country: string;
  flagEmoji: string;
  authorityLabel: string;
  description: string;
  colorGradient: string;
  publishedQuestionCount: number;
};

// Public (no auth) -- powers the landing page's exam grid and any exam
// picker shown before signup. Only returns exams with real branding data
// (code/flag set) so the original internal "general_dentist" bucket exam
// never leaks into the marketing grid. Question count is live, so an exam
// added later with no tagged content shows "Coming soon" instead of a false
// "Start practicing" claim.
export const getPublicExams: GetPublicExams<void, PublicExam[]> = async (_args, context) => {
  const exams = await context.entities.Exam.findMany({
    where: { isActive: true, code: { not: null } },
    include: {
      _count: { select: { questions: { where: { status: 'published' } } } },
    },
    orderBy: { code: 'asc' },
  });

  return exams.map((exam) => ({
    id: exam.id,
    slug: exam.slug,
    code: exam.code ?? exam.name,
    name: exam.authorityLabel ?? exam.name,
    country: exam.country ?? '',
    flagEmoji: exam.flagEmoji ?? '',
    authorityLabel: exam.authorityLabel ?? exam.name,
    description: exam.description ?? '',
    colorGradient: exam.colorGradient ?? 'from-primary to-secondary',
    publishedQuestionCount: exam._count.questions,
  }));
};

export type PublicBankStats = {
  publishedQuestionCount: number;
  subjectCount: number;
  examCount: number;
};

// Public (no auth) -- bank-wide counters for marketing copy. These power the
// landing stats, hero numbers and auth-page pitch so the "N questions" claims
// can never drift from the real database again (previously hardcoded to
// "9,000+" while the bank held ~800 published — a trust breach for a
// "human-verified" brand). Counting the whole question bank (not per-exam
// tags) because all exams currently share one pool; per-exam counts stay on
// getPublicExams for the grid.
export const getPublicBankStats: GetPublicBankStats<void, PublicBankStats> = async (_args, context) => {
  const [publishedQuestionCount, subjectCount, examCount] = await Promise.all([
    context.entities.Question.count({ where: { status: 'published' } }),
    context.entities.Subject.count({ where: { isActive: true } }),
    // Same filter as getPublicExams (the marketing exam grid): only branded
    // exams (code set). Excludes the internal un-branded "general_dentist"
    // bucket exam so the "N Gulf exams" number always matches the grid below
    // it instead of overshooting by one.
    context.entities.Exam.count({ where: { isActive: true, code: { not: null } } }),
  ]);
  return { publishedQuestionCount, subjectCount, examCount };
};
