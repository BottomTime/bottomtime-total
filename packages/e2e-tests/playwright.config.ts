/* eslint-disable no-process-env */
import { defineConfig, devices } from '@playwright/test';

import { getSessionSecret } from './tests/fixtures/jwt';
import { PostgresFixture } from './tests/fixtures/postgres.fixture';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/specs/',

  testMatch: '**/*.spec.ts',

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
    baseURL: 'http://127.0.0.1:4851',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture screenshots on failed tests. */
    screenshot: 'only-on-failure',
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
      command: `yarn admin db init -f -d "${PostgresFixture.postgresUri}" && yarn preview`,
      url: 'http://127.0.0.1:4801/',
      cwd: '../service',
      env: {
        BT_LOG_LEVEL: 'debug',
        BT_POSTGRES_URI: PostgresFixture.postgresUri,
        BT_PORT: '4801',
        BT_SESSION_SECRET: getSessionSecret(),
        NODE_ENV: 'production',
      },
      timeout: 10000,
      reuseExistingServer: true,
      // stdout: 'pipe',
    },
    {
      command: 'npx tsx ./server/index.ts',
      url: 'http://127.0.0.1:4851/',
      cwd: '../web',
      env: {
        BTWEB_API_URL: 'http://localhost:4801/',
        BTWEB_BASE_URL: 'http://localhost:4851/',
        BTWEB_PORT: '4851',
        // NODE_ENV: 'production',
      },
      timeout: 10000,
      reuseExistingServer: true,
    },
  ],
});
