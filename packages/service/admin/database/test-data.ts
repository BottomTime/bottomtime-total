/* eslint-disable no-console */
import { DataSource, Repository } from 'typeorm';

import { AlertEntity, DiveSiteEntity, UserEntity } from '../../src/data';
import { getDataSource } from './data-source';
import { fakeAlert, fakeDiveSite, fakeUser } from './fakes';

export type EntityCounts = {
  alerts: number;
  diveSites: number;
  users: number;
};

/**
 * Creates items one-by-one and performs batch operations on them.
 * @param iterator A callback to produce a single item.
 * @param completeBatch A callback to be fired when a batch of items is ready for processing.
 * @param count The total number of items.
 * @param batchSize Optional. The size of each batch. (Default is 50.)
 */
async function batch<T>(
  iterator: (index: number) => T | Promise<T>,
  completeBatch: (batch: T[]) => Promise<void>,
  count: number,
  batchSize = 50,
) {
  if (count < 1) {
    throw new Error('Count must be at least 1');
  }
  if (batchSize < 1) {
    throw new Error('Batch size must be at least 1');
  }

  let items: T[] = [];

  for (let i = 0; i < count; i++) {
    items.push(await iterator(i));

    if (i > 0 && (i + 1) % batchSize === 0) {
      await completeBatch(items);
      items = [];
    }
  }

  if (items.length) {
    await completeBatch(items);
  }
}

/**
 * Create a bunch of users and return their IDs.
 * @param count The number of users to insert.
 */
async function createUsers(
  Users: Repository<UserEntity>,
  count: number,
): Promise<void> {
  await batch(
    fakeUser,
    async (users) => {
      await Users.save(users);
    },
    count,
  );
}

async function createDiveSites(
  Sites: Repository<DiveSiteEntity>,
  userIds: string[],
  count: number,
): Promise<void> {
  await batch(
    () => fakeDiveSite(userIds),
    async (sites) => {
      await Sites.save(sites);
    },
    count,
  );
}

async function createAlerts(
  Alerts: Repository<AlertEntity>,
  count: number,
): Promise<void> {
  await batch(
    fakeAlert,
    async (alerts) => {
      await Alerts.save(alerts);
    },
    count,
  );
}

export async function createTestData(
  postgresUri: string,
  counts: EntityCounts,
) {
  let ds: DataSource | undefined;

  try {
    ds = await getDataSource(postgresUri);
    const Alerts = ds.getRepository(AlertEntity);
    const Users = ds.getRepository(UserEntity);
    const Sites = ds.getRepository(DiveSiteEntity);

    console.log('Seeding database (this might take a few minutes!)...');

    if (counts.users > 0) {
      console.log(`Creating ${counts.users} users...`);
      await createUsers(Users, counts.users);
    }

    const userIds = (
      await Users.find({
        select: ['id'],
        take: 1000,
      })
    ).map((user) => user.id);

    if (counts.diveSites > 0) {
      console.log(`Creating ${counts.diveSites} dive sites...`);
      await createDiveSites(Sites, userIds, counts.diveSites);
    }

    if (counts.alerts > 0) {
      console.log(`Creating ${counts.alerts} home page alerts...`);
      await createAlerts(Alerts, counts.alerts);
    }

    console.log('Finished inserting test data');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
