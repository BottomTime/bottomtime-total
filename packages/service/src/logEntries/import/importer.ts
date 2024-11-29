import { CreateOrUpdateLogEntryParamsSchema } from '@bottomtime/api';

import { Logger, MethodNotAllowedException } from '@nestjs/common';

import {
  Observable,
  bufferCount,
  concatMap,
  connect,
  filter,
  from,
  ignoreElements,
  map,
  merge,
  tap,
  throwIfEmpty,
} from 'rxjs';
import { QueryRunner, Repository } from 'typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
} from '../../data';
import { User } from '../../users';
import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';

export class Importer {
  private readonly log = new Logger(Importer.name);

  private readonly entries: Repository<LogEntryEntity>;
  private readonly air: Repository<LogEntryAirEntity>;
  private readonly samples: Repository<LogEntrySampleEntity>;
  private readonly imports: Repository<LogEntryImportEntity>;
  private readonly importRecords: Repository<LogEntryImportRecordEntity>;

  constructor(
    private readonly queryRunner: QueryRunner,
    private readonly entryFactory: LogEntryFactory,
  ) {
    this.entries = queryRunner.manager.getRepository(LogEntryEntity);
    this.air = queryRunner.manager.getRepository(LogEntryAirEntity);
    this.samples = queryRunner.manager.getRepository(LogEntrySampleEntity);
    this.imports = queryRunner.manager.getRepository(LogEntryImportEntity);
    this.importRecords = queryRunner.manager.getRepository(
      LogEntryImportRecordEntity,
    );
  }

  private async *streamRecords(
    importId: string,
  ): AsyncGenerator<string, number> {
    this.log.debug('Starting database transaction to finalize import...');
    await this.queryRunner.startTransaction();

    const batchSize = 50;
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

      for (const record of results) {
        yield record.data;
      }

      if (results.length < batchSize) break;
      skip += batchSize;
    }

    return totalCount;
  }

  private async saveEntries(
    entries: LogEntryEntity[],
  ): Promise<LogEntryEntity[]> {
    this.log.debug(`Saving batch of ${entries.length} log entries...`);
    await this.entries.save(entries);
    return entries;
  }

  private async updateEntryAggregates(
    entries: LogEntryEntity[],
  ): Promise<LogEntryEntity[]> {
    this.log.debug(
      `Saving updated aggregate values for ${entries.length} log entries...`,
    );

    const params: unknown[] = [];
    let query = '';
    let paramIndex = 1;

    for (const entry of entries) {
      query += `UPDATE "log_entries" SET "maxDepth" = $${paramIndex++}, "averageDepth" = $${paramIndex++}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $${paramIndex++};`;
      params.push(entry.maxDepth, entry.averageDepth, entry.id);
    }

    this.log.verbose(query);

    return entries;
  }

  private async saveAir(
    air: LogEntryAirEntity[],
  ): Promise<LogEntryAirEntity[]> {
    this.log.debug(`Saving batch of ${air.length} log entry air data...`);
    await this.air.save(air);
    return air;
  }

  private async saveSamples(
    samples: LogEntrySampleEntity[],
  ): Promise<LogEntrySampleEntity[]> {
    this.log.debug(
      `Saving batch of ${samples.length} log entry data samples...`,
    );
    await this.samples.save(samples);
    return samples;
  }

  importAirEntries(): (
    source: Observable<LogEntryEntity>,
  ) => Observable<never> {
    return (source) =>
      source.pipe(
        // Stream individual air entries from each log entry...
        concatMap((entry) => from(entry.air ?? [])),

        // ...and write them to the database in batches of 500.
        bufferCount(500),
        concatMap((batch) => from(this.saveAir(batch))),

        tap({
          complete: () => this.log.debug('Finished saving air entries'),
        }),

        // Supress output of this observable - we won't need it in the final stream.
        ignoreElements(),
      );
  }

  calculateAggregates(): (
    source: Observable<LogEntryEntity>,
  ) => Observable<LogEntryEntity | LogEntrySampleEntity> {
    return (source) =>
      new Observable((subscriber) => {
        source.subscribe({
          next: (entry) => {
            if (!entry.samples || !entry.samples.length) {
              // No samples? Just pass the entry through without modification.
              subscriber.next(entry);
              return;
            }

            let depthSum = 0;
            let maxDepth = 0;

            for (const sample of entry.samples) {
              depthSum += sample.depth ?? 0;
              maxDepth = Math.max(maxDepth, sample.depth ?? 0);
              subscriber.next(sample);
            }

            entry.maxDepth = maxDepth || entry.maxDepth || null;
            entry.averageDepth =
              depthSum / entry.samples.length || entry.averageDepth || null;

            this.log.debug(
              `Calculated aggregate values for log entry "${entry.id}"`,
              {
                averageDepth: entry.averageDepth,
                maxDepth: entry.maxDepth,
              },
            );
            subscriber.next(entry);
          },

          error: (error) => {
            subscriber.error(error);
          },
          complete: () => {
            subscriber.complete();
          },
        });
      });
  }

  importDataSamples(): (
    source: Observable<LogEntryEntity>,
  ) => Observable<LogEntryEntity> {
    return (source) =>
      source.pipe(
        // Stream data samples and log entries with aggregate values updated.
        this.calculateAggregates(),

        connect((shared) =>
          merge(
            // Log entries with updated aggregate values need to be updated in the database.
            shared.pipe(
              filter((item) => 'timestamp' in item),
              bufferCount(500),
              // TODO: Need a way to do this efficiently.
              concatMap((batch) => from(this.updateEntryAggregates(batch))),
              concatMap((batch) => from(batch)),
              tap({
                complete: () =>
                  this.log.debug(
                    'Finished updating aggregates for log entries.',
                  ),
              }),
            ),

            // And the data samples just need to be written to the database.
            shared.pipe(
              filter((item) => 'timeOffset' in item),
              bufferCount(500),
              concatMap((batch) => from(this.saveSamples(batch))),
              tap({
                complete: () => this.log.debug('Finished saving data samples.'),
              }),

              // Data samples are not needed in the final output.
              ignoreElements(),
            ),
          ),
        ),
      );
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
      bufferCount(100),
      concatMap((batch) => from(this.saveEntries(batch))),
      concatMap((batch) => from(batch)),

      // 4) Now pipe remaining data (air and data samples) to the database in parallel.
      connect((shared) =>
        merge(
          shared.pipe(this.importAirEntries()),
          shared.pipe(this.importDataSamples()),
        ),
      ),

      // 5) Pipe entities to LogEntry instances for output.
      map((entity) => this.entryFactory.createLogEntry(entity)),

      tap({
        complete: () => this.log.debug('Finished streaming log entry data.'),
      }),
    );
  }
}
