import { Collections as CollectionNames, UserData } from '@/schemas';

import { Collection, MongoClient } from 'mongodb';

// IMPORTANT:
// These collections will be preserved between tests. They are not to have their data purged.
const PreservedCollections = new Set<string>([
  'changelog', // Migrate Mongo's change log collection.
]);

let mongoClient: MongoClient | undefined;
let collections: Collections | undefined;

export interface Collections {
  users: Collection<UserData>;
}

export async function getMongoClient() {
  if (!mongoClient) {
    const mongoURI =
      process.env.BTTEST_MONGO_URI ||
      'mongodb://127.0.0.1:27017/bottomtime-e2e';
    mongoClient = await MongoClient.connect(mongoURI);
  }

  return mongoClient;
}

export async function getCollections(): Promise<Collections> {
  if (!collections) {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db();
    collections = {
      users: db.collection<UserData>(CollectionNames.Users),
    };
  }

  return collections;
}

export async function purgeDatabase() {
  // Initialize the MongoDb client (if not done already).
  const client = await getMongoClient();

  // Clean up the database so the test starts with a clean slate.
  const collections = await client.db().collections();
  await Promise.all(
    collections
      .filter(
        (collection) => !PreservedCollections.has(collection.collectionName),
      )
      .map((collection) => collection.deleteMany({})),
  );
}
