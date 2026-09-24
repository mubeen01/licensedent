import { type PrismaClient } from '@prisma/client';

/**
 * Backfill for the shared Gulf question bank (RAID I-02, 2026-09-24).
 *
 * Every question tagged to ANY non-standalone (Gulf) exam is also tagged to
 * EVERY non-standalone exam, so a DHA-only buyer sees the same pool as an
 * Extended buyer (who resolves to general_dentist). Before this, the
 * Gulf-180 + mcq-batch imports (~4,900 questions) were tagged to
 * general_dentist only, and each branded exam had just the 836-question core.
 *
 * Standalone packs (IDC Ireland) are untouched. Idempotent: re-running adds
 * nothing once in sync; also run it after creating a new Gulf exam.
 * `importQuestionsFromText` tags all Gulf exams on import from now on.
 *
 * Run with: `wasp db seed syncGulfSharedPool` (DRY_RUN=1 to only count).
 * Undo (if ever needed): the pre-change membership was "branded exams hold
 * only the 836 core"; restore from the pre-run backup rather than by query.
 */
export async function syncGulfSharedPool(prismaClient: PrismaClient) {
  const dryRun = process.env.DRY_RUN === '1';

  const gulfExams = await prismaClient.exam.findMany({
    where: { standalonePackOnly: false },
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' },
  });

  const countPublished = async () => {
    const rows: { slug: string; n: number }[] = [];
    for (const exam of gulfExams) {
      const n = await prismaClient.question.count({
        where: { status: 'published', exams: { some: { id: exam.id } } },
      });
      rows.push({ slug: exam.slug, n });
    }
    return rows;
  };

  console.log(`syncGulfSharedPool: ${gulfExams.length} Gulf exams${dryRun ? ' (DRY RUN)' : ''}`);
  const before = await countPublished();
  console.table(before);

  if (dryRun) {
    const missing = await prismaClient.$queryRawUnsafe<{ n: bigint }[]>(`
      SELECT count(*)::bigint AS n FROM (
        SELECT DISTINCT e.id, eq."B"
        FROM "_ExamToQuestion" eq
        JOIN "Exam" src ON src.id = eq."A" AND src."standalonePackOnly" = false
        CROSS JOIN "Exam" e
        WHERE e."standalonePackOnly" = false
      ) want
      WHERE NOT EXISTS (SELECT 1 FROM "_ExamToQuestion" x WHERE x."A" = want.id AND x."B" = want."B")
    `);
    console.log(`Would add ${missing[0]?.n ?? 0} exam-question links. Nothing written.`);
    return;
  }

  const added = await prismaClient.$executeRawUnsafe(`
    INSERT INTO "_ExamToQuestion" ("A", "B")
    SELECT DISTINCT e.id, eq."B"
    FROM "_ExamToQuestion" eq
    JOIN "Exam" src ON src.id = eq."A" AND src."standalonePackOnly" = false
    CROSS JOIN "Exam" e
    WHERE e."standalonePackOnly" = false
    ON CONFLICT DO NOTHING
  `);
  console.log(`Added ${added} exam-question links.`);
  console.table(await countPublished());
}
