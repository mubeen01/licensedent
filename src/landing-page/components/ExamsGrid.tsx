import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getPublicExams, useQuery } from 'wasp/client/operations';
import SectionTitle from './SectionTitle';
import LoadingSpinner from '../../admin/layout/LoadingSpinner';
import { examGuideRoute } from '../../exam-pages/examGuideRoute';
import Reveal from './Reveal';

export default function ExamsGrid() {
  const { data: exams, isLoading } = useQuery(getPublicExams);

  return (
    <div id='exams' className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:px-8'>
      <SectionTitle
        eyebrow={`${exams?.length ?? 10} Gulf + Ireland exams`}
        title='Gulf licensing + IDC Ireland, one platform'
        description='Pick DHA, MOH, HAAD or IDC Ireland — banks and mocks follow each authority’s own blueprint, from Gulf MCQs to Irish SAQ-style cases.'
      />

      {isLoading && <LoadingSpinner />}

      {exams && (
        <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {exams.map((exam, idx: number) => {
            const hasContent = exam.publishedQuestionCount > 0;
            const guideRoute = examGuideRoute(exam.code);
            return (
              <Reveal key={exam.id} delay={Math.min(idx * 70, 350)} className='h-full'>
              <div
                className='group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md'
              >
                {/* Top gradient accent — ties the card to its exam colour */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${exam.colorGradient}`} aria-hidden='true' />

                <div className='flex h-full flex-col'>
                  <div className='flex items-start justify-between'>
                    <span
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br ${exam.colorGradient} text-2xl shadow-sm`}
                    >
                      {exam.flagEmoji}
                    </span>
                    <span className='rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                      {exam.country}
                    </span>
                  </div>

                  {/* Code is the anchor people scan for */}
                  <h3 className='mt-5 text-2xl font-semibold tracking-tight text-foreground'>{exam.code}</h3>
                  <p className='mt-0.5 text-sm font-medium text-foreground/80'>{exam.authorityLabel}</p>
                  <p className='mt-2 flex-1 text-sm leading-6 text-muted-foreground'>{exam.description}</p>

                  {hasContent ? (
                    <WaspRouterLink
                      to={guideRoute ?? routes.SignupRoute.to}
                      className='mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5'
                    >
                      {guideRoute ? 'View exam guide' : 'Start practicing'} <ArrowRight className='h-4 w-4' />
                    </WaspRouterLink>
                  ) : (
                    <span className='mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      )}

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
