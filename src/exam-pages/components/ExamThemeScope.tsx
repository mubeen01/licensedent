import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import useColorMode from '../../client/hooks/useColorMode';
import type { AccentId } from '../accentPalette';

/**
 * Maps this app's own per-exam accent system (`AccentId`, used for Tailwind
 * classes across the guide pages) onto Radix Themes' named color scale, so
 * Radix components (Badge, Callout) picked up in the exam guide pages carry
 * the same per-exam identity as the rest of the page instead of introducing
 * a second, disconnected color system.
 */
export const ACCENT_TO_RADIX: Record<AccentId, React.ComponentProps<typeof Theme>['accentColor']> = {
  amber: 'amber',
  teal: 'teal',
  cyan: 'cyan',
  emerald: 'jade',
  blue: 'blue',
  rose: 'ruby',
  indigo: 'indigo',
  orange: 'orange',
  violet: 'violet',
};

/**
 * Scopes Radix Themes to just the exam guide pages (not the whole app --
 * see main.wasp.ts's `rootComponent`, which stays untouched) so these pages
 * can use Radix's polished Badge/Callout primitives without introducing a
 * second, app-wide theming system. `hasBackground={false}` keeps this
 * page's own `.theme-landing` background/tokens as the source of truth --
 * Radix only supplies the components it renders, never repaints the page.
 * `appearance` tracks the same `useColorMode` toggle the rest of the site
 * uses, so light/dark stays in sync instead of drifting on its own.
 */
export default function ExamThemeScope({ accent, children }: { accent: AccentId; children: ReactNode }) {
  const [colorMode] = useColorMode();

  return (
    <Theme
      accentColor={ACCENT_TO_RADIX[accent]}
      grayColor='slate'
      radius='large'
      panelBackground='solid'
      hasBackground={false}
      appearance={colorMode === 'dark' ? 'dark' : 'light'}
    >
      {children}
    </Theme>
  );
}
