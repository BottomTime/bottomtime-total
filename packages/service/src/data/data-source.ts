import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Config } from '../config';

export const PostgresDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: Config.postgresUri,
  entities: [path.join(__dirname, './**/*.entity.ts')],
  synchronize: false,
};

export async function initDataSource(): Promise<DataSource> {
  const AppDataSource = new DataSource(PostgresDataSourceOptions);
  return await AppDataSource.initialize();
}
