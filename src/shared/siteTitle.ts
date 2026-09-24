// Wasp's required app-level `title:` (main.wasp.ts). Wasp's generated root
// layout bakes this into every page's <head> as a literal <title>, ahead of
// the per-page one SeoHead.tsx renders -- see stripDuplicateSiteTitlePlugin
// in vite.config.ts for how the extra one is removed from served HTML.
// One constant so main.wasp.ts and that plugin can never drift apart.
export const SITE_TITLE = 'LicenseDent - Gulf + Ireland Dental Licensing Exam Prep';
