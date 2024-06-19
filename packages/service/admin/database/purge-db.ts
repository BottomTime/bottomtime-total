/* eslint-disable no-console */
import { DataSource } from 'typeorm';

import { getDataSource } from './data-source';

export async function purgeDatabase(postgresUri: string, requireSsl: boolean) {
  let ds: DataSource | undefined;

  try {
    ds = await getDataSource(postgresUri, requireSsl);

    console.log('Purging database...');

    for (const entity of ds.entityMetadatas) {
      const repository = ds.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName}`);
    }

    console.log('Database has been purged.');
  } catch (error) {
    console.error('Error purging database:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
