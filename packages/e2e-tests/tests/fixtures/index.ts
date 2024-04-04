/* eslint-disable no-empty-pattern */
import { ApiClient } from '@bottomtime/web/src/client';

import { test as base } from '@playwright/test';

import { Client } from 'pg';

import { AuthFixture } from './auth.fixture';
import { DiveSitesFixture } from './dive-sites.fixture';
import { createAuthToken } from './jwt';
import { PostgresFixture } from './postgres.fixture';

export const test = base.extend<{
  api: ApiClient;
  auth: AuthFixture;
  db: PostgresFixture;
  diveSites: DiveSitesFixture;
}>({
  api: async ({ db }, use) => {
    // Create an admin user and matching auth token
    const [, authToken] = await Promise.all([
      db.createAdmin(),
      createAuthToken(PostgresFixture.adminUser.id),
    ]);

    const client = new ApiClient({
      authToken,
      baseURL: 'http://127.0.0.1:4851/',
    });

    await use(client);
  },

  auth: async ({ api, page }, use) => {
    const auth = new AuthFixture(api, page);
    await use(auth);
  },

  db: async ({}, use) => {
    // Initialize the Postgres client
    const client = new Client(PostgresFixture.postgresUri);
    await client.connect();

    const postgres = new PostgresFixture(client);

    // Run the test
    await use(postgres);

    // Purge the database and disconnnect.
    await postgres.purgeDatabase();
    await client.end();
  },

  diveSites: async ({ page }, use) => {
    const diveSites = new DiveSitesFixture(page);
    await use(diveSites);
  },
});

export { expect } from '@playwright/test';
