// Chart colors derived from this app's own design tokens (src/client/Main.css's
// --primary/--success/--warning/--secondary/--destructive), snapped to a
// lightness/chroma band that passes the dataviz skill's dark-mode categorical
// checks (the raw CSS custom properties are tuned for UI chrome contrast, not
// chart-mark separation, and fail the dark band as-is). Same hues as the rest
// of the admin panel, just re-stepped for chart legibility.
//
// Question status is treated as a fixed status palette (published/flagged/
// pending/rejected are states, not an open-ended category list), always
// paired with a text label/legend -- never color alone.

export type ChartPalette = {
  primary: string;
  success: string;
  warning: string;
  secondary: string;
  destructive: string;
  grid: string;
  axisText: string;
  foreground: string;
};

const LIGHT: ChartPalette = {
  primary: '#0f756d',
  success: '#25935f',
  warning: '#d39e17',
  secondary: '#0da2e7',
  destructive: '#ef4444',
  grid: '#dae0e7',
  axisText: '#5a6672',
  foreground: '#151f28',
};

const DARK: ChartPalette = {
  primary: '#28bdb1',
  success: '#3db87e',
  warning: '#e2b236',
  secondary: '#39b5ef',
  destructive: '#d44444',
  grid: '#252e37',
  axisText: '#9da9af',
  foreground: '#f3f5f7',
};

export function getChartPalette(colorMode: string): ChartPalette {
  return colorMode === 'dark' ? DARK : LIGHT;
}

// Question.status -> chart color, one mapping used everywhere status shows up
// (donut, subject-coverage stacked bars) so the same color always means the
// same thing on this page.
export function statusColor(palette: ChartPalette, status: 'published' | 'flagged' | 'pending' | 'rejected'): string {
  switch (status) {
    case 'published':
      return palette.success;
    case 'flagged':
      return palette.warning;
    case 'pending':
      return palette.secondary;
    case 'rejected':
      return palette.destructive;
  }
}
