import { prisma } from 'wasp/server';

type LogAdminActionArgs = {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
};

// Uses the raw prisma client rather than context.entities.AdminAuditLog so
// callers don't need AdminAuditLog added to their action's `entities:` list
// in main.wasp just to write a side log. Never throws -- a failed audit write
// should never take down the admin action it's describing.
export async function logAdminAction(
  context: { user?: { id: string } | null | undefined },
  args: LogAdminActionArgs
): Promise<void> {
  if (!context.user) return;
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: context.user.id,
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId,
        details: args.details as any,
      },
    });
  } catch (e) {
    console.error('Failed to write admin audit log', args, e);
  }
}
