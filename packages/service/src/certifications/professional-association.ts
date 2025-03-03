import { ProfessionalAssociationDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { Agency } from '.';
import { AgencyEntity, UserProfessionalAssociationsEntity } from '../data';

export class ProfessionalAssociation {
  constructor(
    private readonly agencies: Repository<AgencyEntity>,
    private readonly associations: Repository<UserProfessionalAssociationsEntity>,
    private readonly data: UserProfessionalAssociationsEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get agency(): Agency {
    return new Agency(this.agencies, this.data.agency!);
  }
  set agency(value: Agency) {
    this.data.agency = { ...value.toEntity() };
  }

  get title(): string {
    return this.data.title;
  }
  set title(value: string) {
    this.data.title = value;
  }

  get identificationNumber(): string {
    return this.data.identificationNumber;
  }
  set identificationNumber(value: string) {
    this.data.identificationNumber = value;
  }

  get startDate(): string | undefined {
    return this.data.startDate ?? undefined;
  }
  set startDate(value: string | undefined) {
    this.data.startDate = value ?? null;
  }

  async save(): Promise<void> {
    await this.associations.save(this.data);
  }

  async delete(): Promise<void> {
    await this.associations.delete(this.data.id);
  }

  toJSON(): ProfessionalAssociationDTO {
    return {
      id: this.id,
      agency: this.agency.toJSON(),
      title: this.title,
      identificationNumber: this.identificationNumber,
      startDate: this.startDate,
    };
  }
}
