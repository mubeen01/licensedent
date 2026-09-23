import { CheckCircle2, Clock, GraduationCap, MapPin, ShieldCheck, XCircle } from 'lucide-react';
import { type CSSProperties, type FormEvent, useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import {
  createFastTrackApplication,
  getMyFastTrackApplication,
  getPublicExams,
  useQuery,
} from 'wasp/client/operations';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { MyFastTrackApplication } from './operations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import SeoHead from '../client/components/SeoHead';
import { ExamFlag } from '../client/components/ExamFlag';
import Eyebrow from '../landing-page/components/Eyebrow';
import Reveal from '../landing-page/components/Reveal';
import SectionTitle from '../landing-page/components/SectionTitle';

/**
 * Free, admin-vetted Fast Track pilot application (docs/09-work-changelog.md,
 * 2026-09-23 pilot-cohort decision) -- not a purchase. A logged-in dentist
 * tells us their exam, city and background; an admin reviews it by hand at
 * /admin/fast-track-applications and approving it grants a real 30-day
 * Fast Track Subscription (source: admin_grant) via the same logic manual
 * comps already use. Built from the same pieces as /contact (Eyebrow /
 * Reveal / SectionTitle / card-elevated) so it reads as one product.
 */

const dotGridStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'radial-gradient(#000000 1.8px, transparent 1.8px)',
  backgroundSize: '22px 22px',
  opacity: 0.06,
};

const whatHappensNext = [
  { title: 'We read every application', description: 'A real person on the team checks your exam date, city and background — no auto-approval.' },
  { title: "You'll hear back by email", description: "Approved or not, we'll let you know. It's usually a quick decision either way." },
  { title: 'Approved = instant access', description: 'The moment it’s approved, Fast Track unlocks on your account for the exam you picked — no card, no charge.' },
];

export default function FastTrackApplyPage({ user }: { user: AuthUser }) {
  const { data: application, isLoading: isLoadingApplication, refetch } = useQuery(getMyFastTrackApplication);
  const { data: exams } = useQuery(getPublicExams);

  const [examId, setExamId] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [whyThisExam, setWhyThisExam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!examId || !city.trim() || !experience.trim() || !whyThisExam.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createFastTrackApplication({
        examId,
        city: city.trim(),
        experience: experience.trim(),
        whyThisExam: whyThisExam.trim(),
      });
      await refetch();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit your application — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='bg-background text-foreground'>
      <SeoHead
        title='Apply for a Free Fast Track Pass'
        description="A limited number of free Fast Track passes for dentists with a real exam date coming up. Apply in a few minutes — every application is reviewed by hand."
        path='/fast-track/apply'
      />

      <main className='isolate'>
        {/* Hero */}
        <section className='relative overflow-hidden border-b border-border/60'>
          <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden='true'>
            <div style={dotGridStyle} />
          </div>
          <div className='mx-auto max-w-3xl px-6 py-20 text-center sm:py-28'>
            <Reveal className='flex justify-center'>
              <Eyebrow>Fast Track pilot</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className='mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl'>
                Apply for a <span className='text-primary'>free</span> Fast Track pass
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className='mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg'>
                We're opening a limited number of free Fast Track passes (normally $100) to dentists with a
                real exam date coming up. Tell us a bit about yourself below — every application is reviewed
                by hand, not auto-approved.
              </p>
            </Reveal>
          </div>
        </section>

        <div className='mx-auto max-w-2xl px-6 py-16 md:py-20 lg:px-8'>
          {isLoadingApplication ? null : application ? (
            <ApplicationStatusCard application={application} />
          ) : (
            <>
              <SectionTitle
                align='left'
                eyebrow='Your application'
                title="A few honest details, that's it"
                description='No essay needed — just enough for us to say yes with confidence.'
              />
              <Reveal>
                <div className='card-elevated p-6 sm:p-8'>
                  <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
                    <div>
                      <Label htmlFor='ft-exam'>Which exam are you sitting?</Label>
                      <Select value={examId} onValueChange={setExamId}>
                        <SelectTrigger id='ft-exam' className='mt-1.5 w-full'>
                          <SelectValue placeholder='Select an exam' />
                        </SelectTrigger>
                        <SelectContent>
                          {exams?.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              <span className='inline-flex items-center gap-1.5'>
                                <ExamFlag emoji={exam.flagEmoji} /> {exam.code}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='ft-city'>City</Label>
                      <Input
                        id='ft-city'
                        className='mt-1.5'
                        value={city}
                        onChange={(e) => setCity(e.currentTarget.value)}
                        placeholder='e.g. Dubai'
                        autoComplete='address-level2'
                      />
                    </div>

                    <div>
                      <Label htmlFor='ft-experience'>Your background</Label>
                      <Textarea
                        id='ft-experience'
                        className='mt-1.5'
                        rows={4}
                        value={experience}
                        onChange={(e) => setExperience(e.currentTarget.value)}
                        placeholder='Where did you qualify, and how long have you been practicing?'
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor='ft-why'>Why this exam, why now?</Label>
                      <Textarea
                        id='ft-why'
                        className='mt-1.5'
                        rows={4}
                        value={whyThisExam}
                        onChange={(e) => setWhyThisExam(e.currentTarget.value)}
                        placeholder="e.g. booked date, visa/relocation timeline, previous attempt — whatever's relevant"
                        required
                      />
                    </div>

                    {error && <p className='text-sm text-destructive'>{error}</p>}

                    <Button
                      type='submit'
                      size='lg'
                      disabled={isSubmitting || !examId || !city.trim() || !experience.trim() || !whyThisExam.trim()}
                      className='self-start'
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit application'}
                    </Button>
                  </form>
                </div>
              </Reveal>
            </>
          )}
        </div>

        {/* What happens next */}
        <div className='border-y border-border/60 bg-muted/30'>
          <div className='mx-auto max-w-4xl px-6 py-16 md:py-20 lg:px-8'>
            <SectionTitle eyebrow='The process' title='What happens after you apply' />
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
              {whatHappensNext.map((step, idx) => (
                <Reveal key={step.title} delay={idx * 90} className='h-full'>
                  <div className='card-elevated h-full p-6'>
                    <span className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary'>
                      {idx + 1}
                    </span>
                    <h3 className='mt-4 text-base font-semibold text-foreground'>{step.title}</h3>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className='mx-auto max-w-3xl px-6 py-16 text-center'>
          <p className='text-sm text-muted-foreground'>
            Not the right fit, or need access sooner?{' '}
            <WaspRouterLink to={routes.PricingPageRoute.to} className='font-semibold text-primary hover:underline'>
              See all plans & pricing
            </WaspRouterLink>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function ApplicationStatusCard({ application }: { application: MyFastTrackApplication }) {
  const exam = application.exam;

  if (application.status === 'approved') {
    return (
      <Reveal>
        <div className='card-elevated flex flex-col items-center gap-4 p-10 text-center'>
          <span className='flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success'>
            <CheckCircle2 className='h-7 w-7' />
          </span>
          <h2 className='text-2xl font-bold text-foreground'>You're in!</h2>
          <p className='max-w-md text-sm leading-6 text-muted-foreground'>
            Your free Fast Track pass for <ExamFlag emoji={exam.flagEmoji} /> {exam.code ?? exam.name} is live on your account.
            Head to your dashboard to start practicing.
          </p>
          <Button asChild>
            <WaspRouterLink to={routes.DashboardHomeRoute.to}>Go to dashboard</WaspRouterLink>
          </Button>
        </div>
      </Reveal>
    );
  }

  if (application.status === 'rejected') {
    return (
      <Reveal>
        <div className='card-elevated flex flex-col items-center gap-4 p-10 text-center'>
          <span className='flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <XCircle className='h-7 w-7' />
          </span>
          <h2 className='text-2xl font-bold text-foreground'>We couldn't offer a pilot spot this round</h2>
          <p className='max-w-md text-sm leading-6 text-muted-foreground'>
            Pilot spots for <ExamFlag emoji={exam.flagEmoji} /> {exam.code ?? exam.name} were limited. You're welcome to pick up
            a paid plan any time — same question bank, same review standard.
          </p>
          <Button asChild variant='outline'>
            <WaspRouterLink to={routes.PricingPageRoute.to}>View plans</WaspRouterLink>
          </Button>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <div className='card-elevated flex flex-col items-center gap-4 p-10 text-center'>
        <span className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <Clock className='h-7 w-7' />
        </span>
        <h2 className='text-2xl font-bold text-foreground'>Application received</h2>
        <p className='max-w-md text-sm leading-6 text-muted-foreground'>
          We're reviewing your application for <ExamFlag emoji={exam.flagEmoji} /> {exam.code ?? exam.name}. You'll get an email
          the moment there's a decision — no need to apply again.
        </p>
        <div className='mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <MapPin className='h-3.5 w-3.5' /> {application.city}
          </span>
          <span className='flex items-center gap-1.5'>
            <GraduationCap className='h-3.5 w-3.5' /> {exam.code ?? exam.name}
          </span>
          <span className='flex items-center gap-1.5'>
            <ShieldCheck className='h-3.5 w-3.5' /> Reviewed by hand
          </span>
        </div>
      </div>
    </Reveal>
  );
}
