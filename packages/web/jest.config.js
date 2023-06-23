module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.{ts,vue}', '!./src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  maxWorkers: '1',
  modulePaths: ['./node_modules', '../../node_modules'],
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  reporters: ['default', 'jest-junit'],
  resetModules: true,
  restoreMocks: true,
  silent: true, // Suppress console output so we don't clutter up the test output.
  verbose: true,
};
