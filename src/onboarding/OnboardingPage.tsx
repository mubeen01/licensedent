import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { type AuthUser } from 'wasp/auth';
import { completeOnboarding, getMyDashboardScope, getPublicExams, useQuery } from 'wasp/client/operations';
import { useNavigate } from 'react-router';
import { routes } from 'wasp/client/router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';
import { todayISODate } from '../dashboard/greeting';
import { COUNTRIES } from './countries';

const DRAFT_KEY = 'licensedent:onboarding-draft';

const QUALIFICATIONS = ['BDS', 'DDS', 'BDentSc', 'DMD', 'BChD', 'Other'] as const;

type FormData = {
  examId: string;
  targetExamDate: string;
  fullName: string;
  yearsOfExperience: string;
  qualificationOption: string;
  qualificationOther: string;
  country: string;
  address: string;
};

const EMPTY_FORM: FormData = {
  examId: '',
  targetExamDate: '',
  fullName: '',
  yearsOfExperience: '',
  qualificationOption: '',
  qualificationOther: '',
  country: '',
  address: '',
};

function loadDraft(): { formData: FormData; currentStep: number } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { formData: EMPTY_FORM, currentStep: 1 };
    const parsed = JSON.parse(raw);
    return {
      formData: { ...EMPTY_FORM, ...parsed.formData },
      currentStep: [1, 2, 3].includes(parsed.currentStep) ? parsed.currentStep : 1,
    };
  } catch {
    return { formData: EMPTY_FORM, currentStep: 1 };
  }
}

const STEP_LABELS = ['Your exam goal', 'Your background', 'Where you’re from'];

const inputClassName =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary';

function RequiredMark() {
  return <span className='text-destructive'>*</span>;
}

function OnboardingPage({ user }: { user: AuthUser }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(() => loadDraft().formData);
  const [currentStep, setCurrentStep] = useState<number>(() => loadDraft().currentStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: exams, isLoading: examsLoading } = useQuery(getPublicExams);
  const { data: dashboardScope } = useQuery(getMyDashboardScope);
  const isIreland = dashboardScope?.kind === 'ireland';
  // A subscriber whose access already resolves to Ireland-only (granted before
  // onboarding, e.g. an admin grant or a completed IDC Pathway checkout) must
  // never be offered a Gulf exam here -- the goal-setting step would otherwise
  // contradict what they actually paid for. Free/prospective users (no access
  // yet) still see the full list, since they haven't chosen a plan.
  const selectableExams = isIreland ? (exams?.filter((e) => e.code === 'IDC') ?? []) : (exams ?? []);

  useEffect(() => {
    if (isIreland && selectableExams.length === 1 && formData.examId !== selectableExams[0].id) {
      set('examId', selectableExams[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIreland, selectableExams.length]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, currentStep }));
  }, [formData, currentStep]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const qualification =
    formData.qualificationOption === 'Other' ? formData.qualificationOther.trim() : formData.qualificationOption;

  function validateStep(step: number): boolean {
    if (step === 1) {
      return !!formData.examId && !!formData.targetExamDate && formData.targetExamDate >= todayISODate();
    }
    if (step === 2) {
      const years = Number(formData.yearsOfExperience);
      return (
        formData.fullName.trim().length > 0 &&
        formData.yearsOfExperience !== '' &&
        Number.isFinite(years) &&
        years >= 0 &&
        qualification.length > 0
      );
    }
    return !!formData.country;
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(3, s + 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  async function handleComplete() {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({
        examId: formData.examId,
        targetExamDate: new Date(formData.targetExamDate),
        fullName: formData.fullName.trim(),
        yearsOfExperience: Number(formData.yearsOfExperience),
        qualification,
        country: formData.country,
        address: formData.address.trim() || undefined,
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate(routes.DashboardHomeRoute.to);
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Something went wrong -- please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-primary/5 via-secondary/5 to-gold/5 flex items-center justify-center p-4 md:p-8'>
      <div className='w-full max-w-2xl'>
        <p className='text-center text-sm font-semibold text-muted-foreground mb-6'>LicenseDent</p>

        <div className='flex items-center justify-between mb-2'>
          <h1 className='text-xl font-black text-foreground'>Let's set up your prep</h1>
          <span className='text-sm font-medium text-muted-foreground'>Step {currentStep} of 3</span>
        </div>
        <Progress value={currentStep * 33.33} className='mb-6' />

        <div className='flex items-center justify-center gap-8 mb-6'>
          {STEP_LABELS.map((label, i) => {
            const step = i + 1;
            const isCurrent = step === currentStep;
            const isDone = step < currentStep;
            return (
              <div key={label} className='flex flex-col items-center gap-1.5'>
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                    isCurrent && 'bg-primary text-primary-foreground',
                    isDone && 'bg-success text-success-foreground',
                    !isCurrent && !isDone && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className='h-4 w-4' /> : step}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center max-w-26',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <Card className='p-8'>
          {currentStep === 1 && (
            <div className='flex flex-col gap-5'>
              <div>
                <Label>
                  Which licensing exam are you preparing for? <RequiredMark />
                </Label>
                <Select
                  value={formData.examId}
                  onValueChange={(v) => set('examId', v)}
                  disabled={isIreland}
                >
                  <SelectTrigger className='w-full mt-1.5'>
                    <SelectValue placeholder={examsLoading ? 'Loading exams…' : 'Select an exam'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableExams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.flagEmoji} {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isIreland && (
                  <p className='mt-1.5 text-xs text-muted-foreground'>Locked to IDC Ireland — your plan only covers this exam.</p>
                )}
              </div>
              <div>
                <Label>
                  When are you targeting to write the exam? <RequiredMark />
                </Label>
                <input
                  type='date'
                  min={todayISODate()}
                  value={formData.targetExamDate}
                  onChange={(e) => set('targetExamDate', e.target.value)}
                  className={cn(inputClassName, 'mt-1.5')}
                />
                {formData.targetExamDate && formData.targetExamDate < todayISODate() && (
                  <p className='mt-1.5 text-xs text-destructive'>Your exam date needs to be today or later.</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className='flex flex-col gap-5'>
              <div>
                <Label>
                  Full name <RequiredMark />
                </Label>
                <Input
                  className='mt-1.5'
                  value={formData.fullName}
                  onChange={(e) => set('fullName', e.currentTarget.value)}
                  placeholder='e.g. Fatima Al Suwaidi'
                />
              </div>
              <div>
                <Label>
                  Years of experience <RequiredMark />
                </Label>
                <Input
                  type='number'
                  min={0}
                  max={60}
                  className='mt-1.5'
                  value={formData.yearsOfExperience}
                  onChange={(e) => set('yearsOfExperience', e.currentTarget.value)}
                  placeholder='0'
                />
              </div>
              <div>
                <Label>
                  Qualification <RequiredMark />
                </Label>
                <Select value={formData.qualificationOption} onValueChange={(v) => set('qualificationOption', v)}>
                  <SelectTrigger className='w-full mt-1.5'>
                    <SelectValue placeholder='Select your qualification' />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATIONS.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.qualificationOption === 'Other' && (
                  <Input
                    className='mt-2'
                    value={formData.qualificationOther}
                    onChange={(e) => set('qualificationOther', e.currentTarget.value)}
                    placeholder='Your qualification'
                  />
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className='flex flex-col gap-5'>
              <div>
                <Label>
                  Which country are you from? <RequiredMark />
                </Label>
                <Select value={formData.country} onValueChange={(v) => set('country', v)}>
                  <SelectTrigger className='w-full mt-1.5'>
                    <SelectValue placeholder='Select your country' />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Address (optional)</Label>
                <Textarea
                  className='mt-1.5'
                  rows={3}
                  value={formData.address}
                  onChange={(e) => set('address', e.currentTarget.value)}
                  placeholder='Street, city'
                />
              </div>
            </div>
          )}

          {submitError && <p className='text-sm text-destructive mt-4'>{submitError}</p>}

          <div className='flex items-center justify-between pt-6 mt-6 border-t border-border'>
            <Button variant='outline' onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>
              Back
            </Button>
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={!validateStep(currentStep)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!validateStep(3) || isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Complete setup'}
              </Button>
            )}
          </div>
        </Card>

        <p className='text-center text-xs text-muted-foreground mt-4'>
          This helps us personalize your dashboard and practice plan.
        </p>
      </div>
    </div>
  );
}

export default OnboardingPage;
