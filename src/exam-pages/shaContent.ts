/**
 * Content for the SHA (Sharjah Health Authority) exam guide page.
 *
 * This exam's DB record was previously mislabeled -- tagged country="Oman"
 * with a description claiming it was "an additional Oman pathway alongside
 * OMSB." Research for this page turned up no such body; multiple
 * independent sources instead confirm SHA is the Sharjah Health Authority,
 * a real UAE regulator (est. 2010) for the emirate of Sharjah, unrelated to
 * Oman. The underlying Exam record and tools/db/seed_gulf_exams.py were
 * corrected to match (2026-08-04) before this page was written. Content
 * below is backed by web research cross-checked across prometric.com,
 * montgohealth.com, neelim.com and nursingmanthra.com, which independently
 * agree on the 150-question/3-hour Prometric format, DataFlow's shared UAE
 * network, and SHA's distinctive initial-license-then-full-license model.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const shaExamGuide: ExamGuideConfig = {
  accent: 'violet',
  backLinkLabel: 'All Gulf exams',

  badgeFlagEmoji: '🇦🇪',
  badgeLabel: 'SHA · Sharjah Health Authority',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'SHA (Sharjah) licensing exam',
  heroDescription:
    "Sharjah runs its own health authority, separate from Dubai's DHA and the federal MOH — and it's the only UAE authority on this platform with a genuine two-stage license: pass the exam, practice under supervision first, then get converted to a full license once that period checks out. Same DataFlow network as DHA, its own supervised-practice model.",

  quickFacts: [
    { label: 'Regulator', value: 'Sharjah Health Authority (SHA), established 2010' },
    { label: 'Delivery', value: 'Computer-based test via Prometric, 150 MCQs in 3 hours' },
    { label: 'Verification', value: 'DataFlow PSV — same shared network as DHA, DOH and MOH' },
    { label: 'Licensing model', value: 'Initial (supervised) license first, full license after a probation period' },
  ],

  statSectionEyebrow: 'What makes SHA different',
  statSectionTitle: 'The only two-stage license in the UAE',
  statSectionDescription: 'Same exam format and DataFlow network as DHA — a genuinely different licensing model once you pass.',
  statCards: [
    {
      value: '150',
      label: 'Questions, 3 hours',
      description: 'Same Prometric CBT format as DHA, HAAD and MOH — English, single-best-answer MCQs.',
    },
    {
      value: '2010',
      label: 'SHA established',
      description: "Sharjah's own health authority, regulating the emirate independently of Dubai's DHA and the federal MOH.",
    },
    {
      value: '2 stages',
      label: 'Initial, then full license',
      description: 'Pass the exam and you get an initial license for supervised practice first — SHA converts it to a full license only after that period goes well.',
    },
    {
      value: '3 yrs',
      label: 'Max practice gap allowed',
      description: 'Eligibility generally requires no gap in professional practice longer than three years.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From DataFlow to a full Sharjah license',
  roadmapDescription: 'The extra stage that sets SHA apart: an initial, supervised license before you get the full one.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm your eligibility',
      description: 'A recognized dental qualification and no gap in professional practice longer than three years is the baseline SHA asks for.',
    },
    {
      icon: 'shield',
      title: 'DataFlow Primary Source Verification',
      description:
        "SHA sits on the same DataFlow network as DHA, DOH and MOH — if you've already completed DataFlow PSV for one of those, the report is often transferable, saving you a second 4-8 week verification cycle.",
    },
    {
      icon: 'calendar',
      title: 'Book your Prometric slot, if required',
      description:
        'Some categories are exempt from sitting the exam based on prior MOHAP, DHA or DOH licenses — confirm your specific case before booking, since not everyone needs to sit it.',
    },
    {
      icon: 'monitor',
      title: 'Sit the exam',
      description: '150 single-best-answer MCQs in 3 hours, English-only — the same Prometric CBT format used across the UAE.',
    },
    {
      icon: 'filecheck',
      title: 'Get your initial license',
      description:
        'A pass gets you an initial license for supervised practice inside a Sharjah healthcare facility — this is SHA evaluating your real-world clinical competency, not just your exam performance.',
    },
    {
      icon: 'trophy',
      title: 'Convert to a full license',
      description: 'Once the supervised period is completed satisfactorily, based on facility reporting, SHA converts your initial license into a full one.',
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: "What makes Sharjah's process different",
  rulesDescription: "The supervised-practice model, DataFlow portability, and what's shared with the rest of the UAE.",
  ruleCards: [
    {
      icon: 'building',
      title: 'A separate authority from Dubai and the federal MOH',
      description:
        "Sharjah regulates its own healthcare licensing independently, established in 2010 — a DHA or MOH license doesn't automatically cover practice in Sharjah.",
    },
    {
      icon: 'recognition',
      title: 'DataFlow reports are often transferable',
      description:
        'Because SHA, DHA, DOH and MOH all sit on the same DataFlow network, a PSV report completed for one can often be reused for another — worth checking before you pay for a second verification.',
    },
    {
      icon: 'globe',
      title: 'Your first license comes with supervision',
      description:
        "Unlike DHA or MOH, passing the exam doesn't hand you a full license outright — you practice under supervision first, and SHA converts it to full status based on how that period goes.",
    },
    {
      icon: 'users',
      title: 'Some categories skip the exam entirely',
      description:
        'Prior MOHAP, DHA or DOH licenses can exempt certain applicants from sitting the Prometric exam — confirm your specific case rather than assuming you need to book.',
    },
    {
      icon: 'timerreset',
      title: "SHA's own attempt policy isn't clearly published",
      description:
        "Unlike DHA's documented three-attempts-pooled-across-authorities policy, SHA's own attempt rules aren't clearly published — confirm the current policy directly with SHA rather than assuming DHA's numbers carry over.",
    },
    {
      icon: 'rotate',
      title: 'Budget real time for the full process',
      description:
        'Independent estimates put the complete SHA licensing timeline — DataFlow, exam, and the supervised-practice conversion — at somewhere around 14 to 22 weeks. Confirm current timelines directly with SHA, since this moves.',
    },
  ],

  subjectsEyebrow: 'What the exam actually covers',
  subjectsTitle: "No published blueprint — here's the confirmed shape",
  subjectsDescription:
    "SHA doesn't publish its own subject-by-subject blueprint. Since it shares DataFlow verification and the underlying PQR framework with DHA, the exam is understood to draw on the same core General Dentist curriculum — confirm specifics directly with SHA rather than assuming an exact match.",
  examSubjects: [
    { name: 'Core General Dentist clinical curriculum (shared UAE framework)' },
  ],

  sampleQuestion: {
    subject: 'Pedodontics',
    stem: 'At what approximate age does the first permanent tooth typically erupt into the oral cavity?',
    options: [
      { key: 'A', text: '4-5 years' },
      { key: 'B', text: '6-7 years' },
      { key: 'C', text: '9-10 years' },
      { key: 'D', text: '12-13 years' },
    ],
    correctKey: 'B',
    explanation:
      "The mandibular first permanent molar — the classic \"six-year molar\" — is typically the first permanent tooth to erupt, at around age 6 to 7, often alongside or shortly before the permanent central incisors. This is one of the most commonly tested landmark ages in pedodontics, since it marks the start of the mixed dentition stage.",
  },

  faqEyebrow: 'SHA FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: 'Answered against what SHA actually is, including clearing up a mix-up worth addressing directly.',
  faqs: [
    {
      id: 1,
      question: "Is SHA connected to Oman? I've seen it listed that way somewhere.",
      answer:
        "No — that's a mix-up worth clearing up directly, since it's out there in a few places (including an earlier version of this platform's own listing). SHA is the Sharjah Health Authority, regulating healthcare specifically in the emirate of Sharjah, UAE, separately from Dubai's DHA and the federal MOH. Oman's licensing runs through OMSB and Oman's Ministry of Health instead — see this platform's OMSB guide for that.",
    },
    {
      id: 2,
      question: 'Do I need DataFlow verification separately for SHA if I already did it for DHA?',
      answer:
        "Often not — SHA sits on the same DataFlow network as DHA, DOH and MOH, so a completed PSV report can frequently be transferred between them. Confirm this directly with SHA before paying for a second verification cycle.",
    },
    {
      id: 3,
      question: "What's an 'initial license,' and how is it different from a full one?",
      answer:
        "An initial license lets you practice under supervision inside a Sharjah healthcare facility after you pass the exam. SHA uses that period to evaluate your real-world clinical competency directly, and converts you to a full license once it's completed satisfactorily — a step DHA and MOH don't have.",
    },
    {
      id: 4,
      question: 'Do I definitely need to sit the exam?',
      answer:
        "Not necessarily — some categories are exempt based on prior MOHAP, DHA or DOH licenses. Confirm your specific case with SHA before assuming you need to book a Prometric slot.",
    },
    {
      id: 5,
      question: 'How long does the whole SHA process take?',
      answer:
        'Independent estimates put the full process — DataFlow verification, the exam, and the supervised-practice conversion — at roughly 14 to 22 weeks. Confirm current timelines directly with SHA, since this is the kind of number that shifts.',
    },
    {
      id: 6,
      question: 'Does my DHA or MOH attempt count against my SHA attempts?',
      answer:
        "SHA's own attempt policy isn't clearly published the way DHA's is, so this isn't something we can confirm centrally — check directly with SHA rather than assuming either way.",
    },
    {
      id: 7,
      question: 'Where do I actually apply?',
      answer:
        "Through SHA's own licensing portal. Confirm the current entry point and required documents there directly, since SHA runs its own application queue separate from DHA's and MOH's.",
    },
  ],

  closingTitle: 'Ready to start on the SHA blueprint?',
  closingDescription:
    'Subject-wise practice across the full General Dentist curriculum, with a recall bank and timed 150-question mock exams — every answer verified by a dentist.',
};
