/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test';

import { purgeDatabase } from './mongodb';

export const test = base.extend<{
  resetDb: string;
}>({
  resetDb: [
    async ({}, use) => {
      await purgeDatabase();
      await use('resetDb');
    },
    { scope: 'test', auto: true },
  ],
});
