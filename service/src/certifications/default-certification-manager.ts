import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';
import { CertificationDocument, Collections } from '../data';
import { DefaultCertification } from './default-certification';
import { Certification, CertificationManager } from './interfaces';

export class DefaultCertificationManager implements CertificationManager {
  private readonly certifications: Collection<CertificationDocument>;

  constructor(mongoClient: MongoClient, private readonly log: Logger) {
    this.certifications = mongoClient
      .db()
      .collection(Collections.KnownCertifications);
  }

  async listCertifications(): Promise<Certification[]> {
    const cursor = this.certifications.find(
      {},
      {
        sort: { course: 1 },
      },
    );
    const results: Certification[] = [];

    await cursor.forEach((cert) => {
      results.push(new DefaultCertification(cert));
    });

    return results;
  }
}
