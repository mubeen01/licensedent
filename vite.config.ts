import { execFileSync } from 'node:child_process'
import { wasp } from 'wasp/client/vite'
import { defineConfig, type Plugin } from 'vite'

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

export default defineConfig({
  plugins: [wasp(), generateSitemapPlugin()],
  server: {
    port: 3100,
    open: true,
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
