import path from 'path';
import { DataSource } from 'typeorm';

export async function getDataSource(url: string): Promise<DataSource> {
  const client = new DataSource({
    type: 'postgres',
    url,
    entities: [path.resolve(__dirname, '../../src/data/**/*.entity.ts')],
  });
  return await client.initialize();
}
