import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_STATE_ADMIN = path.join(__dirname, 'playwright/.auth/admin.json');
export const STORAGE_STATE_SUPERVISOR = path.join(__dirname, 'playwright/.auth/supervisor.json');
export const STORAGE_STATE_TEKNISI = path.join(__dirname, 'playwright/.auth/teknisi.json');

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Playwright Configuration for CAKAP FT MAOS E2E Testing Suite
 * Supports Local execution and GitHub Actions CI with full isolation, retries,
 * failure tracing, screenshots, and synthetic camera/GPS media emulation.
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time per test
  timeout: 60 * 1000,

  // Expect assertion timeout
  expect: {
    timeout: 10 * 1000,
  },

  // Opt out of parallel execution for database state consistency
  fullyParallel: false,

  // Fail build on CI if test.only was left in code
  forbidOnly: !!process.env.CI,

  // Retries: 2 on CI, 0 on local
  retries: process.env.CI ? 2 : 0,

  // Serial execution to preserve database integrity
  workers: 1,

  // Reporters
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],

  // Shared settings for all projects
  use: {
    baseURL: BASE_URL,

    // Collect trace on failure for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'retain-on-failure',

    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,

    // Enable synthetic media device streams for webcam testing in headless CI
    launchOptions: {
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    },
  },

  projects: [
    // 1. Global Authentication Setup (Generates cached storage states)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // 2. Desktop Chrome (Admin & Supervisor portals)
    {
      name: 'desktop',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        permissions: ['geolocation', 'camera'],
        geolocation: { latitude: -7.6045, longitude: 109.1534 }, // Default FT Maos coordinates
      },
    },

    // 3. Mobile Chrome (Field Technician view - Pixel 5)
    {
      name: 'teknisi-mobile',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        permissions: ['geolocation', 'camera'],
        geolocation: { latitude: -7.6045, longitude: 109.1534 },
      },
    },
  ],

  // Run dev server automatically if not already running
  webServer: {
    command: 'php artisan serve --port=8000',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
