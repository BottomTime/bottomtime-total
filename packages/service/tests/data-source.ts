import path from 'path';
import { DataSource } from 'typeorm';

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
    url:
      process.env.BT_POSTGRES_TEST_URI ||
      'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_test',
    entities: [path.resolve(__dirname, '../src/data/**/*.entity.ts')],
    migrations: [path.resolve(__dirname, '../migrations/*.ts')],
  });
  await dataSource.initialize();
  await purgeDatabase();
});

afterEach(purgeDatabase);

afterAll(async () => {
  await dataSource.destroy();
});

export { dataSource };
