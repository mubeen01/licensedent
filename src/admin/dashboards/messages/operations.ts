import { type ContactFormMessage } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type CreateContactFormMessage,
  type GetContactFormMessages,
  type GetUnreadMessageCount,
  type MarkMessageRead,
  type MarkMessageReplied,
} from 'wasp/server/operations';
import * as z from 'zod';
import { createNotification } from '../../../notifications/operations';
import { logAdminAction } from '../../../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';

function ensureUser<T extends { id: string } | undefined>(user: T): NonNullable<T> {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  return user as NonNullable<T>;
}

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

const createContactFormMessageInputSchema = z.object({ content: z.string().trim().min(1).max(4000) });
type CreateContactFormMessageInput = z.infer<typeof createContactFormMessageInputSchema>;

// Any logged-in student can send one -- this is the "Contact support" card on
// AccountPage, the only entry point into ContactFormMessage today.
export const createContactFormMessage: CreateContactFormMessage<CreateContactFormMessageInput, void> = async (
  rawArgs,
  context
) => {
  const user = ensureUser(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(createContactFormMessageInputSchema, rawArgs);

  await context.entities.ContactFormMessage.create({
    data: { userId: user.id, content: args.content },
  });
};

export type ContactFormMessageWithSender = ContactFormMessage & {
  user: { email: string | null; username: string | null };
};

const getContactFormMessagesInputSchema = z.object({
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(50),
});
type GetContactFormMessagesInput = z.infer<typeof getContactFormMessagesInputSchema>;

// Admin inbox list -- unread first, then newest first within each group.
// Paginated (matching the Audit Log page's 50-row paging) -- previously
// loaded every message in the table on every visit, unbounded.
export const getContactFormMessages: GetContactFormMessages<
  GetContactFormMessagesInput | void,
  ContactFormMessageWithSender[]
> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getContactFormMessagesInputSchema, rawArgs ?? {});
  return context.entities.ContactFormMessage.findMany({
    include: { user: { select: { email: true, username: true } } },
    orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    skip: args.skip,
    take: args.take,
  });
};

const messageIdInputSchema = z.object({ id: z.string().nonempty() });
type MessageIdInput = z.infer<typeof messageIdInputSchema>;

export const markMessageRead: MarkMessageRead<MessageIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(messageIdInputSchema, rawArgs);
  const message = await context.entities.ContactFormMessage.update({
    where: { id: args.id },
    data: { isRead: true },
  });
  await logAdminAction(context, {
    action: 'message.markRead',
    entityType: 'ContactFormMessage',
    entityId: args.id,
    details: { userId: message.userId, content: message.content.slice(0, 200) },
  });
};

export const markMessageReplied: MarkMessageReplied<MessageIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(messageIdInputSchema, rawArgs);
  const message = await context.entities.ContactFormMessage.update({
    where: { id: args.id },
    data: { isRead: true, repliedAt: new Date() },
  });
  await logAdminAction(context, {
    action: 'message.markReplied',
    entityType: 'ContactFormMessage',
    entityId: args.id,
    details: { userId: message.userId, content: message.content.slice(0, 200) },
  });
  // The actual reply goes out by email (this app has no in-app thread view yet) -- this is just
  // the "someone got back to you" signal for whoever's looking at the dashboard right now.
  try {
    await createNotification(
      { Notification: context.entities.Notification },
      {
        userId: message.userId,
        type: 'message_replied',
        title: 'We replied to your message',
        body: 'Check your email for our reply -- reach out again anytime from Contact.',
        link: '/account',
      }
    );
  } catch (err) {
    console.error('[messages] reply notification row failed:', err);
  }
};

export const getUnreadMessageCount: GetUnreadMessageCount<void, number> = async (_args, context) => {
  ensureAdmin(context.user);
  return context.entities.ContactFormMessage.count({ where: { isRead: false } });
};
