import path from 'path';
import 'reflect-metadata';
import { DataSourceOptions } from 'typeorm';

import { Config } from '../config';

export const PostgresDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: Config.postgresUri,
  entities: [path.join(__dirname, './**/*.entity.ts')],
  synchronize: false,
};
