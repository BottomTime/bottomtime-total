/* eslint-disable no-console, no-process-env */
import { mkdir } from 'fs/promises';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import { up } from 'migrate-mongo';

export default async function (): Promise<void> {
  await mkdir(path.resolve(__dirname, '../logs'), { recursive: true });

  let uri: string;
  if (process.env.CIRCLECI === 'true') {
    // MongoDB will be running in a dedicated Docker image in CircleCI. We can just use that.
    uri = 'mongodb://localhost:27017/ci';
  } else {
    // Otherwise, we'll run an in-memory Mong server.
    console.log('\nStarting MongoDB server...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    (globalThis as any).mongod = mongod;
  }

  process.env.__MONGO_URI__ = uri;

  console.log('Performing migrations...');
  const client = await MongoClient.connect(uri);
  const migrations = await up(client.db() as any, client as any);
  await client.close();
  console.table(migrations.map((val) => ({ 'Completed Migration': val })));

  console.log('Database is running.\n');
}
