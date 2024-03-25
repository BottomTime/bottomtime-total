import {
  DiveSitesSortBy,
  GpsCoordinates,
  RatingRange,
  SortOrder,
} from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { DiveSiteEntity } from '../data';

export class DiveSiteQueryBuilder {
  private query: SelectQueryBuilder<DiveSiteEntity>;

  constructor(diveSites: Repository<DiveSiteEntity>) {
    this.query = diveSites
      .createQueryBuilder()
      .from(DiveSiteEntity, 'sites')
      .innerJoin('sites.creator', 'creator')
      .select([
        'sites.id',
        'sites.name',
        'sites.description',
        'sites.depth',
        'sites.depthUnit',
        'sites.location',
        'sites.directions',
        'sites.gps',
        'sites.shoreAccess',
        'sites.freeToDive',
        'sites.createdOn',
        'sites.updatedOn',
        'sites.averageRating',
        'sites.averageDifficulty',
        'creator.id',
        'creator.username',
        'creator.memberSince',
        'creator.avatar',
        'creator.location',
        'creator.name',
      ]);
  }

  build(): SelectQueryBuilder<DiveSiteEntity> {
    return this.query;
  }

  withCreatorId(creatorId?: string): this {
    if (creatorId) {
      this.query = this.query.andWhere('creator.id = :creatorId', {
        creatorId,
      });
    }
    return this;
  }

  withDifficulty(difficulty?: RatingRange): this {
    if (difficulty) {
      this.query = this.query.andWhere(
        'sites.averageDifficulty BETWEEN :min AND :max',
        {
          min: difficulty.min,
          max: difficulty.max,
        },
      );
    }
    return this;
  }

  withFreeToDive(freeToDive?: boolean): this {
    if (typeof freeToDive === 'boolean') {
      this.query = this.query.andWhere('sites.freeToDive = :freeToDive', {
        freeToDive,
      });
    }
    return this;
  }

  withGeoLocation(position?: GpsCoordinates, distance?: number): this {
    if (position && distance) {
      this.query = this.query.andWhere(
        'ST_DWithin(sites.gps::geography, ST_MakePoint(:lon, :lat), :distance)',
        {
          lon: position.lon,
          lat: position.lat,
          distance: distance * 1000, // Distance must be converted from km to meters
        },
      );
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.skip(skip ?? 0).take(limit ?? 100);
    return this;
  }

  withRating(rating?: RatingRange): this {
    if (rating) {
      this.query = this.query.andWhere(
        'sites.averageRating BETWEEN :min AND :max',
        {
          min: rating.min,
          max: rating.max,
        },
      );
    }
    return this;
  }

  withShoreAccesss(shoreAccess?: boolean): this {
    if (typeof shoreAccess === 'boolean') {
      this.query = this.query.andWhere('sites.shoreAccess = :shoreAccess', {
        shoreAccess,
      });
    }
    return this;
  }

  withTextSearch(query?: string): this {
    if (query) {
      this.query = this.query.andWhere(
        "sites.fulltext @@ websearch_to_tsquery('english', :query)",
        { query },
      );
    }
    return this;
  }

  withSortOrder(sortBy?: DiveSitesSortBy, sortOrder?: SortOrder): this {
    let sortByField: string;
    let sortOrderString: 'ASC' | 'DESC';

    if (sortOrder) {
      sortOrderString = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';
    }

    switch (sortBy) {
      case DiveSitesSortBy.Name:
        sortByField = 'sites.name';
        sortOrderString ||= 'ASC';
        break;

      case DiveSitesSortBy.Rating:
      default:
        sortByField = 'sites.averageRating';
        sortOrderString ||= 'DESC';
        break;
    }

    this.query = this.query.orderBy(sortByField, sortOrderString, 'NULLS LAST');
    return this;
  }

  withSiteId(siteId: string): this {
    this.query = this.query.andWhere('sites.id = :siteId', { siteId });
    return this;
  }
}
