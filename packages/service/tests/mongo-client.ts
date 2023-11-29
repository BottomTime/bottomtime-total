/* eslint-disable no-process-env */
import { MongoClient } from 'mongodb';
import Mongoose from 'mongoose';

// Load all of the Mongoose schemas.
import '../src/schemas';

let mongoClient: MongoClient;
let mongoose: typeof Mongoose;

async function purgeDatabase() {
  const collections = await mongoClient.db().collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

global.beforeAll(async () => {
  // Connect to in-memory server
  mongoClient = await MongoClient.connect(process.env.__MONGO_URI__!);
  mongoose = await Mongoose.connect(process.env.__MONGO_URI__!);

  // Pruge the DB collections before testing.
  await purgeDatabase();
});

// Purge the DB after each test.
global.afterEach(purgeDatabase);

// Close the client connection when done.
global.afterAll(async () => {
  await Promise.all([mongoClient.close(), Mongoose.connection.close()]);
});

export { mongoClient, mongoose };
