import { ExportLogEntriesParamsDTO } from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Observable, from, map } from 'rxjs';
import { LogEntryEntity } from 'src/data';
import { User } from 'src/users';
import { Repository } from 'typeorm';

import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';
import { LogEntryQueryBuilder } from '../log-entry-query-builder';

export type ExportLogEntriesOptions = ExportLogEntriesParamsDTO & {
  owner: User;
};

@Injectable()
export class LogEntryExportService {
  private readonly log = new Logger(LogEntryExportService.name);

  constructor(
    @InjectRepository(LogEntryEntity)
    private readonly entries: Repository<LogEntryEntity>,

    @Inject(LogEntryFactory)
    private readonly entryFactory: LogEntryFactory,
  ) {}

  private async *streamEntries(
    options: ExportLogEntriesOptions,
  ): AsyncGenerator<LogEntryEntity, number> {
    const limit = 50;
    let skip = 0;
    let resultCount = 0;
    let totalCount = 0;

    do {
      const query = new LogEntryQueryBuilder(this.entries, true)
        .withDateRange(options.startDate, options.endDate)
        .withLocation(options.location, options.radius)
        .withOwner(options.owner.id)
        .withQuery(options.query)
        .withRatingRange(options.minRating, options.maxRating)
        .withSortOrder(options.sortBy, options.sortOrder)
        .withPagination(skip, limit)
        .build();
      this.log.verbose(query.getSql());
      let results: LogEntryEntity[] = [];
      [results, totalCount] = await query.getManyAndCount();

      resultCount += results.length;
      skip += limit;

      for (const entry of results) {
        yield entry;
      }
    } while (resultCount < totalCount);

    return resultCount;
  }

  beginExport(options: ExportLogEntriesOptions): Observable<LogEntry> {
    return from(this.streamEntries(options)).pipe(
      map((entity) => this.entryFactory.createLogEntry(entity)),
    );
  }
}
