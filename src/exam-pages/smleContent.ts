/**
 * Content for the SMLE (Saudi Arabia / SCFHS) exam guide page.
 *
 * Rewritten 2026-08-04 against SCFHS's own official "Saudi Dental Licensure
 * Examination (SDLE) Applicant Guide" (2026-03 edition, fetched directly
 * from scfhs.org.sa). This replaced an earlier draft built on general
 * knowledge that got several specifics wrong: the exam is delivered via
 * Prometric, not Pearson VUE; scoring is a scaled 200-800 score with a pass
 * of 542, not a percentage; and the officially-published blueprint gives
 * exact section weightings, which are used below instead of a generic
 * subject list. Anything the applicant guide doesn't specify (exact fees,
 * booking-window dates) is still left for candidates to confirm on SCFHS's
 * own portal.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const smleExamGuide: ExamGuideConfig = {
  accent: 'emerald',
  backLinkLabel: 'All Gulf exams',

  seo: {
    title: 'SMLE (SDLE) Exam Guide — Saudi Dental Licensing | LicenseDent',
    description:
      "SCFHS's Saudi Dental Licensure Examination (SDLE) explained: scaled scoring, Prometric delivery, and early eligibility for final-year students.",
    path: '/exams/smle',
  },

  badgeFlagEmoji: '🇸🇦',
  badgeLabel: 'SMLE · Saudi Dental Licensure Examination (SDLE)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'SMLE (SDLE) licensing exam',
  heroDescription:
    "Dentists in Saudi Arabia sit what SCFHS officially calls the SDLE — the Saudi Dental Licensure Examination. It's a scaled-score exam, not a percentage-based one, delivered via Prometric, and it lets you test earlier than most Gulf exams — even as a final-year student. Here's exactly what SCFHS's own applicant guide says, not general assumptions carried over from the UAE.",

  quickFacts: [
    { label: 'Exam', value: 'Saudi Dental Licensure Examination (SDLE), run by SCFHS' },
    { label: 'Delivery', value: 'Computer-based test via Prometric' },
    { label: 'Structure', value: '2 blocks of 100 questions (200 total), 120 minutes each' },
    { label: 'Scoring', value: 'Scaled score, 200-800 — pass is 542, not a percentage' },
  ],

  statSectionEyebrow: "Straight from SCFHS's own applicant guide",
  statSectionTitle: 'The exam, exactly as SCFHS specifies it',
  statSectionDescription: "Pulled from SCFHS's current SDLE Applicant Guide, not a generic Gulf-exam assumption.",
  statCards: [
    {
      value: '200',
      label: 'Questions, 2 blocks',
      description: '100 questions per block, 120 minutes each, with a scheduled 30-minute break between them.',
    },
    {
      value: '542',
      label: 'Passing score',
      description: "On a 200-800 scaled score, set by SCFHS's own standard-setting panel of Saudi dental experts — not a percentage.",
    },
    {
      value: '4 / yr',
      label: 'Max attempts',
      description: "Up to four attempts a year, and you can't sit twice in the same testing window — the second sitting is invalidated.",
    },
    {
      value: '2-6 wks',
      label: 'Results turnaround',
      description: 'Not instant — psychometric analysis after each testing window closes takes two to six weeks.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From application to your SDLE result',
  roadmapDescription: "SCFHS's own applicant-guide process — and notably, you can start earlier than most Gulf exams allow.",
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm your eligibility',
      description:
        'A recognized primary dental degree (BDS or equivalent) qualifies you — but so does still being in your internship year, or being a final-year student one year from graduation. SDLE is open earlier in training than most Gulf exams.',
    },
    {
      icon: 'shield',
      title: "Apply through SCFHS's e-application",
      description:
        'Submit your application online. Once it\'s processed, you\'ll receive a scheduling permit with your eligibility period by email — that\'s what lets you book a test date.',
    },
    {
      icon: 'calendar',
      title: 'Book your Prometric slot',
      description:
        "Scheduling isn't available more than three months in advance. You can test at any SCFHS-approved Prometric centre, whether that's inside Saudi Arabia or internationally.",
    },
    {
      icon: 'monitor',
      title: 'Sit the exam',
      description:
        'Two blocks of 100 questions, 120 minutes each, with a 30-minute break between them. Four options per question, mixing straight recall with scenario-based questions that test interpretation, analysis and clinical decision-making.',
    },
    {
      icon: 'trophy',
      title: 'Get your results',
      description:
        "Not instant — results are announced two to six weeks after your testing window closes. You'll get two reports: a statement of results, and a feedback report comparing your performance to other test-takers.",
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: "What SCFHS's applicant guide actually says",
  rulesDescription: 'The specifics that catch candidates off guard if they walk in expecting DHA-style rules.',
  ruleCards: [
    {
      icon: 'scale',
      title: "It's a scaled score, not a percentage",
      description:
        'The passing score is 542 on a 200-800 scale, set by a standard-setting exercise with Saudi dental experts. There\'s no "60%" to aim for here — don\'t try to translate it into one.',
    },
    {
      icon: 'timerreset',
      title: 'Up to 4 attempts a year, one per testing window',
      description: 'You can sit SDLE up to four times a year starting from your first attempt. Sitting twice in the same testing window invalidates the second sitting.',
    },
    {
      icon: 'recognition',
      title: 'You can keep testing after you pass',
      description:
        "Once you have a passing score, you're eligible for two further attempts specifically to improve your mark — useful for a stronger residency-selection position. None of the other Gulf exams on this platform offer that.",
    },
    {
      icon: 'ban',
      title: 'Failing has a 2-year classification consequence',
      description: "SCFHS's classification and registration rules apply to candidates who fail SDLE for two years after their graduation date.",
    },
    {
      icon: 'globe',
      title: 'A separate system from the UAE',
      description: "Saudi Arabia isn't part of the UAE's DataFlow PSV network — SCFHS verifies and processes your application independently, through its own system.",
    },
    {
      icon: 'building',
      title: 'SCFHS runs its own official practice exam',
      description: "Unlike most Gulf authorities, SCFHS itself offers an SDLE practice test sampled from the real item bank and matching the actual blueprint — worth using before paying for third-party question banks.",
    },
  ],

  subjectsEyebrow: "SCFHS's official SDLE blueprint",
  subjectsTitle: 'What the exam actually weighs',
  subjectsDescription:
    "Straight from SCFHS's own SDLE Examination Content Guideline, with the exact percentage each section carries — Restorative Dentistry alone is worth almost half the exam.",
  examSubjects: [
    { name: 'Restorative Dentistry', weight: '40%' },
    { name: 'Periodontics', weight: '18%' },
    { name: 'Endodontics', weight: '17%' },
    { name: 'Oral Medicine & Surgery', weight: '15%' },
    { name: 'Orthodontics / Pediatric Dentistry', weight: '10%' },
  ],

  sampleQuestion: {
    subject: 'Endodontics',
    stem: 'Which instrument is primarily used to determine the working length of a root canal electronically, without relying on a radiograph?',
    options: [
      { key: 'A', text: 'Apex locator' },
      { key: 'B', text: 'Periodontal probe' },
      { key: 'C', text: 'Dental explorer' },
      { key: 'D', text: 'Gutta-percha spreader' },
    ],
    correctKey: 'A',
    explanation:
      'An electronic apex locator measures electrical impedance as a file moves down the canal to detect the position of the apical constriction, giving a working-length reading without repeated radiographs. A periodontal probe measures pocket depth, a dental explorer detects caries and restoration margins, and a gutta-percha spreader is an obturation instrument used for lateral condensation — none of them measure canal length.',
  },

  faqEyebrow: 'SMLE / SDLE FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: "Answered against SCFHS's own applicant guide, not UAE-style assumptions.",
  faqs: [
    {
      id: 1,
      question: 'Is SMLE the same thing as the SDLE?',
      answer:
        'Officially, dentists sit the SDLE — the Saudi Dental Licensure Examination, run by SCFHS. "SMLE" is the broader "Saudi Medical Licensing Exam" branding this platform uses across professions; for dentistry specifically, the exam you\'ll actually apply for is named SDLE.',
    },
    {
      id: 2,
      question: "How is the exam scored, since there's no percentage?",
      answer:
        "SDLE uses a scaled score on a 200-800 range, with a passing score of 542 set by a standard-setting panel of Saudi dental experts. Don't try to convert it to a percentage — it isn't one.",
    },
    {
      id: 3,
      question: 'How many attempts do I get?',
      answer:
        "Up to four a year, and you can't sit twice in the same testing window. Notably, you can keep testing even after you pass — two more attempts are allowed specifically to improve your mark for residency selection.",
    },
    {
      id: 4,
      question: 'When do I get my results?',
      answer:
        "Not instantly — two to six weeks after your testing window closes, since SCFHS runs a psychometric analysis first. You'll receive both a statement of results and a feedback report comparing your performance to other test-takers.",
    },
    {
      id: 5,
      question: 'Do I need DataFlow verification for Saudi Arabia?',
      answer: "No — Saudi Arabia isn't part of the UAE's DataFlow network. SCFHS verifies and processes your application through its own independent system.",
    },
    {
      id: 6,
      question: 'Can I sit the exam before I graduate?',
      answer:
        "Yes — SCFHS's eligibility criteria explicitly include candidates still in their internship year, and final-year students who are one year from graduation, not just those who already hold a completed degree.",
    },
    {
      id: 7,
      question: 'Where do I actually sit the exam?',
      answer:
        'At any SCFHS-approved Prometric testing centre, inside Saudi Arabia or internationally. Booking isn\'t available more than three months in advance, so plan around your eligibility period once your scheduling permit is issued.',
    },
  ],

  closingTitle: 'Ready to start on the SDLE blueprint?',
  closingDescription:
    "Practice weighted the same way SCFHS actually scores it — Restorative Dentistry front and centre — with a recall bank and timed mock exams, every answer verified by a dentist.",
};
