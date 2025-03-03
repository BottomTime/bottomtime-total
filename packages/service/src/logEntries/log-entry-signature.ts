import { BuddyType, LogEntrySignatureDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { Agency, AgencyFactory } from '../certifications';
import { LogEntrySignatureEntity } from '../data';
import { User, UserFactory } from '../users';

export class LogEntrySignature {
  constructor(
    private readonly signatures: Repository<LogEntrySignatureEntity>,
    private readonly userFactory: UserFactory,
    private readonly agencyFactory: AgencyFactory,
    private readonly data: LogEntrySignatureEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get signedOn(): Date {
    return this.data.signed;
  }

  get buddy(): User {
    return this.userFactory.createUser(this.data.buddy);
  }

  get buddyType(): BuddyType {
    return this.data.type;
  }
  set buddyType(val: BuddyType) {
    this.data.type = val;
  }

  get agency(): Agency | undefined {
    return this.data.agency
      ? this.agencyFactory.createAgency(this.data.agency)
      : undefined;
  }
  set agency(val: Agency | undefined) {
    this.data.agency = val?.toEntity();
  }

  get certificationNumber(): string | undefined {
    return this.data.certificationNumber ?? undefined;
  }
  set certificationNumber(val: string | undefined) {
    this.data.certificationNumber = val ?? null;
  }

  toJSON(): LogEntrySignatureDTO {
    return {
      id: this.id,
      signedOn: this.signedOn.valueOf(),
      buddy: this.buddy.profile.toJSON(),
      type: this.buddyType,
      agency: this.agency?.toJSON(),
      certificationNumber: this.certificationNumber,
    };
  }

  toEntity(): LogEntrySignatureEntity {
    return { ...this.data };
  }

  async save(): Promise<void> {
    await this.signatures.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.signatures.delete({ id: this.data.id });
    return affected === 1;
  }
}
