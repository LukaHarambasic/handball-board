import { defineConfig, devices } from '@playwright/test'

const ipad = devices['iPad Pro 11 landscape']

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'ipad-landscape', use: { ...ipad, browserName: 'webkit' } },
    { name: 'ipad-portrait', use: { ...devices['iPad Pro 11'], browserName: 'webkit' } },
    { name: 'iphone-portrait', use: { ...devices['iPhone 15'], browserName: 'webkit' } },
    { name: 'iphone-landscape', use: { ...devices['iPhone 15 landscape'], browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
