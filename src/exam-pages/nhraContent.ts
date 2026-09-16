/**
 * Content for the NHRA (Bahrain) exam guide page.
 *
 * Backed by web research cross-checked across several independent
 * exam-prep sources (prometrican.com, waqaramin.me, medexamcenter.com,
 * prometricdentallearning.com) that all report the same specific figures.
 * NHRA turned out to be one of the most clearly documented policies of any
 * exam covered so far -- its own Mehan portal, an explicit 4-attempts/
 * 3-year window with a mandatory 6-month retraining period after a 4th
 * fail, and a 4-month eligibility code expiry are all specific, checkable
 * numbers, not structural inference. Anything not corroborated this way
 * (exact fees) is still left for candidates to confirm on NHRA's own Mehan
 * portal.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const nhraExamGuide: ExamGuideConfig = {
  accent: 'orange',
  backLinkLabel: 'All Gulf exams',

  badgeFlagEmoji: '🇧🇭',
  badgeLabel: 'NHRA · National Health Regulatory Authority (Bahrain)',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'NHRA (Bahrain) licensing exam',
  heroDescription:
    "Bahrain's National Health Regulatory Authority runs one of the more clearly documented licensing processes in the Gulf — apply through its Mehan portal, get an eligibility code, sit a 150-question Prometric exam, and know your result immediately. It also has a hard rule none of the other exams on this platform have: four attempts, then a mandatory six-month retraining period. Here's exactly how it works.",

  quickFacts: [
    { label: 'Regulator', value: 'National Health Regulatory Authority (NHRA)' },
    { label: 'Delivery', value: 'Computer-based test via Prometric, 150 MCQs in 3 hours' },
    { label: 'Pass mark', value: '60%, no negative marking, results immediate' },
    { label: 'Attempts', value: '4 consecutive attempts within 3 years of your first sitting' },
  ],

  statSectionEyebrow: 'The numbers, exactly as NHRA publishes them',
  statSectionTitle: 'A rare case: a fully documented policy',
  statSectionDescription: "NHRA is one of the few Gulf authorities on this platform that publishes its attempt and eligibility rules outright.",
  statCards: [
    {
      value: '150',
      label: 'Questions, 3 hours',
      description: 'Same Prometric CBT format as DHA, HAAD, MOH and QCHP — English, single-best-answer MCQs.',
    },
    {
      value: '60%',
      label: 'Pass mark',
      description: 'No negative marking, and results are available immediately after you finish.',
    },
    {
      value: '4 / 3 yrs',
      label: 'Attempt window',
      description: 'Up to four consecutive attempts, but all of them have to fall within three years of your first sitting.',
    },
    {
      value: '4 months',
      label: 'Eligibility code validity',
      description: "Your NHRA eligibility code expires four months after issue — sit the exam inside that window or you'll need to request a new one.",
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From Mehan application to a Bahrain license',
  roadmapDescription: "NHRA's own portal-driven process — no DataFlow chain, no separate credentialing body.",
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Apply through Mehan',
      description:
        "Bahrain's licensing applications run through NHRA's own online system, Mehan — this is where you submit your dental degree, licensing history and supporting documents.",
    },
    {
      icon: 'shield',
      title: 'NHRA reviews and approves your application',
      description:
        "Once your documents clear review, NHRA issues you an eligibility code to book the exam — there's no separate DataFlow-style third-party verification step in this process the way there is for DHA or QCHP.",
    },
    {
      icon: 'key',
      title: 'Use your eligibility code within 4 months',
      description: "The code is only valid for four months from issue. Miss that window and you'll need to request a new one before you can book anything.",
    },
    {
      icon: 'calendar',
      title: 'Book your Prometric slot',
      description: 'Booking runs through Prometric directly once your eligibility code is active.',
    },
    {
      icon: 'monitor',
      title: 'Sit the exam',
      description: '150 single-best-answer MCQs in 3 hours, English-only, no negative marking.',
    },
    {
      icon: 'trophy',
      title: 'Get your result immediately',
      description: 'Unlike DHA, NHRA gives you your result the moment you finish — 60% (90 of 150) is a pass.',
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: 'The rule that makes NHRA different: four attempts, then retraining',
  rulesDescription: "NHRA's attempt policy is one of the most specific and strictly enforced in the region.",
  ruleCards: [
    {
      icon: 'timerreset',
      title: 'Four attempts, a three-year window',
      description: "You get up to four consecutive attempts, but they all have to happen within three years of your first sitting — this isn't a lifetime cap, it's a clock.",
    },
    {
      icon: 'ban',
      title: 'Fail the fourth, and retraining is mandatory',
      description: "If you fail your fourth attempt, NHRA requires a minimum six-month retraining period before you're allowed to reapply — there's no immediate fifth attempt.",
    },
    {
      icon: 'recognition',
      title: 'No DataFlow step in this process',
      description: "Unlike DHA, MOH, HAAD, QCHP or SMLE, NHRA's own review process doesn't route through DataFlow — your documents go straight to NHRA through Mehan.",
    },
    {
      icon: 'scale',
      title: 'Pass mark and results are fully public',
      description: 'A published 60% cut score, no negative marking, and immediate results — NHRA is one of the more transparent authorities on this platform about what the exam actually requires.',
    },
    {
      icon: 'rotate',
      title: 'Your eligibility code is a ticking clock',
      description: "Four months from issue, full stop. Book and sit inside that window, or restart the application process for a new code.",
    },
    {
      icon: 'globe',
      title: 'No shared attempt pool with other authorities',
      description: 'A DHA, HAAD, MOH, QCHP, SMLE, KMLE or OMSB result has no bearing on your NHRA attempt count, and vice versa — Bahrain runs its own independent system and counter.',
    },
  ],

  subjectsEyebrow: 'What the exam actually covers',
  subjectsTitle: "NHRA's named domains",
  subjectsDescription:
    "NHRA doesn't publish an exact percentage breakdown the way SCFHS does, but its named domains are consistently reported across sources — a standard General Dentist spread, not a narrower specialty exam.",
  examSubjects: [
    { name: 'Operative Dentistry' },
    { name: 'Endodontics' },
    { name: 'Oral Surgery' },
    { name: 'Prosthodontics' },
    { name: 'Periodontics' },
    { name: 'Pediatric Dentistry' },
    { name: 'Orthodontics' },
  ],

  sampleQuestion: {
    subject: 'Local Anaesthesia',
    stem: 'What is the maximum recommended dose (MRD) of lidocaine with 1:100,000 epinephrine for a healthy adult patient, per standard dental guidelines?',
    options: [
      { key: 'A', text: '2.0 mg/kg' },
      { key: 'B', text: '4.4 mg/kg' },
      { key: 'C', text: '7.0 mg/kg' },
      { key: 'D', text: '10.0 mg/kg' },
    ],
    correctKey: 'B',
    explanation:
      "The widely cited maximum recommended dose of lidocaine with a vasoconstrictor for a healthy adult is 4.4 mg/kg, with an absolute ceiling typically capped around 300 mg regardless of body weight. Going meaningfully above that raises the risk of systemic toxicity — this is one of the most commonly tested numbers in dental pharmacology sections across every Gulf licensing exam.",
  },

  faqEyebrow: 'NHRA FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: "Answered against NHRA's own published policy, not assumptions carried over from DHA.",
  faqs: [
    {
      id: 1,
      question: 'How many attempts do I actually get at NHRA?',
      answer:
        'Up to four consecutive attempts — but all four have to fall within three years of your first sitting. It\'s a rolling window, not a simple lifetime count.',
    },
    {
      id: 2,
      question: 'What happens if I fail four times?',
      answer:
        "NHRA requires a minimum six-month retraining period before you're permitted to reapply. There's no way to sit a fifth attempt immediately after a fourth fail.",
    },
    {
      id: 3,
      question: 'Do I need DataFlow verification for Bahrain?',
      answer:
        "No — NHRA's process runs through its own Mehan portal without a separate DataFlow verification step, unlike DHA, MOH, HAAD or QCHP.",
    },
    {
      id: 4,
      question: 'How long is my eligibility code valid?',
      answer: 'Four months from the date it\'s issued. If you don\'t book and sit the exam inside that window, you\'ll need to request a new code before you can proceed.',
    },
    {
      id: 5,
      question: 'Will I know my score right away?',
      answer: 'Yes — results are available immediately after you finish the exam. 60% (90 of 150 questions) is a pass.',
    },
    {
      id: 6,
      question: 'Does my DHA, QCHP or SMLE result count for anything at NHRA?',
      answer: "No. Bahrain's NHRA runs its own independent system with its own attempt counter — a result from another authority has no bearing here, and vice versa.",
    },
    {
      id: 7,
      question: 'Where do I actually apply?',
      answer: "Through NHRA's own Mehan portal — that's where you submit your documents, get approved, and receive the eligibility code you'll need to book your Prometric slot.",
    },
  ],

  closingTitle: 'Ready to start on the NHRA blueprint?',
  closingDescription:
    'Subject-wise practice across the full General Dentist curriculum, with a recall bank and timed 150-question mock exams — every answer verified by a dentist.',
};
