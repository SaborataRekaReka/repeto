import { defineConfig } from '@playwright/test';

const parsedSlowMo = Number.parseInt(process.env.PW_SLOW_MO ?? '', 10);
const slowMo = Number.isFinite(parsedSlowMo) && parsedSlowMo > 0 ? parsedSlowMo : 0;

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/backend/**', '**/node_modules/**'],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
