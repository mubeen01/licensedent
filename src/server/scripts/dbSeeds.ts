import { type User } from 'wasp/entities';
import { faker } from '@faker-js/faker';
import type { PrismaClient } from '@prisma/client';
import { PaymentPlanId, SubscriptionStatus } from '../../payment/plans';

type MockUserData = Omit<User, 'id'>;

/**
 * This function, which we've imported in `app.db.seeds` in the `main.wasp` file,
 * seeds the database with mock users via the `wasp db seed` command.
 * For more info see: https://wasp.sh/docs/data-model/backends#seeding-the-database
 */
export async function seedMockUsers(prismaClient: PrismaClient) {
  await Promise.all(generateMockUsersData(50).map((data) => prismaClient.user.create({ data })));
}

function generateMockUsersData(numOfUsers: number): MockUserData[] {
  return faker.helpers.multiple(generateMockUserData, { count: numOfUsers });
}

function generateMockUserData(): MockUserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const subscriptionStatus = faker.helpers.arrayElement<SubscriptionStatus | null>([
    ...Object.values(SubscriptionStatus),
    null,
  ]);
  const now = new Date();
  const createdAt = faker.date.past({ refDate: now });
  const timePaid = faker.date.between({ from: createdAt, to: now });
  const credits = subscriptionStatus ? 0 : faker.number.int({ min: 0, max: 10 });
  const hasUserPaidOnStripe = !!subscriptionStatus || credits > 3;
  return {
    email: faker.internet.email({ firstName, lastName }),
    username: faker.internet.userName({ firstName, lastName }),
    createdAt,
    isAdmin: false,
    isDisabled: false,
    lastLoginAt: null,
    loginCount: 0,
    tags: [],
    credits,
    subscriptionStatus,
    lemonSqueezyCustomerPortalUrl: null,
    paymentProcessorUserId: hasUserPaidOnStripe ? `cus_test_${faker.string.uuid()}` : null,
    datePaid: hasUserPaidOnStripe ? faker.date.between({ from: createdAt, to: timePaid }) : null,
    subscriptionPlan: subscriptionStatus ? faker.helpers.arrayElement(Object.values(PaymentPlanId)) : null,
  };
}

/**
 * PRD-007: one-time migration, run once via `wasp db seed migrateBlogPostsFromMarkdown`.
 * Moves the 2 posts that existed as hand-edited markdown files in the now-
 * retired blog/ Astro site into the new BlogPost table -- content copied
 * verbatim (no rewriting), status/dates matching what each file's own
 * frontmatter already said. Safe to re-run: skips a slug that already exists.
 */
export async function migrateBlogPostsFromMarkdown(prismaClient: PrismaClient) {
  const posts = [
    {
      slug: 'how-many-questions-dha-exam',
      title: 'How Many Questions Are on the DHA Exam? (2026 Format Explained)',
      excerpt:
        "The DHA General Dentist exam, straight from DHA's own current CBT Assessment Guideline: question count, timing, pass score, and how the attempt limit actually works.",
      tags: ['dha', 'exam-format', 'dubai'],
      status: 'published' as const,
      publishedAt: new Date('2026-09-16'),
      bodyMarkdown: `If you're preparing for the Dubai Health Authority's dental licensing
exam, the first practical question is usually the simplest one: how many
questions, how much time, and what does it take to pass? Here's what
DHA's own current CBT Assessment Guideline actually says for the General
Dentist title (exam code **GEN5301**).

## The format

- **150 multiple-choice questions**, single best answer per question.
- **3 hours** total, and that window includes registration and
  instructions — not just time spent answering.
- Delivered as a computer-based test through Prometric
  (prometric.com/DHA).

## The pass score

DHA publishes the pass score outright for General Dentist: **60%**.
What DHA does *not* share is your own individual result — you'll only
ever see Pass or Fail in Sheryan, never your actual score or percentage.
Prometric separately issues a "Learning Outcome" report showing your
strengths and weaknesses by domain, which is useful for a re-sit but is
explicitly not your result.

## How many attempts do you actually get?

Three attempts per specialty — and this is the part candidates most
often get wrong: it's **pooled across MOH, HAAD/DOH and DHA**, not three
attempts per authority. Fail your third attempt and the default is a
two-year block on reapplying, though a fourth attempt is possible with
permission, or you can requalify for three new attempts sooner via an
additional recognized certificate or two years of clinical licensed
experience.

## What subject areas does GEN5301 actually test?

DHA's guideline covers domains including anesthesia and pain management,
endodontics, oral medicine/oral surgery, implant surgery, periodontics,
restorative dentistry, orthodontics/pediatric dentistry, and ethics,
among others. DHA weighs each domain when scoring but doesn't publish an
exact percentage breakdown per domain.

## Next steps

- Read the [full DHA exam guide](https://licensedent.com/exams/dha) for
  the complete 5-step licensing pathway (PQR → DataFlow → Sheryan →
  Prometric → result), plus the reschedule/cancellation rules and pass
  validity period.
- Try a [free demo exam](https://licensedent.com/demo-exam) — 20
  questions, 15 minutes, no account needed — to get a feel for the
  format before you book the real thing.

*Sourced from DHA's "Healthcare Professional Licensing Assessment
Guideline" (CBT), updated May 2026, and DHA's "Manual for Licensing
Healthcare Professionals" v1.2. Always cross-check against DHA's current
published guidance before booking — requirements can change.*`,
    },
    {
      slug: 'gulf-dental-exam-results-transfer',
      title: 'Does Your Dental Exam Result Transfer to Another Gulf Country?',
      excerpt:
        'DHA, HAAD, MOH, SMLE, QCHP, NHRA, OMSB, KMLE and SHA, side by side: which results are pooled together, and which authorities run completely independent systems.',
      tags: ['dha', 'haad', 'moh', 'smle', 'qchp', 'nhra', 'omsb', 'kmle', 'sha', 'comparison'],
      status: 'draft' as const,
      publishedAt: null,
      bodyMarkdown: `If you've sat — or failed — a dental licensing exam in one Gulf country,
the next question is almost always the same: does that result help or
hurt you anywhere else? The honest answer is that it depends entirely on
which country, and the mechanics aren't consistent across the region.
Here's what each authority's own current guidance actually says.

## The UAE cluster: DHA, HAAD/DOH and MOH share one pool

This is the one place in the region where attempts genuinely combine.
DHA, HAAD (DOH, Abu Dhabi) and MOH (UAE federal) share a single
three-attempts-per-specialty limit — sitting and failing the same
specialty at any one of the three uses up an attempt at **all three**,
not just the one you sat. Passing at one can also carry weight at
another: if you hold a valid or recently lapsed MOH license, meet the
target authority's PQR, and have a good-standing letter, you may qualify
for Licensure Recognition and be exempted from re-sitting for the same or
a lower title — confirm the specific criteria with the authority you're
applying to before assuming it covers you.

Fail your third pooled attempt and the default is a two-year block on
reapplying, though a fourth attempt is possible with permission, or you
can requalify for three new attempts sooner via an additional recognized
certificate or two years of clinical licensed experience.

## Everywhere else: independent systems, independent counters

Every other authority covered here runs its own attempt count, with no
recognition of results from the UAE cluster or from each other:

- **Qatar (QCHP/DHP)**: "No. Qatar's DHP runs its own independent
  licensing system with its own attempt counter — a UAE or Saudi result
  has no bearing on your Qatar application, and vice versa."
- **Bahrain (NHRA)**: "No. Bahrain's NHRA runs its own independent system
  with its own attempt counter — a result from another authority has no
  bearing here, and vice versa."
- **Oman (OMSB)**: "No — each system verifies credentials and counts
  attempts independently. A UAE or Saudi result has no bearing on your
  OMSB application."
- **Kuwait (KMLE/KDLE)**: "No — Kuwait's MOH runs its own independent
  system with its own attempt counter, entirely separate from the UAE,
  Saudi or Qatar."
- **Sharjah (SHA)**: the one genuine grey area. SHA's own attempt policy
  relative to DHA/MOH isn't clearly published the way DHA's is — don't
  assume either way, and check directly with SHA before relying on an
  assumption.

## Attempt limits also differ country by country

Even setting cross-recognition aside, "how many attempts do I get" isn't
a single Gulf-wide number:

| Country | Attempt limit |
|---|---|
| DHA / HAAD / MOH (pooled) | 3 per specialty, shared across all three |
| Saudi Arabia (SMLE/SDLE) | Up to 4/year, no repeat in the same window — 2 more allowed after passing, purely to improve your residency-selection mark |
| Bahrain (NHRA) | Up to 4 consecutive attempts within a rolling 3-year window from your first sitting |
| Kuwait (KMLE) | No widely reported overall cap; historically 3 per sponsoring employer — confirm current policy given 2023's sponsorship-rule changes |
| Oman (OMSB) | Not centrally published — confirm directly before booking |

## The one-line takeaway

If you're moving within the UAE (DHA ↔ HAAD ↔ MOH), your attempts and
sometimes your pass follow you. Moving to Saudi Arabia, Qatar, Bahrain,
Oman or Kuwait, treat it as starting over — a pass or fail anywhere else
carries no formal weight, and each system tracks you independently.

## Read the full guide for your exam

- [DHA (Dubai)](https://licensedent.com/exams/dha)
- [HAAD / DOH (Abu Dhabi)](https://licensedent.com/exams/haad)
- [MOH (UAE federal)](https://licensedent.com/exams/moh)
- [SHA (Sharjah)](https://licensedent.com/exams/sha)
- [SMLE / SDLE (Saudi Arabia)](https://licensedent.com/exams/smle)
- [QCHP (Qatar)](https://licensedent.com/exams/qchp)
- [NHRA (Bahrain)](https://licensedent.com/exams/nhra)
- [OMSB (Oman)](https://licensedent.com/exams/omsb)
- [KDLE / KMLE (Kuwait)](https://licensedent.com/exams/kmle)

*Every answer above is quoted directly from that exam's own guide on this
site, each independently sourced from that authority's current published
guidance. Requirements change — always confirm directly with the
authority you're applying to before making a decision based on this.*`,
    },
  ];

  for (const post of posts) {
    const exists = await prismaClient.blogPost.findUnique({ where: { slug: post.slug } });
    if (exists) {
      console.log(`[migrateBlogPostsFromMarkdown] Skipping "${post.slug}" -- already exists.`);
      continue;
    }
    await prismaClient.blogPost.create({ data: post });
    console.log(`[migrateBlogPostsFromMarkdown] Created "${post.slug}" (${post.status}).`);
  }
}
