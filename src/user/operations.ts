import { type Prisma } from '@prisma/client';
import { type User } from 'wasp/entities';
import { HttpError, prisma } from 'wasp/server';
import { type GetPaginatedUsers, type UpdateIsUserAdminById } from 'wasp/server/operations';
import * as z from 'zod';
import { SubscriptionStatus } from '../payment/plans';
import { logAdminAction } from '../server/adminAudit';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

const updateUserAdminByIdInputSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean(),
});

type UpdateUserAdminByIdInput = z.infer<typeof updateUserAdminByIdInputSchema>;

export const updateIsUserAdminById: UpdateIsUserAdminById<UpdateUserAdminByIdInput, User> = async (
  rawArgs,
  context
) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(updateUserAdminByIdInputSchema, rawArgs);

  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const before = await context.entities.User.findUniqueOrThrow({ where: { id } });
  const updated = await context.entities.User.update({
    where: { id },
    data: { isAdmin },
  });

  await logAdminAction(context, {
    action: 'user.setAdmin',
    entityType: 'User',
    entityId: id,
    details: { email: before.email, from: before.isAdmin, to: isAdmin },
  });

  return updated;
};

type GetPaginatedUsersOutput = {
  users: (Pick<
    User,
    | 'id'
    | 'email'
    | 'username'
    | 'subscriptionStatus'
    | 'paymentProcessorUserId'
    | 'isAdmin'
    | 'isDisabled'
    | 'lastLoginAt'
    | 'createdAt'
    | 'tags'
  > & {
    subscriptions: { id: string; planType: string; durationDays: number; createdAt: Date }[];
  })[];
  totalPages: number;
};

const userSortFieldSchema = z.enum(['username', 'createdAt', 'lastLoginAt']);

const getPaginatorArgsSchema = z.object({
  skipPages: z.number(),
  filter: z.object({
    emailContains: z.string().nonempty().optional(),
    isAdmin: z.boolean().optional(),
    subscriptionStatusIn: z.array(z.nativeEnum(SubscriptionStatus).nullable()).optional(),
    tags: z.array(z.string()).optional(),
  }),
  sortBy: userSortFieldSchema.default('username'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

type GetPaginatedUsersInput = z.infer<typeof getPaginatorArgsSchema>;

export const getPaginatedUsers: GetPaginatedUsers<GetPaginatedUsersInput, GetPaginatedUsersOutput> = async (
  rawArgs,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const {
    skipPages,
    filter: { subscriptionStatusIn: subscriptionStatus, emailContains, isAdmin, tags },
    sortBy,
    sortDir,
  } = ensureArgsSchemaOrThrowHttpError(getPaginatorArgsSchema, rawArgs);

  const includeUnsubscribedUsers = !!subscriptionStatus?.some((status) => status === null);
  const desiredSubscriptionStatuses = subscriptionStatus?.filter((status) => status !== null);

  const pageSize = 10;

  const userPageQuery = {
    skip: skipPages * pageSize,
    take: pageSize,
    where: {
      AND: [
        {
          OR: emailContains
            ? [
                { email: { contains: emailContains, mode: 'insensitive' } },
                { username: { contains: emailContains, mode: 'insensitive' } },
              ]
            : undefined,
          isAdmin,
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: desiredSubscriptionStatuses,
              },
            },
            {
              subscriptionStatus: includeUnsubscribedUsers ? null : undefined,
            },
          ],
        },
        {
          tags: tags && tags.length > 0 ? { hasSome: tags } : undefined,
        },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      isDisabled: true,
      lastLoginAt: true,
      createdAt: true,
      tags: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true,
      subscriptions: {
        select: { id: true, planType: true, durationDays: true, createdAt: true },
      },
    },
    orderBy: {
      [sortBy]: sortDir,
    },
  } satisfies Prisma.UserFindManyArgs;

  const [pageOfUsers, totalUsers] = await prisma.$transaction([
    context.entities.User.findMany(userPageQuery),
    context.entities.User.count({ where: userPageQuery.where }),
  ]);
  const totalPages = Math.ceil(totalUsers / pageSize);

  return {
    users: pageOfUsers,
    totalPages,
  };
};
