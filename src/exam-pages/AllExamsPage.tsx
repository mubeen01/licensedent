import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getPublicExams, useQuery } from 'wasp/client/operations';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { Button } from '../components/ui/button';
import SeoHead from '../client/components/SeoHead';
import Footer from '../landing-page/components/Footer';
import ScrollToTop from '../landing-page/components/ScrollToTop';
import SectionTitle from '../landing-page/components/SectionTitle';
import { footerNavigation } from '../landing-page/contentSections';
import { dhaExamGuide } from './dhaContent';
import { examGuideRoute } from './examGuideRoute';
import { haadExamGuide } from './haadContent';
import { idcExamGuide } from './idcContent';
import { kmleExamGuide } from './kmleContent';
import { mohExamGuide } from './mohContent';
import { nhraExamGuide } from './nhraContent';
import { omsbExamGuide } from './omsbContent';
import { qchpExamGuide } from './qchpContent';
import { shaExamGuide } from './shaContent';
import { smleExamGuide } from './smleContent';

/** First two quick facts from each exam's own guide page, reused here as scan-friendly chips. */
const quickChipsByCode: Record<string, [string, string]> = {
  DHA: [dhaExamGuide.quickFacts[0].value, dhaExamGuide.quickFacts[1].value],
  HAAD: [haadExamGuide.quickFacts[0].value, haadExamGuide.quickFacts[1].value],
  MOH: [mohExamGuide.quickFacts[0].value, mohExamGuide.quickFacts[1].value],
  SMLE: [smleExamGuide.quickFacts[0].value, smleExamGuide.quickFacts[1].value],
  OMSB: [omsbExamGuide.quickFacts[0].value, omsbExamGuide.quickFacts[1].value],
  QCHP: [qchpExamGuide.quickFacts[0].value, qchpExamGuide.quickFacts[1].value],
  KMLE: [kmleExamGuide.quickFacts[0].value, kmleExamGuide.quickFacts[1].value],
  NHRA: [nhraExamGuide.quickFacts[0].value, nhraExamGuide.quickFacts[1].value],
  SHA: [shaExamGuide.quickFacts[0].value, shaExamGuide.quickFacts[1].value],
  IDC: [idcExamGuide.quickFacts[0].value, idcExamGuide.quickFacts[1].value],
};

export default function AllExamsPage() {
  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='All Exams — DHA, HAAD, MOH, SMLE, OMSB, QCHP, KMLE, NHRA, SHA, IDC | LicenseDent'
        description='Compare Gulf and Ireland dental licensing exams side by side, then jump into a dedicated guide with structure, pathway and rules for the one you need.'
        path='/exams'
      />
      <main className='isolate'>
        <Hero />
        <ExamsIndexGrid />
        <ClosingCta />
      </main>
      <Footer footerNavigation={footerNavigation} />
      <ScrollToTop />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  HERO                                                                       */
/* -------------------------------------------------------------------------- */
function Hero() {
  const { data: exams } = useQuery(getPublicExams);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const countries = exams ? new Set(exams.map((e) => e.country)).size : 7;

  return (
    <div className='relative w-full overflow-hidden bg-background pt-14'>
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden' aria-hidden='true'>
        <div className='absolute -top-24 -left-24 h-104 w-104 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute top-1/3 -right-24 h-104 w-104 rounded-full bg-secondary/15 blur-3xl' />
        <div className='absolute -bottom-24 left-1/3 h-88 w-88 rounded-full bg-gold/10 blur-3xl' />
      </div>

      <div className='mx-auto max-w-5xl px-6 py-16 text-center sm:py-20 lg:px-8'>
        <div
          className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
        >
          <div className='flex justify-center'>
            <span className='inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary'>
              <span className='relative flex h-2 w-2'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
              </span>
              <Sparkles className='h-4 w-4 text-primary' />
              {exams?.length ?? 9} exams · {countries} countries · every guide human-verified
            </span>
          </div>

          <h1 className='mt-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl'>
            Gulf + Ireland dental{' '}
            <span className='block animate-gradient-x bg-linear-to-r from-primary via-primary-muted to-secondary bg-size-[200%_100%] bg-clip-text text-transparent sm:inline'>
              licensing exams
            </span>{' '}
            in one place
          </h1>

          <p className='mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground'>
            Pick DHA, MOH or IDC Ireland for the real structure, blueprint and process — researched from
            official regulator sources, not recycled forum posts. Then jump straight into practice built
            around it.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EXAMS INDEX GRID                                                           */
/* -------------------------------------------------------------------------- */
function ExamsIndexGrid() {
  const { data: exams, isLoading } = useQuery(getPublicExams);

  return (
    <div className='mx-auto max-w-7xl px-6 pb-16 lg:px-8'>
      <SectionTitle
        eyebrow='Choose your exam'
        title='Click through to the full guide'
        description="Every card links to a dedicated page — exam structure, pathway, rules and a sample question, specific to that authority."
      />

      {isLoading && <LoadingSpinner />}

      {exams && (
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {exams.map((exam, idx) => {
            const hasContent = exam.publishedQuestionCount > 0;
            const guideRoute = examGuideRoute(exam.code);
            const chips = exam.code ? quickChipsByCode[exam.code] : undefined;

            return (
              <div
                key={exam.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className='animate-fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 opacity-0 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl'
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${exam.colorGradient}`} aria-hidden='true' />
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-linear-to-br ${exam.colorGradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25`}
                  aria-hidden='true'
                />

                <div className='relative z-10 flex h-full flex-col'>
                  <div className='flex items-start justify-between'>
                    <span
                      className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-linear-to-br ${exam.colorGradient} text-xl shadow-xs transition-transform duration-300 group-hover:scale-110`}
                    >
                      {exam.flagEmoji}
                    </span>
                    <span className='rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                      {exam.country}
                    </span>
                  </div>

                  <h3 className='mt-3 text-xl font-extrabold tracking-tight text-foreground'>{exam.code}</h3>
                  <p className='mt-0.5 text-xs font-semibold text-foreground/70'>{exam.authorityLabel}</p>
                  <p className='mt-2 text-sm leading-6 text-muted-foreground'>{exam.description}</p>

                  {chips && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {chips.map((chip) => (
                        <span
                          key={chip}
                          className='rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground'
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className='mt-auto pt-4'>
                    {hasContent ? (
                      <WaspRouterLink
                        to={guideRoute ?? routes.SignupRoute.to}
                        className='inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5'
                      >
                        {guideRoute ? 'View exam guide' : 'Start practicing'} <ArrowRight className='h-4 w-4' />
                      </WaspRouterLink>
                    ) : (
                      <span className='inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes exam-fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: exam-fade-in-up 0.5s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CLOSING CTA                                                                */
/* -------------------------------------------------------------------------- */
function ClosingCta() {
  return (
    <div className='mx-auto max-w-5xl px-6 py-16 md:py-24 lg:px-8'>
      <div className='relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary/10 via-card to-secondary/5 p-10 text-center shadow-lg sm:p-14'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-secondary text-white shadow-lg'>
          <Sparkles className='h-6 w-6' />
        </div>
        <h2 className='mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
          Not sure which exam is yours yet?
        </h2>
        <p className='mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground'>
          Create a free account and try a real question before you commit — the same question bank powers
          practice for every exam above.
        </p>
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
            <WaspRouterLink to={routes.DemoExamRoute.to}>Try a free demo exam</WaspRouterLink>
          </Button>
        </div>
        <div className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground'>
          <span className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-secondary' /> Free to start
          </span>
          <span className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-secondary' /> Verified by a dentist
          </span>
          <span className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-secondary' /> Cancel anytime
          </span>
        </div>
      </div>
    </div>
  );
}
