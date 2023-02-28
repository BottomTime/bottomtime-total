import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function (): Promise<void> {
  console.log('\nStarting MongoDB server...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.__MONGO_URI__ = uri;
  (globalThis as any).mongod = mongod;

  console.log('Database is running.\n');
}
