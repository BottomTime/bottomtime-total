import { Repository } from 'typeorm';

import { Agency, Certification } from '../../../src/certifications';
import { AgencyEntity, CertificationEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';

describe('Certification Class', () => {
  let Agencies: Repository<AgencyEntity>;
  let Certifications: Repository<CertificationEntity>;
  let data: CertificationEntity;
  let cert: Certification;

  beforeAll(() => {
    Agencies = dataSource.getRepository(AgencyEntity);
    Certifications = dataSource.getRepository(CertificationEntity);
  });

  beforeEach(async () => {
    data = {
      id: '4659ca3e-46c4-4865-b2a2-b9cc16818ed6',
      agency: { ...TestAgencies[0] },
      course: 'Open Water Diver',
    };

    cert = new Certification(Agencies, Certifications, data);

    await Agencies.save(TestAgencies);
  });

  it('will return properties correctly', () => {
    expect(cert.id).toEqual(data.id);
    expect(cert.agency.name).toEqual(data.agency!.name);
    expect(cert.course).toEqual(data.course);
  });

  it('will update properties correctly', () => {
    cert.agency = new Agency(Agencies, TestAgencies[2]);
    cert.course = 'Advanced Open Water Diver';
    expect(cert.agency.name).toEqual(TestAgencies[2].name);
    expect(cert.course).toEqual('Advanced Open Water Diver');
  });

  it('will render class to JSON correctly', () => {
    expect(cert.toJSON()).toMatchSnapshot();
  });

  it('will save a new certification to the database', async () => {
    await cert.save();
    const result = await Certifications.findOneOrFail({
      where: { id: data.id },
      relations: ['agency'],
    });
    expect(result).toMatchSnapshot();
  });

  it('will save changes to properties', async () => {
    await Certifications.save(data);
    cert.agency = new Agency(Agencies, TestAgencies[2]);
    cert.course = 'Advanced Open Water Diver';
    await cert.save();

    const result = await Certifications.findOneOrFail({
      where: { id: data.id },
      relations: ['agency'],
    });
    expect(result).toEqual({
      id: data.id,
      agency: TestAgencies[2],
      course: 'Advanced Open Water Diver',
    });
  });
});
