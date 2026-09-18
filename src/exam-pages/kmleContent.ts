/**
 * Content for the KMLE (Kuwait) exam guide page.
 *
 * Backed by actual web research, cross-checked across several exam-prep
 * sources (prometricmcq.com, edentalportal.com, gulfdentistmcqs.com and
 * others independently reporting the same figures). Key facts: dentists
 * specifically know this exam as the KDLE (Kuwait Dental Licensure
 * Examination) even though the platform's own exam record is branded KMLE;
 * it's a two-part exam (150-question/3-hour Prometric CBT + a mandatory
 * in-person viva) unlike every other exam on this platform; and employer
 * sponsorship, historically mandatory before booking, changed in September
 * 2023 so general dentists can now sit the CBT independently. Anything not
 * corroborated this way (exact current attempt caps, fees) is left for
 * candidates to confirm directly with Kuwait's MOH, since this is an area
 * that has genuinely evolved recently.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const kmleExamGuide: ExamGuideConfig = {
  accent: 'indigo',
  questionFormat: 'mcq',
  backLinkLabel: 'All Gulf exams',

  seo: {
    title: 'Kuwait KDLE Exam Guide — Dental Licensure (KMLE) | LicenseDent',
    description:
      "How Kuwait's KDLE dental licensure exam works: the mandatory in-person viva, two-part format, sponsor rules, and what changed after September 2023.",
    path: '/exams/kmle',
  },

  badgeFlagEmoji: '🇰🇼',
  badgeLabel: 'KMLE · Kuwait Ministry of Health (KDLE for dentists)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'Kuwait (KMLE/KDLE) licensing exam',
  heroDescription:
    "Kuwait's Ministry of Health runs the only Gulf licensing exam on this platform with a mandatory in-person viva on top of the computer-based test. Dentists specifically know it as the KDLE (Kuwait Dental Licensure Examination). Higher experience requirements, a two-part format, and — until a September 2023 change — a mandatory employer sponsor before you could even apply. Here's how it actually works.",

  quickFacts: [
    { label: 'Regulator', value: 'Kuwait Ministry of Health' },
    { label: 'Delivery', value: 'Prometric CBT (150 MCQs, 3 hours) plus an in-person viva' },
    { label: 'Eligibility', value: 'BDS/equivalent + 1-year internship + ~5-6 years clinical experience' },
    { label: 'Pass mark', value: '60%, no negative marking' },
  ],

  statSectionEyebrow: 'What makes Kuwait different',
  statSectionTitle: 'The only two-part exam on this platform',
  statSectionDescription: 'A higher experience bar, an oral component, and a sponsorship history unlike anywhere else in the Gulf.',
  statCards: [
    {
      value: '2 parts',
      label: 'MCQ + viva',
      description: 'A 150-question Prometric CBT, then a separate in-person viva with MOH officials — the only Gulf exam here with a mandatory oral component.',
    },
    {
      value: '5-6 yrs',
      label: 'Experience required',
      description: 'General dentists need roughly five to six years of clinical experience after a mandatory one-year internship — a notably higher bar than DHA, HAAD or MOH.',
    },
    {
      value: '60%',
      label: 'Pass mark',
      description: '150 questions, 3 hours, no negative marking — a straightforward cut score, published outright.',
    },
    {
      value: '2023',
      label: 'Sponsorship changed',
      description: "Until September 2023, dentists needed an employer sponsor before they could even sit the Prometric exam. That's no longer required for the CBT stage — confirm current rules for the viva and registration stage directly with Kuwait's MOH.",
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From eligibility to a Kuwait license',
  roadmapDescription: 'The two-stage structure that sets Kuwait apart from the rest of the Gulf.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm your eligibility',
      description:
        'A BDS or equivalent degree, a completed one-year internship, and roughly five to six years of clinical experience post-internship for general dentists — noticeably more experience than most other Gulf authorities ask for.',
    },
    {
      icon: 'shield',
      title: 'Credential verification',
      description: "Kuwait's MOH verifies your qualifications and experience as part of registration, ahead of exam booking.",
    },
    {
      icon: 'calendar',
      title: 'Book your Prometric slot',
      description:
        'Historically this stage needed an employer sponsor lined up first. Since September 2023, general dentists have been able to book the Prometric CBT independently — confirm your specific situation with Kuwait MOH before assuming either way applies to you.',
    },
    {
      icon: 'monitor',
      title: 'Sit the Prometric CBT',
      description:
        '150 single-best-answer MCQs in 3 hours, English-only, often built around clinical scenarios with radiographic or clinical images rather than pure recall.',
    },
    {
      icon: 'filecheck',
      title: 'Sit the in-person viva',
      description:
        'A separate oral exam conducted by MOH officials, testing clinical judgment, ethics and real-world decision-making — this is the step with no equivalent at DHA, HAAD, MOH, QCHP, SMLE or OMSB.',
    },
    {
      icon: 'trophy',
      title: 'Result',
      description:
        "The Prometric portion is typically scored within 24 hours; the viva outcome follows MOH's own process. Passing both is what completes licensing.",
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: "What makes Kuwait's process different",
  rulesDescription: "The parts of Kuwait's system that don't have an equivalent anywhere else on this platform.",
  ruleCards: [
    {
      icon: 'building',
      title: 'The only mandatory viva in the region',
      description: 'Every other Gulf exam on this platform is CBT-only. Kuwait adds an in-person oral exam that evaluates clinical judgment and ethics directly, not just recall.',
    },
    {
      icon: 'users',
      title: 'A higher experience bar',
      description: 'Roughly five to six years of clinical experience after a mandatory one-year internship for general dentists — plan your application timeline around that, not DHA\'s PQR.',
    },
    {
      icon: 'timerreset',
      title: 'Employer sponsorship changed in 2023',
      description:
        "Sponsorship used to be mandatory before you could even book the Prometric CBT. Since September 2023, that's no longer required for the CBT stage on its own — but confirm what's currently needed for the viva and final registration, since this is an area that's genuinely evolved and specifics can vary by pathway.",
    },
    {
      icon: 'ban',
      title: 'Attempts can be capped per employer',
      description:
        'Reporting suggests attempts are limited to three per sponsoring employer, even where there\'s no fixed overall cap — worth confirming exactly how this applies now that the employer requirement has partly changed.',
    },
    {
      icon: 'scale',
      title: 'No negative marking, clinical-scenario heavy',
      description: 'The 150-question Prometric CBT doesn\'t penalize wrong answers, and leans on clinical scenarios with images rather than pure textbook recall — a slightly different skill from straight fact recall.',
    },
    {
      icon: 'globe',
      title: 'No shared attempt pool with the UAE, Saudi or Qatar',
      description: "Kuwait's MOH runs its own independent system — a DHA, HAAD, MOH, QCHP or SMLE result has no bearing here, and vice versa.",
    },
  ],

  subjectsEyebrow: 'What the exam actually covers',
  subjectsTitle: "No published percentage blueprint — here's the confirmed shape",
  subjectsDescription:
    "Kuwait's MOH doesn't publish a subject-by-subject weighting the way SCFHS does. What's consistently reported: the 150-question CBT leans on clinical, scenario-based questions across the standard General Dentist curriculum, often built around radiographic or clinical images.",
  examSubjects: [
    { name: 'Operative Dentistry & Restorative' },
    { name: 'Endodontics' },
    { name: 'Oral & Maxillofacial Surgery' },
    { name: 'Prosthodontics' },
    { name: 'Periodontics' },
    { name: 'Orthodontics & Pediatric Dentistry' },
    { name: 'Oral Medicine, Pathology & Radiology' },
  ],

  sampleQuestion: {
    subject: 'Oral & Maxillofacial Surgery',
    stem:
      'Which nerve is most commonly injured during extraction of an impacted mandibular third molar, causing altered sensation of the lower lip and chin?',
    options: [
      { key: 'A', text: 'Inferior alveolar nerve' },
      { key: 'B', text: 'Lingual nerve' },
      { key: 'C', text: 'Buccal nerve' },
      { key: 'D', text: 'Mylohyoid nerve' },
    ],
    correctKey: 'A',
    explanation:
      "The inferior alveolar nerve runs close to the roots of the mandibular third molar within the mandibular canal, and injury to it during extraction classically presents as altered sensation of the lower lip and chin. Lingual nerve injury instead affects tongue sensation and taste on the same side, and buccal or mylohyoid nerve injuries are far less common and don't produce this specific lip/chin distribution.",
  },

  faqEyebrow: 'KMLE / KDLE FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: "Answered against how Kuwait's process runs today, including where the answer has genuinely changed recently.",
  faqs: [
    {
      id: 1,
      question: 'Is it called KMLE or KDLE?',
      answer:
        'You\'ll see both. "KMLE" (Kuwait Medical Licensing Exam) is the broader term sometimes used across professions; dentists specifically usually refer to their exam as the KDLE (Kuwait Dental Licensure Examination). Same Ministry of Health process either way.',
    },
    {
      id: 2,
      question: 'Do I need an employer to apply?',
      answer:
        "Historically, yes — sponsorship was mandatory before you could even book the Prometric CBT. Since September 2023, general dentists have been able to sit the CBT stage without one. Confirm current requirements for the viva and final registration stage directly with Kuwait's MOH, since rules here have genuinely shifted.",
    },
    {
      id: 3,
      question: 'What does the viva actually test?',
      answer:
        "It's an in-person oral exam with MOH officials evaluating clinical judgment, ethics and real-world decision-making — not a repeat of the MCQ content. It's the one component with no equivalent at DHA, HAAD, MOH, QCHP, SMLE or OMSB.",
    },
    {
      id: 4,
      question: 'How many attempts do I get?',
      answer:
        "There's no widely reported overall cap, but attempts have historically been limited to three per sponsoring employer. With the 2023 change to sponsorship rules, confirm the current attempt policy directly with Kuwait MOH rather than assuming the old employer-based limit still applies as-is.",
    },
    {
      id: 5,
      question: 'How much experience do I need?',
      answer:
        'A BDS or equivalent degree, a completed one-year internship, and roughly five to six years of clinical experience afterward for general dentists — notably more than DHA, HAAD or MOH require.',
    },
    {
      id: 6,
      question: 'Will my DHA, QCHP or SMLE result count for anything in Kuwait?',
      answer: "No — Kuwait's MOH runs its own independent system with its own attempt counter, entirely separate from the UAE, Saudi or Qatar.",
    },
    {
      id: 7,
      question: 'How long until I get my result?',
      answer:
        'The Prometric CBT portion is typically scored within about 24 hours. The viva outcome follows the Ministry\'s own separate process — passing both is what completes licensing.',
    },
  ],

  closingTitle: 'Ready to start on the Kuwait (KDLE) blueprint?',
  closingDescription:
    'Subject-wise practice across the full General Dentist curriculum, with a recall bank and timed CBT-style mocks — every answer verified by a dentist.',
};
