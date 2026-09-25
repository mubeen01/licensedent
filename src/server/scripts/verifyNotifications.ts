import type { PrismaClient } from '@prisma/client';
import {
  createNotification,
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../notifications/operations';

/**
 * Notification system live check: creates real Notification rows for a real launch account via
 * the same createNotification() helper every event site (fast-track decision, message replied,
 * plan activated, plan expiring) calls, then exercises the query/action operations exactly as the
 * client would. Cleans up every row it creates. Safe to rerun.
 *
 *   wasp db seed verifyNotifications
 */
export async function verifyNotifications(prisma: PrismaClient) {
  const results: [string, string][] = [];
  const check = (label: string, outcome: string) => {
    results.push([label, outcome]);
    console.log(`[verify-notifications] ${label}: ${outcome}`);
  };

  const testUser = await prisma.user.findFirst({ where: { email: 'riza@licensedent.com' } });
  if (!testUser) {
    throw new Error('riza@licensedent.com not found -- run seedLaunchAccounts first.');
  }
  const user = { id: testUser.id, isAdmin: false };
  const entities = { Notification: prisma.notification };
  const context = { user, entities };

  const createdIds: string[] = [];
  try {
    // 1. createNotification() -- the exact helper every event site calls.
    await createNotification(entities, {
      userId: user.id,
      type: 'fast_track_decision',
      title: 'Verify: Fast Track approved',
      body: 'Self-test row, safe to ignore.',
      link: '/fast-track/apply',
    });
    await createNotification(entities, {
      userId: user.id,
      type: 'message_replied',
      title: 'Verify: message replied',
      body: 'Self-test row, safe to ignore.',
      link: '/account',
    });
    const rows = await prisma.notification.findMany({ where: { userId: user.id, title: { startsWith: 'Verify:' } } });
    createdIds.push(...rows.map((r) => r.id));
    check('createNotification x2', rows.length === 2 ? 'correctly created 2 rows' : `unexpected ${rows.length}`);

    // 2. getMyUnreadNotificationCount -- should see both as unread.
    const unreadBefore = await getMyUnreadNotificationCount(undefined, context as any);
    check('unread count before read', unreadBefore >= 2 ? `${unreadBefore} (>=2 ok)` : `unexpected ${unreadBefore}`);

    // 3. getMyNotifications -- should list them, newest first.
    const list = await getMyNotifications({ take: 5 }, context as any);
    check('getMyNotifications returns rows', list.length > 0 ? `${list.length} row(s)` : 'unexpectedly empty');

    // 4. markNotificationRead -- flips exactly one row, and is a no-op for another user's id.
    await markNotificationRead({ id: createdIds[0] }, context as any);
    const afterOneRead = await prisma.notification.findUnique({ where: { id: createdIds[0] } });
    check('markNotificationRead flips isRead', afterOneRead?.isRead === true ? 'correctly true' : 'still false');

    const otherUser = await prisma.user.findFirst({ where: { id: { not: user.id } } });
    if (otherUser) {
      const foreignRow = await prisma.notification.create({
        data: { userId: otherUser.id, type: 'plan_activated', title: 'Verify: not yours', body: 'x' },
      });
      createdIds.push(foreignRow.id);
      await markNotificationRead({ id: foreignRow.id }, context as any);
      const stillUnread = await prisma.notification.findUnique({ where: { id: foreignRow.id } });
      check(
        "markNotificationRead ignores another user's row",
        stillUnread?.isRead === false ? 'correctly untouched' : 'LEAKED -- marked another user\'s notification read'
      );
    }

    // 5. markAllNotificationsRead -- flips everything remaining for this user.
    await markAllNotificationsRead(undefined, context as any);
    const unreadAfter = await getMyUnreadNotificationCount(undefined, context as any);
    check('markAllNotificationsRead clears unread', unreadAfter === 0 ? 'correctly 0' : `unexpected ${unreadAfter}`);
  } finally {
    if (createdIds.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: createdIds } } });
    }
  }

  const failed = results.filter(([, outcome]) => /unexpected|LEAKED|still|empty/i.test(outcome));
  console.log(`[verify-notifications] ${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length > 0) {
    throw new Error(`verifyNotifications: ${failed.length} check(s) failed -- see log above.`);
  }
}
