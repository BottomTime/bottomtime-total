/* eslint-disable no-console */
import { type MongoMemoryServer } from 'mongodb-memory-server';

export default async function (): Promise<void> {
  const mongod: MongoMemoryServer = (globalThis as any).mongod;

  if (mongod) {
    console.log('\nStopping MongoDB server...');
    await mongod.stop({ doCleanup: true });
    console.log('MongoDB server has stopped.');
  }
}
