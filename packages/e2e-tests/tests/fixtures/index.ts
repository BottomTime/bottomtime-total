/* eslint-disable no-empty-pattern */
import { ApiClient } from '@bottomtime/api';

import { test as base } from '@playwright/test';

import { Client } from 'pg';

import { AuthFixture } from './auth.fixture';
import { DiveSitesFixture } from './dive-sites.fixture';
import { FeatureFlagsFixture } from './feature-flags.fixture';
import { FriendsFixture } from './friends.fixture';
import { createAuthToken } from './jwt';
import { LogEntriesFixture } from './log-entries.fixture';
import { PostgresFixture } from './postgres.fixture';
import { TankProfilesFixture } from './tank-profiles.fixture';

export const test = base.extend<{
  api: ApiClient;
  auth: AuthFixture;
  db: PostgresFixture;
  diveSites: DiveSitesFixture;
  featureFlags: FeatureFlagsFixture;
  friends: FriendsFixture;
  logEntries: LogEntriesFixture;
  tankProfiles: TankProfilesFixture;
}>({
  api: async ({ baseURL, db }, use) => {
    // Create an admin user and matching auth token
    const [, authToken] = await Promise.all([
      db.createAdmin(),
      createAuthToken(PostgresFixture.adminUser.id),
    ]);

    const client = new ApiClient({
      authToken,
      baseURL,
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

  featureFlags: async ({ page }, use) => {
    const featureFlags = new FeatureFlagsFixture(page);
    await use(featureFlags);
  },

  friends: async ({ page }, use) => {
    const friends = new FriendsFixture(page);
    await use(friends);
  },

  logEntries: async ({ page }, use) => {
    const logEntries = new LogEntriesFixture(page);
    await use(logEntries);
  },

  tankProfiles: async ({ page }, use) => {
    const tankProfiles = new TankProfilesFixture(page);
    await use(tankProfiles);
  },
});

export { expect } from '@playwright/test';
