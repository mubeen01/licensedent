/**
 * Content for the DHA exam guide page.
 *
 * Rewritten 2026-08-04 against DHA's own current, live documents (fetched
 * directly from dha.gov.ae, not secondary exam-prep sites):
 *  - "DHA Healthcare Professional Licensing Assessment Guideline" (CBT),
 *    updated May 2026 -- the source for General Dentist's exam code
 *    (GEN5301), question count, duration, pass score and subject coverage.
 *  - "Manual for Licensing Healthcare Professionals" v1.2, issued 08/05/2025,
 *    effective through 08/05/2030 -- the source for the 5-step licensing
 *    process, the 3-attempts/2-year-block rule, and reassessment routes.
 *  - "Manual for Professional Assessment (Oral/CBT)" v1, effective
 *    16/01/2024-16/01/2029 -- the source for Prometric booking mechanics,
 *    the reschedule/no-show fee rules, and the Learning Outcome report.
 * This superseded an earlier draft based on an undated internal PO-03
 * policy PDF, which turned out to have several claims (cut score never
 * published, a separate "Eligibility Letter" valid 1 year, a 1-month appeal
 * window) that don't appear in DHA's current live manuals -- those were
 * dropped rather than carried forward unverified. Where DHA's current
 * documents don't give a number (exact PSV/booking turnaround, current
 * fees), this says so instead of reusing the old figures.
 */
import type { ExamGuideConfig } from './examGuideTypes';

export const dhaExamGuide: ExamGuideConfig = {
  accent: 'amber',
  backLinkLabel: 'All Gulf exams',

  badgeFlagEmoji: '🇦🇪',
  badgeLabel: 'DHA · Dubai Health Authority',
  heroTitleLead: 'The complete guide to the',
  heroTitleHighlight: 'DHA licensing exam',
  heroDescription:
    "Everything a General Dentist needs to license with the Dubai Health Authority — straight from DHA's own current CBT guideline and licensing manuals: the exact exam structure (exam code GEN5301), the DataFlow verification chain, the real attempt-and-reapplication rules, and the subject coverage the assessment actually draws from.",

  quickFacts: [
    { label: 'Delivery', value: 'Computer-based test via Prometric (prometric.com/DHA)' },
    { label: 'Format', value: '150 questions, 3 hours — exam code GEN5301' },
    { label: 'Pass score', value: '60% for General Dentist — published, but your own result isn\'t shared' },
    { label: 'Attempts', value: '3 total, pooled across MOH, HAAD/DOH and DHA' },
  ],

  statSectionEyebrow: "Straight from DHA's own guideline",
  statSectionTitle: 'The exam, exactly as DHA specifies it',
  statSectionDescription: "Pulled from DHA's current CBT Assessment Guideline, not secondhand estimates.",
  statCards: [
    {
      value: '150',
      label: 'Questions',
      description: 'Multiple-choice, single-best-answer — General Dentist runs under exam code GEN5301.',
    },
    {
      value: '3 hrs',
      label: 'Duration',
      description: 'The full session, including registration and instructions — not just time spent on questions.',
    },
    {
      value: '60%',
      label: 'Pass score',
      description: "Published outright for General Dentist. What DHA keeps private is your own result, not the cut-off itself.",
    },
    {
      value: '3',
      label: 'Attempts, pooled',
      description: 'Across MOH, HAAD/DOH and DHA combined for the same specialty — not three per authority.',
    },
  ],

  roadmapEyebrow: 'The pathway',
  roadmapTitle: "DHA's own 5-step licensing process",
  roadmapDescription: "Straight from DHA's Manual for Licensing Healthcare Professionals — DataFlow verification is where most delays actually happen.",
  roadmapSteps: [
    {
      icon: 'clipboard',
      title: 'Fulfil the PQR',
      description:
        "The Unified Healthcare Professional Qualification Requirements — in force UAE-wide since October 2014 — set the minimum degree, home-country licence, experience and good-standing status for the General Dentist title. Start with a self-assessment in Sheryan before you spend on verification.",
    },
    {
      icon: 'shield',
      title: 'Get verified through DataFlow',
      description:
        "DHA requires a positive Primary Source Verification result from DataFlow before your application can move forward — your degree, licence, experience letters and good-standing certificate all get checked directly with the issuing bodies.",
    },
    {
      icon: 'key',
      title: 'Create your Sheryan account and get your Eligibility ID',
      description:
        "Once your PQR and PSV checks clear, Sheryan issues an Eligibility ID — you'll need it to complete the Prometric booking process. DHA's current manuals don't publish a fixed turnaround for this step, so confirm timing directly in Sheryan.",
    },
    {
      icon: 'monitor',
      title: 'Sit the Prometric CBT',
      description:
        "150 questions, 3 hours, booked at prometric.com/DHA. Arrive 30 minutes early for check-in, and bring the same passport you registered in Sheryan — a name mismatch reported less than 5 days before your exam is on you, not DHA.",
    },
    {
      icon: 'trophy',
      title: 'Get your result through Sheryan',
      description:
        'Pass or Fail is uploaded to Sheryan within 2 working days. Separately, Prometric issues a "Learning Outcome" report showing your strengths and weaknesses by domain — useful feedback, but it is explicitly not your score or your result. Only a pass gets you the Professional Registration Certificate.',
    },
  ],

  rulesEyebrow: 'Read this before you book',
  rulesTitle: 'What DHA\'s current manuals actually say',
  rulesDescription: 'The specific rules that decide whether a bad exam day is recoverable — from documents effective through 2029-2030, not an old policy PDF.',
  ruleCards: [
    {
      icon: 'eyeoff',
      title: "Your score stays private — the cut-off doesn't",
      description:
        'DHA publishes the pass score for General Dentist outright (60%), but will never share your own result value beyond Pass/Fail. Prometric\'s separate "Learning Outcome" report shows domain-level strengths and weaknesses without revealing your score.',
    },
    {
      icon: 'users',
      title: '3 attempts, pooled nationally',
      description:
        'The limit is three attempts per specialty in total, shared across MOH, HAAD/DOH and DHA — not three per authority. You must declare your attempt history across all three when applying.',
    },
    {
      icon: 'ban',
      title: 'Fail 3 times, and the default is a 2-year block',
      description:
        "Failing your third attempt blocks you from reapplying for a DHA licence for two years. A fourth attempt is possible with permission (by declaring your full UAE attempt history), and you can requalify for three brand-new attempts sooner by earning an additional recognized certificate or by accumulating two years of clinical licensed experience since your last attempt.",
    },
    {
      icon: 'timerreset',
      title: 'No mandatory wait between attempts',
      description: "DHA's own manual states there's no restriction on the duration between re-sits — rebook the moment a slot is available, according to assessment availability.",
    },
    {
      icon: 'rotate',
      title: 'Reschedule 5+ days out, or forfeit the fee entirely',
      description:
        "Reschedule or cancel at least 5 calendar days before your exam and Prometric charges its standard change fee. Leave it later than that, cancel late, or no-show, and your exam fee is non-refundable — you're paying for a completely new booking.",
    },
    {
      icon: 'scale',
      title: '5-year pass validity, with a practice-gap catch',
      description:
        'A pass stays valid for reassessment-exemption purposes for five years, provided there\'s no gap in practice. If you had a practice gap and it has been more than two years since you passed, DHA requires you to sit a brand-new assessment regardless of your original pass.',
    },
  ],

  subjectsEyebrow: "DHA's own exam coverage",
  subjectsTitle: 'What GEN5301 actually tests',
  subjectsDescription:
    "Copied directly from DHA's current CBT Assessment Guideline for General Dentist. DHA weighs each domain when scoring your answers, but — unlike some other Gulf authorities — doesn't publish the exact percentage breakdown.",
  examSubjects: [
    { name: 'Anesthesia and Pain Management' },
    { name: 'Endodontics' },
    { name: 'Cosmetic' },
    { name: 'Oral Medicine / Oral Surgery' },
    { name: 'Implant Surgery' },
    { name: 'Deformities and Orthognathic Surgery' },
    { name: 'Periodontics' },
    { name: 'Restorative Dentistry' },
    { name: 'Patient Education' },
    { name: 'Temporomandibular Joint' },
    { name: 'Orthodontics / Pediatric Dentistry' },
    { name: 'Ethics' },
  ],

  sampleQuestion: {
    subject: 'Oral Pathology',
    stem:
      'A panoramic radiograph taken during a routine check-up shows a well-defined unilocular radiolucency at the apex of a non-vital lower first molar. The tooth has a history of deep caries and a root-canal filling from several years ago. What is the most likely diagnosis?',
    options: [
      { key: 'A', text: 'Dentigerous cyst' },
      { key: 'B', text: 'Radicular (periapical) cyst' },
      { key: 'C', text: 'Odontogenic keratocyst' },
      { key: 'D', text: 'Nasopalatine duct cyst' },
    ],
    correctKey: 'B',
    explanation:
      'The radicular (periapical) cyst is the most common odontogenic cyst overall, and the classic trigger is exactly this — a non-vital, previously carious tooth with chronic periapical inflammation. A dentigerous cyst forms around the crown of an unerupted tooth, an odontogenic keratocyst tends toward a scalloped, more aggressive-looking margin, and a nasopalatine duct cyst sits in the anterior midline of the maxilla, unrelated to any single non-vital tooth.',
  },

  faqEyebrow: 'DHA FAQ',
  faqTitle: 'Questions candidates actually ask',
  faqDescription: "Answered against DHA's current live manuals, not an outdated policy PDF.",
  faqs: [
    {
      id: 1,
      question: 'How many questions is the DHA General Dentist exam, and how long do I get?',
      answer:
        '150 multiple-choice questions in 3 hours, under exam code GEN5301 — that 3-hour window includes registration and instructions, not just time spent answering.',
    },
    {
      id: 2,
      question: 'What score do I need to pass?',
      answer:
        "60% for General Dentist — DHA publishes this pass score outright. What stays private is your own individual result: you'll only ever see Pass or Fail in Sheryan, never your actual score or percentage.",
    },
    {
      id: 3,
      question: 'Will I get any feedback at all if I fail?',
      answer:
        'Yes, indirectly — Prometric issues a separate "Learning Outcome" report showing your strengths and weaknesses across exam domains. DHA is explicit that this report does not reflect your actual result, but it\'s still useful for knowing where to focus a re-sit.',
    },
    {
      id: 4,
      question: 'How many attempts do I actually get at the DHA exam?',
      answer:
        "Three, per specialty — pooled across MOH, HAAD/DOH and DHA, not three per authority. Fail your third attempt and the default is a two-year block on reapplying, though a fourth attempt is possible with permission, or you can requalify for three new attempts sooner via an additional certificate or two years of clinical experience.",
    },
    {
      id: 5,
      question: 'What ID do I need to bring on exam day?',
      answer:
        'A valid passport with details matching your Sheryan registration exactly. If there\'s a mismatch, you need to contact DHA at least 5 days before your exam — DHA isn\'t responsible for extra charges caused by a late report.',
    },
    {
      id: 6,
      question: 'Can I reschedule if something comes up?',
      answer:
        "Yes, if you do it at least 5 calendar days before your exam — you'll still pay Prometric's standard change fee. Leave it later than that, cancel, or no-show, and your entire exam fee is forfeited as non-refundable.",
    },
    {
      id: 7,
      question: 'How long does my pass stay valid?',
      answer:
        "Five years, provided you have no gap in practice. If you did have a practice gap and it's been more than two years since your pass, DHA will require a brand-new assessment regardless of your original result.",
    },
    {
      id: 8,
      question: 'Do I need to retake the exam if I already passed MOH or HAAD/DOH?',
      answer:
        "Possibly not. DHA's PQR includes licensure-recognition provisions for applicants with a valid or recently cancelled MOHAP/DOH licence and a good-standing certificate, for the same or a lower title — check the current criteria in Sheryan before booking anything.",
    },
  ],

  closingTitle: 'Ready to start on the DHA blueprint?',
  closingDescription:
    "Subject-wise practice, a high-yield recall bank and timed, Prometric-style mock tests — tagged to the same domains GEN5301 actually tests, with every answer verified by a dentist.",
};
