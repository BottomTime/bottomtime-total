import path from 'path';
import { DataSource } from 'typeorm';

export async function getDataSource(
  url: string,
  requireSsl: boolean,
): Promise<DataSource> {
  const client = new DataSource({
    type: 'postgres',
    url,
    entities: [path.resolve(__dirname, '../../src/data/**/*.entity.ts')],
    ssl: requireSsl,
  });
  return await client.initialize();
}
