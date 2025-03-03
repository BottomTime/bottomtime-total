import { AgencyFactory } from '../../src/certifications';
import { AgencyEntity } from '../../src/data';
import { dataSource } from '../data-source';

export function createAgencyFactory(): AgencyFactory {
  const agencies = dataSource.getRepository(AgencyEntity);
  return new AgencyFactory(agencies);
}
