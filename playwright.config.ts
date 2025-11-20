import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Screenshot Automation
 * 
 * This config defines two projects:
 * 1. desktop - For Admin/Supervisor features (1440x900 viewport)
 * 2. teknisi-mobile - For Technician features (Pixel 5 emulation)
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Run tests in files in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 1,

  // Reporter to use
  reporter: [
    ['html'],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:8000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and devices
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // Slower actions for better screenshots
        actionTimeout: 10000,
      },
    },

    {
      name: 'teknisi-mobile',
      use: {
        ...devices['Pixel 5'],
        // Slower actions for better screenshots
        actionTimeout: 10000,
      },
    },
  ],

  // Run your local dev server before starting the tests
  // Uncomment if you want Playwright to start the server automatically
  // webServer: {
  //   command: 'php artisan serve',
  //   url: 'http://localhost:8000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
