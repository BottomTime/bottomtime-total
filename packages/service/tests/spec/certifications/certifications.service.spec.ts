import {
  Certification,
  CertificationsService,
} from '../../../src/certifications';
import {
  CertificationDocument,
  CertificationModel,
} from '../../../src/schemas';
import CertificationTestData from '../../fixtures/certifications.json';

describe('Certifications Service', () => {
  let certifications: CertificationDocument[];
  let service: CertificationsService;

  beforeAll(() => {
    service = new CertificationsService(CertificationModel);
    certifications = CertificationTestData.map(
      (cert) => new CertificationModel(cert),
    );
  });

  describe('when searching certifications', () => {
    beforeEach(async () => {
      await CertificationModel.insertMany(certifications);
    });

    it('will list all certifications by default', async () => {
      const results = await service.searchCertifications({
        skip: 0,
        limit: 400,
      });
      expect(results).toMatchSnapshot();
    });

    it('will perform a text-based search', async () => {
      const results = await service.searchCertifications({
        query: 'advanced',
        skip: 0,
        limit: 10,
      });
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
        skip: 10,
        limit: 5,
      });
      expect(results).toMatchSnapshot();
    });
  });

  describe('when retrieving a certification', () => {
    it('will return a certification if it exists', async () => {
      await CertificationModel.insertMany([certifications[7]]);
      const expected = new Certification(certifications[7]).toJSON();
      const actual = await service.getCertification(certifications[7].id);
      expect(actual?.toJSON()).toEqual(expected);
    });

    it('will return undefined if the certification ID cannot be found', async () => {
      const cert = await service.getCertification('does-not-exist');
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

    const result = await CertificationModel.findById(cert.id);
    expect(result?.toJSON()).toEqual({
      __v: 0,
      _id: cert.id,
      ...data,
    });
  });
});
