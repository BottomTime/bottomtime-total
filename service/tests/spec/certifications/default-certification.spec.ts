import { faker } from '@faker-js/faker';
import { DefaultCertification } from '../../../src/certifications';
import { CertificationDocument } from '../../../src/data';

describe('Default Certification', () => {
  it('Will return properties correctly', () => {
    const data: CertificationDocument = {
      _id: faker.datatype.uuid(),
      course: 'Rescue Diver',
      agency: 'PADI',
    };
    const certification = new DefaultCertification(data);

    expect(certification.id).toEqual(data._id);
    expect(certification.course).toEqual(data.course);
    expect(certification.agency).toEqual(data.agency);
  });
});
