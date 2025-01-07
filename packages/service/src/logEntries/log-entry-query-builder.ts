import { LogEntrySortBy, SortOrder } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogEntryEntity } from '../data';

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
      .createQueryBuilder('entries')
      .innerJoin('entries.owner', 'owners')
      .leftJoin('entries.site', 'sites')
      .leftJoin('entries.operator', 'operators')
      .select([
        'entries.id',
        'entries.createdAt',
        'entries.updatedAt',
        'entries.logNumber',
        'entries.tags',

        'entries.entryTime',
        'entries.timezone',
        'entries.bottomTime',
        'entries.duration',

        'entries.averageDepth',
        'entries.maxDepth',
        'entries.depthUnit',

        'owners.id',
        'owners.accountTier',
        'owners.username',
        'owners.memberSince',
        'owners.logBookSharing',
        'owners.name',
        'owners.location',
        'owners.avatar',

        'operators.address',
        'operators.averageRating',
        'operators.id',
        'operators.gps',
        'operators.logo',
        'operators.name',
        'operators.slug',
        'operators.phone',
        'operators.website',

        'sites.averageRating',
        'sites.id',
        'sites.name',
        'sites.description',
        'sites.location',
        'sites.gps',
      ]);
  }

  build(): SelectQueryBuilder<LogEntryEntity> {
    return this.query;
  }

  withDateRange(start?: number, end?: number): this {
    if (start && end) {
      this.query = this.query.andWhere(
        'entries.entryTime BETWEEN :start AND :end',
        {
          start: new Date(start),
          end: new Date(end),
        },
      );
    } else if (start) {
      this.query = this.query.andWhere('entries.entryTime >= :start', {
        start: new Date(start),
      });
    } else if (end) {
      this.query = this.query.andWhere('entries.entryTime < :end', {
        end: new Date(end),
      });
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
          .addOrderBy('entries.entryTime', sortOrderField);
        break;

      case LogEntrySortBy.EntryTime:
      default:
        this.query = this.query.orderBy('entries.entryTime', sortOrderField);
        break;
    }

    return this;
  }
}
