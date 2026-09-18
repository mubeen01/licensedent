import {
  ArrowLeft,
  ArrowRight,
  Ban,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  EyeOff,
  FileCheck2,
  Globe2,
  KeyRound,
  Monitor,
  Rotate3d,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
} from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Button } from '../../components/ui/button';
import SeoHead, { SITE_ORIGIN } from '../../client/components/SeoHead';
import ScrollToTop from '../../landing-page/components/ScrollToTop';
import SectionTitle from '../../landing-page/components/SectionTitle';
import { accentPalettes } from '../accentPalette';
import type { ExamGuideConfig, RoadmapIcon, RuleIcon } from '../examGuideTypes';

const roadmapIcons: Record<RoadmapIcon, typeof Shield> = {
  clipboard: ClipboardCheck,
  shield: ShieldCheck,
  filecheck: FileCheck2,
  key: KeyRound,
  calendar: CalendarCheck,
  monitor: Monitor,
  trophy: Trophy,
};

const ruleIcons: Record<RuleIcon, typeof Shield> = {
  eyeoff: EyeOff,
  users: Users,
  timerreset: TimerReset,
  ban: Ban,
  scale: Scale,
  rotate: Rotate3d,
  recognition: BadgeCheck,
  globe: Globe2,
  building: Building2,
};

export default function ExamGuidePage({ config }: { config: ExamGuideConfig }) {
  const accent = accentPalettes[config.accent];

  // PRD-01 S2.2/S2.3 -- both built from config that's already static/
  // human-verified (nothing fetched, nothing invented), so they're present
  // in the build-time prerendered HTML, not just after client hydration.
  const canonicalUrl = `${SITE_ORIGIN}${config.seo.path}`;
  // Every SEO title in this codebase follows "<short name> Exam Guide ... -- <subtitle> | LicenseDent" -- the part before the em dash is a clean, short label for breadcrumbs/Course names.
  const shortName = config.seo.title.split('—')[0].trim();

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: shortName,
    description: config.seo.description,
    url: canonicalUrl,
    provider: { '@type': 'EducationalOrganization', name: 'LicenseDent', url: SITE_ORIGIN },
    // The exam's own official subject/domain blueprint (sourced from that
    // authority's guideline, see this exam's *Content.ts file header) --
    // not LicenseDent's internal question-bank taxonomy.
    teaches: config.examSubjects.map((s) => s.name),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'All Exams', item: `${SITE_ORIGIN}/exams` },
      { '@type': 'ListItem', position: 3, name: shortName, item: canonicalUrl },
    ],
  };

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title={config.seo.title}
        description={config.seo.description}
        path={config.seo.path}
        faqs={config.faqs}
        extraJsonLd={[courseJsonLd, breadcrumbJsonLd]}
      />
      <main className='isolate'>
        <Hero config={config} accentClasses={accent} />
        <QuickFactsStrip config={config} accentClasses={accent} />
        <StatGrid config={config} accentClasses={accent} />
        <Roadmap config={config} accentClasses={accent} />
        <RulesSection config={config} accentClasses={accent} />
        <div className='border-y border-border/60 bg-muted/30'>
          <ExamSubjectsSection config={config} accentClasses={accent} />
        </div>
        <SampleQuestionSection config={config} accentClasses={accent} />
        <FaqSection config={config} accentClasses={accent} />
        <ClosingCta config={config} accentClasses={accent} />
      </main>
      <ScrollToTop />
    </div>
  );
}

type AccentClasses = (typeof accentPalettes)[keyof typeof accentPalettes];

/* -------------------------------------------------------------------------- */
/*  HERO                                                                       */
/* -------------------------------------------------------------------------- */
function Hero({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='relative w-full overflow-hidden bg-background pt-14'>
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden' aria-hidden='true'>
        <div className={`absolute -top-24 -left-24 h-104 w-104 rounded-full ${a.glow} blur-3xl`} />
        <div className='absolute top-1/3 -right-24 h-104 w-104 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute -bottom-24 left-1/3 h-88 w-88 rounded-full bg-gold/10 blur-3xl' />
      </div>

      <div className='mx-auto max-w-5xl px-6 py-16 sm:py-20 lg:px-8'>
        <WaspRouterLink
          to={routes.AllExamsRoute.to}
          className='group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary'
        >
          <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-0.5' />
          {config.backLinkLabel}
        </WaspRouterLink>

        <div className='mt-6 flex justify-center sm:justify-start'>
          <span
            className={`inline-flex items-center gap-2 rounded-full border ${a.border30} ${a.bg10} px-4 py-1.5 text-sm font-medium ${a.text} ${a.textDark}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br ${a.gradientFrom} ${a.gradientTo} text-sm shadow-xs`}
            >
              {config.badgeFlagEmoji}
            </span>
            {config.badgeLabel}
          </span>
        </div>

        <h1 className='mt-6 text-center text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-left lg:text-6xl'>
          {config.heroTitleLead}{' '}
          <span
            className={`block bg-linear-to-r ${a.gradientFrom} ${a.gradientVia} to-primary bg-clip-text text-transparent sm:inline`}
          >
            {config.heroTitleHighlight}
          </span>
        </h1>

        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground lg:mx-0 lg:text-left'>
          {config.heroDescription}
        </p>

        <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
          <Button
            size='lg'
            asChild
            className='group w-full border-0 bg-linear-to-r from-primary to-secondary px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 sm:w-auto'
          >
            <WaspRouterLink to={routes.SignupRoute.to}>
              Start practicing free
              <span className='inline-block transition-transform group-hover:translate-x-1' aria-hidden='true'>
                →
              </span>
            </WaspRouterLink>
          </Button>
          <Button size='lg' variant='outline' asChild className='w-full px-8 font-semibold sm:w-auto'>
            <WaspRouterLink to={routes.DemoExamRoute.to}>Try a free demo exam</WaspRouterLink>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  QUICK FACTS STRIP                                                          */
/* -------------------------------------------------------------------------- */
function QuickFactsStrip({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='mx-auto max-w-5xl px-6 lg:px-8'>
      <div className='grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4'>
        {config.quickFacts.map((fact) => (
          <div key={fact.label} className='bg-card p-5'>
            <div className={`text-xs font-semibold uppercase tracking-wide ${a.text} ${a.textDark}`}>{fact.label}</div>
            <div className='mt-1.5 text-sm font-medium leading-5 text-foreground'>{fact.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  STAT GRID                                                                  */
/* -------------------------------------------------------------------------- */
function StatGrid({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-8'>
      <SectionTitle
        eyebrow={config.statSectionEyebrow}
        title={config.statSectionTitle}
        description={config.statSectionDescription}
      />
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {config.statCards.map((stat) => (
          <div
            key={stat.label}
            className={`card-elevated card-elevated-hover group p-6 ${a.hoverBorder40}`}
          >
            <div className={`text-3xl font-bold ${a.text} ${a.textDark}`}>{stat.value}</div>
            <div className='mt-1 text-sm font-semibold text-foreground'>{stat.label}</div>
            <div className='mt-1.5 text-xs leading-5 text-muted-foreground'>{stat.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ROADMAP                                                                    */
/* -------------------------------------------------------------------------- */
function Roadmap({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='border-y border-border/60 bg-muted/30'>
      <div className='mx-auto max-w-4xl px-6 py-16 md:py-24 lg:px-8'>
        <SectionTitle
          eyebrow={config.roadmapEyebrow}
          title={config.roadmapTitle}
          description={config.roadmapDescription}
        />

        <ol className='relative mt-4 space-y-8 border-l border-border pl-8'>
          {config.roadmapSteps.map((step, idx) => {
            const Icon = roadmapIcons[step.icon];
            return (
              <li key={step.title} className='group relative'>
                <div
                  className={`absolute left-[-2.6rem] flex h-9 w-9 items-center justify-center rounded-full border-4 border-background bg-linear-to-br ${a.gradientFrom} to-primary text-white shadow-sm`}
                >
                  <Icon className='h-4 w-4' />
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wide ${a.text} ${a.textDark}`}>
                  Step {idx + 1}
                </div>
                <h3 className='mt-1 text-lg font-semibold text-foreground'>{step.title}</h3>
                <p className='mt-1.5 text-sm leading-6 text-muted-foreground'>{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  RULES                                                                      */
/* -------------------------------------------------------------------------- */
function RulesSection({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle eyebrow={config.rulesEyebrow} title={config.rulesTitle} description={config.rulesDescription} />
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {config.ruleCards.map((rule) => {
          const Icon = ruleIcons[rule.icon];
          return (
            <div
              key={rule.title}
              className={`card-elevated card-elevated-hover p-6 ${a.hoverBorder40}`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg10} ${a.text} ${a.textDark}`}>
                <Icon className='h-5 w-5' />
              </div>
              <h3 className='mt-4 text-base font-semibold text-foreground'>{rule.title}</h3>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>{rule.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EXAM SUBJECTS -- the authority's own published blueprint, not a generic   */
/*  list. If an authority doesn't publish one, subjectsDescription says so.   */
/* -------------------------------------------------------------------------- */
function ExamSubjectsSection({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='mx-auto max-w-5xl px-6 py-16 md:py-20 lg:px-8'>
      <SectionTitle
        eyebrow={config.subjectsEyebrow}
        title={config.subjectsTitle}
        description={config.subjectsDescription}
      />
      <div className='flex flex-wrap justify-center gap-3'>
        {config.examSubjects.map((subject) => (
          <div
            key={subject.name}
            className={`group flex items-center gap-2 rounded-full border border-border bg-linear-to-br from-card to-card-subtle/40 px-4 py-2.5 text-sm font-medium text-foreground shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${a.hoverBorder30}`}
          >
            {subject.name}
            {subject.weight && (
              <span className={`rounded-full ${a.bg10} px-2 py-0.5 text-xs font-semibold ${a.text} ${a.textDark}`}>
                {subject.weight}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SAMPLE QUESTION                                                            */
/* -------------------------------------------------------------------------- */
function SampleQuestionSection({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  const { subject, stem, options, correctKey, explanation } = config.sampleQuestion;
  const isSaq = config.questionFormat === 'saq';

  return (
    <div className='mx-auto max-w-3xl px-6 py-16 md:py-20 lg:px-8'>
      <SectionTitle
        eyebrow='What it actually feels like'
        title='A worked question, in the same format'
        description={
          isSaq
            ? 'Structured written-answer reasoning, not a multiple-choice guess — see the full clinical logic, not just the key.'
            : 'Single-best-answer, no ambiguity tricks — with the reasoning, not just the key.'
        }
      />

      <div className='card-elevated group relative overflow-hidden transition-transform duration-500 hover:scale-[1.005]'>
        <div className='flex items-center justify-between border-b border-border bg-muted/60 px-6 py-3'>
          <div className='flex items-center gap-2'>
            <span className={`rounded-full ${a.bg10} px-2.5 py-1 text-xs font-semibold ${a.text} ${a.textDark}`}>
              {subject}
            </span>
            <span className='text-xs text-muted-foreground'>{config.badgeLabel.split(' · ')[0]}-style mock question</span>
          </div>
          <div className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
            <Clock className='h-3.5 w-3.5' />
            {isSaq ? 'Short-answer reasoning' : 'Single best answer'}
          </div>
        </div>
        <div className='p-6'>
          <p className='text-sm font-medium leading-6 text-foreground'>{stem}</p>
          <div className='mt-5 space-y-2.5'>
            {options.map((opt) => {
              const isCorrect = opt.key === correctKey;
              return (
                <div
                  key={opt.key}
                  className={
                    'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors ' +
                    (isCorrect ? 'border-secondary/40 bg-secondary/10 text-foreground' : 'border-border text-foreground/80')
                  }
                >
                  <span
                    className={
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ' +
                      (isCorrect ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground')
                    }
                  >
                    {opt.key}
                  </span>
                  <span className='flex-1'>{opt.text}</span>
                  {isCorrect && <CheckCircle2 className='h-4 w-4 flex-none text-secondary' />}
                </div>
              );
            })}
          </div>
          <div className='mt-4 rounded-lg bg-muted/70 px-4 py-3 text-xs leading-5 text-muted-foreground'>
            <span className='font-semibold text-foreground'>Explanation: </span>
            {explanation}
          </div>
        </div>
      </div>

      <div className='mt-8 flex justify-center'>
        <Button asChild size='lg' className='group bg-linear-to-r from-primary to-secondary font-semibold text-white'>
          <WaspRouterLink to={routes.DemoExamRoute.to}>
            Try more questions like this
            <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
          </WaspRouterLink>
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */
function FaqSection({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='border-y border-border/60 bg-muted/30'>
      <div className='mx-auto max-w-4xl px-6 py-16 md:py-24 lg:px-8'>
        <SectionTitle eyebrow={config.faqEyebrow} title={config.faqTitle} description={config.faqDescription} />
        <Accordion type='single' collapsible className='w-full space-y-3'>
          {config.faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={`faq-${faq.id}`}
              className={`rounded-xl border border-border bg-linear-to-br from-card to-card-subtle/40 px-5 transition-colors duration-200 ${a.hoverBorder30} ${a.dataOpenBorder40} ${a.dataOpenBg}`}
            >
              <AccordionTrigger
                className={`py-5 text-left text-base font-semibold leading-7 text-foreground transition-colors duration-200 hover:no-underline ${a.hoverText} ${a.hoverTextDark} ${a.dataOpenText} ${a.dataOpenTextDark}`}
              >
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className='pb-5 text-muted-foreground'>
                <p className='text-base leading-7 text-muted-foreground'>{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CLOSING CTA                                                                */
/* -------------------------------------------------------------------------- */
function ClosingCta({ config, accentClasses: a }: { config: ExamGuideConfig; accentClasses: AccentClasses }) {
  return (
    <div className='mx-auto max-w-5xl px-6 py-16 md:py-24 lg:px-8'>
      <div
        className={`relative overflow-hidden rounded-3xl border border-border bg-linear-to-br ${a.glowFrom10} via-card to-primary/5 p-10 text-center shadow-lg sm:p-14`}
      >
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${a.gradientFrom} to-primary text-white shadow-lg`}
        >
          <Sparkles className='h-6 w-6' />
        </div>
        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>{config.closingTitle}</h2>
        <p className='mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground'>{config.closingDescription}</p>
        <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <Button
            size='lg'
            asChild
            className='group w-full border-0 bg-linear-to-r from-primary to-secondary px-8 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 sm:w-auto'
          >
            <WaspRouterLink to={routes.SignupRoute.to}>
              Create free account
              <span className='inline-block transition-transform group-hover:translate-x-1' aria-hidden='true'>
                →
              </span>
            </WaspRouterLink>
          </Button>
          <Button size='lg' variant='outline' asChild className='w-full px-8 font-semibold sm:w-auto'>
            <WaspRouterLink to={routes.PricingPageRoute.to}>View pricing</WaspRouterLink>
          </Button>
        </div>
        <p className='mt-8 text-xs text-muted-foreground'>
          LicenseDent is an independent exam-prep platform and is not affiliated with, endorsed by, or acting
          on behalf of any licensing authority.
        </p>
      </div>
    </div>
  );
}
