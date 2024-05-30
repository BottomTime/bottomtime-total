/* eslint-disable no-console */
import { DataSource } from 'typeorm';

import { TankEntity } from '../../src/data';
import { getDataSource } from './data-source';
import TankData from './seed/tanks.json';

export async function seedDatabase(postgresUri: string) {
  let ds: DataSource | undefined;

  try {
    console.log('Connecting to MongoDb...');
    ds = await getDataSource(postgresUri);

    console.log('Generating system tank profiles...');
    const tanks = ds.getRepository(TankEntity);
    await tanks.save(TankData as TankEntity[]);

    console.log('Database seeded.');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
