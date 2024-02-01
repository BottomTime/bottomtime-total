/* eslint-disable no-process-env */
// Load all of the Mongoose schemas.
import '@/schemas';

import { MongoClient } from 'mongodb';
import Mongoose from 'mongoose';

let mongoClient: MongoClient;
let mongoose: typeof Mongoose;

async function purgeDatabase() {
  const collections = await mongoClient.db().collections();
  await Promise.all(
    collections
      .filter((collection) => collection.collectionName !== 'changelog')
      .map((collection) => collection.deleteMany({})),
  );
}

beforeAll(async () => {
  // Connect to in-memory server
  mongoClient = await MongoClient.connect(process.env.__MONGO_URI__!);
  mongoose = await Mongoose.connect(process.env.__MONGO_URI__!);

  // Purge the DB collections before testing.
  await purgeDatabase();
});

// Purge the DB after each test.
afterEach(purgeDatabase);

// Close the client connection when done.
afterAll(async () => {
  await Promise.all([mongoClient.close(), Mongoose.connection.close()]);
});

export { mongoClient, mongoose };
