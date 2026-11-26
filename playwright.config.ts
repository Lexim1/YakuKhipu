import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', timeout: 120_000, expect: { timeout: 15_000 }, workers: 1,
  outputDir: process.env.QA_TEST_OUTPUT ?? './test-results',
  reporter: [['list'], ['json', { outputFile: process.env.QA_TEST_REPORT ?? './test-results/report.json' }]],
  use: { baseURL: process.env.QA_BASE_URL ?? 'https://localhost:5444', ignoreHTTPSErrors: true, trace: 'off', screenshot: 'only-on-failure', channel: process.platform === 'win32' ? 'msedge' : undefined },
  projects: [{ name: 'desktop', use: { viewport: { width: 1365, height: 900 }, reducedMotion: 'reduce' } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', reducedMotion: 'reduce' } }],
})
