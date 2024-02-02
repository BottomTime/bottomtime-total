/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test';

import { Collections, getCollections, purgeDatabase } from './mongodb';

export const test = base.extend<{
  db: Collections;
  resetDb: string;
}>({
  db: async ({}, use) => {
    const collections = await getCollections();
    await use(collections);
  },
  resetDb: [
    async ({}, use) => {
      await purgeDatabase();
      await use('resetDb');
    },
    { scope: 'test', auto: true },
  ],
});
