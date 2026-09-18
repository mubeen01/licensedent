import type { AccentId } from './accentPalette';

export interface QuickFact {
  label: string;
  value: string;
}

export interface StatCard {
  value: string;
  label: string;
  description: string;
}

export type RoadmapIcon = 'clipboard' | 'shield' | 'filecheck' | 'key' | 'calendar' | 'monitor' | 'trophy';

export interface RoadmapStep {
  icon: RoadmapIcon;
  title: string;
  description: string;
}

export type RuleIcon =
  | 'eyeoff'
  | 'users'
  | 'timerreset'
  | 'ban'
  | 'scale'
  | 'rotate'
  | 'recognition'
  | 'globe'
  | 'building';

export interface RuleCard {
  icon: RuleIcon;
  title: string;
  description: string;
}

export interface SampleQuestionOption {
  key: string;
  text: string;
}

export interface SampleQuestion {
  subject: string;
  stem: string;
  options: SampleQuestionOption[];
  correctKey: string;
  explanation: string;
}

export interface ExamFaq {
  id: number;
  question: string;
  answer: string;
}

/** One subject/domain on an exam's official blueprint. `weight` is the
 * official percentage or question count, when the authority publishes one. */
export interface ExamSubject {
  name: string;
  weight?: string;
}

export interface ExamGuideSeo {
  /** Kept under ~60 chars so it doesn't truncate in search results. */
  title: string;
  /** Kept under ~160 chars for the same reason. */
  description: string;
  /** The route's own path, e.g. '/exams/dha' -- used for the canonical URL. */
  path: string;
}

/** Everything one exam guide page needs -- content only, no JSX. */
export interface ExamGuideConfig {
  accent: AccentId;
  /** Drives the sample-question section's copy -- 'mcq' for single-best-answer
   * exams (all current Gulf exams), 'saq' for written short-answer exams (IDC
   * Ireland). Every exam here is one or the other today; extend if a future
   * exam mixes both. */
  questionFormat: 'mcq' | 'saq';
  backLinkLabel: string;

  seo: ExamGuideSeo;

  badgeFlagEmoji: string;
  badgeLabel: string;
  heroTitleLead: string;
  heroTitleHighlight: string;
  heroDescription: string;

  quickFacts: QuickFact[];

  statSectionEyebrow: string;
  statSectionTitle: string;
  statSectionDescription: string;
  statCards: StatCard[];

  subjectsEyebrow: string;
  subjectsTitle: string;
  /** Shown above the subject list -- state plainly if this authority doesn't publish an official blueprint. */
  subjectsDescription: string;
  examSubjects: ExamSubject[];

  roadmapEyebrow: string;
  roadmapTitle: string;
  roadmapDescription: string;
  roadmapSteps: RoadmapStep[];

  rulesEyebrow: string;
  rulesTitle: string;
  rulesDescription: string;
  ruleCards: RuleCard[];

  sampleQuestion: SampleQuestion;

  faqEyebrow: string;
  faqTitle: string;
  faqDescription: string;
  faqs: ExamFaq[];

  closingTitle: string;
  closingDescription: string;
}
