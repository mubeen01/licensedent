import { type AdminAuditLog, type User } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { type GetAdminAuditLog } from 'wasp/server/operations';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';

function ensureAdmin(user: { isAdmin: boolean } | undefined) {
  if (!user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }
  if (!user.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }
}

const getAdminAuditLogInputSchema = z.object({
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(100).default(50),
  entityType: z.string().nonempty().optional(),
  entityId: z.string().nonempty().optional(),
});
type GetAdminAuditLogInput = z.infer<typeof getAdminAuditLogInputSchema>;

export type AdminAuditLogEntry = AdminAuditLog & { admin: Pick<User, 'id' | 'email' | 'username'> };

export const getAdminAuditLog: GetAdminAuditLog<GetAdminAuditLogInput, AdminAuditLogEntry[]> = async (
  rawArgs,
  context
) => {
  ensureAdmin(context.user);
  const args = ensureArgsSchemaOrThrowHttpError(getAdminAuditLogInputSchema, rawArgs);

  return context.entities.AdminAuditLog.findMany({
    where: {
      ...(args.entityType && { entityType: args.entityType }),
      ...(args.entityId && { entityId: args.entityId }),
    },
    orderBy: { createdAt: 'desc' },
    skip: args.skip,
    take: args.take,
    include: { admin: { select: { id: true, email: true, username: true } } },
  });
};
