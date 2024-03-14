/* eslint-disable no-console, no-process-env */
import { mkdir } from 'fs/promises';
import path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';

import { PostgresUri } from './postgres-uri';

export default async function (): Promise<void> {
  // Create a directory for logs
  await mkdir(path.resolve(__dirname, '../logs'), { recursive: true });

  // Generate super insecure passwords for testing. We don't need the test suite taking forever to run
  // and we don't care about security in a testing context.
  process.env.BT_PASSWORD_SALT_ROUNDS = '1';

  // Now create the test database
  const postgresUri = new URL(PostgresUri);
  const database = postgresUri.pathname.slice(1);

  console.log('Initializing test database...');
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

  console.log('Database initialized. Performing migrations...');
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

  console.log('Database is ready.\n');
}
