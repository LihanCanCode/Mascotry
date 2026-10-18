import { defineConfig, devices } from '@playwright/test'

/**
 * The end-to-end suite runs against a real production build served by
 * `vite preview`, not against the dev server.
 *
 * That matters here more than usual: the two runtime files and the render
 * worker are separate build outputs, and the demo page is only honest if it is
 * loading the same artifacts a visitor would. A dev-server run would exercise
 * Vite's on-the-fly transforms instead.
 */
const PORT = 4321

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    trace: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
