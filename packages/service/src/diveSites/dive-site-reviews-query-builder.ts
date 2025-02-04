import { DiveSiteReviewsSortBy, SortOrder } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { DiveSiteReviewEntity } from '../data';
import { DiveSite } from './dive-site';

const SelectFields = [
  'reviews.id',
  'reviews.rating',
  'reviews.difficulty',
  'reviews.comments',
  'reviews.createdOn',
  'reviews.updatedOn',
  'creator.id',
  'creator.accountTier',
  'creator.logBookSharing',
  'creator.memberSince',
  'creator.username',
  'creator.name',
  'creator.avatar',
  'creator.location',
];

export class DiveSiteReviewsQueryBuilder {
  private query: SelectQueryBuilder<DiveSiteReviewEntity>;

  constructor(reviews: Repository<DiveSiteReviewEntity>, diveSite: DiveSite) {
    this.query = reviews
      .createQueryBuilder('reviews')
      .innerJoin('reviews.creator', 'creator')
      .andWhere('reviews.site = :siteId', { siteId: diveSite.id })
      .select(SelectFields);
  }

  build(): SelectQueryBuilder<DiveSiteReviewEntity> {
    return this.query;
  }

  withCreator(creator?: string): this {
    if (creator) {
      this.query = this.query.andWhere('creator.usernameLowered = :creator', {
        creator: creator.trim().toLowerCase(),
      });
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.skip(skip ?? 0).take(limit ?? 100);
    return this;
  }

  withSortOrder(sortBy?: DiveSiteReviewsSortBy, sortOrder?: SortOrder): this {
    const sortOrderValue = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';
    let sortByColumn: string;
    switch (sortBy) {
      case DiveSiteReviewsSortBy.Rating:
        sortByColumn = 'reviews.rating';
        break;

      case DiveSiteReviewsSortBy.CreatedOn:
      default:
        sortByColumn = 'reviews.createdOn';
        break;
    }
    this.query.orderBy(sortByColumn, sortOrderValue, 'NULLS LAST');
    if (sortBy === DiveSiteReviewsSortBy.Rating) {
      this.query.addOrderBy('reviews.createdOn', 'DESC');
    }
    return this;
  }
}
