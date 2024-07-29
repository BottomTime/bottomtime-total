import { GPSCoordinates } from '@bottomtime/api';

import { DiveOperatorEntity } from 'src/data';
import { Repository, SelectQueryBuilder } from 'typeorm';

export const DiveOperatorSuccinctSelectFields = [
  'operators.id',
  'operators.createdAt',
  'operators.updatedAt',
  'operators.address',
  'operators.description',
  'operators.email',
  'operators.gps',
  'operators.logo',
  'operators.name',
  'operators.phone',
  'operators.facebook',
  'operators.instagram',
  'operators.tiktok',
  'operators.twitter',
  'operators.website',
  'owner.id',
  'owner.username',
  'owner.memberSince',
  'owner.logBookSharing',
  'owner.avatar',
  'owner.location',
  'owner.name',
];

export const DiveOperatorFullSelectFields = [
  ...DiveOperatorSuccinctSelectFields,
];

export class DiveOperatorQueryBuilder {
  private query: SelectQueryBuilder<DiveOperatorEntity>;

  constructor(operators: Repository<DiveOperatorEntity>) {
    this.query = operators
      .createQueryBuilder('operators')
      .innerJoin('operators.owner', 'owner')
      .select(DiveOperatorSuccinctSelectFields)
      .orderBy('operators.name', 'ASC');
  }

  build(): SelectQueryBuilder<DiveOperatorEntity> {
    return this.query;
  }

  withGeoLocation(position?: GPSCoordinates, distance?: number): this {
    if (position && distance) {
      this.query = this.query.andWhere(
        'ST_DWithin(operators.gps::geography, ST_MakePoint(:lon, :lat), :distance)',
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
    this.query = this.query.skip(skip ?? 0).take(limit ?? 50);
    return this;
  }

  withTextSearch(query?: string): this {
    if (query) {
      this.query = this.query.andWhere(
        "operators.fulltext @@ websearch_to_tsquery('english', :query)",
        {
          query,
        },
      );
    }
    return this;
  }
}
