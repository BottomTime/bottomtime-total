/* eslint-disable no-console */
import path from 'path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';

export async function initDatabase(
  postgresUri: string,
  requireSsl: boolean,
  force = false,
): Promise<void> {
  const url = new URL(postgresUri);
  const database = url.pathname.slice(1);

  let pgClient: Client | undefined;
  let dataSource: DataSource | undefined;

  try {
    console.log('Initializing database...');
    pgClient = new Client({
      host: url.hostname,
      port: parseInt(url.port, 10),
      user: url.username,
      password: url.password,
      database: 'postgres',
      ssl: requireSsl,
    });
    await pgClient.connect();

    if (force) {
      console.log('Dropping existing database...');
      await pgClient.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
    } else {
      const { rowCount } = await pgClient.query(
        `SELECT 1 FROM pg_database WHERE datname='${database}'`,
      );
      if (typeof rowCount === 'number' && rowCount > 0) {
        console.log('Database already exists. Exiting...');
        console.log(
          '  HINT: If you want to force the database to be dropped and recreated, use the --force flag.',
        );
        return;
      }
    }

    await pgClient.query(
      `CREATE DATABASE ${database} WITH OWNER ${url.username} ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8' TEMPLATE = 'template0'`,
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

    console.log('Database is ready.\n\n');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pgClient?.end();
    if (dataSource?.isInitialized) {
      await dataSource?.destroy();
    }
  }
}
