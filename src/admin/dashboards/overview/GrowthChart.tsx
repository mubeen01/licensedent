import { type ApexOptions } from 'apexcharts';
import { useMemo, useState } from 'react';
import ReactApexChart from '../../../lib/reactApexChart';
import { getAdminGrowthSeries, useQuery } from 'wasp/client/operations';
import useColorMode from '../../../client/hooks/useColorMode';
import LoadingSpinner from '../../layout/LoadingSpinner';
import ChartPanel from './ChartPanel';
import { getChartPalette } from './chartColors';
import RangeToggle from './RangeToggle';

function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function GrowthChart() {
  const [days, setDays] = useState(30);
  const [colorMode] = useColorMode();
  const { data, isLoading } = useQuery(getAdminGrowthSeries, { days });
  const palette = getChartPalette(colorMode);
  const isDark = colorMode === 'dark';

  const total = (data ?? []).reduce((sum, p) => sum + p.signups, 0);
  const categories = (data ?? []).map((p) => p.date);
  const series = [{ name: 'Signups', data: (data ?? []).map((p) => p.signups) }];

  const options: ApexOptions = useMemo(
    () => ({
      chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', foreColor: palette.axisText },
      colors: [palette.primary],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 90, 100] },
      },
      grid: {
        borderColor: palette.grid,
        strokeDashArray: 3,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        categories,
        type: 'category',
        labels: { formatter: formatShortDate, style: { colors: palette.axisText, fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: Math.min(8, Math.max(1, days - 1)),
      },
      yaxis: { labels: { style: { colors: palette.axisText, fontSize: '11px' } }, min: 0, forceNiceScale: true },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        x: { formatter: (val: number) => formatShortDate(String(val)) },
        y: { formatter: (v: number) => `${v} signup${v === 1 ? '' : 's'}` },
      },
      markers: { size: 0, hover: { size: 5 } },
    }),
    [palette, categories, days, isDark]
  );

  return (
    <ChartPanel
      title='Student growth'
      subtitle={`${total} new signup${total === 1 ? '' : 's'} in the last ${days} days`}
      action={<RangeToggle value={days} onChange={setDays} />}
    >
      {isLoading ? (
        <div className='flex h-65 items-center justify-center'>
          <LoadingSpinner />
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type='area' height={260} />
      )}
    </ChartPanel>
  );
}
