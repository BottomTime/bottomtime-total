import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

import { PostgresRequireSsl, PostgresUri } from './postgres-uri';

let dataSource: DataSource;
let postgresConfig: DataSourceOptions;

async function purgeDatabase(): Promise<void> {
  for (const entity of dataSource.entityMetadatas) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}

beforeAll(async () => {
  postgresConfig = {
    type: 'postgres',
    url: PostgresUri,
    entities: [path.resolve(__dirname, '../service/src/data/**/*.entity.ts')],
    migrations: [path.resolve(__dirname, '../service/migrations/*.ts')],
    ssl: PostgresRequireSsl,
  };
  dataSource = new DataSource(postgresConfig);
  await dataSource.initialize();
  await purgeDatabase();
});

afterEach(purgeDatabase);

afterAll(async () => {
  await dataSource.destroy();
});

export { dataSource, postgresConfig };
