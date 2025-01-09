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

  withPagination(skip?: number, limit?: number): this {
    this.query.skip(skip ?? 0).take(limit ?? 100);
    return this;
  }

  withSortOrder(sortBy?: DiveSiteReviewsSortBy, sortOrder?: SortOrder): this {
    const sortOrderValue = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';
    const sortByValue = `reviews.${sortBy ?? DiveSiteReviewsSortBy.CreatedOn}`;
    this.query.orderBy(sortByValue, sortOrderValue, 'NULLS LAST');
    if (sortBy === DiveSiteReviewsSortBy.Rating) {
      this.query.addOrderBy('reviews.createdOn', 'DESC');
    }
    return this;
  }
}
