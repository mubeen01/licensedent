import { type ApexOptions } from 'apexcharts';
import { useMemo, useState } from 'react';
import ReactApexChart from '../../../lib/reactApexChart';
import { getAdminReviewVelocity, useQuery } from 'wasp/client/operations';
import useColorMode from '../../../client/hooks/useColorMode';
import LoadingSpinner from '../../layout/LoadingSpinner';
import ChartPanel from './ChartPanel';
import { getChartPalette } from './chartColors';
import RangeToggle from './RangeToggle';

function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// How fast the admin team is actually clearing the review queue -- approved
// vs rejected per day. Independent of the Stripe-gated stats job; reads
// straight off Question.verifiedAt/rejectedAt, which are always populated.
export default function ReviewVelocityChart() {
  const [days, setDays] = useState(14);
  const [colorMode] = useColorMode();
  const { data, isLoading } = useQuery(getAdminReviewVelocity, { days });
  const palette = getChartPalette(colorMode);
  const isDark = colorMode === 'dark';

  const totalApproved = (data ?? []).reduce((sum, p) => sum + p.approved, 0);
  const totalRejected = (data ?? []).reduce((sum, p) => sum + p.rejected, 0);
  const categories = (data ?? []).map((p) => p.date);
  const series = [
    { name: 'Approved', data: (data ?? []).map((p) => p.approved) },
    { name: 'Rejected', data: (data ?? []).map((p) => p.rejected) },
  ];

  const options: ApexOptions = useMemo(
    () => ({
      chart: { type: 'bar', stacked: false, toolbar: { show: false }, fontFamily: 'inherit', foreColor: palette.axisText },
      colors: [palette.success, palette.destructive],
      plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: palette.axisText },
        markers: { width: 10, height: 10, radius: 10 },
      },
      grid: { borderColor: palette.grid, strokeDashArray: 3, xaxis: { lines: { show: false } } },
      xaxis: {
        categories,
        labels: { formatter: formatShortDate, style: { colors: palette.axisText, fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: palette.axisText, fontSize: '11px' } }, min: 0, forceNiceScale: true },
      tooltip: { theme: isDark ? 'dark' : 'light', x: { formatter: (val: number) => formatShortDate(String(val)) } },
    }),
    [palette, categories, isDark]
  );

  return (
    <ChartPanel
      title='Review velocity'
      subtitle={`${totalApproved} approved · ${totalRejected} rejected in the last ${days} days`}
      action={<RangeToggle value={days} onChange={setDays} options={[7, 14, 30]} />}
    >
      {isLoading ? (
        <div className='flex h-65 items-center justify-center'>
          <LoadingSpinner />
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type='bar' height={260} />
      )}
    </ChartPanel>
  );
}
