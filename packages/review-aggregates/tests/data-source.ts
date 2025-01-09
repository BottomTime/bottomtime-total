import * as Entities from '@bottomtime/service/src/data';

import path from 'path';
import { Client } from 'pg';
import { DataSource, DataSourceOptions } from 'typeorm';

import { PostgresRequireSsl, PostgresUri } from './postgres-uri';

let dataSource: DataSource;
let postgresClient: Client;
let postgresConfig: DataSourceOptions;

async function purgeDatabase(): Promise<void> {
  for (const entity of dataSource.entityMetadatas) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}

beforeAll(async () => {
  postgresClient = new Client({
    connectionString: PostgresUri,
    ssl: PostgresRequireSsl,
  });
  postgresConfig = {
    type: 'postgres',
    url: PostgresUri,
    entities: Entities,
    migrations: [path.resolve(__dirname, '../service/migrations/*.ts')],
    ssl: PostgresRequireSsl,
  };
  dataSource = new DataSource(postgresConfig);
  await dataSource.initialize();
  await postgresClient.connect();
  await purgeDatabase();
});

afterEach(purgeDatabase);

afterAll(async () => {
  await dataSource.destroy();
  await postgresClient.end();
});

export { dataSource, postgresClient, postgresConfig };
