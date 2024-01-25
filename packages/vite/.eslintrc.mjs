import path from 'path';

module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    '@vue/typescript/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'es2022',
    sourceType: 'module',
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    '@typescript-eslint/no-empty-function': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  },
  overrides: [
    {
      files: ['**/tests/**/*.{ts,vue}'],
      env: {
        jest: true,
      },
    },
  ],
};
