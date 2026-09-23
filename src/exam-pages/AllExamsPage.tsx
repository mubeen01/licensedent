import { Badge } from '@radix-ui/themes';
import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getPublicExams, useQuery } from 'wasp/client/operations';
import SeoHead, { SITE_ORIGIN } from '../client/components/SeoHead';
import { useBankStats } from '../client/hooks/useBankStats';
import CTABanner from '../landing-page/components/CTABanner';
import Eyebrow from '../landing-page/components/Eyebrow';
import Reveal from '../landing-page/components/Reveal';
import ScrollToTop from '../landing-page/components/ScrollToTop';
import SectionTitle from '../landing-page/components/SectionTitle';
import DotGridBackdrop from './components/DotGridBackdrop';
import ExamThemeScope, { ACCENT_TO_RADIX } from './components/ExamThemeScope';
import { examGuideRoute } from './examGuideRoute';
import { EXAM_GUIDES } from './examGuideIndex';

// PRD-01 S2.3 -- static, so it's present in the prerendered HTML.
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'All Exams', item: `${SITE_ORIGIN}/exams` },
  ],
};

export default function AllExamsPage() {
  const { stats: bankStats } = useBankStats();

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='All Exams — DHA, HAAD, MOH, SMLE, OMSB, QCHP, KMLE, NHRA, SHA, IDC | LicenseDent'
        description='Compare Gulf and Ireland dental licensing exams side by side, then jump into a dedicated guide with structure, pathway and rules for the one you need.'
        path='/exams'
        extraJsonLd={[breadcrumbJsonLd]}
      />
      <ExamThemeScope accent='indigo'>
        <main className='isolate'>
          <Hero />
          <ExamsIndexGrid />
          {/* Same closing CTA the landing page and About page end on --
              generic, honest, live-numbers copy, not exam-specific, so it
              doesn't need its own bespoke panel here. */}
          <CTABanner questionCount={bankStats?.publishedQuestionCount} examCount={bankStats?.examCount} />
        </main>
      </ExamThemeScope>
      <ScrollToTop />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  HERO                                                                       */
/* -------------------------------------------------------------------------- */
function Hero() {
  const { data: exams } = useQuery(getPublicExams);

  const countries = exams ? new Set(exams.map((e) => e.country)).size : 7;

  return (
    <div className='relative w-full overflow-hidden bg-background pt-14'>
      <DotGridBackdrop glowClassName='absolute -top-56 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[90px]' />

      <div className='mx-auto max-w-3xl px-6 py-16 text-center sm:py-20 lg:px-8'>
        <Reveal className='flex justify-center'>
          <Eyebrow>
            {exams?.length ?? 10} exams · {countries} countries · every guide written by dentists
          </Eyebrow>
        </Reveal>

        <Reveal delay={80}>
          <h1 className='mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl'>
            Gulf + Ireland dental <span className='text-primary'>licensing exams</span> in one place
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className='mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
            Pick DHA, MOH or IDC Ireland for the real structure, blueprint and process — researched from
            official regulator sources, not recycled forum posts. Then jump straight into practice built
            around it.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EXAMS INDEX GRID                                                           */
/* -------------------------------------------------------------------------- */
function ExamsIndexGrid() {
  // Live published-question counts are a progressive enhancement (the "N
  // practice questions" line below each card) -- every card and its link
  // renders unconditionally from EXAM_GUIDES above regardless of whether
  // this query has resolved, errored, or is still loading, so a failed/slow
  // query degrades to "no live count shown," never to a missing or broken
  // page. Matched by exam code, which is stable between the DB and the
  // static guide content (see guideCard() above).
  const { data: exams } = useQuery(getPublicExams);
  const countByCode = new Map(exams?.map((e) => [e.code, e.publishedQuestionCount]));

  return (
    <div className='mx-auto max-w-7xl px-6 pb-16 lg:px-8'>
      <SectionTitle
        eyebrow='Choose your exam'
        title='Click through to the full guide'
        description="Every card links to a dedicated page — exam structure, pathway, rules and a sample question, specific to that authority."
      />

      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {EXAM_GUIDES.map((exam, idx) => {
          const questionCount = countByCode.get(exam.code);

          return (
            <Reveal key={exam.code} delay={Math.min(idx * 70, 350)} className='h-full'>
              <div className='card-elevated card-elevated-hover group relative flex h-full flex-col p-5'>
                <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${exam.gradient}`} aria-hidden='true' />
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-linear-to-br ${exam.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25`}
                  aria-hidden='true'
                />

                <div className='relative z-10 flex h-full flex-col'>
                  <div className='flex items-start justify-between'>
                    <span
                      className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-linear-to-br ${exam.gradient} text-xl shadow-xs transition-transform duration-300 group-hover:scale-110`}
                    >
                      {exam.flagEmoji}
                    </span>
                    {questionCount != null && questionCount > 0 && (
                      <Badge color={ACCENT_TO_RADIX[exam.accent]} variant='soft' size='1'>
                        {questionCount.toLocaleString()} questions
                      </Badge>
                    )}
                  </div>

                  <h3 className='mt-3 text-xl font-extrabold tracking-tight text-foreground'>{exam.code}</h3>
                  <p className='mt-0.5 text-xs font-semibold text-foreground/70'>{exam.authorityLabel}</p>
                  <p className='mt-2 text-sm leading-6 text-muted-foreground'>{exam.description}</p>

                  <div className='mt-3 flex flex-wrap gap-1.5'>
                    {exam.quickChips.map((chip) => (
                      // whitespace-normal! overrides Badge's own `white-space:
                      // nowrap`, and min-w-0 overrides the flex-item default
                      // `min-width: auto` -- both are needed, since Badge is
                      // itself `display: flex` internally, so without min-w-0
                      // its text still refuses to shrink/wrap below its
                      // unwrapped intrinsic width. Some exams' quick-fact
                      // values are full sentences, not short tags, and would
                      // otherwise get clipped by the card's overflow.
                      <Badge
                        key={chip}
                        color='gray'
                        variant='soft'
                        size='1'
                        className='max-w-full min-w-0 whitespace-normal! text-left'
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>

                  <div className='mt-auto pt-4'>
                    <WaspRouterLink
                      to={examGuideRoute(exam.code) ?? routes.SignupRoute.to}
                      className='inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5'
                    >
                      View exam guide <ArrowRight className='h-4 w-4' />
                    </WaspRouterLink>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

