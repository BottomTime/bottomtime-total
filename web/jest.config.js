module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.{ts,vue}', '!./src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  resetModules: true,
  restoreMocks: true,
  silent: true, // Suppress console output so we don't clutter up the test output.
  verbose: true,
};
