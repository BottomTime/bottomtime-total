/* eslint-disable no-console */
import { DataSource } from 'typeorm';

import { AgencyEntity, TankEntity } from '../../src/data';
import { getDataSource } from './data-source';
import { SeedAgencies } from './seed/agencies';
import { SeedTankProfiles } from './seed/tanks';

export async function seedDatabase(postgresUri: string, requireSsl: boolean) {
  let ds: DataSource | undefined;

  try {
    console.log('Connecting to database...');
    ds = await getDataSource(postgresUri, requireSsl);

    console.log('Generating system tank profiles...');
    const tanks = ds.getRepository(TankEntity);
    await tanks.save(SeedTankProfiles);

    console.log('Generating dive agencies data...');
    const agencies = ds.getRepository(AgencyEntity);
    await agencies.save(SeedAgencies);

    console.log('Database seeded.');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
