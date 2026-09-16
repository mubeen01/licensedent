import { type ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { getQuestionBankStats, useQuery } from 'wasp/client/operations';
import useColorMode from '../../../client/hooks/useColorMode';
import LoadingSpinner from '../../layout/LoadingSpinner';
import ChartPanel from './ChartPanel';
import { getChartPalette } from './chartColors';

// Question status is a fixed set of states, not an open categorical list --
// same published/flagged/pending/rejected color mapping used by
// SubjectCoverageChart, so a color means the same thing everywhere on this
// dashboard. Every segment carries a visible label + count in the legend,
// never relying on hue alone to tell them apart.
export default function QuestionStatusDonut() {
  const [colorMode] = useColorMode();
  const { data: stats, isLoading } = useQuery(getQuestionBankStats);
  const palette = getChartPalette(colorMode);
  const isDark = colorMode === 'dark';

  const segments = [
    { label: 'Published', value: stats?.totalPublished ?? 0, color: palette.success },
    { label: 'Flagged', value: stats?.totalFlagged ?? 0, color: palette.warning },
    { label: 'Pending', value: stats?.totalPending ?? 0, color: palette.secondary },
    { label: 'Rejected', value: stats?.totalRejected ?? 0, color: palette.destructive },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const options: ApexOptions = useMemo(
    () => ({
      chart: { type: 'donut', fontFamily: 'inherit' },
      labels: segments.map((s) => s.label),
      colors: segments.map((s) => s.color),
      stroke: { width: 2, colors: [isDark ? '#111a22' : '#ffffff'] },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (v: number) => `${v.toLocaleString()} question${v === 1 ? '' : 's'}` },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: palette.axisText,
                formatter: () => total.toLocaleString(),
              },
              value: { color: palette.foreground, fontWeight: 700 },
            },
          },
        },
      },
    }),
    [isDark, palette, total]
  );

  return (
    <ChartPanel title='Question bank status' subtitle={`${total.toLocaleString()} questions across every subject`}>
      {isLoading ? (
        <div className='flex h-65 items-center justify-center'>
          <LoadingSpinner />
        </div>
      ) : total === 0 ? (
        <p className='py-10 text-center text-sm text-muted-foreground'>No questions imported yet.</p>
      ) : (
        <div className='flex flex-col sm:flex-row items-center gap-6'>
          <div className='w-full sm:w-1/2'>
            <ReactApexChart
              options={options}
              series={segments.map((s) => s.value)}
              type='donut'
              height={220}
            />
          </div>
          <ul className='w-full sm:w-1/2 flex flex-col gap-2.5'>
            {segments.map((s) => (
              <li key={s.label} className='flex items-center justify-between gap-2 text-sm'>
                <span className='flex items-center gap-2 font-medium text-foreground'>
                  <span className='h-2.5 w-2.5 rounded-full flex-shrink-0' style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className='text-muted-foreground tabular-nums'>
                  {s.value.toLocaleString()}
                  <span className='text-xs ml-1'>({total > 0 ? Math.round((s.value / total) * 100) : 0}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartPanel>
  );
}
