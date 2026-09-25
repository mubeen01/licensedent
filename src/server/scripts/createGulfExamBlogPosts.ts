import type { PrismaClient } from '@prisma/client';

/**
 * 5 new blog posts, requested directly by the owner: "create few post on blog
 * which must be best real ... it should be pillar blog n inner pages linking
 * ... give 5 blog post full detailed ... related to the gulf exams." All
 * created as status: draft, per this project's standing AI-content rule
 * (AI drafts, human reviews and publishes from /admin/blog -- never
 * auto-published). Every fact below is quoted or paraphrased from the
 * already-reviewed exam guide content files (src/exam-pages/*Content.ts) --
 * nothing here is invented, matching the same discipline
 * migrateBlogPostsFromMarkdown and the existing drafted comparison post
 * already follow. Pillar + cluster structure: post 1 is the hub, linking to
 * all 9 exam guides and to posts 2-5; posts 2-5 link back to the pillar and
 * to each other where topically relevant. Some links between these 5 posts
 * will 404 for public readers until all 5 are published together (draft
 * posts aren't publicly reachable by slug) -- expected, not a bug; review
 * and publish as a set from /admin/blog.
 *
 *   wasp db seed createGulfExamBlogPosts
 *
 * Safe to rerun: skips any slug that already exists.
 */
export async function createGulfExamBlogPosts(prismaClient: PrismaClient) {
  const posts = [
    {
      slug: 'gulf-dental-licensing-exams-guide',
      title: 'Gulf Dental Licensing Exams: The Complete Guide for Foreign-Trained Dentists',
      excerpt:
        'A side-by-side guide to all nine Gulf dental licensing exams — DHA, HAAD/DOH, MOH, SMLE/SDLE, QCHP, OMSB, NHRA, KMLE/KDLE and SHA — covering DataFlow, format, pass marks and where to start.',
      tags: ['gulf-exams', 'dha', 'haad', 'moh', 'smle', 'qchp', 'omsb', 'nhra', 'kmle', 'sha'],
      status: 'draft' as const,
      publishedAt: null,
      bodyMarkdown: `If you trained outside the Gulf and want to practice dentistry inside it, the first thing that trips people up isn't the exam content — it's figuring out which exam you actually need to sit, and how the country you pick changes almost everything else about the process. Six countries in the Gulf Cooperation Council each run their own dental licensing exam (the UAE alone runs four, since three of its emirates — Dubai, Abu Dhabi and Sharjah — license separately from the federal system), and while they share a common DNA, the differences between them are big enough to change your timeline by months.

This is the map. Nine exams, one page, no guessing.

## The nine exams, at a glance

| Exam | Country / Emirate | Regulator | Delivery | Format | Pass mark |
|---|---|---|---|---|---|
| [DHA](https://licensedent.com/exams/dha) | Dubai, UAE | Dubai Health Authority | Prometric | 150 Qs, 3 hrs (GEN5301) | 60% |
| [HAAD (DOH)](https://licensedent.com/exams/haad) | Abu Dhabi, UAE | Department of Health – Abu Dhabi | Pearson VUE (since 2023) | 150 Qs | 60% overall + 60%+ in one of 3 key subjects |
| [MOH](https://licensedent.com/exams/moh) | UAE federal (Northern Emirates) | Ministry of Health & Prevention | Prometric-style CBT | Same core curriculum as DHA/DOH | Not published by percentage |
| [SMLE (SDLE)](https://licensedent.com/exams/smle) | Saudi Arabia | SCFHS | Prometric | 200 Qs, 2 blocks | Scaled score, pass = 542/800 |
| [QCHP (DHP)](https://licensedent.com/exams/qchp) | Qatar | Department of Healthcare Professions | Prometric | 150 Qs, 3.5 hrs | 60% |
| [OMSB](https://licensedent.com/exams/omsb) | Oman | Oman Medical Specialty Board + MOH | Pearson VUE (since 2023) | 100 Qs, 2.5 hrs + MOH viva | 65% |
| [NHRA](https://licensedent.com/exams/nhra) | Bahrain | National Health Regulatory Authority | Prometric | 150 Qs, 3 hrs | 60% |
| [KMLE (KDLE)](https://licensedent.com/exams/kmle) | Kuwait | Kuwait Ministry of Health | Prometric + in-person viva | 150 Qs, 3 hrs + viva | 60% |
| [SHA](https://licensedent.com/exams/sha) | Sharjah, UAE | Sharjah Health Authority | Prometric | 150 Qs, 3 hrs | Not published |

Every one of these is a real, separate application — passing one doesn't automatically qualify you anywhere else, and in most cases it doesn't even count as an attempt anywhere else. The one real exception is the UAE cluster, below.

## Step one for almost everyone: DataFlow

If you're applying to DHA, HAAD/DOH, MOH, SHA or (as of 2026) QCHP, the very first real hurdle isn't the exam — it's DataFlow Primary Source Verification, where your degree, license, experience letters and good-standing certificate get checked directly with the institutions that issued them. It's the single biggest source of delay in the entire process, mostly because it depends on how quickly a university registrar or a former employer replies to a verification request, not on anything you personally control.

Saudi Arabia, Oman and Bahrain don't use DataFlow at all — SCFHS, OMSB and NHRA each run their own independent verification through their own systems. Kuwait's process runs through its own Ministry of Health. We've written a full country-by-country breakdown of exactly who needs DataFlow and who doesn't in [DataFlow Verification for Gulf Dental Licensing, Exam by Exam](https://licensedent.com/blog/dataflow-verification-gulf-dental-exams).

## The UAE cluster is genuinely one system wearing four names

This is worth understanding before you pick a starting point. DHA (Dubai), HAAD/DOH (Abu Dhabi) and MOH (the federal authority covering the Northern Emirates) all sit on the same Professional Qualification Requirements framework, the same DataFlow verification chain, and — critically — the same shared attempt counter. Sit and fail the General Dentist exam at any one of the three, and you've used up an attempt at all three, not just the one you sat. You get three attempts total, not three per authority.

Sharjah's SHA sits on the same DataFlow network too, and a completed PSV report is often transferable between SHA, DHA, DOH and MOH — but SHA's own attempt policy relative to the other three isn't clearly published, so don't assume it's pooled the same way.

Because the four UAE exams are so closely related but not identical (different delivery vendors, different quirks in the pass rule, different license scope), we've written a direct comparison for the three most commonly confused: [DHA vs HAAD (DOH) vs MOH: What's Actually Different](https://licensedent.com/blog/dha-vs-haad-vs-moh-comparison). If Dubai specifically is your target, [DHA Eligibility: Who Can Actually Apply for a Dubai Dental License?](https://licensedent.com/blog/dha-eligibility-requirements) walks through the PQR and DataFlow steps in more depth than this overview can.

## Everywhere else runs its own independent system

Saudi Arabia's SDLE (still branded SMLE on some platforms, including this one) is the most structurally different exam on this list — it's the only one scored on a scaled 200-800 range rather than a percentage, the only one that lets you sit before you've formally graduated (final-year students one year out, or candidates in their internship year, are both eligible), and the only one where you're allowed to keep testing after you've already passed, purely to improve your score for residency selection. If Saudi Arabia is on your list, [SMLE vs SDLE: Same Saudi Dental Exam, Two Names](https://licensedent.com/blog/smle-vs-sdle-saudi-dental-exam) clears up the naming confusion and the format differences that actually matter.

Qatar's QCHP (now formally the Department of Healthcare Professions, though the exam kept its old name) is one of the more transparent authorities in the region — it publishes its 60% cut score outright and shows you your result the moment you finish, a real contrast with DHA's policy of never disclosing your actual score. The one thing to watch here is recent: DataFlow verification became mandatory for every QCHP applicant on 1 January 2026, with no exceptions, so don't assume an older account of the process from before that date still applies.

Oman's OMSB is a two-body process — OMSB itself handles the written Pearson VUE exam, but Oman's Ministry of Health separately runs a mandatory in-person viva in Muscat, held once a month for up to 30 candidates. Passing the written exam alone doesn't finish the process. OMSB also carries the highest published pass mark on this list at 65%, and weights Operative Dentistry, Oral Surgery and Endodontics unusually heavily — together they're worth 39% of the exam.

Bahrain's NHRA is arguably the most candidate-friendly system here on paper: no DataFlow step at all, immediate results the moment you finish, and a fully published attempt policy (four consecutive attempts within a three-year window, with a mandatory six-month retraining period if you fail all four). The tradeoff is that the eligibility code NHRA issues you is only valid for four months, so timing your booking matters more than it does elsewhere.

Kuwait's KDLE (branded KMLE on this platform) is the only exam in the region with a mandatory in-person viva on top of the written test for every candidate, not just an occasional requirement — and it asks for meaningfully more clinical experience up front, typically five to six years after a one-year internship. Employer sponsorship used to be mandatory before you could even book the written exam; that changed in September 2023, though it's worth confirming the current sponsorship rules for the viva and registration stage directly with Kuwait's Ministry of Health, since this is an area that's genuinely still evolving.

## So which one should you actually start with?

There's no universally correct answer, but the pattern that shows up most often among candidates is: pick the country where you already have a job offer, a family connection, or a genuine preference to live, and let that decide the exam — not the other way around. If you're specifically weighing the three UAE authorities against each other because you don't yet have a strong preference, that's exactly the decision our [DHA vs HAAD vs MOH comparison](https://licensedent.com/blog/dha-vs-haad-vs-moh-comparison) is built to help with, since the pooled-attempt rule means a wrong first guess there has a real cost.

Whichever exam you land on, the underlying dental knowledge being tested — restorative dentistry, endodontics, periodontics, oral surgery, pharmacology, the same core General Dentist curriculum most Gulf authorities draw from — overlaps heavily across all nine. That's really the point of building one platform instead of nine separate question banks: the exam-specific rules genuinely differ, the dentistry underneath them mostly doesn't.

*Every figure in this guide is pulled from each authority's own published guidance or independently corroborated sources — see each exam's individual guide for full citations. Requirements change; always confirm current details directly with the regulator before booking.*`,
    },
    {
      slug: 'dha-eligibility-requirements',
      title: 'DHA Eligibility: Who Can Actually Apply for a Dubai Dental License?',
      excerpt:
        "The real DHA eligibility path for General Dentists, straight from DHA's own PQR and licensing manuals: the self-assessment, DataFlow verification, and the Sheryan Eligibility ID.",
      tags: ['dha', 'eligibility', 'dubai'],
      status: 'draft' as const,
      publishedAt: null,
      bodyMarkdown: `"Am I even eligible for DHA?" is usually the first real question anyone asks before they spend a single dirham on the licensing process — and it's also the question most exam-prep sites answer vaguely, because the honest answer depends on documents and verification steps, not a simple checklist. Here's what the Dubai Health Authority's own current Manual for Licensing Healthcare Professionals and CBT Assessment Guideline actually require for the General Dentist title, not a generic "Gulf exam" assumption.

## It starts with the PQR, not the exam

DHA licensing runs on the Unified Healthcare Professional Qualification Requirements — usually just called the PQR — which have applied UAE-wide since October 2014. The PQR sets the minimum degree, home-country license, clinical experience and good-standing status you need to hold the General Dentist title in the first place. This is worth internalizing early: the exam itself is step four of a five-step process, not step one. If your qualifications don't meet the PQR, passing GEN5301 doesn't get you a license.

DHA's own advice, worth taking literally: run a self-assessment in Sheryan (DHA's online licensing portal) *before* you spend money on document verification. It costs nothing to check whether your degree and experience profile clears the bar, and it can save you from paying for a DataFlow verification cycle you didn't actually need yet.

## Step two: DataFlow Primary Source Verification

Once your self-assessment looks clear, DHA requires a positive Primary Source Verification (PSV) result from DataFlow before your application can move forward at all. This is the step that actually decides your timeline, and it has nothing to do with how well you know dentistry. DataFlow independently contacts your dental school, your previous licensing authority and your past employers to confirm your degree, your license, your experience letters and your good-standing certificate are genuine — directly with the institutions that issued them, not by trusting the copies you submit.

This is also where most delays genuinely happen, and it's largely out of your hands: a registrar's office that takes six weeks to reply to a verification request will hold up your entire application regardless of how prepared you are for the exam itself. If you already hold a DataFlow report from a different Gulf authority — HAAD/DOH, MOH or SHA, which all sit on the same shared DataFlow network — it's worth checking whether that report can be reused rather than paying for a second full verification cycle.

## Step three: Sheryan and your Eligibility ID

Once both your PQR self-assessment and your DataFlow PSV clear, DHA's Sheryan system issues you an Eligibility ID. This is the credential that actually lets you book a Prometric exam slot — without it, there's nothing to book. DHA's current published manuals don't commit to a fixed turnaround time for this step, which is a genuine gap in the public documentation; the honest advice is to confirm current timing directly inside your own Sheryan account rather than planning around a number nobody can currently verify for you.

## What "eligible" doesn't mean: recognition from another license

One eligibility shortcut worth knowing about: DHA's PQR includes licensure-recognition provisions for applicants who already hold a valid or recently cancelled MOHAP (MOH) or DOH (HAAD) license, plus a good-standing certificate, for the same or a lower title. In practice, this can mean skipping the GEN5301 exam entirely if you already hold one of those two UAE licenses in good standing. The exact current criteria live in Sheryan, not in a static document, so this is genuinely worth checking directly rather than assuming either way — DHA's guidance on this specific point changes without a lot of public fanfare.

## The exam itself, once you're eligible

For completeness: once you clear the three steps above, the General Dentist exam is 150 multiple-choice questions in a 3-hour session (that includes registration and instructions, not just answering time), booked at a Prometric centre through prometric.com/DHA, under exam code GEN5301. The published pass score is 60% — DHA discloses that outright, even though it never discloses your own individual result beyond a Pass/Fail in Sheryan. You get three attempts, but — and this catches people out constantly — that limit is pooled across DHA, HAAD/DOH and MOH combined, not three attempts at DHA specifically. Failing your third pooled attempt triggers a default two-year block on reapplying, with a couple of narrow ways to shorten that: a fourth attempt is possible with permission, or you can requalify for three brand-new attempts sooner by earning an additional recognized certificate or accumulating two years of clinical licensed experience since your last attempt.

## A pass doesn't stay valid forever, either

One eligibility detail that's easy to miss because it applies *after* you've already passed: a DHA pass stays valid for reassessment-exemption purposes for five years, but only if there's no gap in your clinical practice. If you had a practice gap and it's been more than two years since you passed, DHA requires a completely new assessment regardless of your original result — meaning "eligibility" isn't strictly a one-time checkbox even once you've cleared the exam.

## The realistic order of operations

Put together, the actual eligibility path looks like this: run a free self-assessment in Sheryan → check whether a licensure-recognition shortcut applies to you if you already hold a MOH or DOH license → get DataFlow PSV completed (or transferred from another UAE authority) → receive your Eligibility ID in Sheryan → book and sit GEN5301 at Prometric. Nothing about this sequence is exam-content-related, which is exactly why it's so often skipped over by prep resources that jump straight to subject weightings and sample questions.

If you're also weighing whether Dubai specifically is the right first UAE exam to sit — versus Abu Dhabi's HAAD/DOH or the federal MOH license — the pooled-attempt rule above means that decision is worth making deliberately rather than by default. Our [DHA vs HAAD vs MOH comparison](https://licensedent.com/blog/dha-vs-haad-vs-moh-comparison) walks through exactly what's different between the three. And for the full step-by-step licensing pathway once eligibility is confirmed, including the subject coverage GEN5301 actually tests, see the [complete DHA exam guide](https://licensedent.com/exams/dha).

*Sourced from DHA's "Healthcare Professional Licensing Assessment Guideline" (CBT), updated May 2026, and DHA's "Manual for Licensing Healthcare Professionals" v1.2, effective through 2030. Eligibility criteria can change — always confirm your specific case in Sheryan before paying for verification or booking an exam slot.*`,
    },
    {
      slug: 'dataflow-verification-gulf-dental-exams',
      title: 'DataFlow Verification for Gulf Dental Licensing: Exam by Exam',
      excerpt:
        "Which Gulf dental licensing authorities actually require DataFlow verification, which don't, and why the answer isn't the same everywhere — DHA, HAAD, MOH, SHA, QCHP, SMLE, OMSB, NHRA and KMLE compared.",
      tags: ['dataflow', 'dha', 'haad', 'moh', 'sha', 'qchp', 'smle', 'omsb', 'nhra', 'comparison'],
      status: 'draft' as const,
      publishedAt: null,
      bodyMarkdown: `Ask five different dentists whether they need DataFlow verification and you'll often get five different answers — and unlike a lot of licensing confusion, this one is genuinely justified, because the honest answer really does depend on which country you're applying to. DataFlow Primary Source Verification isn't a single Gulf-wide requirement; it's a specific service that some regulators mandate, some regulators don't use at all, and one regulator only started requiring in 2026. Here's exactly where each authority stands, sourced from each exam's own current guidance.

## What DataFlow actually verifies, and why it matters more than the exam itself early on

Before the country-by-country breakdown: DataFlow's Primary Source Verification process independently confirms your degree, your professional license, your experience letters and your good-standing certificate directly with the institutions that issued them — not by trusting the documents you submit, but by contacting the university, the former licensing authority and past employers themselves. Where it's required, it's routinely the single biggest source of delay in the entire licensing process, because the timeline depends on how quickly a foreign registrar's office responds, not on anything the candidate personally controls. If DataFlow is part of your path, budget real time for it — weeks, not days.

## Requires DataFlow: the UAE cluster, plus Qatar since 2026

**DHA (Dubai)** requires a positive DataFlow PSV result before your application can move forward at all — it's the second of DHA's own published five-step licensing process, sitting between the PQR self-assessment and the Sheryan Eligibility ID.

**HAAD/DOH (Abu Dhabi)** runs the identical PSV process against DOH's own version of the PQR — the same nationally standardized PSV process used for DHA and MOH applications.

**MOH (UAE federal)** verifies through DataFlow too, run through the same provider as DHA and DOH.

**SHA (Sharjah)** sits on the same DataFlow network as the other three UAE authorities, with a genuinely useful practical upside: a PSV report completed for DHA, DOH or MOH can often be transferred to SHA rather than redone from scratch, potentially saving a second 4-to-8-week verification cycle. Worth confirming with SHA directly before you pay for a second report you might not need.

**QCHP (Qatar, now formally the Department of Healthcare Professions)** is the one genuine recent change in this list: since 1 January 2026, under DHP Circular 2025/24, DataFlow PSV became mandatory for every applicant, with no exceptions. Before that date, it wasn't always required depending on scope of practice — if you're relying on older guidance about Qatar's process, this is the detail most likely to be out of date.

## Doesn't require DataFlow: Saudi Arabia, Oman, Bahrain and Kuwait

**SMLE/SDLE (Saudi Arabia)** runs entirely outside the DataFlow network. SCFHS is direct about it: Saudi Arabia isn't part of the UAE's DataFlow PSV network, and SCFHS verifies and processes applications independently through its own system. If you've already been DataFlow-verified for a UAE exam, that report has no bearing on your Saudi application.

**OMSB (Oman)** verifies credentials through its own registration process, independent of both DataFlow and SCFHS. OMSB isn't part of DataFlow's UAE network or SCFHS's Saudi system — your credentials get verified fresh through OMSB, even if you already have a DataFlow or SCFHS file elsewhere. Expect to submit your documents again even if you're already verified somewhere else in the region.

**NHRA (Bahrain)** is arguably the simplest system on this list procedurally: applications run entirely through NHRA's own Mehan portal, with no separate DataFlow-style third-party verification step the way there is for DHA or QCHP. Your documents go straight to NHRA for review.

**KMLE/KDLE (Kuwait)** verifies through Kuwait's own Ministry of Health rather than DataFlow, as part of a registration process that has genuinely evolved recently — most notably, the employer sponsorship that used to be mandatory before you could even book the written exam was dropped in September 2023 for the CBT stage.

## The pattern worth remembering

If you group it by geography rather than by exam name, the pattern is actually simple: every UAE authority (DHA, DOH, MOH, SHA) plus Qatar's QCHP use DataFlow. Saudi Arabia, Oman, Bahrain and Kuwait each run their own independent verification system instead. There's no partial overlap and no shared verification between the two groups — a DataFlow report doesn't help you at all outside the UAE-plus-Qatar cluster, and a Saudi, Omani, Bahraini or Kuwaiti application doesn't accept one even if you happen to already have it from a previous UAE application.

## Quick reference: who verifies your file, and how

| Exam | Uses DataFlow? | Verified by |
|---|---|---|
| DHA (Dubai) | Yes | DataFlow, before the Sheryan Eligibility ID stage |
| HAAD / DOH (Abu Dhabi) | Yes | DataFlow, against DOH's own PQR |
| MOH (UAE federal) | Yes | DataFlow, same provider as DHA/DOH |
| SHA (Sharjah) | Yes | DataFlow, often transferable from DHA/DOH/MOH |
| QCHP / DHP (Qatar) | Yes, mandatory since 1 Jan 2026 | DataFlow, no exceptions under Circular 2025/24 |
| SMLE / SDLE (Saudi Arabia) | No | SCFHS directly, its own independent system |
| OMSB (Oman) | No | OMSB directly, verified fresh even with an existing DataFlow file |
| NHRA (Bahrain) | No | NHRA directly, through the Mehan portal |
| KMLE / KDLE (Kuwait) | No | Kuwait's Ministry of Health directly |

Worth noting: "doesn't use DataFlow" isn't the same as "doesn't verify your credentials at all" — SCFHS, OMSB, NHRA and Kuwait's MOH all still check your degree, license and experience history, just through their own in-house process instead of outsourcing it to DataFlow. The practical difference is who you're waiting on, not whether verification happens.

## What this actually means for your timeline

If your target exam requires DataFlow, start that process as early as you possibly can — realistically before you've even finalized which specific exam date you're aiming for, since a slow-replying registrar's office can add a month or more to your timeline with zero relationship to your own preparation. If your target exam doesn't use DataFlow, don't assume that means the process is faster overall — Kuwait's KDLE, for instance, has no DataFlow step but does have a mandatory in-person viva and a five-to-six-year experience requirement that DataFlow-cluster exams don't ask for, and Oman's OMSB skips DataFlow but adds its own monthly in-person viva in Muscat.

In short: "does this exam need DataFlow" and "is this exam faster or slower overall" are two different questions, and it's worth checking both before you pick where to start. For the UAE-specific decision — DHA versus HAAD/DOH versus MOH — see our [full comparison](https://licensedent.com/blog/dha-vs-haad-vs-moh-comparison), and if Dubai is your target specifically, [DHA Eligibility](https://licensedent.com/blog/dha-eligibility-requirements) walks through the full PQR-to-Sheryan sequence DataFlow sits inside. For the complete nine-exam picture, start with our [Gulf dental licensing exams guide](https://licensedent.com/blog/gulf-dental-licensing-exams-guide).

*Every claim above is sourced from each authority's own published guidance or independently corroborated exam-prep research — see each exam's individual guide page for full citations. Verification requirements can and do change (Qatar's 2026 mandate is proof of that) — always confirm your specific case directly with the regulator before paying for verification.*`,
    },
    {
      slug: 'dha-vs-haad-vs-moh-comparison',
      title: "DHA vs HAAD (DOH) vs MOH: What's Actually Different If You're Deciding Where to Sit Your UAE Exam",
      excerpt:
        'DHA, HAAD/DOH and MOH share one attempt pool but run three genuinely different systems — delivery vendor, license scope, and pass rules compared side by side.',
      tags: ['dha', 'haad', 'moh', 'comparison', 'uae'],
      status: 'draft' as const,
      publishedAt: null,
      bodyMarkdown: `If you're licensing in the UAE and haven't already committed to a specific emirate, the choice between DHA, HAAD (now officially DOH) and MOH is worth making deliberately — because unlike, say, choosing between two similar SaaS products, this decision has a real, hard-to-reverse cost attached: DHA, DOH and MOH share a single three-attempts-per-specialty pool. Sit and fail the General Dentist exam at any one of the three and you've burned an attempt at all three, not just the one you sat. Get this decision wrong on your first try and you're not starting over — you're down to two shots total, region-wide.

Here's what's actually different between them, beyond the name on the certificate.

## They run on the same framework — that part's real

Before the differences: all three sit on the same Professional Qualification Requirements (PQR), the same DataFlow Primary Source Verification chain, and the same shared national attempt counter. A dentist eligible for one is very likely eligible for the others, and DataFlow verification completed for one can sometimes carry weight for another through each authority's Licensure Recognition provisions — if you hold a valid or recently lapsed license from one, meet the target authority's PQR, and have a good-standing letter, you may be exempted from re-sitting for the same or a lower title. That's worth checking case by case rather than assumed.

## Where they actually diverge: delivery vendor

This is the detail that trips up more candidates than anything else on this list. **DHA delivers its exam through Prometric** (prometric.com/DHA) — the same system most people associate with "the UAE dental exam." **DOH (Abu Dhabi) switched to Pearson VUE in 2023** and now books through Abu Dhabi's own TAMM portal — a completely different testing vendor, login and interface from DHA's Prometric system, not just a different skin on the same booking flow. **MOH delivers a Prometric-style computer-based test**, closer to DHA's setup than DOH's, booked through MOH's own Sheryan portal.

Practically: if you've only ever prepared assuming a Prometric-style test-day experience, Abu Dhabi's Pearson VUE exam will genuinely feel different on the day, down to the interface and the reschedule rules. Confirm which vendor applies to your specific exam before you walk in expecting DHA's process.

## Where they diverge: jurisdiction and license scope

**A DHA license** authorizes practice specifically within the emirate of Dubai. **A DOH license** authorizes practice within Abu Dhabi's licensed facilities specifically — it does not automatically extend to Dubai or the Northern Emirates. **MOH is the broadest of the three**: it covers the five Northern Emirates that don't run their own health authority (Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah and Fujairah), plus federal and government facilities nationwide — including federal facilities physically located inside Dubai and Abu Dhabi, which DHA's and DOH's own licenses don't reach on their own.

This is a genuinely common pattern worth knowing: many candidates use MOH as their entry point into UAE practice specifically because its jurisdiction is the widest, then use Licensure Recognition to add a DHA or DOH license later without a second full sitting — not because MOH is an easier exam, but because it's the broadest single license available.

## Where they diverge: the pass rule itself

**DHA publishes a straightforward 60% cut score** for General Dentist, and applies it as a single overall percentage. **DOH applies a weighted pass rule that catches people off guard**: independent sources agree you need 60% or higher overall *and* 60% or higher in at least one of three specific subjects — Restorative Dentistry, Oral Medicine & Surgery, or Periodontics. A candidate with a strong overall score but a weak showing across all three of those subjects can genuinely still fail at DOH, in a way that wouldn't fail them at DHA. **MOH doesn't publish a detailed blueprint or a specific pass-rule nuance at all** — MOHAP's own position is that the exam is scope-of-practice-based rather than governed by a public subject-by-subject document, so there's no equivalent published gotcha to plan around, mostly because there's less public detail to plan against in the first place.

## Where they diverge: how much detail each authority actually publishes

This one matters more than it sounds like it should, because it changes how confidently you can prepare. **DHA is the most transparent of the three** — it publishes its exact question count, timing, subject-coverage list and pass score in a current, dated CBT Assessment Guideline. **DOH publishes less centrally**, so several of the specifics above (the 5-subject blueprint, the weighted pass rule) come from independently-agreeing secondary sources rather than a single DOH policy document — still reliable, but worth knowing it's not a primary-source guarantee the way DHA's numbers are. **MOH publishes the least of the three**: MOHAP doesn't release a line-by-line exam blueprint the way DHA does, and multiple specifics (exact booking-window timing, reschedule cutoffs) are explicitly left for candidates to confirm directly through MOH's own Sheryan portal rather than assumed from DHA's published rules.

## So which one should you actually pick?

If maximum published transparency and a straightforward single-number pass score matter to you, DHA gives you the clearest picture going in. If Abu Dhabi specifically is where you intend to work, DOH's weighted pass rule is worth studying directly rather than assuming DHA's simpler system applies. If you want the broadest possible UAE license from a single exam — or you're not yet sure which specific emirate you'll end up in — MOH's federal-plus-Northern-Emirates coverage is the widest net available, at the cost of the least published detail to prepare against.

Whatever you pick, remember the number that actually governs the decision: three attempts, total, shared across all three. For the DataFlow step every one of these three shares, see [DataFlow Verification for Gulf Dental Licensing](https://licensedent.com/blog/dataflow-verification-gulf-dental-exams). If Dubai is your leading candidate specifically, [DHA Eligibility](https://licensedent.com/blog/dha-eligibility-requirements) covers the full PQR-to-Sheryan sequence. And for the complete picture across all nine Gulf exams, not just the UAE three, start with our [Gulf dental licensing exams guide](https://licensedent.com/blog/gulf-dental-licensing-exams-guide).

*Sourced from DHA's current published CBT Assessment Guideline and Licensing Manual, and independently corroborated research for DOH and MOH's own published guidance — see each exam's individual guide page for full citations. Confirm current specifics directly with each authority before booking; publicly available detail differs significantly between the three, as noted above.*`,
    },
    {
      slug: 'smle-vs-sdle-saudi-dental-exam',
      title: 'SMLE vs SDLE: Same Saudi Dental Exam, Two Names — What to Know Before You Apply',
      excerpt:
        "Why you'll see both 'SMLE' and 'SDLE' for the same Saudi dental licensing exam, and the format details — scaled scoring, early eligibility, Prometric delivery — that actually matter.",
      tags: ['smle', 'sdle', 'saudi-arabia'],
      status: 'draft' as const,
      publishedAt: null,
      bodyMarkdown: `If you've been researching Saudi Arabia's dental licensing exam and keep running into two different names for what seems like the same thing, you're not imagining it — and clearing up which name is actually correct matters less than understanding the format underneath it, because that's where Saudi Arabia's exam genuinely diverges from every other Gulf licensing system on this platform.

## SMLE vs SDLE: which name is actually right?

The regulator — the Saudi Commission for Health Specialties (SCFHS) — officially calls the dental exam the **SDLE**: the Saudi Dental Licensure Examination. "SMLE" is the broader **Saudi Medical Licensing Exam** branding used across multiple healthcare professions, and it's carried over onto a lot of exam-prep platforms, including this one's own exam listing, as a catch-all label. For dentistry specifically, the exam you'll actually apply for through SCFHS is named SDLE. If you're searching for official guidance, "SDLE" plus "dental" will get you closer to the primary source than "SMLE" alone.

With the naming sorted, here's what makes the exam itself genuinely different from the rest of the region.

## It's scored on a scale, not a percentage

Every other major Gulf dental exam covered on this platform uses a percentage cut score — DHA and QCHP both publish 60%, OMSB publishes 65%. SDLE doesn't work that way at all. It uses a **scaled score on a 200-800 range**, with a passing score of **542**, set by a standard-setting exercise involving a panel of Saudi dental experts. There's no percentage to translate this into, and trying to convert it into one will just confuse your own expectations going in — 542 out of 800 isn't "68%" in any meaningful sense, since scaled scoring is specifically designed to account for difficulty differences between different versions of the exam.

## You can sit it before you've technically graduated

This is arguably the most practically useful difference on this list. SCFHS's own eligibility criteria explicitly include candidates who are **still in their internship year**, or **final-year students who are one year from graduation** — not just dentists who already hold a completed degree in hand. Every other Gulf exam covered on this platform assumes you're already a qualified, licensed dentist before you apply. If you're a final-year dental student weighing your options early, Saudi Arabia is the one place in the region where "early" can mean literally before you've finished your degree.

## The format: two blocks, not one continuous sitting

SDLE runs as **200 questions split into two blocks of 100**, each given **120 minutes**, with a scheduled 30-minute break between them — a meaningfully different rhythm from DHA's single continuous 150-question, 3-hour session. Both blocks mix straight recall questions with scenario-based ones that test interpretation and clinical decision-making, per SCFHS's own applicant guide.

## You can keep testing even after you pass

This is genuinely unique among the exams covered on this platform: once you've achieved a passing score on SDLE, **you're eligible for two further attempts specifically to improve your mark** — not to requalify, since you're already qualified, but to strengthen your position for residency selection, where a higher score can matter competitively even after the pass/fail threshold is already cleared. None of the other Gulf exams on this platform offer anything like this. The overall cap is up to four attempts a year, and you can't sit twice within the same testing window — the second attempt in a window is simply invalidated, not scored.

## Results take longer than you might expect

Unlike Bahrain's NHRA, which gives you a result the moment you finish, or QCHP, which shows your score right after the exam, **SDLE results take two to six weeks** to come back, because SCFHS runs a full psychometric analysis after each testing window closes before releasing anything. You'll eventually get two documents: a statement of results, and a separate feedback report comparing your performance against other test-takers — useful context that a simple pass/fail doesn't give you.

## No DataFlow, and a real practice exam from SCFHS itself

Saudi Arabia sits entirely outside the UAE's DataFlow verification network — SCFHS verifies and processes applications independently through its own system, so a DataFlow report from a UAE application carries no weight here, and vice versa. One genuine advantage worth knowing about: SCFHS itself publishes an official SDLE practice test, sampled from the real item bank and matching the actual blueprint. Most Gulf authorities don't offer anything like this directly — it's worth working through before paying for third-party question banks.

## What the exam actually weighs

SCFHS publishes an exact percentage breakdown by section, which is more precise than most other Gulf authorities disclose: Restorative Dentistry alone accounts for **40% of the exam** — nearly half — followed by Periodontics (18%), Endodontics (17%), Oral Medicine & Surgery (15%) and Orthodontics/Pediatric Dentistry (10%). If your revision time is limited, that weighting alone tells you where to spend the majority of it.

## The one real consequence of failing

SCFHS's classification and registration rules apply a real consequence to failing SDLE: a **two-year classification consequence dating from your graduation date** for candidates who don't pass. This is worth knowing early rather than discovering after a first attempt that didn't go the way you planned — it's a good argument for using SCFHS's own practice exam and a properly weighted study plan before your first sitting, rather than treating it as a low-stakes dry run.

Put together: same exam, two names, and a format genuinely different enough from the rest of the Gulf that carrying over assumptions from a DHA-style exam will actively work against you. For how Saudi Arabia fits into the wider regional picture — including which other Gulf exams require DataFlow and which don't — see our [Gulf dental licensing exams guide](https://licensedent.com/blog/gulf-dental-licensing-exams-guide) and [DataFlow Verification, Exam by Exam](https://licensedent.com/blog/dataflow-verification-gulf-dental-exams).

*Sourced from SCFHS's official Saudi Dental Licensure Examination (SDLE) Applicant Guide, 2026-03 edition. Requirements and scoring standards are set by SCFHS and can change — always confirm current details on SCFHS's own portal before applying.*`,
    },
  ];

  for (const post of posts) {
    const exists = await prismaClient.blogPost.findUnique({ where: { slug: post.slug } });
    if (exists) {
      console.log(`[createGulfExamBlogPosts] Skipping "${post.slug}" -- already exists.`);
      continue;
    }
    await prismaClient.blogPost.create({ data: post });
    console.log(`[createGulfExamBlogPosts] Created "${post.slug}" (${post.status}).`);
  }
}
