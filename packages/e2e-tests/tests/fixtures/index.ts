/* eslint-disable no-empty-pattern */
import { ApiClient } from '@bottomtime/api';

import { test as base } from '@playwright/test';

import { Client } from 'pg';

import { AuthFixture } from './auth.fixture';
import { DiveSitesFixture } from './dive-sites.fixture';
import { EdgeAuthFixture } from './edge-auth.fixture';
import { FriendsFixture } from './friends.fixture';
import { createAuthToken } from './jwt';
import { LogEntriesFixture } from './log-entries.fixture';
import { OperatorsFixture } from './operators.fixture';
import { PostgresFixture } from './postgres.fixture';
import { TankProfilesFixture } from './tank-profiles.fixture';

export const test = base.extend<{
  api: ApiClient;
  auth: AuthFixture;
  db: PostgresFixture;
  diveSites: DiveSitesFixture;
  edgeAuth: EdgeAuthFixture;
  friends: FriendsFixture;
  logEntries: LogEntriesFixture;
  operators: OperatorsFixture;
  tankProfiles: TankProfilesFixture;
}>({
  api: async ({ baseURL, db, edgeAuth }, use) => {
    // Create an admin user and matching auth token
    const [, authToken] = await Promise.all([
      db.createAdmin(),
      createAuthToken(PostgresFixture.adminUser.id),
    ]);

    const client = new ApiClient({
      authToken,
      baseURL,
      edgeAuthToken: edgeAuth.authToken,
    });

    await use(client);
  },

  auth: async ({ api, page }, use) => {
    const auth = new AuthFixture(api, page);
    await use(auth);
  },

  db: async ({}, use) => {
    // Initialize the Postgres client
    const client = new Client(PostgresFixture.postgresURI);
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

  edgeAuth: async ({}, use) => {
    const edgeAuth = new EdgeAuthFixture();
    await use(edgeAuth);
  },

  friends: async ({ page }, use) => {
    const friends = new FriendsFixture(page);
    await use(friends);
  },

  logEntries: async ({ page }, use) => {
    const logEntries = new LogEntriesFixture(page);
    await use(logEntries);
  },

  operators: async ({ page }, use) => {
    const operators = new OperatorsFixture(page);
    await use(operators);
  },

  tankProfiles: async ({ page }, use) => {
    const tankProfiles = new TankProfilesFixture(page);
    await use(tankProfiles);
  },
});

export { expect } from '@playwright/test';
