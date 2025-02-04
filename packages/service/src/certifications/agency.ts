import { AgencyDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { AgencyEntity } from '../data';

export class Agency {
  constructor(
    private readonly agencies: Repository<AgencyEntity>,
    private readonly data: AgencyEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get longName(): string | undefined {
    return this.data.longName ?? undefined;
  }
  set longName(value: string | undefined) {
    this.data.longName = value ?? null;
  }

  get logo(): string {
    return this.data.logo;
  }
  set logo(value: string) {
    this.data.logo = value;
  }

  get website(): string {
    return this.data.website;
  }
  set website(value: string) {
    this.data.website = value;
  }

  get ordinal(): number | undefined {
    return this.data.ordinal ?? undefined;
  }
  set ordinal(value: number | undefined) {
    this.data.ordinal = value ?? null;
  }

  async save(): Promise<void> {
    await this.agencies.save(this.data);
  }

  async delete(): Promise<void> {
    await this.agencies.delete(this.data.id);
  }

  toJSON(): AgencyDTO {
    return {
      id: this.id,
      logo: this.logo,
      name: this.name,
      longName: this.longName,
      website: this.website,
    };
  }

  toEntity(): AgencyEntity {
    return { ...this.data };
  }
}
