import { LogEntrySortBy, SortOrder } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogEntryEntity } from '../data';
import { DiveSiteSelectFields } from '../diveSites/dive-site-query-builder';

export const LogEntryAirSelectFields = [
  'site_air.ordinal',
  'site_air.name',
  'site_air.material',
  'site_air.workingPressure',
  'site_air.volume',
  'site_air.count',
  'site_air.startPressure',
  'site_air.endPressure',
  'site_air.pressureUnit',
  'site_air.o2Percent',
  'site_air.hePercent',
] as const;

export class LogEntryQueryBuilder {
  private query: SelectQueryBuilder<LogEntryEntity>;

  constructor(entries: Repository<LogEntryEntity>) {
    this.query = entries
      .createQueryBuilder()
      .from(LogEntryEntity, 'entries')
      .innerJoin('entries.owner', 'owners')
      .leftJoin('entries.site', 'sites')
      .leftJoin('sites.creator', 'site_creators')
      .leftJoin('entries.air', 'site_air')
      .select([
        'entries.id',
        'entries.logNumber',
        'entries.timestamp',
        'entries.entryTime',
        'entries.timezone',
        'entries.bottomTime',
        'entries.duration',
        'entries.maxDepth',
        'entries.depthUnit',
        'entries.weight',
        'entries.weightUnit',
        'entries.notes',
        'owners.id',
        'owners.username',
        'owners.memberSince',
        'owners.logBookSharing',
        'owners.name',
        'owners.location',
        'owners.avatar',
        ...DiveSiteSelectFields,
        ...LogEntryAirSelectFields,
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

    const sortOrderField = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';

    switch (sortBy) {
      case LogEntrySortBy.LogNumber:
        this.query = this.query
          .orderBy('entries.logNumber', sortOrderField, 'NULLS LAST')
          .addOrderBy('entries.timestamp', sortOrderField);
        break;

      case LogEntrySortBy.EntryTime:
      default:
        this.query = this.query.orderBy('entries.timestamp', sortOrderField);
        break;
    }

    return this;
  }
}
