import { Collection } from 'mongodb';

import { CertificationDocument, Collections } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import {
  DefaultCertification,
  DefaultCertificationManager,
} from '../../../src/certifications';
import { mongoClient } from '../../mongo-client';

import CertificationData from '../../../src/data/certifications.json';

const Log = createTestLogger('default-certification-manager');

describe('Default Certification Manager', () => {
  let Certifications: Collection<CertificationDocument>;

  beforeAll(() => {
    Certifications = mongoClient
      .db()
      .collection(Collections.KnownCertifications);
  });

  it('Will list certifications ordered by course name', async () => {
    await Certifications.insertMany(CertificationData);
    const manager = new DefaultCertificationManager(mongoClient, Log);
    const expected = CertificationData.sort((a, b) =>
      a.course.localeCompare(b.course),
    ).map((data) => new DefaultCertification(data));

    const actual = await manager.listCertifications();

    expect(actual).toEqual(expected);
  });
});
