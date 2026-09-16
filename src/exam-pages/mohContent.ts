/**
 * Content for the MOH exam guide page.
 *
 * Same approach as the HAAD/DOH page: MOH's own internal policy document
 * isn't in the project's reference material, so the shared UAE-wide
 * framework (DataFlow PSV, pooled attempts, PQR-based eligibility) is stated
 * confidently since DHA's own policy names MOH as a partner authority in
 * that system. MOH-specific SLAs and fees aren't invented -- point to MOH's
 * own portal (Sheryan) for anything that changes on their side. Confirmed
 * 2026-08-04 via web research: MOHAP does not publish a detailed,
 * line-by-line exam blueprint the way DHA does -- that's stated plainly
 * below rather than papered over with an invented breakdown.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const mohExamGuide: ExamGuideConfig = {
  accent: 'cyan',
  backLinkLabel: 'All Gulf exams',

  badgeFlagEmoji: '🇦🇪',
  badgeLabel: 'MOH · Ministry of Health & Prevention',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'MOH licensing exam',
  heroDescription:
    "MOH is the UAE's federal health regulator — the broadest single license of the three, covering every emirate that doesn't run its own health authority, plus federal facilities nationwide. Same DataFlow/PQR framework as DHA and DOH, wider reach.",

  quickFacts: [
    { label: 'Regulator', value: 'Ministry of Health & Prevention (federal UAE)' },
    { label: 'Delivery', value: 'Computer-based test (CBT), Prometric-style centre' },
    { label: 'Language', value: 'English only — no translators permitted' },
    { label: 'Coverage', value: 'Sharjah, Ajman, Umm Al Quwain, RAK, Fujairah + federal facilities' },
  ],

  statSectionEyebrow: 'Why MOH is different',
  statSectionTitle: 'The broadest license in the UAE',
  statSectionDescription: 'Same national exam framework as DHA and DOH — the widest jurisdiction of the three.',
  statCards: [
    {
      value: '5',
      label: 'Emirates covered',
      description: "Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah and Fujairah all fall under MOH, since none run their own separate health authority.",
    },
    {
      value: '3',
      label: 'Attempts, total',
      description: 'Pooled nationally with DHA and DOH(HAAD) for the same specialty — same rule, same shared counter.',
    },
    {
      value: '1',
      label: 'PSV provider',
      description: 'DataFlow verifies your documents for MOH the same way it does for DHA and DOH — one national verification standard, three authorities.',
    },
    {
      value: 'Federal',
      label: 'License scope',
      description: 'An MOH license also covers federal/government facilities inside Dubai and Abu Dhabi, on top of the Northern Emirates — the widest reach of the three.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From PQR to a federal UAE license',
  roadmapDescription: 'The same national framework as DHA and DOH, run through MOH\'s own portal.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm you meet the PQR',
      description:
        "MOH publishes its own Professional Qualification Requirements for the General Dentist title, built on the same national framework as DHA and DOH — check the current version on MOH's portal rather than assuming it's a carbon copy.",
    },
    {
      icon: 'shield',
      title: 'DataFlow Primary Source Verification',
      description:
        'DataFlow verifies your degree, licence, experience letters and good-standing certificate against MOH\'s requirements — the same PSV process used for DHA and DOH applications, run through the same provider.',
    },
    {
      icon: 'filecheck',
      title: 'MOH credentials your file',
      description:
        "MOH's licensing team reviews your verified documents against the PQR for your title. As with the other two authorities, an incomplete file is the most common reason this stage drags.",
    },
    {
      icon: 'key',
      title: 'Your eligibility to book activates',
      description:
        "Once MOH clears your file, you can book a CBT slot through their system. Activation and booking-window timelines are set by MOH and aren't guaranteed to match DHA's — confirm the current numbers on your MOH portal.",
    },
    {
      icon: 'calendar',
      title: 'Book and pay through MOH\'s Sheryan portal',
      description:
        "MOH runs its licensing services through its own online system, commonly known as Sheryan — a separate login and application queue from DHA's and DOH's, built on the same underlying PQR/PSV framework.",
    },
    {
      icon: 'monitor',
      title: 'Sit the exam',
      description:
        'Same format as DHA and DOH: English-only CBT, no translators, single-best-answer questions. Bring the passport you registered with, or an original Emirates ID at UAE centres.',
    },
    {
      icon: 'trophy',
      title: 'Get your result',
      description:
        "Pass or fail is posted to MOH's online system. A pass lets you register for practice across MOH's jurisdiction; a fail returns you to the same shared attempt pool you'd be drawing from at DHA or DOH for that specialty.",
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: 'Rules every MOH candidate should know',
  rulesDescription: "What makes MOH's reach different from DHA's and DOH's, and what's shared across all three.",
  ruleCards: [
    {
      icon: 'globe',
      title: 'The widest jurisdiction of the three',
      description:
        "An MOH license covers the Northern Emirates plus federal facilities nationwide — including federal/government hospitals inside Dubai and Abu Dhabi, which DHA and DOH licenses don't reach on their own.",
    },
    {
      icon: 'users',
      title: 'Attempts are pooled nationally',
      description:
        'The same three-attempts-per-specialty rule applies across DHA, DOH and MOH. An attempt used at MOH for General Dentist counts against your DHA or DOH total for the same title.',
    },
    {
      icon: 'recognition',
      title: 'Often the first UAE license candidates sit',
      description:
        "Many candidates use MOH as their entry point into UAE practice, then rely on Licensure Recognition to add DHA or DOH later without a second sitting. That path depends on meeting each authority's own recognition criteria — confirm it applies to your case before assuming it will.",
    },
    {
      icon: 'building',
      title: 'One ministry, many kinds of workplace',
      description:
        "MOH licenses you for both private-sector facilities in the Northern Emirates and federal/government facilities nationwide — a broader mix of employer types than a single-emirate authority covers.",
    },
    {
      icon: 'eyeoff',
      title: "MOH doesn't publish a detailed blueprint",
      description:
        "Unlike DHA's published exam-coverage list or SCFHS's percentage-weighted blueprint, MOHAP doesn't publish a line-by-line breakdown — the exam is understood to be based on scope of practice rather than a public subject-by-subject document.",
    },
    {
      icon: 'rotate',
      title: "Rescheduling isn't free close to the date",
      description:
        "The general UAE pattern is: reschedule early and it's free, reschedule or no-show close to your slot and you repay the fee. MOH's exact cutoff window isn't published centrally — confirm it on Sheryan before assuming DHA's timing applies here too.",
    },
  ],

  subjectsEyebrow: "What MOHAP actually tests",
  subjectsTitle: "No published blueprint — here's what's confirmed",
  subjectsDescription:
    "MOHAP doesn't publish a detailed subject-by-subject blueprint the way DHA or SCFHS do. What's confirmed: the exam is scope-of-practice-based and draws on the same core General Dentist curriculum as DHA and DOH, plus MOHAP-specific regulatory questions covering practice across the Northern Emirates.",
  examSubjects: [
    { name: 'Core General Dentist clinical curriculum (same scope as DHA/DOH)' },
    { name: 'MOHAP-specific regulations for Northern Emirates practice' },
  ],

  sampleQuestion: {
    subject: 'Orthodontics',
    stem: 'Which permanent tooth, after the third molars, is most commonly impacted?',
    options: [
      { key: 'A', text: 'Maxillary canine' },
      { key: 'B', text: 'Mandibular second premolar' },
      { key: 'C', text: 'Maxillary lateral incisor' },
      { key: 'D', text: 'Mandibular canine' },
    ],
    correctKey: 'A',
    explanation:
      'After the third molars, the maxillary canine is the most commonly impacted permanent tooth — its long, late eruption path from high in the maxilla makes it especially prone to getting deflected by crowding, a retained primary canine, or insufficient arch space. Mandibular second premolars and maxillary lateral incisors are impacted far less often, and mandibular canine impaction is comparatively rare.',
  },

  faqEyebrow: 'MOH FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: "Answered against MOH's actual scope, not assumptions carried over from DHA.",
  faqs: [
    {
      id: 1,
      question: 'Which Emirates does an MOH license actually cover?',
      answer:
        "Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah and Fujairah — the emirates without their own dedicated health authority — plus federal and government facilities anywhere in the UAE, including inside Dubai and Abu Dhabi.",
    },
    {
      id: 2,
      question: 'Is MOH easier than DHA or HAAD/DOH?',
      answer:
        "There's no official difficulty ranking, and all three draw on the same core dental curriculum. MOH is often perceived as more accessible simply because its jurisdiction is broader and it's frequently the first UAE license candidates pursue — not because the exam itself is objectively easier.",
    },
    {
      id: 3,
      question: 'Do my MOH attempts count against my DHA or DOH total?',
      answer:
        "Yes. Attempts for the same specialty are pooled across DHA, DOH and MOH — a fail at MOH uses up one of your three attempts everywhere, not just at MOH.",
    },
    {
      id: 4,
      question: 'Can I upgrade an MOH license to DHA or DOH later without re-sitting?',
      answer:
        "Often, yes, through each authority's Licensure Recognition process — if you hold a valid or recently lapsed MOH license, meet the target authority's PQR, and have a good-standing letter, you may be exempted from re-sitting for the same or a lower title. Confirm the specific criteria with the authority you're applying to before assuming it covers you.",
    },
    {
      id: 5,
      question: 'Where do I book the MOH exam?',
      answer:
        "Through MOH's own online licensing system, commonly known as Sheryan — separate from DHA's and DOH's portals, even though the underlying PQR and DataFlow PSV process is shared nationally.",
    },
    {
      id: 6,
      question: 'What ID do I need on exam day?',
      answer:
        'A valid passport matching your licensing registration details, or an original Emirates ID if testing at a UAE centre. No translators are permitted, and the exam runs entirely in English.',
    },
    {
      id: 7,
      question: 'Does MOH publish an exam blueprint like DHA does?',
      answer:
        "No — MOHAP doesn't publish a detailed, line-by-line subject breakdown. The exam is understood to be based on scope of practice, drawing on the same core General Dentist curriculum as DHA and DOH, plus questions on MOHAP-specific regulations for the Northern Emirates.",
    },
  ],

  closingTitle: 'Ready to start on the MOH blueprint?',
  closingDescription:
    'The same core General Dentist curriculum tested across every UAE authority, with a recall bank and timed CBT-style mocks — every answer verified by a dentist.',
};
