import { CreateOrUpdateLogEntryParamsSchema } from '@bottomtime/api';

import { Logger, MethodNotAllowedException } from '@nestjs/common';

import {
  Observable,
  bufferCount,
  concat,
  concatMap,
  connect,
  filter,
  from,
  groupBy,
  ignoreElements,
  map,
  merge,
  of,
  switchMap,
  throwIfEmpty,
  zip,
} from 'rxjs';
import { QueryRunner, Repository } from 'typeorm';

import { asyncMap, asyncTap } from '../../common';
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

type EntrySampleTuple = {
  entry: LogEntryEntity;
  sample: LogEntrySampleEntity;
};

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

  private async beginTransaction(): Promise<void> {
    this.log.debug('Starting database transaction to finalize import...');
    await this.queryRunner.startTransaction();
  }

  private async *streamRecords(
    importId: string,
  ): AsyncGenerator<string, number> {
    const batchSize = 50;
    const totalCount = await this.importRecords.countBy({
      import: { id: importId },
    });

    let skip = 0;
    while (true) {
      const results = await this.importRecords.find({
        where: { import: { id: importId } },
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

  private async saveBatchOfEntries(batch: LogEntryEntity[]): Promise<void> {
    this.log.debug(`Saving batch of ${batch.length} imported log entries...`);
    await this.entries.save(batch);
  }

  importAirEntries(): (
    source: Observable<LogEntryEntity>,
  ) => Observable<never> {
    return (source) =>
      source.pipe(
        filter((entry) => !!entry.air && entry.air.length > 0),
        concatMap((entry) => from(entry.air!)),
        bufferCount(500),
        asyncTap(async (batch) => {
          this.log.debug('Saving batch of log entry air data...');
          await this.air.save(batch);
        }),
        ignoreElements(),
      );
  }

  calculateAggregates(): (
    source: Observable<EntrySampleTuple>,
  ) => Observable<never> {
    return (source) =>
      source.pipe(
        groupBy((tuple) => tuple.entry.id),
        switchMap((group) =>
          group.pipe(
            connect(
              (shared) => zip(),
              // TODO: Calculate the aggregates.
            ),
          ),
        ),
        ignoreElements(),
      );
  }

  importDataSamples(): (
    source: Observable<LogEntryEntity>,
  ) => Observable<never> {
    return (source) =>
      source.pipe(
        filter((entry) => !!entry.samples && entry.samples.length > 0),
        concatMap((entry) =>
          from(entry.samples!).pipe(
            map((sample) => ({
              entry,
              sample,
            })),
          ),
        ),
        connect((shared) =>
          merge(
            shared.pipe(this.calculateAggregates()),
            shared.pipe(
              map((tuple) => tuple.sample),
              bufferCount(500),
              asyncTap(async (sample) => {
                this.log.debug(
                  `Saving batch of ${sample.length} log entry data sample(s)...`,
                );
                await this.samples.save(sample);
              }),
            ),
          ),
        ),
        ignoreElements(),
      );
  }

  doImport(
    importData: LogEntryImportEntity,
    owner: User,
  ): Observable<LogEntry> {
    return concat(
      // Begin Postgres transaction and start streaming import records
      from(this.beginTransaction()).pipe(ignoreElements()),
      from(this.streamRecords(importData.id)),
    ).pipe(
      // Throw an exception if there are no records to import.
      throwIfEmpty(() => {
        this.log.warn(
          `Attempted to finalize import with ID "${importData.id}" when no records were uploaded.`,
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
          .createLogEntryFromCreateDTO(owner, parsed)
          .toEntity();

        entity.deviceId = importData.deviceId ?? null;
        entity.deviceName = importData.device ?? null;

        return entity;
      }),

      bufferCount(100),
      asyncTap((batch) => this.saveBatchOfEntries(batch)),
      concatMap((batch) => from(batch)),

      connect((shared) =>
        merge(
          shared.pipe(this.importAirEntries()),
          shared.pipe(this.importDataSamples()),
          shared.pipe(
            map((entity) => this.entryFactory.createLogEntry(entity)),
          ),
        ),
      ),
    );
  }
}
