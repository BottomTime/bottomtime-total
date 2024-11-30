import {
  CreateOrUpdateLogEntryParamsDTO,
  LogsImportDTO,
} from '@bottomtime/api';

import { Logger, MethodNotAllowedException } from '@nestjs/common';

import { Observable } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { LogEntryImportEntity, LogEntryImportRecordEntity } from '../../data';
import { User, UserFactory } from '../../users';
import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';
import { Importer } from './importer';

export type ImportOptions = {
  data: Observable<string>;
  device?: string;
  deviceId?: string;
  owner: User;
};

export class LogEntryImport {
  private readonly log = new Logger(LogEntryImport.name);
  private readonly imports: Repository<LogEntryImportEntity>;
  private readonly importRecords: Repository<LogEntryImportRecordEntity>;

  private _canceled = false;
  private _owner: User | undefined;

  constructor(
    private readonly dataSource: DataSource,
    private readonly userFactory: UserFactory,
    private readonly entryFactory: LogEntryFactory,
    private readonly data: LogEntryImportEntity,
  ) {
    this.imports = dataSource.getRepository(LogEntryImportEntity);
    this.importRecords = dataSource.getRepository(LogEntryImportRecordEntity);
  }

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

  private async markFinalized(
    imports: Repository<LogEntryImportEntity>,
    importRecords: Repository<LogEntryImportRecordEntity>,
  ): Promise<void> {
    this.log.debug('Marking import as finalized...');
    const finalized = new Date();
    await imports.update({ id: this.id }, { finalized });
    await importRecords.delete({ import: { id: this.id } });
    this.data.finalized = finalized;
  }

  finalize(): Observable<LogEntry> {
    if (this.finalized) {
      throw new MethodNotAllowedException(
        'This import session has already been finalized.',
      );
    }

    if (this.canceled) {
      throw new MethodNotAllowedException(
        'Unable to finalize an import that has been canceled.',
      );
    }

    const importer = new Importer(this.dataSource, this.entryFactory);

    return importer.doImport(this.data, this.owner);
  }

  async cancel(): Promise<boolean> {
    if (this.finalized) {
      throw new MethodNotAllowedException(
        'Cannot cancel an import that has already been finalized',
      );
    }

    this.log.debug(`Canceling import session: ${this.id}...`);
    const { affected } = await this.imports.delete(this.data.id);
    this._canceled = true;
    return affected === 1;
  }

  async getRecordCount(): Promise<number> {
    return await this.importRecords.countBy({ import: { id: this.id } });
  }

  async addRecords(records: CreateOrUpdateLogEntryParamsDTO[]): Promise<void> {
    if (this.canceled) {
      throw new MethodNotAllowedException(
        'Unable to add new records to an import session that has been aborted',
      );
    }

    if (this.finalized) {
      throw new MethodNotAllowedException(
        'Unable to add new records to an import session that has already been finalized.',
      );
    }

    const newRecords: LogEntryImportRecordEntity[] = records.map((r) => ({
      id: uuid(),
      import: this.data,
      data: JSON.stringify(r),
    }));
    await this.importRecords.save(newRecords);
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
