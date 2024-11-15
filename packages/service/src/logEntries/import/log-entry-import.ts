import { LogsImportDTO } from '@bottomtime/api';

import { Logger, MethodNotAllowedException } from '@nestjs/common';

import { Observable, from } from 'rxjs';
import { Repository } from 'typeorm';

import { LogEntryImportEntity, LogEntryImportRecordEntity } from '../../data';
import { User, UserFactory } from '../../users';
import { LogEntry } from '../log-entry';
import { IImporter } from './importer';

export class LogEntryImport {
  private readonly log = new Logger(LogEntryImport.name);
  private _canceled = false;
  private _owner: User | undefined;

  constructor(
    private readonly imports: Repository<LogEntryImportEntity>,
    private readonly importRecords: Repository<LogEntryImportRecordEntity>,
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

  private async *streamRecords(): AsyncGenerator<
    LogEntryImportRecordEntity,
    number
  > {
    const batchSize = 50;
    const totalCount = await this.importRecords.countBy({
      import: { id: this.data.id },
    });

    if (totalCount === 0) {
      throw new MethodNotAllowedException(
        'Cannot finalize an import with no records',
      );
    }

    let skip = 0;
    while (true) {
      const results = await this.importRecords.find({
        where: { import: { id: this.data.id } },
        order: { id: 'ASC' },
        skip,
        take: batchSize,
      });

      for (const record of results) {
        yield record;
      }

      if (results.length < batchSize) break;
      skip += batchSize;
    }

    return totalCount;
  }

  private async markFinalized(): Promise<void> {
    const finalized = new Date();
    await this.imports.update({ id: this.id }, { finalized });
    await this.importRecords.delete({ import: { id: this.id } });
    this.data.finalized = finalized;
  }

  finalize(importer: IImporter): Observable<LogEntry> {
    if (this.finalized) {
      throw new MethodNotAllowedException(
        'This import session has already been finalized.',
      );
    }

    return new Observable<LogEntry>((subscriber) => {
      importer
        .import({
          device: this.device,
          deviceId: this.deviceId,
          owner: this.owner,
          data: from(this.streamRecords()),
        })
        .subscribe({
          next: subscriber.next,
          error: (err) => {
            // TODO: Rollback?
            this.log.error(err);
          },
          complete: () => {
            this.markFinalized()
              .catch((error) => {
                // TODO: What now? Rollback?
                subscriber.error(error);
              })
              .finally(() => {
                subscriber.complete();
              });
          },
        });
    });
  }

  async cancel(): Promise<boolean> {
    if (this.finalized) {
      throw new MethodNotAllowedException(
        'Cannot cancel an import that has already been finalized',
      );
    }

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
