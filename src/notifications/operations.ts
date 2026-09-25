import { type Notification } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type GetMyNotifications,
  type GetMyUnreadNotificationCount,
  type MarkAllNotificationsRead,
  type MarkNotificationRead,
} from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

export type NotificationType = 'message_replied' | 'fast_track_decision' | 'plan_activated' | 'plan_expiring';

// Single write path for every notification this app creates -- called from the same event sites
// that already fire the corresponding email (fast-track decision, message replied, plan activated,
// plan expiring), never from the client. Best-effort by convention: callers wrap this the same way
// they already wrap sendEmail(), so a DB hiccup here can't undo the real action that triggered it.
export async function createNotification(
  entities: { Notification: { create: (args: { data: { userId: string; type: NotificationType; title: string; body: string; link?: string } }) => Promise<Notification> } },
  args: { userId: string; type: NotificationType; title: string; body: string; link?: string }
): Promise<void> {
  await entities.Notification.create({ data: args });
}

const listInputSchema = z.object({
  take: z.number().int().min(1).max(50).default(20),
});
type ListInput = z.infer<typeof listInputSchema>;

export const getMyNotifications: GetMyNotifications<ListInput | void, Notification[]> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const { take } = ensureArgsSchemaOrThrowHttpError(listInputSchema, rawArgs ?? {});
  return context.entities.Notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take,
  });
};

export const getMyUnreadNotificationCount: GetMyUnreadNotificationCount<void, number> = async (_args, context) => {
  const user = ensureUser(context.user);
  return context.entities.Notification.count({ where: { userId: user.id, isRead: false } });
};

const notificationIdInputSchema = z.object({ id: z.string().nonempty() });
type NotificationIdInput = z.infer<typeof notificationIdInputSchema>;

export const markNotificationRead: MarkNotificationRead<NotificationIdInput, void> = async (rawArgs, context) => {
  const user = ensureUser(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(notificationIdInputSchema, rawArgs);
  // updateMany (not update) so a notification id that isn't this user's silently no-ops
  // instead of leaking a 404 that would confirm/deny another user's row exists.
  await context.entities.Notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
};

export const markAllNotificationsRead: MarkAllNotificationsRead<void, void> = async (_args, context) => {
  const user = ensureUser(context.user);
  await context.entities.Notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
};
