module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.{ts,vue}', '!./src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  resetModules: true,
  restoreMocks: true,
  verbose: true,
};
