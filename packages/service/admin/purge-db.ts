/* eslint-disable no-console */
import { MongoClient } from 'mongodb';

export async function purgeDatabase(mongoUri: string) {
  console.log('Connecting to MongoDb...');
  const mongoClient = await MongoClient.connect(mongoUri);
  const collections = await mongoClient.db().collections();

  console.log('Purging data from', collections.length, 'collections...');
  await Promise.all(collections.map((collection) => collection.deleteMany({})));

  console.log('Database has been purged.');
}
