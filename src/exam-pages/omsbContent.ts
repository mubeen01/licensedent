/**
 * Content for the OMSB (Oman) exam guide page.
 *
 * Updated 2026-08-04: an earlier draft was overly conservative and left out
 * specifics that were actually already found during research (Pearson VUE
 * delivery since April 2023, 100 questions/2.5 hours/65% pass, the fact that
 * Operative Dentistry + Oral Surgery + Endodontics make up 39% of the exam,
 * and the monthly in-person viva in Muscat) -- those are restored here.
 * Still no primary-source OMSB policy document in hand, so exact attempt
 * limits and fees remain pointed at OMSB's own portal rather than guessed.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const omsbExamGuide: ExamGuideConfig = {
  accent: 'blue',
  backLinkLabel: 'All Gulf exams',

  seo: {
    title: 'OMSB Oman Exam Guide — Dental Licensing | LicenseDent',
    description:
      "How Oman's OMSB dental licensing exam works: Pearson VUE delivery, the Muscat in-person viva, and how it differs from the UAE and Saudi exams.",
    path: '/exams/omsb',
  },

  badgeFlagEmoji: '🇴🇲',
  badgeLabel: 'OMSB · Oman Medical Specialty Board',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'OMSB (Oman) licensing exam',
  heroDescription:
    "The Oman Medical Specialty Board (OMSB) handles assessment and classification for General Dentists in Oman; the Ministry of Health issues the actual practising licence, including a monthly in-person viva in Muscat. Delivered via Pearson VUE since April 2023, independent of the UAE's DataFlow network and Saudi's SCFHS. Here's the real structure, not a generic Gulf-exam assumption.",

  quickFacts: [
    { label: 'Regulator', value: 'OMSB (assessment) + Oman Ministry of Health (practising licence)' },
    { label: 'Delivery', value: 'Computer-based test via Pearson VUE, since April 2023' },
    { label: 'Format', value: '100 single-best-answer questions, 2 hours 30 minutes' },
    { label: 'Pass mark', value: '65%' },
  ],

  statSectionEyebrow: 'The exam, with the specifics that are actually known',
  statSectionTitle: 'A two-body process: OMSB, then MOH',
  statSectionDescription: 'Delivery vendor, format, pass mark and blueprint weighting are documented — attempt limits and fees still aren\'t published centrally.',
  statCards: [
    {
      value: '100',
      label: 'Questions, 2.5 hrs',
      description: 'Single-best-answer MCQs, delivered via Pearson VUE — the same vendor DOH (Abu Dhabi) switched to, not Prometric.',
    },
    {
      value: '65%',
      label: 'Pass mark',
      description: 'The highest published cut score of any exam on this platform — DHA and most others sit at 60%.',
    },
    {
      value: '39%',
      label: 'Operative, Surgery & Endo',
      description: 'Operative Dentistry, Oral Surgery and Endodontics together make up over a third of the entire exam — the single biggest concentration of marks.',
    },
    {
      value: '15-30 min',
      label: 'The MOH viva',
      description: 'A required in-person oral exam at the MOH building in Muscat, held once a month for up to 30 candidates at a time.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: 'From OMSB assessment to an MOH practising licence',
  roadmapDescription: 'Two bodies, two stages — the written exam through OMSB, then a viva through Oman\'s Ministry of Health.',
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Confirm your eligibility',
      description:
        "A recognized dental degree from an OMSB-approved institution plus a minimum of two years of post-qualification experience is the baseline reported for General Dentist applicants — confirm the current requirement directly with OMSB.",
    },
    {
      icon: 'shield',
      title: 'Credential verification',
      description:
        "OMSB verifies your qualifications and professional history as part of registration, independently of DataFlow or SCFHS — expect to submit documents fresh even if you're already DataFlow-verified for a UAE exam.",
    },
    {
      icon: 'calendar',
      title: 'Book your Pearson VUE slot',
      description: "Once your file clears, you book through Pearson VUE — the delivery vendor OMSB has used since April 2023, not Prometric.",
    },
    {
      icon: 'monitor',
      title: 'Sit the written exam',
      description:
        '100 single-best-answer questions in 2 hours 30 minutes, weighted toward Operative Dentistry, Oral Surgery and Endodontics — together worth 39% of the exam.',
    },
    {
      icon: 'filecheck',
      title: 'Sit the MOH viva',
      description:
        "A separate in-person oral exam at the Ministry of Health building in Muscat, 15 to 30 minutes long. It's held once a month, with slots offered to up to 30 candidates at a time — worth booking early rather than assuming a slot will be available.",
    },
    {
      icon: 'trophy',
      title: 'Licence and next steps',
      description: "Passing both the OMSB written exam and the MOH viva is what completes the practising-licence process. Confirm the exact post-result steps and timeline directly with OMSB and MOH.",
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: 'What to know before applying through OMSB',
  rulesDescription: "What's documented, and what you'll still need to confirm directly with OMSB or MOH.",
  ruleCards: [
    {
      icon: 'globe',
      title: 'A separate system from the UAE and Saudi',
      description:
        "OMSB isn't part of DataFlow's UAE network or SCFHS's Saudi system. Your credentials get verified fresh through OMSB, even if you already have a DataFlow or SCFHS file elsewhere.",
    },
    {
      icon: 'building',
      title: 'Two bodies, two stages',
      description:
        "OMSB handles assessment and classification; Oman's Ministry of Health issues the actual practising licence and runs the viva. Passing the written exam alone doesn't complete the process.",
    },
    {
      icon: 'scale',
      title: 'A 65% pass mark — higher than most',
      description:
        "OMSB's published cut score is 65%, noticeably higher than DHA's, HAAD's or NHRA's 60%. Operative Dentistry, Oral Surgery and Endodontics carry the most weight, so a weak showing there is the likeliest way to miss the mark.",
    },
    {
      icon: 'recognition',
      title: "It's Pearson VUE, not Prometric",
      description: 'OMSB moved delivery to Pearson VUE in April 2023 — the same switch DOH (Abu Dhabi) made — so a Prometric login from a DHA application won\'t work here.',
    },
    {
      icon: 'users',
      title: "Attempt policy isn't centrally published",
      description:
        "Confirm the current resit rules directly with OMSB rather than assuming they mirror DHA's three-attempts system — this platform can't verify Oman-specific attempt limits the way it can for DHA's own published policy.",
    },
    {
      icon: 'timerreset',
      title: 'No shared attempt pool with other authorities',
      description: 'Passing or failing a UAE or Saudi exam has no bearing on your OMSB record — separate systems, separate counters.',
    },
  ],

  subjectsEyebrow: 'The blueprint OMSB actually tests',
  subjectsTitle: 'Where the marks are concentrated',
  subjectsDescription:
    'Operative Dentistry, Oral Surgery and Endodontics together account for 39% of the exam — the rest is spread across the standard General Dentist curriculum.',
  examSubjects: [
    { name: 'Operative Dentistry, Oral Surgery & Endodontics', weight: '39% combined' },
    { name: 'Prosthodontics' },
    { name: 'Periodontics' },
    { name: 'Orthodontics & Pediatric Dentistry' },
    { name: 'Oral Medicine, Pathology & Radiology' },
    { name: 'Dental Materials & Pharmacology' },
  ],

  sampleQuestion: {
    subject: 'Dental Materials',
    stem:
      'Which property of a dental impression material describes its ability to return to its original dimensions after being removed from undercuts in the mouth?',
    options: [
      { key: 'A', text: 'Elastic recovery' },
      { key: 'B', text: 'Flexibility' },
      { key: 'C', text: 'Viscosity' },
      { key: 'D', text: 'Wettability' },
    ],
    correctKey: 'A',
    explanation:
      "Elastic recovery describes how well a material springs back to its original dimensions after the deformation it undergoes when pulled past undercuts during removal — critical for materials like alginate and polyvinyl siloxane. Flexibility refers to how much a material can bend before permanent deformation, viscosity describes flow and consistency before setting, and wettability describes how well the material — or the resulting cast material — wets a surface, which matters for detail reproduction rather than dimensional recovery.",
  },

  faqEyebrow: 'OMSB FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: "Answered honestly — including where the answer is \"confirm with OMSB,\" not a guess.",
  faqs: [
    {
      id: 1,
      question: "Is OMSB the same as Oman's Ministry of Health licensing?",
      answer:
        "No — they're two different stages. OMSB handles the assessment and classification, including the written Pearson VUE exam. Oman's Ministry of Health issues the actual practising licence and runs a separate in-person viva. You need to clear both.",
    },
    {
      id: 2,
      question: 'What does the MOH viva actually involve?',
      answer:
        "A 15-to-30-minute in-person oral exam at the MOH building in Muscat, held once a month with slots offered to up to 30 candidates at a time. It's a separate hurdle from the OMSB written exam, not a formality.",
    },
    {
      id: 3,
      question: 'Do I need DataFlow verification for Oman?',
      answer: "No — OMSB runs its own credentialing process, separate from the UAE's DataFlow network. Expect to submit your documents to OMSB directly, even if you're already DataFlow-verified elsewhere.",
    },
    {
      id: 4,
      question: 'Will my DHA, HAAD, MOH or SMLE result count for anything with OMSB?',
      answer: 'No — each system verifies credentials and counts attempts independently. A UAE or Saudi result has no bearing on your OMSB application.',
    },
    {
      id: 5,
      question: 'What does the exam actually weigh most?',
      answer:
        "Operative Dentistry, Oral Surgery and Endodontics together make up 39% of the 100-question exam — the single biggest concentration of marks. The rest spreads across Prosthodontics, Periodontics, Orthodontics/Pediatric Dentistry and the remaining core subjects.",
    },
    {
      id: 6,
      question: 'What score do I need to pass?',
      answer: "65% — noticeably higher than DHA's, HAAD's or NHRA's published 60% cut score.",
    },
    {
      id: 7,
      question: 'How many attempts do I get?',
      answer: "This isn't centrally published for OMSB the way it is for DHA. Confirm the current resit policy directly with OMSB before booking, rather than assuming it matches the UAE's three-attempt system.",
    },
    {
      id: 8,
      question: 'Where do I actually apply, and how is the exam delivered?',
      answer:
        "Through OMSB's own registration process, with the written exam delivered via Pearson VUE (since April 2023) rather than Prometric. Confirm the current entry point and required documents on OMSB's official site.",
    },
  ],

  closingTitle: 'Ready to start on the OMSB blueprint?',
  closingDescription:
    'Practice weighted the way OMSB actually tests it — Operative Dentistry, Oral Surgery and Endodontics front and centre — with a recall bank and timed mock exams, every answer verified by a dentist.',
};
