import { FriendsSortBy, SortOrder } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { FriendshipEntity } from '../data';

const SortColumns: Record<FriendsSortBy, string> = {
  [FriendsSortBy.FriendsSince]: 'friendship.friendsSince',
  [FriendsSortBy.Username]: 'friend.username',
  [FriendsSortBy.MemberSince]: 'friend.memberSince',
} as const;

export class FriendQueryBuilder {
  private query: SelectQueryBuilder<FriendshipEntity>;

  constructor(friends: Repository<FriendshipEntity>) {
    this.query = friends
      .createQueryBuilder('friendship')
      .innerJoin('friendship.friend', 'friend')
      .select([
        'friendship.friendsSince',
        'friendship.friendId',
        'friend.accountTier',
        'friend.avatar',
        'friend.id',
        'friend.logBookSharing',
        'friend.location',
        'friend.memberSince',
        'friend.name',
        'friend.username',
      ]);
  }

  build(): SelectQueryBuilder<FriendshipEntity> {
    return this.query;
  }

  withFriendId(friendId: string): this {
    this.query = this.query.andWhere('friendship.friendId = :friendId', {
      friendId,
    });
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.offset(skip ?? 0).limit(limit ?? 100);
    return this;
  }

  withSortOrder(sortBy?: FriendsSortBy, sortOrder?: SortOrder): this {
    sortBy ??= FriendsSortBy.FriendsSince;
    sortOrder ??=
      sortBy === FriendsSortBy.Username
        ? SortOrder.Ascending
        : SortOrder.Descending;

    this.query = this.query.orderBy(
      SortColumns[sortBy],
      (sortOrder ?? SortOrder.Descending) === SortOrder.Ascending
        ? 'ASC'
        : 'DESC',
    );

    return this;
  }

  withUserId(userId: string): this {
    this.query = this.query.andWhere('friendship.userId = :userId', { userId });
    return this;
  }
}
