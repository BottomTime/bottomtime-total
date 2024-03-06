import { Repository } from 'typeorm';

import { Certification } from '../../../src/certifications';
import { CertificationEntity } from '../../../src/data';
import { dataSource } from '../../data-source';

describe('Certification Class', () => {
  let Certifications: Repository<CertificationEntity>;
  let data: CertificationEntity;
  let cert: Certification;

  beforeAll(() => {
    Certifications = dataSource.getRepository(CertificationEntity);
  });

  beforeEach(() => {
    data = new CertificationEntity();
    data.id = '4659ca3e-46c4-4865-b2a2-b9cc16818ed6';
    data.agency = 'PADI';
    data.course = 'Open Water Diver';

    cert = new Certification(Certifications, data);
  });

  it('will return properties correctly', () => {
    expect(cert.id).toEqual(data.id);
    expect(cert.agency).toEqual(data.agency);
    expect(cert.course).toEqual(data.course);
  });

  it('will update properties correctly', () => {
    cert.agency = 'SSI';
    cert.course = 'Advanced Open Water Diver';
    expect(cert.agency).toEqual('SSI');
    expect(cert.course).toEqual('Advanced Open Water Diver');
  });

  it('will render class to JSON correctly', () => {
    expect(cert.toJSON()).toEqual({
      id: data.id,
      agency: data.agency,
      course: data.course,
    });
  });

  it('will save a new certification to the database', async () => {
    await cert.save();
    const result = await Certifications.findOneByOrFail({ id: data.id });
    expect(result).toEqual(data);
  });

  it('will save changes to properties', async () => {
    await Certifications.save(data);
    cert.agency = 'SSI';
    cert.course = 'Advanced Open Water Diver';
    await cert.save();

    const result = await Certifications.findOneByOrFail({ id: data.id });
    expect(result).toEqual({
      id: data.id,
      agency: 'SSI',
      course: 'Advanced Open Water Diver',
    });
  });
});
