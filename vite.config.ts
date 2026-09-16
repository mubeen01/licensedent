import { wasp } from 'wasp/client/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [wasp()],
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
