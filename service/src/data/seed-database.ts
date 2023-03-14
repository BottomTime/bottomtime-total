import { Db } from 'mongodb';
import { Collections, CertificationDocument } from '.';

import KnownCertifications from './certifications.json';

export async function seedDatabase(db: Db): Promise<void> {
  const knownCertifications = db.collection<CertificationDocument>(
    Collections.KnownCertifications,
  );
  await knownCertifications.insertMany(KnownCertifications);
}
