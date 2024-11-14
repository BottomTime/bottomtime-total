import { LogsImportDTO } from '@bottomtime/api';

import { MethodNotAllowedException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { LogEntryEntity, LogEntryImportEntity } from '../../data';
import { User, UserFactory } from '../../users';

export class LogEntryImport {
  private _canceled = false;
  private _owner: User | undefined;

  constructor(
    private readonly imports: Repository<LogEntryImportEntity>,
    private readonly logEntries: Repository<LogEntryEntity>,
    private readonly userFactory: UserFactory,
    private readonly data: LogEntryImportEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get owner(): User {
    if (!this._owner) {
      this._owner = this.userFactory.createUser(this.data.owner);
    }
    return this._owner;
  }

  get date(): Date {
    return this.data.finalized || this.data.date;
  }

  get finalized(): boolean {
    return this.data.finalized instanceof Date;
  }

  get canceled(): boolean {
    return this._canceled;
  }

  get bookmark(): string | undefined {
    return this.data.bookmark || undefined;
  }

  get device(): string | undefined {
    return this.data.device || undefined;
  }

  get deviceId(): string | undefined {
    return this.data.deviceId || undefined;
  }

  async finalize(): Promise<boolean> {
    if (this.finalized) return false;

    const hasEntries = await this.logEntries.existsBy({
      import: { id: this.data.id },
    });

    if (!hasEntries || this.canceled) {
      throw new MethodNotAllowedException(
        'Cannot finalize an import operation before log entries have been added',
      );
    }

    const finalized = new Date();
    await this.imports.update({ id: this.id }, { finalized });

    this.data.finalized = finalized;
    return true;
  }

  async cancel(): Promise<boolean> {
    if (this.finalized) {
      throw new MethodNotAllowedException(
        'Cannot cancel an import that has already been finalized',
      );
    }

    await this.logEntries.delete({ import: { id: this.data.id } });
    const { affected } = await this.imports.delete(this.data.id);
    this._canceled = true;
    return affected === 1;
  }

  toJSON(): LogsImportDTO {
    return {
      id: this.id,
      owner: this.data.owner.username,
      date: this.date,
      finalized: this.finalized,
      bookmark: this.bookmark,
      device: this.device,
      deviceId: this.deviceId,
    };
  }

  toEntity(): LogEntryImportEntity {
    return { ...this.data };
  }
}
