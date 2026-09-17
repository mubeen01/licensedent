import { type AuthUser } from 'wasp/auth';
import { getMyProgress, useQuery } from 'wasp/client/operations';
import { Link as WaspRouterLink } from 'wasp/client/router';
import { BarChart3, Target } from 'lucide-react';
import ReactApexChart from '../lib/reactApexChart';
import { type ApexOptions } from 'apexcharts';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent } from '../components/ui/card';

// Matches the app's --primary / --secondary theme colors (Main.css), so the
// chart reads as part of the same design system instead of admin's blue palette.
const CHART_COLORS = ['#0F756D', '#0DA2E7'];

function ProgressPage({ user }: { user: AuthUser }) {
  const { data: progress, isLoading } = useQuery(getMyProgress);

  const totals = progress?.reduce(
    (acc, s) => ({ attempted: acc.attempted + s.attempted, correct: acc.correct + s.correct }),
    { attempted: 0, correct: 0 }
  );

  return (
    <DashboardLayout user={user} pageTitle='Progress'>
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        {isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}

        {!isLoading && (!progress || progress.length === 0) && (
          <Card>
            <CardContent className='p-10 text-center'>
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
            </CardContent>
          </Card>
        )}

        {!isLoading && progress && progress.length > 0 && (
          <>
            {totals && totals.attempted > 0 && (
              <Card className='bg-primary border-primary'>
                <CardContent className='p-6 text-primary-foreground'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='p-2.5 bg-white/15 rounded-xl'>
                      <Target className='w-5 h-5' />
                    </div>
                    <div>
                      <h3 className='font-semibold'>Overall accuracy</h3>
                      <p className='text-primary-foreground/75 text-sm'>
                        {totals.correct} / {totals.attempted} correct across {progress.length} subjects
                      </p>
                    </div>
                  </div>
                  <div className='text-4xl font-semibold'>{Math.round((totals.correct / totals.attempted) * 100)}%</div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-base font-semibold text-foreground mb-5'>By subject</h3>
                <SubjectAccuracyChart progress={progress} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SubjectAccuracyChart({ progress }: { progress: { subjectName: string; accuracy: number; correct: number; attempted: number }[] }) {
  const categories = progress.map((s) => s.subjectName);
  const series = [{ name: 'Accuracy', data: progress.map((s) => s.accuracy) }];

  const options: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Satoshi, sans-serif' },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 6, barHeight: '55%', distributed: true },
    },
    colors: categories.map((_, i) => (i % 2 === 0 ? CHART_COLORS[0] : CHART_COLORS[1])),
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
