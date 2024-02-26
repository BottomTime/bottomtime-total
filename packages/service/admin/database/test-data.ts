/* eslint-disable no-console */
import mongoose from 'mongoose';

import { DiveSiteModel, UserModel } from '../../src/schemas';
import { fakeDiveSite, fakeUser } from './fakes';

export type EntityCounts = {
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
async function createUsers(count: number): Promise<void> {
  await batch(
    async () => {
      const data = fakeUser();
      return data;
    },
    async (users) => {
      await UserModel.insertMany(users);
    },
    count,
  );
}

async function createDiveSites(userIds: string[], count: number) {
  await batch(
    () => {
      const data = fakeDiveSite(userIds);
      return data;
    },
    async (sites) => {
      await DiveSiteModel.insertMany(sites);
    },
    count,
  );
}

export async function createTestData(mongoUri: string, counts: EntityCounts) {
  try {
    console.log('Connecting to MongoDb...');
    await mongoose.connect(mongoUri);

    console.log('Seeding database (this might take a few minutes!)...');

    if (counts.users > 0) {
      console.log(`Creating ${counts.users} users...`);
      await createUsers(counts.users);
    }

    const userIdQuery = await UserModel.find(
      {},
      {
        _id: 1,
      },
    ).limit(1000);
    const userIds = userIdQuery.map((user) => user._id);

    console.log(`Creating ${counts.diveSites} dive sites...`);
    await createDiveSites(userIds, counts.diveSites);

    console.log('Finished inserting test data');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}
