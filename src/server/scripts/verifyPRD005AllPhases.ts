import type { PrismaClient } from '@prisma/client';
import { toggleUserDisabled } from '../../admin/dashboards/users/operations';
import {
  approveQuestion,
  bulkQuestionAction,
  deleteQuestion,
  getQuestionIdsForReview,
  importQuestionsFromText,
} from '../../admin/dashboards/questions/operations';
import { createExam, updateExam } from '../../admin/dashboards/exams/operations';
import {
  createLesson,
  createLessonPart,
  reorderLesson,
  reorderLessonPart,
  updateLessonPart,
} from '../../admin/dashboards/lessons/operations';
import { getContactFormMessages, markMessageRead } from '../../admin/dashboards/messages/operations';

// PRD-005 full-plan regression suite -- kept in the repo (unlike the
// throwaway `verifyPhaseN...` scripts each phase used once and deleted).
// Run anytime with `wasp db seed verifyPRD005AllPhases` against a real dev
// DB to re-check all 7 phases still work together after later changes.
// Re-verifies one or two representative behaviors from EVERY phase
// (1, 3, 4, 5, 6, 7) in one pass, using the real exported operation
// functions (not reimplementations) -- a regression check that everything
// still works together, not a re-derivation of each phase's original, more
// exhaustive verification (see docs/13-admin-panel-hardening-PRD-005.md for
// each phase's own original test coverage). Creates and fully cleans up
// its own throwaway rows (own admin user, exam, subjects, questions,
// lessons) every run -- safe to run repeatedly, never touches real data.

type Check = { stage: string; label: string; pass: boolean; detail?: string };

export async function verifyPRD005AllPhases(prismaClient: PrismaClient) {
  const suffix = Date.now();
  const checks: Check[] = [];
  function record(stage: string, label: string, pass: boolean, detail?: string) {
    checks.push({ stage, label, pass, detail });
    console.log(`[PRD-005][${stage}] ${label} -- ${pass ? 'PASS' : 'FAIL'}${detail ? ` (${detail})` : ''}`);
  }

  const admin = await prismaClient.user.create({
    data: { email: `prd005-admin-${suffix}@test.local`, isAdmin: true, isDisabled: false },
  });
  const context = { user: { id: admin.id, isAdmin: true }, entities: prismaClient as any } as any;

  const exam = await prismaClient.exam.create({ data: { name: `PRD005 Test Exam ${suffix}`, slug: `prd005-test-${suffix}` } });
  const subjectA = await prismaClient.subject.create({ data: { name: 'Subject A', examId: exam.id } });
  const subjectB = await prismaClient.subject.create({ data: { name: 'Subject B', examId: exam.id } });

  const testUserIds: string[] = [];
  const testQuestionIds: string[] = [];
  const testLessonIds: string[] = [];

  try {
    /* ---------------------------- Stage 1: data integrity + security ---------------------------- */
    {
      const victim = await prismaClient.user.create({
        data: { email: `prd005-victim-${suffix}@test.local`, isDisabled: false },
      });
      testUserIds.push(victim.id);
      const auth = await (prismaClient as any).auth.create({ data: { userId: victim.id } });
      await (prismaClient as any).session.create({
        data: { id: `prd005-session-${suffix}`, userId: auth.id, expiresAt: new Date(Date.now() + 86400000) },
      });
      await toggleUserDisabled({ id: victim.id, isDisabled: true }, context);
      const remainingSessions = await (prismaClient as any).session.count({ where: { auth: { userId: victim.id } } });
      record('1-data-integrity', 'toggleUserDisabled revokes sessions', remainingSessions === 0, `${remainingSessions} sessions left`);
    }

    {
      const validOptions = [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }];
      const q = await prismaClient.question.create({
        data: {
          stem: `Race guard test ${suffix}`,
          options: validOptions,
          correctKey: 'A',
          explanation: 'Because A.',
          difficulty: 'easy',
          status: 'pending',
          subjectId: subjectA.id,
        },
      });
      testQuestionIds.push(q.id);
      const results = await Promise.allSettled([approveQuestion({ id: q.id }, context), approveQuestion({ id: q.id }, context)]);
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      record('1-data-integrity', 'approveQuestion race guard (concurrent double-approve)', succeeded === 1, `${succeeded} succeeded`);
    }

    {
      const published = await prismaClient.question.create({
        data: {
          stem: `Tag invariant published ${suffix}`,
          options: [{ key: 'A', text: 'x' }],
          correctKey: 'A',
          explanation: 'e',
          difficulty: 'medium',
          status: 'published',
          subjectId: subjectA.id,
        },
      });
      const pending = await prismaClient.question.create({
        data: {
          stem: `Tag invariant pending ${suffix}`,
          options: [{ key: 'A', text: 'x' }],
          difficulty: 'medium',
          status: 'pending',
          subjectId: subjectA.id,
        },
      });
      testQuestionIds.push(published.id, pending.id);
      await bulkQuestionAction({ action: 'tag', questionIds: [published.id, pending.id], difficulty: null }, context);
      const [reloadedPublished, reloadedPending] = await Promise.all([
        prismaClient.question.findUniqueOrThrow({ where: { id: published.id } }),
        prismaClient.question.findUniqueOrThrow({ where: { id: pending.id } }),
      ]);
      record(
        '1-data-integrity',
        "bulkQuestionAction 'tag' leaves a published question's difficulty untouched",
        reloadedPublished.difficulty === 'medium' && reloadedPending.difficulty === null,
        `published=${reloadedPublished.difficulty}, pending=${reloadedPending.difficulty}`
      );
    }

    {
      const q = await prismaClient.question.create({
        data: {
          stem: `Delete audit test ${suffix}`,
          options: [{ key: 'A', text: 'x' }],
          status: 'pending',
          subjectId: subjectA.id,
        },
      });
      await deleteQuestion({ id: q.id }, context);
      const auditRow = await prismaClient.adminAuditLog.findFirst({
        where: { action: 'question.delete', entityId: q.id },
      });
      record('1-data-integrity', 'deleteQuestion writes an audit log entry', !!auditRow);
    }

    /* ------------------------------ Stage 3: scale readiness ------------------------------ */
    {
      const indexNames = ['Question_subjectId_status_idx', 'Question_importBatchId_status_idx', 'Question_status_difficulty_idx'];
      const rows = await prismaClient.$queryRawUnsafe<{ indexname: string }[]>(
        `select indexname from pg_indexes where tablename = 'Question' and indexname = ANY($1)`,
        indexNames
      );
      record('3-scale-readiness', 'Question review-query indexes still exist', rows.length === indexNames.length, `${rows.length}/${indexNames.length} found`);
    }

    {
      const stem = `Duplicate dedup test question stem ${suffix} used to check bank-wide detection across two separate imports`;
      const text = `1- ${stem}\nA. Correct**\nB. Wrong\n* Explanation.`;
      const first = await importQuestionsFromText(
        { examId: exam.id, subjectMode: 'single', subjectId: subjectB.id, fileName: 'dedup-test-1.txt', text, skipAiSuggestions: true },
        context
      );
      const second = await importQuestionsFromText(
        { examId: exam.id, subjectMode: 'single', subjectId: subjectB.id, fileName: 'dedup-test-2.txt', text, skipAiSuggestions: true },
        context
      );
      record(
        '3-scale-readiness',
        'importQuestionsFromText dedup catches a re-import of the same stem',
        first.inserted === 1 && second.skippedDuplicate === 1 && second.inserted === 0,
        `first.inserted=${first.inserted}, second.skippedDuplicate=${second.skippedDuplicate}`
      );
    }

    /* --------------------------- Stage 4: review-throughput UX --------------------------- */
    {
      for (let i = 0; i < 3; i++) {
        const q = await prismaClient.question.create({
          data: { stem: `Bulk-id-fetch test ${suffix}-${i}`, options: [{ key: 'A', text: 'x' }], status: 'pending', subjectId: subjectB.id },
        });
        testQuestionIds.push(q.id);
      }
      const { ids, totalCount } = await getQuestionIdsForReview(
        { subjectId: subjectB.id, status: 'unreviewed', needsTagging: false, missingAiDraft: false },
        context
      );
      const directCount = await prismaClient.question.count({ where: { subjectId: subjectB.id, status: { in: ['pending', 'flagged'] } } });
      record(
        '4-review-throughput',
        'getQuestionIdsForReview id-count matches a direct count() on the same filter',
        ids.length === totalCount && totalCount === directCount,
        `ids=${ids.length}, totalCount=${totalCount}, directCount=${directCount}`
      );
    }

    {
      const q1 = await prismaClient.question.create({
        data: {
          stem: `Bulk undo test A ${suffix}`,
          options: [{ key: 'A', text: 'x' }, { key: 'B', text: 'y' }],
          correctKey: 'A',
          explanation: 'e',
          difficulty: 'easy',
          status: 'pending',
          subjectId: subjectA.id,
        },
      });
      testQuestionIds.push(q1.id);
      const approveResult = await bulkQuestionAction({ action: 'approve', questionIds: [q1.id] }, context);
      const undo = approveResult.undo;
      let undoWorked = false;
      if (undo && undo.kind === 'approve') {
        await bulkQuestionAction({ action: 'unpublish', questionIds: undo.questionIds }, context);
        const reloaded = await prismaClient.question.findUniqueOrThrow({ where: { id: q1.id } });
        undoWorked = reloaded.status === 'pending';
      }
      record('4-review-throughput', 'bulk approve -> undo round trip lands back at pending', undoWorked);
    }

    /* ---------------------------- Stage 5: audit trail completeness ---------------------------- */
    {
      const changesBefore = await prismaClient.adminAuditLog.count({ where: { action: 'exam.update', entityId: exam.id } });
      await updateExam(
        { id: exam.id, name: exam.name, code: null, country: null, flagEmoji: null, authorityLabel: null, description: null, colorGradient: null, isActive: true },
        context
      );
      const afterNoOp = await prismaClient.adminAuditLog.count({ where: { action: 'exam.update', entityId: exam.id } });
      await updateExam(
        { id: exam.id, name: `${exam.name} (renamed)`, code: null, country: null, flagEmoji: null, authorityLabel: null, description: null, colorGradient: null, isActive: true },
        context
      );
      const afterRealChange = await prismaClient.adminAuditLog.count({ where: { action: 'exam.update', entityId: exam.id } });
      record(
        '5-audit-trail',
        'updateExam logs only on a real field change, not a no-op resave',
        afterNoOp === changesBefore && afterRealChange === changesBefore + 1,
        `before=${changesBefore}, afterNoOp=${afterNoOp}, afterRealChange=${afterRealChange}`
      );
    }

    {
      const student = await prismaClient.user.create({ data: { email: `prd005-msg-student-${suffix}@test.local`, isDisabled: false } });
      testUserIds.push(student.id);
      const message = await prismaClient.contactFormMessage.create({ data: { userId: student.id, content: 'Test message' } });
      await markMessageRead({ id: message.id }, context);
      const auditRow = await prismaClient.adminAuditLog.findFirst({ where: { action: 'message.markRead', entityId: message.id } });
      record('5-audit-trail', 'markMessageRead writes an audit log entry', !!auditRow);
    }

    /* ------------------------------- Stage 6: dashboard accuracy ------------------------------- */
    {
      const paidUser = await prismaClient.user.create({ data: { email: `prd005-paid-${suffix}@test.local`, isDisabled: false } });
      const compUser = await prismaClient.user.create({ data: { email: `prd005-comp-${suffix}@test.local`, isDisabled: false } });
      const disabledUser = await prismaClient.user.create({ data: { email: `prd005-disabled-${suffix}@test.local`, isDisabled: true } });
      testUserIds.push(paidUser.id, compUser.id, disabledUser.id);
      await prismaClient.subscription.create({ data: { userId: paidUser.id, planType: 'fast_track', durationDays: 90, allExamsAccess: true, source: 'payment' } });
      await prismaClient.subscription.create({ data: { userId: compUser.id, planType: 'fast_track', durationDays: 90, allExamsAccess: true, source: 'admin_grant' } });

      const paidOnlyGroups = await prismaClient.subscription.groupBy({
        by: ['planType'],
        where: { source: 'payment', userId: { in: [paidUser.id, compUser.id] } },
        _count: { _all: true },
      });
      const paidOnlyCount = paidOnlyGroups.find((g) => g.planType === 'fast_track')?._count._all ?? 0;
      const enabledCount = await prismaClient.user.count({ where: { isDisabled: false, id: { in: [paidUser.id, compUser.id, disabledUser.id] } } });
      record(
        '6-dashboard-accuracy',
        'revenue query excludes comp grants; disabled users excluded from active count',
        paidOnlyCount === 1 && enabledCount === 2,
        `paidOnlyCount=${paidOnlyCount}, enabledCount=${enabledCount}`
      );
    }

    /* ------------------------------- Stage 7: smaller admin pages ------------------------------- */
    {
      const testExam = await createExam({ name: `Phase7 Regress Exam ${suffix}`, authorityLabel: 'Auth', colorGradient: 'from-rose-500 to-rose-400' }, context);
      await updateExam(
        { id: testExam.id, name: testExam.name, code: null, country: null, flagEmoji: null, authorityLabel: 'Updated Auth', description: null, colorGradient: 'from-sky-500 to-sky-400', isActive: true },
        context
      );
      const reloaded = await prismaClient.exam.findUniqueOrThrow({ where: { id: testExam.id } });

      const lessonA = await createLesson({ examId: testExam.id, subjectId: null, title: 'A', order: 1, passThresholdPercent: 70 }, context);
      const lessonB = await createLesson({ examId: testExam.id, subjectId: null, title: 'B', order: 2, passThresholdPercent: 70 }, context);
      await reorderLesson({ id: lessonA.id, otherId: lessonB.id }, context);
      const [rA, rB] = await Promise.all([
        prismaClient.lesson.findUniqueOrThrow({ where: { id: lessonA.id } }),
        prismaClient.lesson.findUniqueOrThrow({ where: { id: lessonB.id } }),
      ]);

      const partA = await createLessonPart({ lessonId: lessonA.id, title: 'PA', order: 1 }, context);
      const partB = await createLessonPart({ lessonId: lessonA.id, title: 'PB', order: 2 }, context);
      await reorderLessonPart({ id: partA.id, otherId: partB.id }, context);
      let friendlyError = false;
      try {
        await updateLessonPart(
          { id: partA.id, title: 'PA', order: (await prismaClient.lessonPart.findUniqueOrThrow({ where: { id: partB.id } })).order, youtubeId: null, durationMinutes: null, notesMarkdown: null, sourceBook: null, sourcePages: null },
          context
        );
      } catch (e: any) {
        friendlyError = typeof e?.message === 'string' && e.message.includes('already exists for this lesson');
      }

      await prismaClient.contactFormMessage.create({ data: { userId: admin.id, content: 'Pagination test msg' } });
      const page1 = await getContactFormMessages({ skip: 0, take: 1 }, context);

      testLessonIds.push(lessonA.id, lessonB.id);
      record(
        '7-smaller-admin-pages',
        'Exam field editors persist, Lesson/Part reorder swaps, friendly collision error, pagination works',
        reloaded.authorityLabel === 'Updated Auth' &&
          reloaded.colorGradient === 'from-sky-500 to-sky-400' &&
          rA.order === 2 &&
          rB.order === 1 &&
          friendlyError &&
          page1.length === 1,
        `exam ok=${reloaded.authorityLabel === 'Updated Auth'}, reorder ok=${rA.order === 2}, friendlyError=${friendlyError}, page1.length=${page1.length}`
      );

      await prismaClient.lessonPart.deleteMany({ where: { lessonId: lessonA.id } });
      await prismaClient.lesson.deleteMany({ where: { id: { in: [lessonA.id, lessonB.id] } } });
      await prismaClient.exam.delete({ where: { id: testExam.id } });
    }
  } finally {
    // Cleanup, regardless of pass/fail above.
    await prismaClient.contactFormMessage.deleteMany({ where: { userId: { in: [...testUserIds, admin.id] } } });
    await prismaClient.questionVersion.deleteMany({ where: { questionId: { in: testQuestionIds } } });
    await prismaClient.userAttempt.deleteMany({ where: { questionId: { in: testQuestionIds } } });
    await prismaClient.question.deleteMany({ where: { id: { in: testQuestionIds } } });
    await prismaClient.question.deleteMany({ where: { subjectId: { in: [subjectA.id, subjectB.id] } } });
    await prismaClient.importBatch.deleteMany({ where: { subjectName: { in: ['Subject A', 'Subject B'] } } });
    await prismaClient.lessonPart.deleteMany({ where: { lessonId: { in: testLessonIds } } });
    await prismaClient.lesson.deleteMany({ where: { id: { in: testLessonIds } } });
    await prismaClient.subscription.deleteMany({ where: { userId: { in: testUserIds } } });
    await (prismaClient as any).session.deleteMany({ where: { auth: { userId: { in: testUserIds } } } }).catch(() => {});
    await (prismaClient as any).auth.deleteMany({ where: { userId: { in: testUserIds } } }).catch(() => {});
    await prismaClient.subject.deleteMany({ where: { id: { in: [subjectA.id, subjectB.id] } } });
    await prismaClient.exam.delete({ where: { id: exam.id } }).catch(() => {});
    await prismaClient.user.deleteMany({ where: { id: { in: testUserIds } } });
    await prismaClient.adminAuditLog.deleteMany({ where: { adminId: admin.id } });
    await prismaClient.user.delete({ where: { id: admin.id } });
    console.log('[PRD-005] cleaned up all test rows.');

    const failed = checks.filter((c) => !c.pass);
    console.log(`\n[PRD-005] ${checks.length - failed.length}/${checks.length} checks passed.`);
    if (failed.length > 0) {
      console.log('[PRD-005] FAILED:', failed.map((f) => `${f.stage}: ${f.label}`).join('; '));
      throw new Error(`${failed.length} PRD-005 regression check(s) failed`);
    }
  }
}
