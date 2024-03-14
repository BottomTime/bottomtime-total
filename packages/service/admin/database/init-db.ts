/* eslint-disable no-console */
import path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';

export async function initDatabase(
  postgresUri: string,
  force = false,
): Promise<void> {
  const url = new URL(postgresUri);
  const database = url.pathname.slice(1);

  let pgClient: Client | undefined;
  let dataSource: DataSource | undefined;

  try {
    console.log('Initializing test database...');
    pgClient = new Client({
      host: url.hostname,
      port: parseInt(url.port, 10),
      user: url.username,
      password: url.password,
      database: 'postgres',
    });
    await pgClient.connect();

    if (force) {
      await pgClient.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
    }

    await pgClient.query(
      `CREATE DATABASE ${database} WITH OWNER ${url.username}`,
    );
    await pgClient.end();

    pgClient = new Client({
      host: url.hostname,
      port: parseInt(url.port, 10),
      user: url.username,
      password: url.password,
      database,
    });
    await pgClient.connect();
    await pgClient.query(`CREATE EXTENSION "postgis"`);
    await pgClient.end();

    console.log('Database initialized. Performing migrations...');
    dataSource = new DataSource({
      type: 'postgres',
      url: postgresUri,
      entities: [path.resolve(__dirname, '../../src/data/**/*.entity.ts')],
      migrations: [path.resolve(__dirname, '../../migrations/*.ts')],
    });

    await dataSource.initialize();
    const migrationResults = await dataSource.runMigrations();
    console.table(migrationResults);
    await dataSource.destroy();

    console.log('Database is ready.\n');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pgClient?.end();
    await dataSource?.destroy();
  }
}
