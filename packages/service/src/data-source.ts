import 'reflect-metadata';
import { DataSourceOptions } from 'typeorm';

import { Config } from './config';
import * as Entities from './data';

export const PostgresDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: Config.postgresUri,
  entities: Object.values(Entities),
  synchronize: false,
};
