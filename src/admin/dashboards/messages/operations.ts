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

// Admin inbox list -- unread first, then newest first within each group.
export const getContactFormMessages: GetContactFormMessages<void, ContactFormMessageWithSender[]> = async (
  _args,
  context
) => {
  ensureAdmin(context.user);
  return context.entities.ContactFormMessage.findMany({
    include: { user: { select: { email: true, username: true } } },
    orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
  });
};

const messageIdInputSchema = z.object({ id: z.string().nonempty() });
type MessageIdInput = z.infer<typeof messageIdInputSchema>;

export const markMessageRead: MarkMessageRead<MessageIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(messageIdInputSchema, rawArgs);
  await context.entities.ContactFormMessage.update({ where: { id: args.id }, data: { isRead: true } });
};

export const markMessageReplied: MarkMessageReplied<MessageIdInput, void> = async (rawArgs, context) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(messageIdInputSchema, rawArgs);
  await context.entities.ContactFormMessage.update({
    where: { id: args.id },
    data: { isRead: true, repliedAt: new Date() },
  });
};

export const getUnreadMessageCount: GetUnreadMessageCount<void, number> = async (_args, context) => {
  ensureAdmin(context.user);
  return context.entities.ContactFormMessage.count({ where: { isRead: false } });
};
