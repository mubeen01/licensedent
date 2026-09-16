import { HttpError } from 'wasp/server';
import { type OnBeforeLoginHook } from 'wasp/server/auth';

export const onBeforeLoginHook: OnBeforeLoginHook = async ({ user, prisma }) => {
  if (user.isDisabled) {
    throw new HttpError(403, 'This account has been disabled. Contact support if you think this is a mistake.');
  }
  // Fire-and-forget: a stalled write here shouldn't ever block a real login.
  prisma.user
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date(), loginCount: { increment: 1 } } })
    .catch((e) => {
      console.error('Failed to stamp lastLoginAt', e);
    });
};
