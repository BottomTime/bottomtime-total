/* eslint-disable no-console */
import { type MongoMemoryServer } from 'mongodb-memory-server';

export default async function (): Promise<void> {
  console.log('\nStopping MongoDB server...');
  const mongod: MongoMemoryServer = (globalThis as any).mongod;
  await mongod.stop({ doCleanup: true });
  console.log('MongoDB server has stopped.');
}
