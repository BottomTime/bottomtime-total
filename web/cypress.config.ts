import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    fixturesFolder: 'tests/e2e/fixtures',
    integrationFolder: 'tests/e2e/specs',
    pluginsFile: 'tests/e2e/plugins/index.ts',
    screenshotOnRunFailure: true,
    screenshotsFolder: 'tests/e2e/screenshots',
    supportFile: 'tests/e2e/support/index.ts',
    testFiles: '**/*.spec.ts',
    video: false,
    videosFolder: 'tests/e2e/videos',
  },
});
