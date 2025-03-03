import { Repository } from 'typeorm';

import {
  Agency,
  Certification,
  CertificationsService,
} from '../../../src/certifications';
import { AgencyEntity, CertificationEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import CertificationTestData from '../../fixtures/certifications.json';

describe('Certifications Service', () => {
  let Agencies: Repository<AgencyEntity>;
  let Certifications: Repository<CertificationEntity>;
  let certsData: CertificationEntity[];
  let service: CertificationsService;

  beforeAll(() => {
    Agencies = dataSource.getRepository(AgencyEntity);
    Certifications = dataSource.getRepository(CertificationEntity);
    service = new CertificationsService(Agencies, Certifications);
    certsData = CertificationTestData.map((data) => {
      const cert = new CertificationEntity();
      Object.assign(cert, data);
      return cert;
    });
  });

  beforeEach(async () => {
    await Agencies.save(TestAgencies);
  });

  describe('when searching certifications', () => {
    beforeEach(async () => {
      await Certifications.createQueryBuilder()
        .insert()
        .into(CertificationEntity)
        .values(certsData)
        .execute();
    });

    it('will list all certifications by default', async () => {
      const results = await service.searchCertifications({
        skip: 0,
        limit: 500,
      });
      expect(results).toMatchSnapshot();
    });

    it('will filter by agency', async () => {
      const results = await service.searchCertifications({
        agency: 'naui',
        skip: 0,
        limit: 500,
      });
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination', async () => {
      const results = await service.searchCertifications({
        skip: 20,
        limit: 10,
      });
      expect(results).toMatchSnapshot();
    });
  });

  describe('when retrieving a certification', () => {
    it('will return a certification if it exists', async () => {
      await Certifications.save(certsData[7]);
      const expected = new Certification(Agencies, Certifications, {
        ...certsData[7],
        agency: TestAgencies[0],
      }).toJSON();
      const actual = await service.getCertification(certsData[7].id);
      expect(actual?.toJSON()).toEqual(expected);
    });

    it('will return undefined if the certification ID cannot be found', async () => {
      const cert = await service.getCertification(
        '04a91216-37bc-406a-9b9d-996af7fc1750',
      );
      expect(cert).toBeUndefined();
    });
  });

  it('will create a new certification', async () => {
    const data = {
      agency: new Agency(Agencies, TestAgencies[1]),
      course: 'Advanced Snorkel Technician',
    };
    const cert = await service.createCertification(data);
    expect(cert.agency.name).toEqual(data.agency.name);
    expect(cert.course).toEqual(data.course);
    expect(cert.id).toBeDefined();

    const result = await Certifications.findOneOrFail({
      where: { id: cert.id },
      relations: ['agency'],
    });
    expect(result).toEqual({
      id: cert.id,
      course: data.course,
      agency: {
        id: TestAgencies[1].id,
        name: TestAgencies[1].name,
        longName: TestAgencies[1].longName,
        logo: TestAgencies[1].logo,
        website: TestAgencies[1].website,
        ordinal: TestAgencies[1].ordinal,
      },
    });
  });
});
