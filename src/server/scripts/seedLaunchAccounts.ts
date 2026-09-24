import { type PrismaClient } from '@prisma/client';
import {
  createProviderId,
  createUser,
  findAuthIdentity,
  getProviderDataWithPassword,
  sanitizeAndSerializeProviderData,
  updateAuthIdentityProviderData,
} from 'wasp/server/auth';

/**
 * Launch accounts (owner request 2026-09-24): 2 admins + 2 full-access
 * student accounts, identical in dev and production.
 *
 * Run once per database (local, then Railway after deploy):
 *   LAUNCH_ACCOUNTS_PASSWORD='...' wasp db seed seedLaunchAccounts
 * (locally the password is read from .env.server, which is gitignored --
 * it must never be written into this file, docs or a commit).
 *
 * Idempotent: an existing account keeps its id and history; the script
 * re-applies isAdmin/tags, re-verifies the email, resets the password to
 * LAUNCH_ACCOUNTS_PASSWORD, and only adds a grant the user doesn't already
 * hold. Admins get both passes because admin status alone does not unlock
 * paid content (payment/access.ts only reads Subscription rows).
 *
 * Grants are admin_grant rows with an explicit expiresAt of GRANT_EXPIRES_AT,
 * so they behave like a bought pass that simply doesn't run out.
 */

type Grant = 'extended' | 'ireland_pathway';

const GRANT_EXPIRES_AT = new Date('2036-12-31T23:59:59Z');
const GRANT_DURATION_DAYS = 3650;

const ACCOUNTS: { email: string; isAdmin: boolean; tags: string[]; grants: Grant[] }[] = [
  { email: 'rubi@licensedent.com', isAdmin: true, tags: ['owner'], grants: ['extended', 'ireland_pathway'] },
  { email: 'mubeen.mohd1@gmail.com', isAdmin: true, tags: ['admin'], grants: ['extended', 'ireland_pathway'] },
  // Gulf / General Dentist: Extended = every Gulf exam.
  { email: 'rida@licensedent.com', isAdmin: false, tags: ['staff-test'], grants: ['extended'] },
  // IDC Ireland: IDC Pathway, fixed to the IDC exam.
  { email: 'riza@licensedent.com', isAdmin: false, tags: ['staff-test'], grants: ['ireland_pathway'] },
];

export async function seedLaunchAccounts(prismaClient: PrismaClient) {
  const password = process.env.LAUNCH_ACCOUNTS_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Set LAUNCH_ACCOUNTS_PASSWORD (min 8 chars) in the environment or .env.server first.');
  }

  const idcExam = await prismaClient.exam.findFirst({ where: { code: 'IDC' }, select: { id: true } });
  if (!idcExam) {
    throw new Error('IDC exam not found -- load content into this database before creating accounts.');
  }

  for (const account of ACCOUNTS) {
    const email = account.email.toLowerCase();
    const providerId = createProviderId('email', email);
    const existingIdentity = await findAuthIdentity(providerId);

    let userId: string;
    if (existingIdentity) {
      await updateAuthIdentityProviderData<'email'>(
        providerId,
        getProviderDataWithPassword<'email'>(existingIdentity.providerData),
        { hashedPassword: password, isEmailVerified: true }
      );
      const auth = await prismaClient.auth.findUniqueOrThrow({ where: { id: existingIdentity.authId } });
      userId = auth.userId!;
      console.log(`  ${email}: exists, password reset + verified`);
    } else {
      const providerData = await sanitizeAndSerializeProviderData<'email'>({
        hashedPassword: password,
        isEmailVerified: true,
        emailVerificationSentAt: null,
        passwordResetSentAt: null,
      });
      const created = await createUser(providerId, providerData, { email, username: email } as any);
      userId = created.id;
      console.log(`  ${email}: created`);
    }

    await prismaClient.user.update({
      where: { id: userId },
      data: { isAdmin: account.isAdmin, isDisabled: false, tags: account.tags },
    });

    for (const grant of account.grants) {
      const already = await prismaClient.subscription.findFirst({
        where: { userId, planType: grant, source: 'admin_grant', expiresAt: { gte: GRANT_EXPIRES_AT } },
      });
      if (already) continue;
      await prismaClient.subscription.create({
        data: {
          userId,
          planType: grant,
          durationDays: GRANT_DURATION_DAYS,
          allExamsAccess: grant === 'extended',
          examAccessId: grant === 'ireland_pathway' ? idcExam.id : null,
          source: 'admin_grant',
          expiresAt: GRANT_EXPIRES_AT,
        },
      });
      console.log(`    + ${grant} until ${GRANT_EXPIRES_AT.toISOString().slice(0, 10)}`);
    }
  }
}
