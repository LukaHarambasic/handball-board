import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Same policy as netlify.toml, so `vite preview` surfaces CSP violations before deploy.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"

export default defineConfig({
  preview: { headers: { 'Content-Security-Policy': CSP } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // No skipWaiting: a new version waits and is applied on the next launch (see platform/serviceWorker.ts).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
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
