import { CreateOrUpdateLogEntryParamsSchema } from '@bottomtime/api';

import {
  Inject,
  Injectable,
  Logger,
  MethodNotAllowedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  bufferCount,
  concatMap,
  connect,
  distinctUntilKeyChanged,
  filter,
  from,
  ignoreElements,
  map,
  merge,
  tap,
  throwIfEmpty,
} from 'rxjs';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
  UserEntity,
} from '../../data';
import { User } from '../../users';
import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';

@Injectable()
export class Importer {
  private readonly log = new Logger(Importer.name);

  private readonly queryRunner: QueryRunner;
  private readonly entries: Repository<LogEntryEntity>;
  private readonly air: Repository<LogEntryAirEntity>;
  private readonly samples: Repository<LogEntrySampleEntity>;
  private readonly imports: Repository<LogEntryImportEntity>;
  private readonly importRecords: Repository<LogEntryImportRecordEntity>;

  constructor(
    @InjectDataSource()
    dataSource: DataSource,

    @Inject(LogEntryFactory)
    private readonly entryFactory: LogEntryFactory,
  ) {
    const queryRunner = dataSource.createQueryRunner();
    this.entries = queryRunner.manager.getRepository(LogEntryEntity);
    this.air = queryRunner.manager.getRepository(LogEntryAirEntity);
    this.samples = queryRunner.manager.getRepository(LogEntrySampleEntity);
    this.imports = queryRunner.manager.getRepository(LogEntryImportEntity);
    this.importRecords = queryRunner.manager.getRepository(
      LogEntryImportRecordEntity,
    );
    this.queryRunner = queryRunner;
  }

  private async *streamRecords(
    importId: string,
  ): AsyncGenerator<string, number> {
    this.log.debug('Starting database transaction to finalize import...');
    await this.queryRunner.startTransaction();

    const batchSize = 20;
    let totalCount = 0;

    let skip = 0;
    while (true) {
      this.log.debug(
        `Fetching import records ${skip}-${
          skip + batchSize - 1
        } for import ID "${importId}"...`,
      );
      const results = await this.importRecords.find({
        where: { import: { id: importId } },
        order: { id: 'ASC' },
        skip,
        take: batchSize,
      });

      totalCount += results.length;

      for (const record of results) yield record.data;

      if (results.length < batchSize) break;
      skip += batchSize;
    }

    return totalCount;
  }

  private async saveEntries(
    entries: LogEntryEntity[],
  ): Promise<LogEntryEntity[]> {
    this.log.debug(`Saving batch of ${entries.length} log entries...`);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    await this.entries.insert(
      entries.map(
        (entry) =>
          ({
            ...entry,
            air: undefined,
            samples: undefined,
            owner: { id: entry.owner.id } as UserEntity,
          } as any),
      ),
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return entries;
  }

  private async bulkUpdateEntryAggregates(
    entries: LogEntryEntity[],
  ): Promise<LogEntryEntity[]> {
    this.log.debug(
      `Saving updated aggregate values for ${entries.length} log entries...`,
    );

    const ids = entries.map((entry) => entry.id);
    const [, updateCount] = await this.queryRunner.query(
      `UPDATE log_entries
      SET ("averageDepth", "maxDepth") = (
        SELECT AVG(depth), MAX(depth) FROM log_entry_samples WHERE "logEntryId" = log_entries.id
      )
      WHERE id IN(${entries.map((_, i) => `$${i + 1}`).join(', ')})`,
      ids,
    );

    this.log.debug(`${updateCount} records updated with aggregates.`);

    const updatedEntities = await this.entries.find({
      where: { id: In(ids) },
      select: { id: true, maxDepth: true, averageDepth: true },
    });
    const updatedAggregates = updatedEntities.reduce<
      Record<string, Pick<LogEntryEntity, 'averageDepth' | 'maxDepth'>>
    >((map, entity) => {
      map[entity.id] = {
        averageDepth: entity.averageDepth,
        maxDepth: entity.maxDepth,
      };
      return map;
    }, {});

    for (const entry of entries) {
      if (updatedAggregates[entry.id]) {
        entry.averageDepth = updatedAggregates[entry.id].averageDepth;
        entry.maxDepth = updatedAggregates[entry.id].maxDepth;
      }
    }

    return entries;
  }

  private async saveAir(
    air: LogEntryAirEntity[],
  ): Promise<LogEntryAirEntity[]> {
    this.log.debug(`Saving batch of ${air.length} log entry air data...`);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    await this.air.insert(air as any);
    return air;
  }

  private async saveSamples(
    samples: LogEntrySampleEntity[],
  ): Promise<LogEntrySampleEntity[]> {
    this.log.debug(
      `Saving batch of ${samples.length} log entry data samples...`,
    );
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    await this.samples.insert(samples as any);
    return samples;
  }

  private importAirEntries(): OperatorFunction<LogEntryEntity, never> {
    let totalAirEntries = 0;
    return (source) =>
      source.pipe(
        // Stream individual air entries from each log entry...
        concatMap((entry) => from(entry.air ?? [])),

        // ...and write them to the database in batches of 500.
        bufferCount(1000),
        concatMap((batch) => from(this.saveAir(batch))),

        tap({
          next: (batch) => {
            totalAirEntries += batch.length;
          },
          complete: () =>
            this.log.debug(
              `Finished saving ${totalAirEntries} total air entries`,
            ),
        }),

        // Supress output of this observable - we won't need it in the final stream.
        ignoreElements(),
      );
  }

  private importDataSamples(): OperatorFunction<LogEntryEntity, never> {
    let totalSamples = 0;
    return (source) =>
      source.pipe(
        // 1) Ignore entries with no data samples attached.
        filter((entry) => !!entry.samples && entry.samples.length > 0),

        // 2) Save all data samples to the database in batches of 1000.
        concatMap((entry) =>
          from(entry.samples ?? []).pipe(
            map((sample) => {
              sample.logEntry = entry;
              return sample;
            }),
          ),
        ),
        bufferCount(1000),
        concatMap((batch) => from(this.saveSamples(batch))),
        tap({
          next: (batch) => {
            totalSamples += batch.length;
          },
          complete: () => {
            this.log.debug(
              `Finished saving ${totalSamples} total data samples.`,
            );
          },
        }),

        // 3) Calculate aggregates for log entries and update them in the database.
        concatMap((batch) =>
          from(batch).pipe(map((sample) => sample.logEntry)),
        ),
        distinctUntilKeyChanged('id'),
        bufferCount(20),
        concatMap((batch) => from(this.bulkUpdateEntryAggregates(batch))),

        // 4) Supress output of this observable - we won't need it in the final stream.
        ignoreElements(),
      ) as Observable<never>;
  }

  private finalizeImport<T>(
    importData: LogEntryImportEntity,
  ): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) =>
      new Observable<T>((subscriber) => {
        source.subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: async () => {
            try {
              this.log.debug(
                'Marking import as finalized and committing transaction...',
              );
              const finalized = new Date();
              await this.imports.update(importData.id, {
                finalized,
                error: null,
              });
              await this.importRecords.delete({
                import: { id: importData.id },
              });
              await this.queryRunner.commitTransaction();
              importData.finalized = finalized;
              subscriber.complete();
            } catch (error) {
              subscriber.error(error);
            }
          },
        });
      });
  }

  private abortOnError<T>(
    importData: LogEntryImportEntity,
  ): OperatorFunction<T, T> {
    return (source) =>
      new Observable<T>((subscriber) => {
        let failed = false;
        source.subscribe({
          next: (value) => subscriber.next(value),
          complete: () => {
            if (!failed) subscriber.complete();
          },

          error: async (error) => {
            failed = true;
            this.log.warn('Aborting and rolling back transaction...');
            this.log.error(error);
            try {
              await this.queryRunner.rollbackTransaction();
              await this.imports.update(importData.id, {
                error:
                  error.message ??
                  'An unknown error occurred and the import was aborted.',
              });
            } catch (rollbackError) {
              this.log.error(rollbackError);
            }
            subscriber.error(error);
          },
        });
      });
  }

  doImport(
    importData: LogEntryImportEntity,
    owner: User,
  ): Observable<LogEntry> {
    return from(this.streamRecords(importData.id)).pipe(
      tap({
        complete: () =>
          this.log.debug('Finished streaming import records from database.'),
      }),

      // 1) Throw an exception if there are no records to import.
      throwIfEmpty(() => {
        this.log.warn(
          `Attempted to finalize import with ID "${importData.id}" when no records were uploaded.`,
        );
        return new MethodNotAllowedException(
          'Cannot finalize an import that has no import records attached.',
        );
      }),

      // 2) Parse JSON and transform data into LogEntryEntity objects.
      map((record) => {
        const raw = JSON.parse(record);
        const parsed = CreateOrUpdateLogEntryParamsSchema.parse(raw);
        const entity = this.entryFactory
          .createLogEntryFromCreateDTO(owner, parsed)
          .toEntity();

        entity.deviceId = importData.deviceId ?? null;
        entity.deviceName = importData.device ?? null;

        return entity;
      }),

      // 3) Write log entry entities to the database in batches of 100.
      bufferCount(20),
      concatMap((batch) => from(this.saveEntries(batch))),
      concatMap((batch) => from(batch)),

      // 4) Now pipe remaining data (air and data samples) to the database in parallel.
      connect((shared) =>
        merge(
          shared.pipe(this.importAirEntries()),
          shared.pipe(this.importDataSamples()),

          // 5) Pipe entities to LogEntry instances for output.
          shared.pipe(
            map((entity) => this.entryFactory.createLogEntry(entity)),
          ),
        ),
      ),

      // 6) Mark import as finalized and commit transaction.
      this.finalizeImport<LogEntry>(importData),

      // Add an error handler to abort and rollback the transaction if an error occurs.
      this.abortOnError<LogEntry>(importData),
    );
  }
}
