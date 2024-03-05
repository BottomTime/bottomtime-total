/* eslint-disable no-console, no-process-env */
import { mkdir } from 'fs/promises';
import { up } from 'migrate-mongo';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';

export default async function (): Promise<void> {
  await mkdir(path.resolve(__dirname, '../logs'), { recursive: true });

  let uri: string;
  let postgresUri: URL;
  if (process.env.CIRCLECI === 'true') {
    // MongoDB will be running in a dedicated Docker image in CircleCI. We can just use that.
    uri = 'mongodb://localhost:27017/ci';

    // TODO: What is the image called?
    postgresUri = new URL('postgres://localhost:5432/bottomtime_test');
  } else {
    // Otherwise, we'll run an in-memory Mongo server.
    console.log('\nStarting MongoDB server...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    (globalThis as any).mongod = mongod;

    postgresUri = new URL(
      process.env.BT_POSTGRES_TEST_URI ||
        'postgres://localhost:5432/bottomtime_test',
    );
  }

  const database = postgresUri.pathname.slice(1);

  let pgClient = new Client({
    host: postgresUri.hostname,
    port: parseInt(postgresUri.port, 10),
    user: postgresUri.username,
    password: postgresUri.password,
    database: 'postgres',
  });
  await pgClient.connect();
  await pgClient.query(`DROP DATABASE IF EXISTS ${database}`);
  await pgClient.query(`CREATE DATABASE ${database}`);
  await pgClient.end();

  pgClient = new Client({
    host: postgresUri.hostname,
    port: parseInt(postgresUri.port, 10),
    user: postgresUri.username,
    password: postgresUri.password,
    database,
  });
  await pgClient.connect();
  await pgClient.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
  await pgClient.end();

  const dataSource = new DataSource({
    type: 'postgres',
    url: postgresUri.toString(),
    entities: [path.resolve(__dirname, '../src/data/**/*.entity.ts')],
    migrations: [path.resolve(__dirname, '../migrations/*.ts')],
  });

  await dataSource.initialize();
  const migrationResults = await dataSource.runMigrations();
  console.table(migrationResults);
  await dataSource.destroy();

  process.env.__MONGO_URI__ = uri;
  process.env.BT_MONGO_URI = uri;

  // Generate super insecure passwords for testing. We don't need the test suite taking forever to run
  // and we don't care about security in a testing context.
  process.env.BT_PASSWORD_SALT_ROUNDS = '1';

  console.log('Performing migrations...');
  const client = await MongoClient.connect(uri);
  const migrations = await up(client.db() as any, client as any);
  await client.close();
  console.table(migrations.map((val) => ({ 'Completed Migration': val })));

  console.log('Database is running.\n');
}
