import { CertificationDocument } from '../data';
import { Certification } from './interfaces';

export class DefaultCertification implements Certification {
  constructor(private readonly data: CertificationDocument) {}

  get id(): string {
    return this.data._id;
  }

  get agency(): string {
    return this.data.agency;
  }

  get course(): string {
    return this.data.course;
  }
}
