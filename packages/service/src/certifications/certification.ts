import { CertificationDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { AgencyEntity, CertificationEntity } from '../data';
import { Agency } from './agency';

export class Certification {
  constructor(
    private readonly Agencies: Repository<AgencyEntity>,
    private readonly Certifications: Repository<CertificationEntity>,
    private readonly data: CertificationEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get course(): string {
    return this.data.course;
  }
  set course(value: string) {
    this.data.course = value;
  }

  get agency(): Agency {
    return new Agency(this.Agencies, this.data.agency!);
  }
  set agency(value: Agency) {
    this.data.agency = { ...value.toEntity() };
  }

  async save(): Promise<void> {
    await this.Certifications.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.Certifications.delete(this.data.id);
    return typeof affected === 'number' && affected > 0;
  }

  toJSON(): CertificationDTO {
    return {
      id: this.id,
      course: this.course,
      agency: this.agency.toJSON(),
    };
  }
}
