/* eslint-disable no-process-env */
import { defineConfig, devices } from '@playwright/test';

import { sign } from 'jsonwebtoken';

import { getSessionSecret } from './tests/fixtures/jwt';
import { PostgresFixture } from './tests/fixtures/postgres.fixture';

const CookieName = 'bottomtime.e2e';
const IsCI = !!process.env.CI;
const EdgeAuthSecret = process.env.BT_EDGEAUTH_SESSION_SECRET;
const TwoHoursInSeconds = 60 * 60 * 2;

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
  forbidOnly: IsCI,

  /* Retry on CI only */
  retries: IsCI ? 2 : 0,

  /* Use a single worker process. */
  workers: 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['junit', { outputFile: 'test-results/junit.xml' }], ['list']],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: IsCI ? 'https://e2e.bottomti.me' : 'http://localhost:4851',

    /* For testing against an AWS environment in CI, we need to include the edge authentication header with each request. */
    extraHTTPHeaders: {
      'x-bt-auth': EdgeAuthSecret
        ? sign(
            {
              aud: 'e2e.bottomti.me',
              exp: Date.now() / 1000 + TwoHoursInSeconds,
              sub: 'e2etests@bottomti.me',
            },
            EdgeAuthSecret,
          )
        : '',
    },

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture screenshots on failed tests. */
    screenshot: 'only-on-failure',

    /* Retain videos on failed tests. */
    video: 'retain-on-failure',

    /* Allow location APIs in the browser. */
    geolocation: { longitude: 12.492507, latitude: 41.889938 },
    permissions: ['geolocation'],
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],

        // Bypass CORS restrictions for testing locally.
        bypassCSP: true,
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
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
  webServer: IsCI
    ? undefined
    : [
        {
          command: 'yarn admin db init -f && yarn dev',
          url: 'http://localhost:4801/',
          cwd: '../service',
          env: {
            BT_AWS_MEDIA_BUCKET: 'media',
            BT_AWS_S3_ENDPOINT: 'http://localhost:4566',
            BT_AWS_SQS_ENDPOINT: 'http://localhost:4566',
            BT_AWS_SQS_EMAIL_QUEUE_URL:
              'http://localhost:9324/000000000000/emails',
            BT_BASE_URL: 'http://localhost:4851/',
            BT_LOG_LEVEL: 'debug',
            BT_PASSWORD_SALT_ROUNDS: '1',
            BT_POSTGRES_URI: PostgresFixture.postgresURI,
            BT_POSTGRES_REQUIRE_SSL: 'false',
            BT_PORT: '4801',
            // BT_SESSION_COOKIE_DOMAIN: 'localhost',
            BT_SESSION_COOKIE_NAME: CookieName,
            // BT_SESSION_SECURE_COOKIE: 'false',
            BT_SESSION_SECRET: getSessionSecret(),
            BT_DISCORD_CLIENT_ID: 'discord_client',
            BT_DISCORD_CLIENT_SECRET: 'discord_secret',
            BT_GOOGLE_CLIENT_ID: 'google_client',
            BT_GOOGLE_CLIENT_SECRET: 'google_secret',
            BT_GITHUB_CLIENT_ID: 'github_client',
            BT_GITHUB_CLIENT_SECRET: 'github_secret',
            BT_STRIPE_SDK_KEY: 'sk_test_xxxx',
          },
          timeout: 30000,
          reuseExistingServer: true,
          // stdout: 'pipe',
        },
        {
          command: 'yarn dev --force',
          url: 'http://localhost:4851/',
          cwd: '../web',
          env: {
            BTWEB_API_URL: 'http://localhost:4801/',
            BTWEB_VITE_BASE_URL: 'http://localhost:4851/',
            BTWEB_VITE_STRIPE_API_KEY:
              'pk_test_51PktwnI1ADsIvyhFBiMxntz2E4VQYFOTgHfuJBiR3H3ZQBLDx96cDVGcp1AZA5Le0uXUw0msCs63lbdofgR54dzs00h1P6bHfN',
            BTWEB_VITE_ENABLE_PLACES_API: false,
            BTWEB_LOG_LEVEL: 'debug',
            BTWEB_PORT: '4851',
            BTWEB_COOKIE_NAME: CookieName,
          },
          timeout: 30000,
          reuseExistingServer: true,
          // stdout: 'pipe',
        },
      ],
});
