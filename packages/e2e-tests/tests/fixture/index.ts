/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test';

import { DataSource } from 'typeorm';

import { getDataSource, purgeDatabase } from './typeorm';

export const test = base.extend<{
  db: DataSource;
  resetDb: string;
}>({
  db: async ({}, use) => {
    const ds = await getDataSource();
    await use(ds);
  },
  resetDb: [
    async ({ db }, use) => {
      await purgeDatabase(db);
      await use('resetDb');
    },
    { scope: 'test', auto: true },
  ],
});
