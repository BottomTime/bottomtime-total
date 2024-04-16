import { LogEntrySortBy, SortOrder } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogEntryEntity } from '../data';

export class LogEntryQueryBuilder {
  private query: SelectQueryBuilder<LogEntryEntity>;

  constructor(entries: Repository<LogEntryEntity>) {
    this.query = entries
      .createQueryBuilder()
      .from(LogEntryEntity, 'entries')
      .innerJoin('entries.owner', 'owners')
      .select([
        'entries.id',
        'entries.logNumber',
        'entries.timestamp',
        'entries.entryTime',
        'entries.timezone',
        'entries.bottomTime',
        'entries.duration',
        'entries.maxDepth',
        'entries.maxDepthUnit',
        'entries.notes',
        'owners.id',
        'owners.username',
        'owners.memberSince',
        'owners.name',
        'owners.location',
        'owners.avatar',
      ]);
  }

  build(): SelectQueryBuilder<LogEntryEntity> {
    return this.query;
  }

  withDateRange(start?: Date, end?: Date): this {
    if (start && end) {
      this.query = this.query.andWhere(
        'entries.timestamp BETWEEN :start AND :end',
        {
          start,
          end,
        },
      );
    } else if (start) {
      this.query = this.query.andWhere('entries.timestamp >= :start', {
        start,
      });
    } else if (end) {
      this.query = this.query.andWhere('entries.timestamp < :end', { end });
    }

    return this;
  }

  withOwner(ownerId?: string): this {
    if (ownerId) {
      this.query = this.query.andWhere('owners.id = :ownerId', { ownerId });
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.skip(skip ?? 0).take(limit ?? 50);
    return this;
  }

  withSortOrder(sortBy?: LogEntrySortBy, sortOrder?: SortOrder): this {
    sortBy ??= LogEntrySortBy.EntryTime;
    sortOrder ??= SortOrder.Descending;

    let sortByField: string;

    switch (sortBy) {
      case LogEntrySortBy.EntryTime:
      default:
        sortByField = 'entries.timestamp';
        break;
    }

    const sortOrderField = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';

    this.query = this.query.orderBy(sortByField, sortOrderField);
    return this;
  }
}
