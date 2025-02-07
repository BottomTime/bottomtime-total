import {
  DiveSitesSortBy,
  GpsCoordinates,
  RatingRange,
  SortOrder,
  WaterType,
} from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { DiveSiteEntity } from '../data';

export const DiveSiteSelectFields = [
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
  'sites.waterType',
  'sites.createdOn',
  'sites.updatedOn',
  'sites.averageRating',
  'sites.averageDifficulty',
  'site_creators.id',
  'site_creators.username',
  'site_creators.memberSince',
  'site_creators.logBookSharing',
  'site_creators.avatar',
  'site_creators.location',
  'site_creators.name',
] as const;

export class DiveSiteQueryBuilder {
  private query: SelectQueryBuilder<DiveSiteEntity>;

  constructor(diveSites: Repository<DiveSiteEntity>) {
    this.query = diveSites
      .createQueryBuilder('sites')
      .innerJoin('sites.creator', 'site_creators')
      .select([...DiveSiteSelectFields]);
  }

  build(): SelectQueryBuilder<DiveSiteEntity> {
    return this.query;
  }

  withCreatorId(creatorId?: string): this {
    if (creatorId) {
      this.query = this.query.andWhere('site_creators.id = :creatorId', {
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

  withGeoLocation(location?: GpsCoordinates, radius?: number): this {
    if (location) {
      this.query = this.query.andWhere(
        'ST_DWithin(sites.gps::geography, ST_MakePoint(:lon, :lat), :distance)',
        {
          lon: location.lon,
          lat: location.lat,
          distance: (radius ?? 50) * 1000, // Distance must be converted from km to meters
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
    let nulls: 'NULLS FIRST' | 'NULLS LAST' | undefined;

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
        nulls = 'NULLS LAST';
        break;
    }

    this.query = this.query.orderBy(sortByField, sortOrderString, nulls);
    return this;
  }

  withSiteId(siteId: string): this {
    this.query = this.query.andWhere('sites.id = :siteId', { siteId });
    return this;
  }

  withSiteIds(siteIds: string[]): this {
    if (siteIds.length) {
      this.query = this.query.andWhere('sites.id IN (:...siteIds)', {
        siteIds,
      });
    }
    return this;
  }

  withWaterType(waterType?: WaterType): this {
    if (waterType) {
      this.query = this.query.andWhere('sites.waterType = :waterType', {
        waterType,
      });
    }
    return this;
  }
}
