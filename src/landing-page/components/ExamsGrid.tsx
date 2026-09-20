import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getPublicExams, useQuery } from 'wasp/client/operations';
import SectionTitle from './SectionTitle';
import { EXAM_GUIDES } from '../../exam-pages/examGuideIndex';
import { examGuideRoute } from '../../exam-pages/examGuideRoute';
import Reveal from './Reveal';

// PRD-006 C3: previously built entirely from `useQuery(getPublicExams)`, a
// client-side DB call -- this section's prerendered/server HTML had 0 real
// `<a href="/exams/<code>">` links, even though it's on the homepage, the
// site's highest-authority page for link equity. Now renders from the same
// static EXAM_GUIDES source AllExamsPage's index uses (see that module's
// header comment for the full rationale); `getPublicExams` is still queried
// but only for the live "N questions" badge.
export default function ExamsGrid() {
  const { data: exams } = useQuery(getPublicExams);
  const countByCode = new Map(exams?.map((e) => [e.code, e.publishedQuestionCount]));

  return (
    <div id='exams' className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow={`${EXAM_GUIDES.length} Gulf + Ireland exams`}
        title='Gulf licensing + IDC Ireland, one platform'
        description='Pick DHA, MOH, HAAD or IDC Ireland — banks and mocks follow each authority’s own blueprint, from Gulf MCQs to Irish SAQ-style cases.'
      />

      <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {EXAM_GUIDES.map((exam, idx: number) => {
          const questionCount = countByCode.get(exam.code);
          return (
            <Reveal key={exam.code} delay={Math.min(idx * 70, 350)} className='h-full'>
            <div
              className='card-elevated card-elevated-hover group flex h-full flex-col p-7'
            >
              {/* Top gradient accent — ties the card to its exam colour */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${exam.gradient}`} aria-hidden='true' />

              <div className='flex h-full flex-col'>
                <div className='flex items-start justify-between'>
                  <span
                    className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-linear-to-br ${exam.gradient} text-2xl shadow-xs`}
                  >
                    {exam.flagEmoji}
                  </span>
                  {questionCount != null && questionCount > 0 && (
                    <span className='rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                      {questionCount.toLocaleString()} questions
                    </span>
                  )}
                </div>

                {/* Code is the anchor people scan for */}
                <h3 className='mt-5 text-2xl font-semibold tracking-tight text-foreground'>{exam.code}</h3>
                <p className='mt-0.5 text-sm font-medium text-foreground/80'>{exam.authorityLabel}</p>
                <p className='mt-2 flex-1 text-sm leading-6 text-muted-foreground'>{exam.description}</p>

                <WaspRouterLink
                  to={examGuideRoute(exam.code) ?? routes.SignupRoute.to}
                  className='mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5'
                >
                  View exam guide <ArrowRight className='h-4 w-4' />
                </WaspRouterLink>
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>

      <div className='mt-10 flex justify-center'>
        <WaspRouterLink
          to={routes.AllExamsRoute.to}
          className='group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5'
        >
          Browse the full exam guide index <ArrowRight className='h-4 w-4' />
        </WaspRouterLink>
      </div>
    </div>
  );
}
