import { execFileSync } from 'node:child_process'
import { wasp } from 'wasp/client/vite'
import { defineConfig, type Plugin } from 'vite'
import { SITE_TITLE } from './src/shared/siteTitle'

// PRD-006 L10: sitemap.xml used to be hand-maintained and went stale. This
// regenerates it from the real route list (scripts/generate-sitemap.mjs)
// before every build, so `public/sitemap.xml` is always current when Vite
// copies `public/` into the build output. Dev mode doesn't need it (dev
// never serves `public/` as a deployable artifact), so it only runs for
// the actual production build.
function generateSitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    buildStart() {
      execFileSync(process.execPath, ['scripts/generate-sitemap.mjs'], { stdio: 'inherit' })
    },
  }
}

// Wasp's generated root layout (.wasp/out/sdk/wasp/client/app/layout.tsx)
// renders main.wasp.ts's `title:` as a literal <title> inside <head>, and
// every page then renders its own via SeoHead.tsx -- so each prerendered
// page shipped two <title> tags. Crawlers and `document.title` take the
// first one, so non-JS crawlers saw the generic sitewide title on every
// page. This fixes the served HTML itself. In the browser, App.tsx and
// SeoHead.tsx keep `document.title` correct by setting it, never by
// removing <title> nodes: React owns those, and removing one crashed
// navigation. The layout lives in generated
// code we can't edit, but its output (dev SSR responses and every
// prerendered build entry) goes through Vite's transformIndexHtml, so the
// stray tag is removed here. Only strips it when a second <title> exists,
// so a page that forgets SeoHead still keeps a title.
const TITLE_TAG_RE = /<title[^>]*>([\s\S]*?)<\/title>/gi

function stripDuplicateSiteTitlePlugin(): Plugin {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const staticTitle = new Set([SITE_TITLE, escapeHtml(SITE_TITLE)])
  return {
    name: 'strip-duplicate-site-title',
    transformIndexHtml(html) {
      const titles = [...html.matchAll(TITLE_TAG_RE)]
      if (titles.length < 2) return html
      const stray = titles.find((m) => staticTitle.has(m[1].trim()))
      if (!stray || stray.index === undefined) return html
      return html.slice(0, stray.index) + html.slice(stray.index + stray[0].length)
    },
  }
}

export default defineConfig({
  plugins: [wasp(), generateSitemapPlugin(), stripDuplicateSiteTitlePlugin()],
  server: {
    port: 3100,
    open: true,
    // Pre-compile every page when the dev server starts. Pages are lazy
    // routes, and Vite otherwise compiles each one (plus its imports) the
    // first time you open it, which made the first click on a sidebar or
    // menu item look frozen for several seconds. Dev-only: production builds
    // are already compiled.
    warmup: {
      clientFiles: ['./src/**/*Page.tsx', './src/client/App.tsx'],
    },
    // Polling instead of native fs events: this project lives on a
    // Windows drive mounted into WSL (/mnt/d), where inotify events from
    // edits made outside the WSL process often don't reach chokidar.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  // The Wasp SDK is reached via a filesystem symlink (app/node_modules/wasp ->
  // .wasp/out/sdk/wasp) outside Vite's project root. Without dedupe, imports of
  // react/react-dom reached through that path can bypass Vite's dependency
  // pre-bundling and load as a second module instance, breaking React internals
  // (symptom: "Cannot read properties of undefined (reading 'ReactCurrentDispatcher')").
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
