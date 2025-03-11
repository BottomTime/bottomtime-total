import { CreateOrUpdateAgencyDTO } from '@bottomtime/api';

import { createAgencyFactory } from 'tests/utils';
import { Repository } from 'typeorm';

import { AgenciesService } from '../../../src/certifications';
import { AgencyEntity } from '../../../src/data';
import { dataSource } from '../../data-source';

const TestData: AgencyEntity[] = [
  {
    id: 'aa170980-9a68-4168-9859-1f71e0d023df',
    name: 'PADI',
    longName: 'Professional Association of Diving Instructors',
    logo: 'https://www.padi.com',
    website: 'https://www.padi.com',
    ordinal: 1,
  },
  {
    id: 'd85b955b-04f3-4803-ba74-c31c27bc26de',
    name: 'NAUI',
    longName: 'National Association of Underwater Instructors',
    logo: 'https://www.naui.org',
    website: 'https://www.naui.org',
    ordinal: 2,
  },
  {
    id: 'a6a87695-02fb-4caf-b5c2-6af5afbb0ff8',
    name: 'SSI',
    longName: 'Scuba Schools International',
    logo: 'https://www.divessi.com',
    website: 'https://www.divessi.com',
    ordinal: 3,
  },
];

describe('Agencies Service', () => {
  let Agencies: Repository<AgencyEntity>;
  let service: AgenciesService;

  beforeAll(() => {
    Agencies = dataSource.getRepository(AgencyEntity);
    service = new AgenciesService(Agencies, createAgencyFactory());
  });

  beforeEach(async () => {
    await Agencies.save(TestData);
  });

  it('will list agencies', async () => {
    const { data, totalCount } = await service.listAgencies();
    expect(totalCount).toBe(3);
    expect(data.map((agency) => agency.toEntity())).toEqual(TestData);
  });

  it('will return a single agency by its ID', async () => {
    const agency = await service.getAgency(TestData[1].id);
    expect(agency?.toEntity()).toEqual(TestData[1]);
  });

  it('will return undefined when requesting an agency ID that does not exist', async () => {
    await expect(
      service.getAgency('58db47e0-05bb-4083-b1a4-43c9a6696703'),
    ).resolves.toBeUndefined();
  });

  it('will create a new agency', async () => {
    const options: CreateOrUpdateAgencyDTO = {
      logo: '/img/agencies/divo.png',
      name: 'DIVO',
      longName: 'Diving Instructor and Vendor Organization',
      website: 'https://www.divo.com',
    };
    const agency = await service.createAgency(options);
    expect(agency.toEntity()).toMatchObject(options);

    const saved = await Agencies.findOneByOrFail({ id: agency.id });
    expect(saved).toEqual(agency.toEntity());
  });
});
