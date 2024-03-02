import path from 'path';
import { DataSource } from 'typeorm';

import { Config } from '../config';

export async function initDataSource(): Promise<DataSource> {
  const AppDataSource = new DataSource({
    type: 'postgres',
    url: Config.postgresUri,
    entities: [path.join(__dirname, './**/*.entity.ts')],
  });

  return await AppDataSource.initialize();
}
