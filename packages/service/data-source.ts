import path from 'path';
import { DataSource } from 'typeorm';

import { PostgresDataSourceOptions } from './src/data-source';

export default new DataSource({
  ...PostgresDataSourceOptions,
  migrations: [path.join(__dirname, './migrations/*.ts')],
});
