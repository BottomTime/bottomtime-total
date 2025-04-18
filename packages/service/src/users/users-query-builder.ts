import { SortOrder, UserRole, UsersSortBy } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { UserEntity } from '../data';

export class UsersQueryBuilder {
  private query: SelectQueryBuilder<UserEntity>;

  constructor(users: Repository<UserEntity>) {
    this.query = users
      .createQueryBuilder('users')
      .select([
        'users.id',
        'users.avatar',
        'users.bio',
        'users.experienceLevel',
        'users.location',
        'users.memberSince',
        'users.logBookSharing',
        'users.name',
        'users.role',
        'users.startedDiving',
        'users.username',
      ]);
  }

  build(): SelectQueryBuilder<UserEntity> {
    return this.query;
  }

  filterFriendsForUser(userId?: string): this {
    if (userId) {
      this.query = this.query
        .leftJoin(
          'users.friends',
          'friends',
          'friends.userId = users.id AND friends.friendId = :userId',
          { userId },
        )
        .andWhere('friends.id IS NULL')
        .andWhere('users.id != :userId', { userId })
        .groupBy('users.id');
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.offset(skip).limit(limit ?? 100);
    return this;
  }

  withQuery(query?: string): this {
    if (query) {
      this.query = this.query.andWhere(
        "users.fulltext @@ websearch_to_tsquery('english', :query)",
        {
          query,
        },
      );
    }
    return this;
  }

  withRole(role?: UserRole): this {
    if (role) {
      this.query = this.query.andWhere('users.role = :role', {
        role,
      });
    }
    return this;
  }

  withSortOrder(sortBy?: UsersSortBy, sortOrder?: SortOrder): this {
    const sortByValue = `users.${sortBy || UsersSortBy.Username}`;
    let sortOrderValue: 'ASC' | 'DESC';

    if (sortOrder) {
      sortOrderValue = sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC';
    } else {
      sortOrderValue = sortBy === UsersSortBy.MemberSince ? 'DESC' : 'ASC';
    }

    this.query = this.query.orderBy(sortByValue, sortOrderValue);
    return this;
  }
}
