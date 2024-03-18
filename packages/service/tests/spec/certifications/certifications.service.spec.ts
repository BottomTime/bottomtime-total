import { Repository } from 'typeorm';

import {
  Certification,
  CertificationsService,
} from '../../../src/certifications';
import { CertificationEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import CertificationTestData from '../../fixtures/certifications.json';

describe('Certifications Service', () => {
  let Certifications: Repository<CertificationEntity>;
  let certsData: CertificationEntity[];
  let service: CertificationsService;

  beforeAll(() => {
    Certifications = dataSource.getRepository(CertificationEntity);
    service = new CertificationsService(Certifications);
    certsData = CertificationTestData.map((data) => {
      const cert = new CertificationEntity();
      Object.assign(cert, data);
      return cert;
    });
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

    it('will perform a text-based search', async () => {
      const results = await service.searchCertifications({
        query: 'advanced',
        skip: 0,
        limit: 50,
      });
      expect(results.totalCount).toBe(3);
      expect(results).toMatchSnapshot();
    });

    it('will filter by agency', async () => {
      const results = await service.searchCertifications({
        agency: 'SSI',
        skip: 0,
        limit: 10,
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
      const expected = new Certification(Certifications, certsData[7]).toJSON();
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
      agency: 'BSAC',
      course: 'Advanced Snorkel Technician',
    };
    const cert = await service.createCertification(data);
    expect(cert.agency).toEqual(data.agency);
    expect(cert.course).toEqual(data.course);
    expect(cert.id).toBeDefined();

    const result = await Certifications.findOneByOrFail({ id: cert.id });
    expect(result).toEqual({
      id: cert.id,
      ...data,
    });
  });
});
