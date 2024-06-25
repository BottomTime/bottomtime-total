import path from 'path';
import { DataSource } from 'typeorm';

import { PostgresRequireSsl, PostgresUri } from './postgres-uri';

let dataSource: DataSource;

async function purgeDatabase(): Promise<void> {
  for (const entity of dataSource.entityMetadatas) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}

beforeAll(async () => {
  dataSource = new DataSource({
    type: 'postgres',
    url: PostgresUri,
    entities: [path.resolve(__dirname, '../src/data/**/*.entity.ts')],
    migrations: [path.resolve(__dirname, '../migrations/*.ts')],
    ssl: PostgresRequireSsl,
  });
  await dataSource.initialize();
  await purgeDatabase();
});

afterEach(purgeDatabase);

afterAll(async () => {
  await dataSource.destroy();
});

export { dataSource };
