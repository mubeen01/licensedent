import { getPlanPrice, PaymentPlanId } from '../payment/plans';
import type { GridFeature } from './components/FeaturesGrid';
import type { PracticeMode } from './components/PracticeModes';
import type { PricingTeaserPlan } from './components/PricingTeaser';
import type { Stat } from './components/StatsBar';
import type { Subject } from './components/SubjectsStrip';
import type { StudyTool } from './components/StudyTools';
import type { DemoQuestion } from './components/TryItDemo';

/* -------------------------------------------------------------------------- */
/*  STATS BAR                                                                   */
/*  Every number with a database source behind it comes in LIVE from           */
/*  getPublicBankStats (see useBankStats) — hardcoded counts were removed       */
/*  because the page claimed "9,000+" while the bank held a few hundred.        */
/*  While the count hasn't loaded, the question stat shows a claim with no      */
/*  number instead of a placeholder.                                            */
/* -------------------------------------------------------------------------- */
export function buildStats(bank: { publishedQuestionCount?: number; subjectCount?: number; examCount?: number } | null | undefined): Stat[] {
  return [
    {
      value: bank?.publishedQuestionCount != null ? `${bank.publishedQuestionCount.toLocaleString()}+` : 'Growing',
      label: 'Published questions',
      description: 'Growing weekly — Gulf + Ireland pattern bank',
    },
    { value: '100%', label: 'Dentist-verified', description: 'Every answer checked by a dentist — never AI-guessed' },
    {
      value: bank?.subjectCount != null ? `${bank.subjectCount}` : '14+',
      label: 'Dental subjects',
      description: 'Mapped to DHA, MOH & IDC blueprints',
    },
    { value: bank?.examCount != null ? `${bank.examCount}` : '10', label: 'Exams covered', description: 'Gulf licensing + IDC Ireland' },
  ];
}

/* -------------------------------------------------------------------------- */
/*  FEATURES  (FeaturesGrid bento section)                                      */
/*  Expanded to out-feature competitors: recall bank, image-based MCQs,         */
/*  flashcards and rule-out explanations are the new additions.                 */
/* -------------------------------------------------------------------------- */
export const features: GridFeature[] = [
  {
    name: 'Gulf + Ireland pattern bank',
    description:
      'DHA, MOH, HAAD recalls plus IDC Ireland SAQ-style cases — one bank built for both tracks, refreshed every exam cycle.',
    emoji: '🎯',
    size: 'large',
    gradient: 'from-amber-500 to-amber-400',
  },
  {
    name: 'Custom Quiz Builder',
    description:
      'Build your own quiz from any mix of subjects, difficulty, previously-wrong, bookmarked and more — timed or untimed. No two quizzes are ever the same. Included with the Extended plan.',
    emoji: '🧩',
    size: 'large',
    badge: '✨ New',
    gradient: 'from-secondary to-primary',
  },
  {
    name: 'Smart Review',
    description:
      'Spaced repetition that automatically resurfaces the questions you got wrong sooner, and the ones you know further out — so revision time goes where it actually helps.',
    emoji: '🔁',
    size: 'medium',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    name: 'Streaks, XP & study plan',
    description:
      'A daily streak, XP and milestone badges to keep you coming back, plus a personalized daily plan and readiness score built from your own real practice data.',
    emoji: '🔥',
    size: 'medium',
    gradient: 'from-gold to-amber-500',
  },
  {
    name: 'Verified explanations',
    description: 'Every answer key is checked by a dentist — never AI-guessed and auto-published.',
    emoji: '✅',
    size: 'medium',
    gradient: 'from-teal-500 to-teal-700',
  },
  {
    name: 'Rule-out reasoning',
    description: 'Explanations tell you why the other options are wrong, not just which one is right.',
    emoji: '🧠',
    size: 'medium',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    name: 'Image-based MCQs',
    description: 'Radiographs, OPGs, clinical photos and histopath — the visual questions the real exam loves.',
    emoji: '🩻',
    size: 'medium',
    gradient: 'from-cyan-500 to-sky-500',
  },
  {
    name: 'Timed mock tests',
    description: 'Full-length, Prometric-style mocks with a countdown and a scored review at the end.',
    emoji: '⏱️',
    size: 'medium',
    gradient: 'from-sky-500 to-blue-500',
  },
  {
    name: 'Subject-wise practice',
    description: 'Drill Oral Pathology, Endodontics, Periodontics, Prosthodontics and every other subject on its own.',
    emoji: '📚',
    size: 'medium',
    gradient: 'from-blue-500 to-sky-600',
  },
  {
    name: 'Flashcards',
    description: 'Fast, high-yield fact recall for the last-mile revision before exam day.',
    emoji: '🃏',
    size: 'small',
    gradient: 'from-teal-600 to-cyan-500',
  },
  {
    name: 'Progress analytics',
    description: 'See accuracy by subject so you know exactly what to revise next.',
    emoji: '📈',
    size: 'small',
    gradient: 'from-teal-500 to-teal-700',
  },
  {
    name: 'Mark for review',
    description: 'Flag tricky questions and revisit them in one tap before your exam.',
    emoji: '🔖',
    size: 'small',
    gradient: 'from-secondary to-amber-600',
  },
  {
    name: 'Gulf + Ireland coverage',
    description: 'One growing bank spanning DHA, MOH, HAAD, SMLE and IDC Ireland — pick the plan that matches your exam.',
    emoji: '🌍',
    size: 'medium',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    name: 'Study on any device',
    description: 'Practice on your phone between patients, pick up on desktop at home.',
    emoji: '📱',
    size: 'small',
    gradient: 'from-cyan-500 to-teal-500',
  },
];

/* -------------------------------------------------------------------------- */
/*  STUDY TOOLS  (NEW — powers a tabbed "Everything you get" section)           */
/*  This is the block that directly out-features the competitor's tabbed        */
/*  feature list.                                                               */
/* -------------------------------------------------------------------------- */
export const studyTools: StudyTool[] = [
  {
    id: 'quizbuilder',
    name: 'Quiz Builder',
    emoji: '🧩',
    tagline: 'Build your own quiz instead of picking from fixed content — included with the Extended plan.',
    gradient: 'from-secondary to-primary',
    points: [
      'Mix and match any subjects, difficulty, and smart filters: previously wrong, never attempted, bookmarked, recently added, high-yield, case-based, image-based.',
      'A one-click "your weak areas" shortcut pre-selects the subjects you actually need to drill.',
      'Practice mode for instant feedback, or Timed / Exam Mode with a countdown, question palette and scored results.',
      '10 to 200 questions, generated fresh every time — no two quizzes are ever quite the same.',
    ],
  },
  {
    id: 'smartreview',
    name: 'Smart Review',
    emoji: '🔁',
    tagline: 'Spaced repetition that puts revision time exactly where it helps most.',
    gradient: 'from-teal-500 to-cyan-600',
    points: [
      'Every practice answer reschedules that question automatically — no manual planning required.',
      'Get a question wrong, and it resurfaces the same day, not buried until "someday."',
      'Get it right repeatedly, and the interval grows, so you stop over-reviewing what you already know.',
      'A live due-count badge on your dashboard tells you exactly how much is waiting today.',
    ],
  },
  {
    id: 'qbank',
    name: 'Question Bank',
    emoji: '📚',
      tagline: 'A growing bank of exam-style MCQs, organised the way you actually revise.',
    gradient: 'from-teal-500 to-teal-700',
    points: [
      'Subject-wise MCQs across 12+ dental subjects, each mapped to the exam blueprint.',
      'Every question carries a dentist-verified answer key and a clear explanation.',
      'Rule-out reasoning: understand why the other options are wrong, not just the right one.',
      'Clean, distraction-free question interface built for long study sessions.',
      'Mark any question for review and return to it in one tap.',
    ],
  },
  {
    id: 'recalls',
    name: 'Recall Bank',
    emoji: '🎯',
    tagline: 'The highest-yield questions — the concepts that keep coming back.',
    gradient: 'from-amber-500 to-amber-400',
    points: [
      'Frequently-repeated topics compiled and structured subject-by-subject.',
      'Refreshed after each exam cycle so your prep stays current.',
      'Corrected and verified — never raw, unchecked dumps.',
      'Perfect for a focused final week when time is tight.',
    ],
  },
  {
    id: 'mocks',
    name: 'Mock Tests',
    emoji: '⏱️',
    tagline: 'Full-length, timed, Prometric-style — practice exam day before exam day.',
    gradient: 'from-sky-500 to-blue-500',
    points: [
      'Timed, full-length tests that simulate the real exam’s pressure.',
      'Scored result the moment you submit, with a full answer review.',
      'Retake as many times as you like to build stamina and confidence.',
      'Track your mock performance over time to see real improvement.',
    ],
  },
  {
    id: 'images',
    name: 'Image-based MCQs',
    emoji: '🩻',
    tagline: 'The visual questions the real exam is full of.',
    gradient: 'from-cyan-500 to-teal-600',
    points: [
      'Bitewing, periapical and panoramic (OPG) radiograph interpretation.',
      'Clinical photographs and intra-oral presentations.',
      'Histopathology and oral-pathology visuals.',
      'Trains applied diagnosis, not just textbook recall.',
    ],
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    emoji: '🃏',
    tagline: 'Lock in high-yield facts for fast, last-mile revision.',
    gradient: 'from-teal-500 to-teal-600',
    points: [
      'Concise, high-yield cards across every major subject.',
      'Ideal for quick daily review between practice sessions.',
      'Built to make dense dental facts easy to memorise and retain.',
    ],
  },
  {
    id: 'analytics',
    name: 'Progress Analytics',
    emoji: '📈',
    tagline: 'Know exactly what to study next.',
    gradient: 'from-blue-500 to-sky-600',
    points: [
      'Accuracy broken down subject-by-subject.',
      'Automatically surfaces your weakest areas so you revise smart, not just hard.',
      'Watch your scores climb across practice and mocks over time.',
      'A daily streak, XP/level and milestone badges built from your real activity — nothing fabricated.',
      'A personalized daily study plan and a transparent readiness score (never a black-box "AI prediction") that blends mock accuracy, subject coverage and consistency.',
    ],
  },
  {
    id: 'videos',
    name: 'Video Lectures',
    emoji: '🎥',
    tagline: 'Recorded lectures walking through high-yield topics — launching with the Extended plan. We don’t advertise hours we haven’t recorded.',
    gradient: 'from-secondary to-amber-600',
    points: [
      'Subject-wise video lectures built around the same verified topic coverage as the question bank.',
      'The library is being recorded now — it ships with the Extended plan, and the dashboard’s Video Lectures page shows what’s live.',
      'Pairs each topic with the question bank so you watch, then practice.',
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  PRACTICE MODES  (powers a "study your way" pill strip)                      */
/*  Every one of these maps to a real, shipped filter/mode -- Practice's        */
/*  subject picker, Quiz Builder's Include/Difficulty filters (Extended plan)   */
/*  and Mock Exams' timed simulation. No "topic-wise" entry: the app only has   */
/*  subject-level granularity today, there's no separate Topic model, so it's   */
/*  deliberately left off rather than advertised ahead of the data model.       */
/* -------------------------------------------------------------------------- */
export const practiceModes: PracticeMode[] = [
  { emoji: '🎯', label: 'Random Mix' },
  { emoji: '📚', label: 'Subject-wise' },
  { emoji: '❌', label: 'Previously Wrong' },
  { emoji: '⭐', label: 'Bookmarked' },
  { emoji: '🆕', label: 'Never Attempted' },
  { emoji: '🔥', label: 'High-Yield' },
  { emoji: '📈', label: 'Weak Areas Only' },
  { emoji: '👶', label: 'Easy' },
  { emoji: '⚖️', label: 'Medium' },
  { emoji: '💪', label: 'Hard' },
  { emoji: '🦷', label: 'Clinical Case' },
  { emoji: '🖼️', label: 'Image-Based' },
  { emoji: '⏱️', label: 'Timed or Practice Mode' },
];

/* -------------------------------------------------------------------------- */
/*  SUBJECTS  (powers a "subjects covered" strip, shows depth)                  */
/* -------------------------------------------------------------------------- */
export const subjects: Subject[] = [
  { name: 'Oral Pathology', emoji: '🔬' },
  { name: 'Oral Medicine & Radiology', emoji: '🩻' },
  { name: 'Endodontics', emoji: '🦷' },
  { name: 'Periodontics', emoji: '🪥' },
  { name: 'Prosthodontics', emoji: '👑' },
  { name: 'Conservative & Operative', emoji: '⚙️' },
  { name: 'Oral & Maxillofacial Surgery', emoji: '🔪' },
  { name: 'Orthodontics', emoji: '📐' },
  { name: 'Pedodontics', emoji: '🧒' },
  { name: 'Dental Materials', emoji: '🧪' },
  { name: 'Oral Anatomy & Histology', emoji: '🧬' },
  { name: 'Community Dentistry', emoji: '🌍' },
  { name: 'Pharmacology', emoji: '💊' },
  { name: 'Local Anaesthesia', emoji: '💉' },
];

/* -------------------------------------------------------------------------- */
/*  TRY-IT DEMO  (interactive homepage question widget)                         */
/*  ⚠️ SAMPLE questions shown to anonymous visitors before signup. Same brand    */
/*  promise as everywhere else — "dentist-verified answers" — so have a         */
/*  reviewer confirm each correctKey/explanation pair before this goes live.    */
/* -------------------------------------------------------------------------- */
export const demoQuestions: DemoQuestion[] = [
  {
    subject: 'Periodontics',
    stem: 'A patient has a 6mm periodontal pocket on the mesial of tooth #36, with radiographic horizontal bone loss and no furcation involvement. What is the most appropriate initial treatment?',
    options: [
      { key: 'A', text: 'Non-surgical scaling and root planing' },
      { key: 'B', text: 'Open flap debridement' },
      { key: 'C', text: 'Guided tissue regeneration' },
      { key: 'D', text: 'Extraction' },
    ],
    correctKey: 'A',
    explanation:
      'Non-surgical scaling and root planing is first-line for pockets without furcation involvement or a vertical defect needing regeneration. Surgery is only considered if pockets persist after re-evaluation.',
  },
  {
    subject: 'Pharmacology',
    stem: 'Which local anesthetic is contraindicated in a patient with atypical plasma cholinesterase deficiency?',
    options: [
      { key: 'A', text: 'Lidocaine' },
      { key: 'B', text: 'Articaine' },
      { key: 'C', text: 'Procaine' },
      { key: 'D', text: 'Bupivacaine' },
    ],
    correctKey: 'C',
    explanation:
      'Procaine is an ester-type anesthetic metabolized by plasma cholinesterase. Patients with atypical plasma cholinesterase deficiency can’t hydrolyze ester anesthetics normally, risking prolonged toxicity. Amide anesthetics like lidocaine and articaine are metabolized hepatically instead and are unaffected.',
  },
  {
    subject: 'Oral Pathology',
    stem: 'A well-circumscribed periapical radiolucency at a non-vital maxillary lateral incisor, lined by stratified squamous epithelium and containing cholesterol clefts, is most consistent with which diagnosis?',
    options: [
      { key: 'A', text: 'Periapical granuloma' },
      { key: 'B', text: 'Radicular (periapical) cyst' },
      { key: 'C', text: 'Dentigerous cyst' },
      { key: 'D', text: 'Ameloblastoma' },
    ],
    correctKey: 'B',
    explanation:
      'A radicular cyst arises from epithelial rests of Malassez stimulated by inflammation from a non-vital pulp. The epithelial lining and cholesterol clefts (from breakdown of red blood cells and lipid-laden macrophages) distinguish it from a periapical granuloma, which has no epithelial lining.',
  },
];

/* -------------------------------------------------------------------------- */
/*  PRICING TEASER                                                              */
/*  Feature lists updated to reflect the new recall bank, image MCQs & cards.   */
/* -------------------------------------------------------------------------- */
export const pricingTeaserPlans: PricingTeaserPlan[] = [
  {
    name: 'Fast Track',
    tagline: 'For an exam booked in the next few weeks',
    duration: '1 month',
    price: getPlanPrice(PaymentPlanId.FastTrack),
    features: [
      'Full question bank for 1 exam',
      'High-yield recall bank',
      'Unlimited practice sessions',
      'Timed mock tests',
    ],
  },
  {
    name: 'Standard',
    tagline: 'The most popular runway before exam day',
    duration: '3 months',
    price: getPlanPrice(PaymentPlanId.Standard),
    features: [
      'Full question bank for 1 exam',
      'High-yield recall bank & flashcards',
      'Image-based MCQs',
      'Unlimited practice + timed mocks',
      'Progress analytics by subject',
    ],
    highlighted: true,
  },
  {
    name: 'Extended',
    tagline: 'Every Gulf exam, one plan — 6-month runway',
    duration: '6 months · all Gulf exams',
    price: getPlanPrice(PaymentPlanId.Extended),
    features: [
      'Every Gulf exam: DHA, HAAD, MOH, SMLE, OMSB, QCHP, KMLE, NHRA, SHA',
      'Recall bank, flashcards & image MCQs',
      'Unlimited practice + timed mocks',
      'Progress analytics, streaks & study plan',
      'Custom Quiz Builder — build your own quiz, timed or untimed',
      // PRD-006 M11: made explicit that the library is still in
      // production, matching VideoLecturesPage's own "library is in
      // production" framing instead of implying it's ready today.
      'Video lecture library (in production — included as it launches)',
    ],
    perk: '✨ Best for multi-exam Gulf flexibility',
  },
  // IDC Pathway is deliberately NOT here -- this array also feeds the public
  // LandingPage's homepage teaser section (`<PricingTeaser plans={pricingTeaserPlans} />`),
  // and putting Ireland's plan on the homepage is a separate, bigger launch
  // decision than making it purchasable on /pricing. Its card lives directly
  // in PricingPage.tsx's `paymentPlanCards`, sourced independently.
];

// Testimonial section removed (2026-08-18): it listed placeholder names with
// implied real outcomes ("Passed DHA", "Passed HAAD") — fabricated social
// proof on a page selling exam success. It returns with genuine,
// name-cleared, dated reviews from the pilot cohort (see docs/06).

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                         */
/* -------------------------------------------------------------------------- */
export const faqs = [
  {
    id: 1,
    question: 'Which exams does LicenseDent cover?',
    answer:
      'DHA, HAAD, MOH, SMLE, OMSB, QCHP, KMLE, NHRA, SHA plus IDC Ireland — all built for General Dentists. Gulf banks are MCQ-pattern; Ireland track adds SAQ-style cases, OSCE stations and viva reasoning so BDS graduates prepare the Irish way.',
  },
  {
    id: 2,
    question: 'Do you have recall questions?',
    answer:
      'Yes. Our recall bank compiles the concepts that repeat most often, structured subject-by-subject and refreshed after each exam cycle — corrected and verified, never raw dumps.',
  },
  {
    id: 3,
    question: 'Are there image-based questions?',
    answer:
      'Yes — radiographs (bitewing, periapical, OPG), clinical photographs and histopathology visuals, so you’re ready for the applied, image-heavy style of the real exam.',
  },
  {
    id: 4,
    question: 'Are the answers actually verified?',
    answer:
      'Every question goes through a human review queue before it’s published — nothing reaches students on a guessed or unconfirmed answer key.',
  },
  {
    id: 5,
    question: 'Can I switch exams mid-subscription?',
    answer:
      'Fast Track and Standard plans are scoped to one exam. If you need more than one, the Extended plan unlocks every exam we cover for the full 6 months.',
  },
  {
    id: 6,
    question: 'Do I need a laptop, or can I study on my phone?',
    answer: 'Both. Practice mode, flashcards and mock tests work on any device with a browser.',
  },
  {
    id: 7,
    question: 'Is there a free way to try it before buying?',
    answer: 'Yes — create a free account and practice a limited set of questions before choosing a plan.',
  },
  {
    id: 8,
    question: 'How are mock tests different from practice mode?',
    answer:
      'Practice mode shows the answer and explanation right after each question. Mock tests run on a timer with no explanations until you submit — closer to the real exam-day experience.',
  },
  {
    id: 9,
    question: 'What happens to a question if it turns out to be wrong?',
    answer:
      'Corrections go through the same review process, and the previous version is kept on record — published content is never silently edited.',
  },
  {
    id: 10,
    question: 'Can I track which subjects I need to revise more?',
    answer: 'Yes — your accuracy is broken down by subject so you can see exactly where to focus next.',
  },
];

/* -------------------------------------------------------------------------- */
/*  FOOTER                                                                      */
/* -------------------------------------------------------------------------- */
export const footerNavigation = {
  product: [
    { name: 'Exams', href: '/#exams' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'FAQ', href: '/#faq' },
  ],
  company: [
    // PRD-006 M20: About page now names who verifies our content; the
    // direct-email "Contact" link stays too, it's the faster path for an
    // existing user with a question.
    { name: 'About', href: '/about' },
    { name: 'Contact', href: 'mailto:support@licensedent.com' },
    { name: 'Terms of Service', href: '/legal#terms' },
    // PRD-006 H2: added -- the cookie-consent banner already linked to a
    // "Privacy Policy" that didn't exist anywhere; the footer had no
    // privacy link at all either.
    { name: 'Privacy Policy', href: '/legal#privacy' },
    { name: 'Refund Policy', href: '/legal#refund' },
    { name: 'Disclaimer', href: '/legal#disclaimer' },
  ],
};