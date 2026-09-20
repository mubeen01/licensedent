// PRD-006 L10: sitemap.xml used to be hand-maintained with lastmod dates
// that drifted stale relative to real source edits. This generates it from
// the actual route list (main.wasp.ts's own `prerender: true` public routes)
// with lastmod pulled from each route's real source file via git, so it can
// never go stale again. Wired into vite.config.ts to run before every build.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://licensedent.com';

// Mirrors main.wasp.ts's public, content-bearing `prerender: true` routes --
// the same 15-page SEO candidate set as PRD-01 S0.1/S0.2. Auth/account/admin
// etc. are intentionally excluded, not useful for search. Each entry's
// `source` is the file whose last real edit should drive `lastmod`.
const ROUTES = [
  { loc: '/', source: 'src/landing-page/LandingPage.tsx', changefreq: 'weekly', priority: '1.0' },
  { loc: '/exams', source: 'src/exam-pages/examGuideIndex.ts', changefreq: 'weekly', priority: '0.9' },
  { loc: '/exams/dha', source: 'src/exam-pages/dhaContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/haad', source: 'src/exam-pages/haadContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/moh', source: 'src/exam-pages/mohContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/smle', source: 'src/exam-pages/smleContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/omsb', source: 'src/exam-pages/omsbContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/qchp', source: 'src/exam-pages/qchpContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/kmle', source: 'src/exam-pages/kmleContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/nhra', source: 'src/exam-pages/nhraContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/sha', source: 'src/exam-pages/shaContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/exams/idc-ireland', source: 'src/exam-pages/idcContent.ts', changefreq: 'monthly', priority: '0.9' },
  { loc: '/pricing', source: 'src/payment/PricingPage.tsx', changefreq: 'monthly', priority: '0.8' },
  { loc: '/demo-exam', source: 'src/demo-exam/DemoExamPage.tsx', changefreq: 'monthly', priority: '0.7' },
  { loc: '/legal', source: 'src/legal/LegalPage.tsx', changefreq: 'yearly', priority: '0.3' },
];

function lastCommitDate(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cd --date=short -- "${relPath}"`, {
      cwd: appRoot,
      encoding: 'utf-8',
    }).trim();
    if (out) return out;
  } catch {
    // fall through to today's date below (uncommitted file, or not in a git repo)
  }
  return new Date().toISOString().slice(0, 10);
}

function generate() {
  const urls = ROUTES.map(({ loc, source, changefreq, priority }) => {
    const lastmod = lastCommitDate(source);
    return `  <url>\n    <loc>${SITE_ORIGIN}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  PRD-006 L10: generated at build time by scripts/generate-sitemap.mjs from
  main.wasp.ts's real public route list -- do not hand-edit, edit ROUTES in
  that script instead. lastmod is each route's source file's real last git
  commit date, so this can't go stale the way a hand-written file did.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  writeFileSync(path.join(appRoot, 'public', 'sitemap.xml'), xml, 'utf-8');
  console.log(`[generate-sitemap] wrote public/sitemap.xml (${ROUTES.length} URLs)`);
}

generate();
