import { type AuthUser } from 'wasp/auth';
import { getMyProgress, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink } from 'wasp/client/router';
import { BarChart3, Target } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import ReactApexChart from '../lib/reactApexChart';
import { type ApexOptions } from 'apexcharts';
import DashboardLayout from './DashboardLayout';

// Fallback hex, only used until the themed-color effect below reads the
// real CSS vars -- keeps the chart in sync with whichever theme is active
// (default teal/sky, or .theme-ireland's indigo/violet) instead of being
// frozen to one palette regardless of theme, same technique as
// StudyPlanCard's readiness gauge.
const CHART_COLOR_FALLBACKS = ['#0F756D', '#0DA2E7'];

function useThemedChartColors(varNames: string[], fallbackHex: string[]) {
  const probeRef = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState(fallbackHex);
  useLayoutEffect(() => {
    if (!probeRef.current) return;
    const computed = getComputedStyle(probeRef.current);
    const resolved = varNames.map((v, i) => {
      const value = computed.getPropertyValue(v).trim();
      return value ? `hsl(${value})` : fallbackHex[i];
    });
    setColors(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varNames.join(',')]);
  return { probeRef, colors };
}

function ProgressPage({ user }: { user: AuthUser }) {
  const { data: progress, isLoading } = useQuery(getMyProgress);
  const { probeRef, colors: chartColors } = useThemedChartColors(['--primary', '--secondary'], CHART_COLOR_FALLBACKS);

  const totals = progress?.reduce(
    (acc, s) => ({ attempted: acc.attempted + s.attempted, correct: acc.correct + s.correct }),
    { attempted: 0, correct: 0 }
  );

  return (
    <DashboardLayout user={user} pageTitle='Progress'>
      <div ref={probeRef} className='max-w-4xl mx-auto p-6 space-y-6'>
        {isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}

        {!isLoading && (!progress || progress.length === 0) && (
          <div className='card-elevated p-10 text-center'>
            <div className='w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4'>
              <BarChart3 className='w-5 h-5 text-muted-foreground' />
            </div>
            <p className='font-medium text-foreground mb-1'>No practice attempts yet</p>
            <p className='text-sm text-muted-foreground mb-4'>
              Start practicing to see your accuracy by subject here.
            </p>
            <WaspRouterLink to='/practice' className='text-sm font-medium text-primary hover:underline'>
              Start practicing
            </WaspRouterLink>
          </div>
        )}

        {!isLoading && progress && progress.length > 0 && (
          <>
            {totals && totals.attempted > 0 && (
              <div className='card-elevated relative p-6 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.06]'>
                <div className='pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-secondary/15 blur-2xl' />
                <div className='relative'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary'>
                      <Target className='w-5 h-5' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-foreground'>Overall accuracy</h3>
                      <p className='text-muted-foreground text-sm'>
                        {totals.correct} / {totals.attempted} correct across {progress.length} subjects
                      </p>
                    </div>
                  </div>
                  <div className='text-4xl font-bold tracking-tight text-foreground'>
                    {Math.round((totals.correct / totals.attempted) * 100)}%
                  </div>
                </div>
              </div>
            )}

            <div className='card-elevated p-6'>
              <h3 className='text-base font-semibold text-foreground mb-5'>By subject</h3>
              <SubjectAccuracyChart progress={progress} colors={chartColors} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SubjectAccuracyChart({
  progress,
  colors,
}: {
  progress: { subjectName: string; accuracy: number; correct: number; attempted: number }[];
  colors: string[];
}) {
  const categories = progress.map((s) => s.subjectName);
  const series = [{ name: 'Accuracy', data: progress.map((s) => s.accuracy) }];

  const options: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Satoshi, sans-serif' },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 6, barHeight: '55%', distributed: true },
    },
    colors: categories.map((_, i) => (i % 2 === 0 ? colors[0] : colors[1])),
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      style: { colors: ['#fff'], fontWeight: 700 },
    },
    xaxis: { categories, max: 100, labels: { formatter: (val) => `${val}%` } },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val: number, opts) => {
          const s = progress[opts.dataPointIndex];
          return `${val}% (${s.correct}/${s.attempted})`;
        },
      },
    },
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type='bar'
      height={Math.max(220, categories.length * 44)}
    />
  );
}

export default ProgressPage;
