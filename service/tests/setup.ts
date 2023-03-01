/* eslint-disable no-console, no-process-env */
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { up } from 'migrate-mongo';

export default async function (): Promise<void> {
  console.log('\nStarting MongoDB server...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.__MONGO_URI__ = uri;
  (globalThis as any).mongod = mongod;

  console.log('Performing migrations...');
  const client = await MongoClient.connect(uri);
  const migrations = await up(client.db() as any, client as any);
  await client.close();
  console.table(migrations.map((val) => ({ 'Completed Migration': val })));

  console.log('Database is running.\n');
}
