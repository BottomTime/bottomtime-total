import { OperatorReviewSortBy, SortOrder } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { OperatorReviewEntity } from '../data';
import { User } from '../users';
import { Operator } from './operator';

const SelectFields = [
  'reviews.id',
  'reviews.createdAt',
  'reviews.updatedAt',
  'reviews.rating',
  'reviews.comments',
  'creator.id',
  'creator.accountTier',
  'creator.logBookSharing',
  'creator.memberSince',
  'creator.username',
  'creator.name',
  'creator.avatar',
  'creator.location',
];

export class OperatorReviewQueryBuilder {
  private query: SelectQueryBuilder<OperatorReviewEntity>;

  constructor(reviews: Repository<OperatorReviewEntity>) {
    this.query = reviews
      .createQueryBuilder('reviews')
      .innerJoin('reviews.creator', 'creator')
      .select(SelectFields);
  }

  build(): SelectQueryBuilder<OperatorReviewEntity> {
    return this.query;
  }

  withCreator(user?: User): this {
    if (user) {
      this.query = this.query.andWhere('creator.id = :userId', {
        userId: user.id,
      });
    }
    return this;
  }

  withOperator(operator: Operator): this {
    this.query = this.query.andWhere('reviews.operatorId = :operatorId', {
      operatorId: operator.id,
    });
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.skip(skip ?? 0).take(limit ?? 50);
    return this;
  }

  withQuery(query?: string): this {
    if (query) {
      this.query = this.query.andWhere(
        "reviews.fulltext @@ websearch_to_tsquery('english', :query)",
        {
          query,
        },
      );
    }
    return this;
  }

  withSortOrder(sortBy?: OperatorReviewSortBy, sortOrder?: SortOrder): this {
    const sortOrderValue = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';
    switch (sortBy) {
      case OperatorReviewSortBy.Age:
        this.query = this.query.orderBy('reviews.createdAt', sortOrderValue);
        break;

      case OperatorReviewSortBy.Rating:
      default:
        this.query = this.query.orderBy(
          'reviews.rating',
          sortOrderValue,
          'NULLS LAST',
        );
        break;
    }
    return this;
  }
}
