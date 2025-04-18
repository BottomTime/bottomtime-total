import { GpsCoordinates, VerificationStatus } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { OperatorEntity } from '../data';
import { User } from '../users';

export const OperatorSelectFields = [
  'operators.id',
  'operators.active',
  'operators.createdAt',
  'operators.updatedAt',
  'operators.address',
  'operators.banner',
  'operators.description',
  'operators.email',
  'operators.gps',
  'operators.logo',
  'operators.name',
  'operators.phone',
  'operators.facebook',
  'operators.instagram',
  'operators.slug',
  'operators.tiktok',
  'operators.twitter',
  'operators.youtube',
  'operators.verificationStatus',
  'operators.website',
  'owner.id',
  'owner.accountTier',
  'owner.username',
  'owner.memberSince',
  'owner.logBookSharing',
  'owner.avatar',
  'owner.location',
  'owner.name',
];

export class OperatorQueryBuilder {
  private query: SelectQueryBuilder<OperatorEntity>;
  private showInactive: boolean | undefined;

  constructor(operators: Repository<OperatorEntity>) {
    this.query = operators
      .createQueryBuilder('operators')
      .innerJoin('operators.owner', 'owner')
      .select(OperatorSelectFields)
      .orderBy('operators.name', 'ASC');
  }

  build(): SelectQueryBuilder<OperatorEntity> {
    if (!this.showInactive) {
      return this.query.andWhere('operators.active = true');
    }
    return this.query;
  }

  withGeoLocation(position?: GpsCoordinates, distance?: number): this {
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

  withInactive(showInactive?: boolean): this {
    this.showInactive = showInactive;
    return this;
  }

  withOwner(owner?: User): this {
    if (owner) {
      this.query = this.query.andWhere('owner.id = :ownerId', {
        ownerId: owner.id,
      });
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.skip(skip ?? 0).take(limit ?? 50);
    return this;
  }

  withShowInactive(showInactive?: boolean): this {
    this.showInactive = showInactive;
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

  withVerificationStatus(status?: VerificationStatus): this {
    if (status) {
      this.query = this.query.andWhere(
        'operators.verificationStatus = :status',
        {
          status,
        },
      );
    }
    return this;
  }
}
