/* eslint-disable no-console */
import mongoose from 'mongoose';

import { UserModel } from '../../src/schemas';
import { fakeUser } from './fakes';

export type EntityCounts = {
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
async function createUsers(count: number): Promise<string[]> {
  const ids: string[] = [];

  await batch(
    async () => {
      const data = fakeUser();
      ids.push(data._id);
      return data;
    },
    async (users) => {
      await UserModel.insertMany(users);
    },
    count,
  );

  return ids;
}

// async function createDiveSites(
//   mongoClient: MongoClient,
//   userIds: string[],
//   count: number,
// ) {
//   const sitesCollection = mongoClient
//     .db()
//     .collection<DiveSiteDocument>(Collections.DiveSites);

//   await batch(
//     () => {
//       return fakeDiveSite({
//         creator: faker.helpers.arrayElement(userIds),
//       });
//     },
//     async (sites) => {
//       await sitesCollection.insertMany(sites);
//     },
//     count,
//     100,
//   );
// }

export async function createTestData(mongoUri: string, counts: EntityCounts) {
  try {
    console.log('Connecting to MongoDb...');
    await mongoose.connect(mongoUri);

    console.log('Seeding database (this might take a few minutes!)...');

    let userIds: string[] = [];
    if (counts.users > 0) {
      console.log(`Creating ${counts.users} users...`);
      userIds = await createUsers(counts.users);
    }

    // console.log('Creating 1000 dive sites...');
    // await createDiveSites(mongoClient, userIds, 1000);

    console.log('Finished inserting test data');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}
