/**
 * Content for the QCHP (Qatar) exam guide page.
 *
 * Unlike HAAD/MOH/SMLE/OMSB, this one is backed by actual web research
 * (cross-checked across DataFlow Group's own site, Qatar's official
 * dhp.moph.gov.qa domain, and several exam-prep sources), not just
 * structural inference from the DHA policy document. Key facts verified
 * across multiple sources: the QCHP -> DHP rename (Feb 2019 Emiri decree),
 * the 150-question/3.5-hour/60%-pass Prometric format, DataFlow PSV
 * becoming mandatory for every applicant from 1 January 2026 (DHP Circular
 * 2025/24), and a Scientific/Clinical/Affective domain split (35/100/15
 * questions) rather than a simple subject list. Corrected 2026-08-04: an
 * earlier draft said "3 hours" -- the exam is actually 3.5 hours. Anything
 * not corroborated this way (exact fees, booking windows) is still left for
 * candidates to confirm on DHP's own portal.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const qchpExamGuide: ExamGuideConfig = {
  accent: 'rose',
  questionFormat: 'mcq',
  backLinkLabel: 'All Gulf exams',

  seo: {
    title: 'QCHP Qatar Exam Guide — Dental Licensing | LicenseDent',
    description:
      "Qatar's QCHP dental licensing exam explained: 150 questions, three and a half hours, Prometric delivery, and mandatory DataFlow verification as of 2026.",
    path: '/exams/qchp',
  },

  badgeFlagEmoji: '🇶🇦',
  badgeLabel: 'QCHP · Department of Healthcare Professions (Qatar)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'QCHP (Qatar) licensing exam',
  heroDescription:
    "Qatar's dental licensing exam still goes by its old name — QCHP — even though the regulator itself was restructured into the Department of Healthcare Professions (DHP) back in 2019. 150 questions, three and a half hours, delivered through Prometric, with DataFlow verification now mandatory for every applicant as of 2026. Here's the current process, exactly as Qatar runs it.",

  quickFacts: [
    { label: 'Regulator', value: 'Department of Healthcare Professions (DHP), Ministry of Public Health — still branded "QCHP"' },
    { label: 'Delivery', value: 'Computer-based test via Prometric, 150 MCQs in 3.5 hours' },
    { label: 'Pass mark', value: '60% — 90 of 150 correct' },
    { label: 'Verification', value: 'DataFlow PSV mandatory for every applicant since 1 January 2026' },
  ],

  statSectionEyebrow: 'The numbers, exactly as QCHP runs them',
  statSectionTitle: 'What the exam actually looks like',
  statSectionDescription: 'Unlike DHA, Qatar publishes its exam format and pass mark outright — here\'s what to expect.',
  statCards: [
    {
      value: '150',
      label: 'Questions',
      description: 'Single-best-answer MCQs, delivered via Prometric — the same delivery vendor DHA, HAAD and MOH use.',
    },
    {
      value: '3.5 hrs',
      label: 'Time allowed',
      description: '210 minutes to work through all 150 questions.',
    },
    {
      value: '60%',
      label: 'Pass mark',
      description: '90 or more correct answers is a pass — QCHP publishes this outright, unlike DHA\'s undisclosed cut score.',
    },
    {
      value: '2026',
      label: 'DataFlow now mandatory',
      description: 'Since 1 January 2026 (DHP Circular 2025/24), every applicant needs DataFlow Primary Source Verification — no exceptions.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From DataFlow to a Qatar license',
  roadmapDescription: "DHP's own sequence, now with mandatory DataFlow verification as the very first step.",
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm your eligibility',
      description:
        'A recognized dental degree (BDS/DDS or equivalent) plus a minimum of two years of clinical experience is the baseline DHP asks for. Confirm the current requirement for your specific title on the DHP portal before applying.',
    },
    {
      icon: 'shield',
      title: 'DataFlow Primary Source Verification',
      description:
        'Since 1 January 2026, DataFlow PSV is mandatory for every applicant with no exceptions, under DHP Circular 2025/24 — this now happens before anything else, even for scopes that previously didn\'t require it.',
    },
    {
      icon: 'calendar',
      title: 'Book your Prometric slot',
      description:
        "Once verified, you book the QCHP-coded qualifying exam through Prometric — if it's required for your specific scope of practice, since some scopes qualify for exemption at the evaluation stage.",
    },
    {
      icon: 'monitor',
      title: 'Sit the exam',
      description: '150 single-best-answer MCQs in 3.5 hours, split across Scientific, Clinical and Affective domains, run entirely in English at a Prometric test centre.',
    },
    {
      icon: 'trophy',
      title: 'Score and result',
      description:
        "Score reports are made available right after you finish — 60% (90 of 150) is a pass, so you'll typically know where you stand before you leave the centre.",
    },
    {
      icon: 'filecheck',
      title: 'Apply for Evaluation and Licensing',
      description:
        "A pass — or a confirmed exemption — lets you move to DHP's Evaluation and Licensing stage to finalize your registration to practice in Qatar.",
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: 'What actually changed at QCHP',
  rulesDescription: 'The renaming, the 2026 DataFlow mandate, and what QCHP does differently from the UAE exams.',
  ruleCards: [
    {
      icon: 'building',
      title: 'QCHP became DHP in 2019',
      description:
        'A February 2019 Emiri decree restructured the Ministry of Public Health and replaced the Qatar Council for Healthcare Practitioners with the Department of Healthcare Professions. The regulator, portal and licenses are all DHP now — "QCHP" survives as the exam\'s branding and the code Prometric still uses.',
    },
    {
      icon: 'globe',
      title: 'DataFlow is now mandatory, no exceptions',
      description:
        'As of 1 January 2026, every applicant needs DataFlow PSV before anything else — a change from the previous system, where it wasn\'t always required depending on scope.',
    },
    {
      icon: 'scale',
      title: 'Your pass mark is public, unlike DHA\'s',
      description:
        "QCHP publishes its exam format and 60% cut score outright, and shows you your score right after you finish — a real contrast with DHA's policy of never disclosing scores, even on appeal.",
    },
    {
      icon: 'recognition',
      title: 'Exemptions exist for some scopes',
      description:
        "Not every applicant needs to sit the Prometric exam — some scopes and experience levels qualify for exemption at the evaluation stage. Confirm your specific case on the DHP portal before assuming you need to book anything.",
    },
    {
      icon: 'timerreset',
      title: 'No shared attempt pool with the UAE or Saudi',
      description:
        'A DHA, HAAD, MOH or SMLE result has no bearing on your DHP application — Qatar runs its own independent system and counter, verified through DataFlow the same way DHA is, but administered entirely separately.',
    },
    {
      icon: 'rotate',
      title: 'Confirm current fees and slots with DHP/Prometric',
      description: 'Booking windows, fees and rescheduling rules are set by DHP and Prometric directly and can change — always check before you commit.',
    },
  ],

  subjectsEyebrow: "QCHP's own domain split",
  subjectsTitle: 'Scientific, Clinical, Affective — not a subject list',
  subjectsDescription:
    "QCHP doesn't blueprint the exam by dental subject the way DHA or SCFHS do — it splits the 150 questions into three domains. Clinical content (Restorative, Endodontics, Prosthodontics, Periodontics, OMS) makes up the bulk of it.",
  examSubjects: [
    { name: 'Clinical domain', weight: '100 Qs' },
    { name: 'Scientific domain — Biomedical Sciences', weight: '30 Qs' },
    { name: 'Scientific domain — Evidence-Based Practice', weight: '5 Qs' },
    { name: 'Affective domain — professionalism & ethics', weight: '15 Qs' },
  ],

  sampleQuestion: {
    subject: 'Pharmacology',
    stem: 'Which local anesthetic is metabolized primarily by hepatic microsomal enzymes rather than by plasma cholinesterase?',
    options: [
      { key: 'A', text: 'Lidocaine' },
      { key: 'B', text: 'Procaine' },
      { key: 'C', text: 'Benzocaine' },
      { key: 'D', text: 'Tetracaine' },
    ],
    correctKey: 'A',
    explanation:
      'Lidocaine is an amide-type local anesthetic, and amides are metabolized in the liver by microsomal enzymes. Procaine, benzocaine and tetracaine are all ester-type anesthetics, which are hydrolyzed by plasma (pseudo)cholinesterase instead — the amide/ester distinction is exactly what determines the metabolic pathway, and it\'s also why ester allergies don\'t cross-react with amides like lidocaine.',
  },

  faqEyebrow: 'QCHP FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: 'Answered against how the DHP system runs today, not the old QCHP-era assumptions.',
  faqs: [
    {
      id: 1,
      question: 'Is it QCHP or DHP? Which name should I actually be using?',
      answer:
        'The regulator is the Department of Healthcare Professions (DHP) — QCHP was restructured into DHP by a February 2019 Emiri decree. "QCHP" survives purely as the exam\'s common name and the code used on the Prometric booking itself; your license, portal and official correspondence will all say DHP.',
    },
    {
      id: 2,
      question: 'Do I need DataFlow verification for Qatar?',
      answer:
        'Yes, and as of 1 January 2026 it\'s mandatory for every applicant with no exceptions, under DHP Circular 2025/24. This is a genuine recent change — DataFlow PSV wasn\'t always required for every scope before then.',
    },
    {
      id: 3,
      question: 'What score do I need to pass?',
      answer:
        'QCHP publishes its cut score outright: 60%, meaning 90 or more correct out of 150 questions. This is a real contrast with DHA, which never discloses its cut score.',
    },
    {
      id: 4,
      question: 'Will I know my score right away?',
      answer: "Yes — score reports are typically available immediately after you finish the exam, so you'll generally know where you stand before leaving the test centre.",
    },
    {
      id: 5,
      question: 'Does my DHA, HAAD, MOH or SMLE result count for anything at QCHP?',
      answer:
        'No. Qatar\'s DHP runs its own independent licensing system with its own attempt counter — a UAE or Saudi result has no bearing on your Qatar application, and vice versa.',
    },
    {
      id: 6,
      question: 'Do I definitely need to sit the exam?',
      answer:
        "Not necessarily — some scopes and experience levels qualify for exemption at DHP's evaluation stage. Confirm your specific case on the DHP portal before assuming you need to book a Prometric slot.",
    },
    {
      id: 7,
      question: 'Where do I actually apply?',
      answer:
        "Through the DHP portal — DataFlow verification first, then the Prometric qualifying exam if it applies to your scope, then DHP's Evaluation and Licensing stage to finalize registration.",
    },
    {
      id: 8,
      question: "Is QCHP structured by dental subject, like DHA's exam?",
      answer:
        "Not quite — QCHP splits its 150 questions into three domains instead: a 100-question Clinical domain (Restorative, Endodontics, Prosthodontics, Periodontics, Oral & Maxillofacial Surgery), a 35-question Scientific domain (biomedical sciences plus evidence-based practice), and a 15-question Affective domain covering professionalism and ethics.",
    },
  ],

  closingTitle: 'Ready to start on the QCHP blueprint?',
  closingDescription:
    'Subject-wise practice across the full General Dentist curriculum, with a recall bank and timed 150-question mock exams — every answer verified by a dentist.',
};
