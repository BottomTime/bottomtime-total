/* eslint-disable no-process-env */
import { MongoClient } from 'mongodb';

let mongoClient: MongoClient;

async function purgeDatabase() {
  const collections = await mongoClient.db().collections();
  await Promise.all(
    collections.map(async (collection) => await collection.deleteMany({})),
  );
}

global.beforeAll(async () => {
  // Connect to in-memory server
  mongoClient = await MongoClient.connect(process.env.__MONGO_URI__!);

  // Pruge the DB collections before testing.
  await purgeDatabase();
});

// Purge the DB after each test.
global.afterEach(purgeDatabase);

// Close the client connection when done.
global.afterAll(async () => {
  await mongoClient.close();
});

export { mongoClient };
