import { type ApexOptions } from 'apexcharts';
import { CalendarClock, ChevronRight, Pencil, Target } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import ReactApexChart from '../lib/reactApexChart';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { getMyStudyPlan, getReadinessScore, updateTargetExamDate, useQuery } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import LoadingSpinner from '../admin/layout/LoadingSpinner';
import { todayISODate } from './greeting';

const READINESS_COLOR_FALLBACK = '#0F756D';

// Reads the cascaded --success CSS var from the nearest themed ancestor (the
// default teal theme, or .theme-ireland's emerald override applied higher up
// in DashboardLayout) so the ApexCharts gauge -- which needs a real color
// string, not a CSS var reference -- follows whichever theme is active
// instead of staying hardcoded to one hex value forever.
function useThemedChartColor(varName: string, fallbackHex: string) {
  const probeRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState(fallbackHex);
  useLayoutEffect(() => {
    if (!probeRef.current) return;
    const value = getComputedStyle(probeRef.current).getPropertyValue(varName).trim();
    if (value) setColor(`hsl(${value})`);
  }, [varName]);
  return { probeRef, color };
}

export default function StudyPlanCard() {
  const { data: plan, isLoading: isLoadingPlan } = useQuery(getMyStudyPlan);
  const { data: readiness } = useQuery(getReadinessScore);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const { probeRef, color: readinessColor } = useThemedChartColor('--success', READINESS_COLOR_FALLBACK);

  if (isLoadingPlan) {
    return (
      <div className='card-elevated p-8'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan?.hasTargetDate || isEditingDate) {
    return (
      <div className='card-elevated p-6 md:p-8'>
        <ExamDateForm
          defaultValue={plan?.targetExamDate}
          onSaved={() => setIsEditingDate(false)}
          onCancel={plan?.hasTargetDate ? () => setIsEditingDate(false) : undefined}
        />
      </div>
    );
  }

  const options: ApexOptions = {
    chart: { type: 'radialBar', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        hollow: { size: '60%' },
        dataLabels: {
          value: { fontSize: '22px', fontWeight: 800, formatter: (v) => `${v}%` },
          name: { show: false },
        },
      },
    },
    colors: [readinessColor],
    labels: ['Readiness'],
  };

  return (
    <div className='card-elevated p-6 md:p-8'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <CalendarClock className='w-4 h-4 text-muted-foreground' />
            <h3 className='text-sm font-medium uppercase tracking-wide text-muted-foreground'>Study plan</h3>
          </div>
          <button
            onClick={() => setIsEditingDate(true)}
            className='flex items-center gap-1 text-xs font-medium text-primary hover:underline'
          >
            <Pencil className='w-3 h-3' />
            Change date
          </button>
        </div>

        <div className='flex items-center gap-6 mb-6'>
          <div ref={probeRef} className='w-24 h-24 shrink-0'>
            <ReactApexChart options={options} series={[readiness?.score ?? 0]} type='radialBar' height={96} />
          </div>
          <div>
            <p
              className='text-2xl font-semibold text-foreground'
              title={
                readiness
                  ? `${readiness.breakdown.mockAccuracyPct}% mock accuracy, ${readiness.breakdown.subjectCoveragePct}% subject coverage, ${readiness.breakdown.streakPct}% consistency`
                  : undefined
              }
            >
              {plan.daysRemaining === 0 ? 'Exam is today' : `${plan.daysRemaining} day${plan.daysRemaining === 1 ? '' : 's'} left`}
            </p>
            <p className='text-sm text-muted-foreground'>
              Aim for {plan.dailyTargetQuestions} questions today
            </p>
          </div>
        </div>

        {plan.focusSubjects.length > 0 ? (
          <div>
            <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5'>Today's focus</p>
            <div className='flex flex-col gap-2'>
              {plan.focusSubjects.map((s) => (
                <WaspRouterLink
                  key={s.subjectId}
                  to={routes.PracticeRoute.to}
                  search={{ subjects: s.subjectId }}
                  className='flex items-center justify-between gap-2 rounded-lg border border-border/70 p-3 hover:border-primary/40 hover:bg-accent/50 transition-colors'
                >
                  <span className='flex items-center gap-2'>
                    <Target className='w-3.5 h-3.5 text-primary shrink-0' />
                    <span className='text-sm font-medium text-foreground'>{s.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {s.attempted === 0 ? 'Not started' : `${s.accuracy}% accuracy`}
                    </span>
                  </span>
                  <ChevronRight className='w-4 h-4 text-muted-foreground shrink-0' />
                </WaspRouterLink>
              ))}
            </div>
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>
            Great coverage across every subject — keep up regular practice and mock exams.
          </p>
        )}
    </div>
  );
}

function ExamDateForm({
  defaultValue,
  onSaved,
  onCancel,
}: {
  defaultValue?: string | null;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState(defaultValue ? defaultValue.slice(0, 10) : '');
  const [isSaving, setIsSaving] = useState(false);
  const todayISO = todayISODate();
  const isPastDate = !!date && date < todayISO;

  async function handleSave() {
    if (!date || isPastDate) return;
    setIsSaving(true);
    try {
      await updateTargetExamDate({ targetExamDate: new Date(date) });
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <CalendarClock className='w-4 h-4 text-muted-foreground' />
        <h3 className='text-sm font-medium uppercase tracking-wide text-muted-foreground'>Study plan</h3>
      </div>
      <p className='text-sm text-foreground'>
        Set your target exam date to get a personalized daily study plan and readiness score.
      </p>
      <div className='flex flex-col sm:flex-row gap-2'>
        <input
          type='date'
          min={todayISO}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className='flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        />
        <Button disabled={!date || isPastDate || isSaving} onClick={handleSave}>
          Save
        </Button>
        {onCancel && (
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      {isPastDate && <p className='text-xs text-destructive'>Your exam date needs to be today or later.</p>}
    </div>
  );
}
