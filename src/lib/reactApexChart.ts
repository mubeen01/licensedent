import ReactApexChartModule from 'react-apexcharts';

// react-apexcharts@1.4.1's CJS build sets `exports.default` dynamically
// (via Object.defineProperty inside its module factory, not a static
// top-level assignment), which Vite's esbuild dep-optimizer/import-
// analysis fails to unwrap correctly in dev: `import ReactApexChart from
// 'react-apexcharts'` binds to the raw `{ __esModule, default: Charts }`
// wrapper object instead of the `Charts` component itself. Symptom:
// "Element type is invalid ... got: object" wherever a chart renders.
// Unwrap defensively here once; every chart in the app should import
// from this module instead of 'react-apexcharts' directly.
const ReactApexChart = (ReactApexChartModule as unknown as { default?: typeof ReactApexChartModule }).default ?? ReactApexChartModule;

export default ReactApexChart;
