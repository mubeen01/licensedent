import { type ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useNavigate } from 'react-router';
import { getSubjectsForReview, useQuery } from 'wasp/client/operations';
import useColorMode from '../../../client/hooks/useColorMode';
import LoadingSpinner from '../../layout/LoadingSpinner';
import ChartPanel from './ChartPanel';
import { getChartPalette } from './chartColors';

function truncate(name: string, max = 26): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

// Published vs. awaiting-review per subject, sorted so the biggest backlog
// sits on top -- reuses the same getSubjectsForReview query the Question
// Review page's sidebar counts are built from, so this can never drift from
// what that page actually shows. Click a bar to jump straight into review.
export default function SubjectCoverageChart() {
  const [colorMode] = useColorMode();
  const { data: subjects, isLoading } = useQuery(getSubjectsForReview);
  const palette = getChartPalette(colorMode);
  const isDark = colorMode === 'dark';
  const navigate = useNavigate();

  const sorted = useMemo(
    () => [...(subjects ?? [])].filter((s) => s.totalCount > 0).sort((a, b) => b.remainingCount - a.remainingCount),
    [subjects]
  );
  const categories = sorted.map((s) => truncate(s.name));
  const fullNames = sorted.map((s) => s.name);
  const series = [
    { name: 'Published', data: sorted.map((s) => s.publishedCount) },
    { name: 'Awaiting review', data: sorted.map((s) => s.remainingCount) },
  ];

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        stacked: true,
        toolbar: { show: false },
        fontFamily: 'inherit',
        foreColor: palette.axisText,
        events: {
          dataPointSelection: (_event: unknown, _ctx: unknown, config: { dataPointIndex: number }) => {
            const name = fullNames[config.dataPointIndex];
            if (name) navigate(`/admin/questions?subject=${encodeURIComponent(name)}`);
          },
        },
      },
      colors: [palette.success, palette.warning],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: 'end', barHeight: '62%' } },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: palette.axisText },
        markers: { width: 10, height: 10, radius: 10 },
      },
      grid: { borderColor: palette.grid, strokeDashArray: 3, yaxis: { lines: { show: false } } },
      xaxis: {
        categories,
        labels: { style: { colors: palette.axisText, fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: palette.axisText, fontSize: '11px' } } },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (v: number) => `${v} question${v === 1 ? '' : 's'}` },
        x: {
          formatter: (_val: number, opts?: { dataPointIndex: number }) =>
            opts ? fullNames[opts.dataPointIndex] : '',
        },
      },
    }),
    [palette, categories, fullNames, isDark, navigate]
  );

  const chartHeight = Math.max(220, sorted.length * 34 + 60);

  return (
    <ChartPanel title='Subject coverage' subtitle='Published vs. awaiting review — click a bar to jump into that queue'>
      {isLoading ? (
        <div className='flex h-65 items-center justify-center'>
          <LoadingSpinner />
        </div>
      ) : sorted.length === 0 ? (
        <p className='py-10 text-center text-sm text-muted-foreground'>No subjects with questions yet.</p>
      ) : (
        <ReactApexChart options={options} series={series} type='bar' height={chartHeight} />
      )}
    </ChartPanel>
  );
}
