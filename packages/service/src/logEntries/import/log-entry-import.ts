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
  connect,
  defaultIfEmpty,
  filter,
  from,
  groupBy,
  ignoreElements,
  map,
  max,
  merge,
  reduce,
  switchMap,
  tap,
  throwIfEmpty,
  zip,
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

    const queryRunner = this.dataSource.createQueryRunner();
    const importer = new Importer(queryRunner, this.entryFactory);

    return importer.doImport(this.data, this.owner);

    return from(this.streamRecords(queryRunner)).pipe(
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
        this.log.debug(
          `Saving batch of ${batch.length} imported log entries...`,
        );

        await entries.save(batch);
        await air.save(
          batch.reduce<LogEntryAirEntity[]>((acc, entry) => {
            entry.air?.forEach((air) => {
              acc.push({
                ...air,
                logEntry: { id: entry.id } as LogEntryEntity,
              });
            });
            return acc;
          }, []),
        );

        return batch;
      }),
      concatMap((batch) => from(batch)),

      connect((shared) =>
        merge(
          // Pipe entities to LogEntry objects.
          shared.pipe(
            map((entity) => this.entryFactory.createLogEntry(entity)),
          ),

          // Meanwhile, pipe data samples to the database and update aggregate values.
          shared.pipe(
            filter((entry) => !!entry.samples && entry.samples.length > 0),
            concatMap((entry) => from(entry.samples!)),
            bufferCount(1000),
            concatMap((sampleBatch) =>
              (async () => {
                this.log.debug('Saving batch of log entry data samples...');
                await samples.save(sampleBatch);
                return sampleBatch;
              })(),
            ),
            concatMap((sampleBatch) => from(sampleBatch)),
            groupBy((sample) => sample.logEntry.id),
            switchMap((group) =>
              group.pipe(
                connect((shared) =>
                  zip(
                    // Find max depth
                    shared.pipe(
                      filter((sample) => !!sample.depth),
                      max((a, b) => a.depth! - b.depth!),
                      map((deepest) => deepest.depth!),
                      defaultIfEmpty(null),
                    ),

                    // Find average depth
                    shared.pipe(
                      reduce(
                        (acc, value) => {
                          if (value.depth) {
                            return {
                              sum: acc.sum + value.depth,
                              count: acc.count + 1,
                            };
                          }
                          return acc;
                        },
                        { sum: 0, count: 0 },
                      ),
                      map(({ sum, count }) => (count > 0 ? sum / count : null)),
                    ),
                  ),
                ),

                concatMap(async ([maxDepth, averageDepth]) => {
                  this.log.debug(
                    `Calculated aggregate values for log entry ${group.key}`,
                    { maxDepth, averageDepth },
                  );
                  if (maxDepth) {
                    await entries.update({ id: group.key }, { maxDepth });
                  }

                  if (averageDepth) {
                    await entries.update({ id: group.key }, { averageDepth });
                  }
                }),
              ),
            ),
            ignoreElements(),
          ),
        ),
      ),
      tap({
        // Log any errors that occur
        error: async (error): Promise<void> => {
          this.log.error('Error parsing or inserting log entry data:', error);
          await queryRunner.rollbackTransaction();
          this.log.debug(
            'Database transaction rolled back and import has been aborted.',
          );
        },

        // Mark the import as finalized and commit the Postgres transaction if everything completes successfully
        complete: async (): Promise<void> => {
          try {
            await this.markFinalized(imports, importRecords);
            await queryRunner.commitTransaction();
            this.log.log(`Import finalized successfully: ${this.id}`);
          } catch (error) {
            this.log.error(
              `Error finalizing import "${this.id}". Rolling back...`,
              error,
            );
            await queryRunner.rollbackTransaction();
          }
        },
      }),
    );
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
