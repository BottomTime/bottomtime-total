/* eslint-disable no-console, no-process-env */
import path from 'path';
import { DataSource } from 'typeorm';

export const PostgresUri =
  process.env.BT_POSTGRES_TEST_URI ||
  'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_e2e';

let dataSource: DataSource | undefined;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource) return dataSource;

  dataSource = new DataSource({
    type: 'postgres',
    url: PostgresUri,
    entities: [
      path.resolve(__dirname, '../../../service/src/data/**/*.entity.ts'),
    ],
    migrations: [path.resolve(__dirname, '../../../service/migrations/*.ts')],
  });
  return await dataSource.initialize();
}

export async function purgeDatabase(dataSource: DataSource): Promise<void> {
  for (const entity of dataSource.entityMetadatas) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}
