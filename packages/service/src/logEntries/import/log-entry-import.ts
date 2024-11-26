import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  LogsImportDTO,
} from '@bottomtime/api';

import { Logger, MethodNotAllowedException } from '@nestjs/common';

import {
  Observable,
  bufferCount,
  concatMap,
  from,
  map,
  throwIfEmpty,
} from 'rxjs';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
} from '../../data';
import { User, UserFactory } from '../../users';
import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';

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

  private async *streamRecords(
    queryRunner: QueryRunner,
  ): AsyncGenerator<string, number> {
    this.log.debug('Starting database transaction to finalize import...');
    await queryRunner.startTransaction();

    const importRecords = queryRunner.manager.getRepository(
      LogEntryImportRecordEntity,
    );

    const batchSize = 50;
    const totalCount = await importRecords.countBy({
      import: { id: this.data.id },
    });

    let skip = 0;
    while (true) {
      const results = await importRecords.find({
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

    const queryRunner = this.dataSource.createQueryRunner();

    return new Observable<LogEntry>((subscriber) => {
      const entries = queryRunner.manager.getRepository(LogEntryEntity);
      const air = queryRunner.manager.getRepository(LogEntryAirEntity);
      const samples = queryRunner.manager.getRepository(LogEntrySampleEntity);
      const imports = queryRunner.manager.getRepository(LogEntryImportEntity);
      const importRecords = queryRunner.manager.getRepository(
        LogEntryImportRecordEntity,
      );

      from(this.streamRecords(queryRunner))
        .pipe(
          // Throw an exception if there are no records to import.
          throwIfEmpty(() => {
            this.log.warn(
              `Attempted to finalize import with ID "${this.id}" when no records were uploaded.`,
            );
            return new MethodNotAllowedException(
              'Cannot finalize an import that has no import records attached.',
            );
          }),

          // Parse JSON and transform data into LogEntryEntity objects
          map((record) => {
            const raw = JSON.parse(record);
            const parsed = CreateOrUpdateLogEntryParamsSchema.parse(raw);
            const entity = this.entryFactory
              .createLogEntryFromCreateDTO(this.owner, parsed)
              .toEntity();

            entity.deviceId = this.deviceId ?? null;
            entity.deviceName = this.device ?? null;

            return entity;
          }),

          // Save entities in batches of 50.
          bufferCount(50),
          concatMap(async (batch) => {
            // TODO: This needs optimization.
            this.log.debug(
              `Saving batch of ${batch.length} imported log entries...`,
            );
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
            await samples.save(
              batch.reduce<LogEntrySampleEntity[]>((acc, value) => {
                value.samples?.forEach((sample) => {
                  acc.push({
                    ...sample,
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
            this.log.error('Error parsing or inserting log entry data:', error);
            subscriber.error(error);
            subscriber.unsubscribe();
            await queryRunner.rollbackTransaction();
            this.log.debug(
              'Database transaction rolled back and import has been aborted.',
            );
          },
          complete: async (): Promise<void> => {
            try {
              await this.markFinalized(imports, importRecords);
              await queryRunner.commitTransaction();
              subscriber.complete();
              this.log.log(`Import finalized successfully: ${this.id}`);
            } catch (error) {
              this.log.error(
                `Error finalizing import "${this.id}". Rolling back...`,
                error,
              );
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
