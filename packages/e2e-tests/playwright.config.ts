/* eslint-disable no-process-env */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  /* Do not run tests in files in parallel - shared database will make this a problem. */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Use a single worker process. */
  workers: 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['junit', { outputFile: 'test-results/junit.xml' }], ['list']],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:8081',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture screenshots on failed tests. */
    screenshot: 'only-on-failure',

    /* Dismiss the cookie warning in tests. */
    storageState: {
      origins: [
        {
          origin: 'localhost',
          localStorage: [
            {
              name: 'cookies_accepted',
              value: 'true',
            },
          ],
        },
      ],
      cookies: [],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ..devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'yarn migrate up && yarn serve',
      url: 'http://127.0.0.1:4801/health',
      cwd: path.resolve(__dirname, '../service'),
      env: {
        BT_MONGO_URI: 'mongodb://127.0.0.1:27017/bottomtime-e2e',
        BT_PORT: '4801',
      },
      reuseExistingServer: true,
    },
    {
      command: 'yarn serve',
      url: 'http://127.0.0.1:8081',
      cwd: path.resolve(__dirname, '../web'),
      env: {
        BT_SERVICE_URL: 'http://127.0.0.1:4801/',
        PORT: '8081',
      },
      reuseExistingServer: true,
    },
  ],
});
