import { LogsImportDTO } from '@bottomtime/api';

import { Logger, MethodNotAllowedException } from '@nestjs/common';

import { Observable, bufferCount, concatMap, from, throwIfEmpty } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
} from '../../data';
import { User, UserFactory } from '../../users';
import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';
import { IImporter } from './importer';

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

  private async *streamRecords(): AsyncGenerator<string, number> {
    const batchSize = 50;
    const totalCount = await this.importRecords.countBy({
      import: { id: this.data.id },
    });

    let skip = 0;
    while (true) {
      const results = await this.importRecords.find({
        where: { import: { id: this.data.id } },
        order: { id: 'ASC' },
        skip,
        take: batchSize,
      });

      for (const record of results) {
        yield record.data;
      }

      if (results.length < batchSize) break;
      skip += batchSize;
    }

    return totalCount;
  }

  private async markFinalized(
    imports: Repository<LogEntryImportEntity>,
    importRecords: Repository<LogEntryImportRecordEntity>,
  ): Promise<void> {
    const finalized = new Date();
    await imports.update({ id: this.id }, { finalized });
    await importRecords.delete({ import: { id: this.id } });
    this.data.finalized = finalized;
  }

  async finalize(importer: IImporter): Promise<Observable<LogEntry>> {
    if (this.finalized) {
      throw new MethodNotAllowedException(
        'This import session has already been finalized.',
      );
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    return new Observable<LogEntry>((subscriber) => {
      const entries = queryRunner.manager.getRepository(LogEntryEntity);
      const air = queryRunner.manager.getRepository(LogEntryAirEntity);
      const imports = queryRunner.manager.getRepository(LogEntryImportEntity);
      const importRecords = queryRunner.manager.getRepository(
        LogEntryImportRecordEntity,
      );
      importer
        .import({
          device: this.device,
          deviceId: this.deviceId,
          owner: this.owner,
          data: from(this.streamRecords()),
        })
        .pipe(
          throwIfEmpty(() => {
            this.log.warn(
              `Attempted to finalize import with ID "${this.id}" when no records were uploaded.`,
            );
            return new MethodNotAllowedException(
              'Cannot finalize an import that has no import records attached.',
            );
          }),

          // Save entities in batches of 50.
          bufferCount(50),
          concatMap(async (batch) => {
            this.log.debug('Saving batch of imported log entries...');
            await entries.save(batch);
            await air.save(
              batch.reduce<LogEntryAirEntity[]>((acc, value) => {
                value.air?.forEach((air) => {
                  acc.push({
                    ...air,
                    logEntry: { id: value.id } as LogEntryEntity,
                  });
                });
                return acc;
              }, []),
            );
            return batch;
          }),

          // Return LogEntry instances.
          concatMap((batch: LogEntryEntity[]) =>
            from<LogEntry[]>(
              batch.map((entry) => this.entryFactory.createLogEntry(entry)),
            ),
          ),
        )
        .subscribe({
          next: (entry) => subscriber.next(entry),
          error: async (error): Promise<void> => {
            this.log.error(error);
            subscriber.error(error);
            subscriber.unsubscribe();
            await queryRunner.rollbackTransaction();
          },
          complete: async (): Promise<void> => {
            try {
              await this.markFinalized(imports, importRecords);
              await queryRunner.commitTransaction();
              subscriber.complete();
            } catch (error) {
              this.log.error(error);
              await queryRunner.rollbackTransaction();
              subscriber.error(error);
            }
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
