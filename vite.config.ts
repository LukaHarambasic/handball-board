import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }

// Netlify sets COMMIT_REF; locally fall back to git. Shown in the canvases dialog.
function commit(): string {
  const ref = process.env.COMMIT_REF
  if (ref) return ref.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}
const APP_VERSION = `${pkg.version} (${commit()})`

// Same policy as netlify.toml, so `vite preview` surfaces CSP violations before deploy.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"

export default defineConfig({
  preview: { headers: { 'Content-Security-Policy': CSP } },
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [
    // /version.json lets an installed app see a new deploy even when the service worker's own check stalls.
    {
      name: 'version-file',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION }) })
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      // No skipWaiting: a new version waits and is applied on the next launch (see platform/serviceWorker.ts).
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Handball Tactics Board',
        short_name: 'Tactics',
        description: 'A digital handball tactics board for timeouts.',
        lang: 'en',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        background_color: '#E6EAEE',
        theme_color: '#E6EAEE',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
