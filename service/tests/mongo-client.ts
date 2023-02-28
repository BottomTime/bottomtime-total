import { MongoClient } from 'mongodb';
import { down, up } from 'migrate-mongo';

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

  // Perform migrations to generate schema
  const migrations = await up(mongoClient.db() as any, mongoClient as any);
  console.table(migrations.map((val) => ({ 'Completed Migration': val })));

  // Pruge the DB collections for testing.
  await purgeDatabase();
});

// Purge the DB after each test
global.afterEach(purgeDatabase);

global.afterAll(async () => {
  // Tear down the schema (to test the "migrate-mongo down" functionality.)
  const migrations = await down(mongoClient.db() as any, mongoClient as any);

  console.table(migrations.map((val) => ({ 'Reversed Migration': val })));

  // Disconnect from the Mongo server
  await mongoClient.close();
});

export { mongoClient };
