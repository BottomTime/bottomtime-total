import { FriendRequestDirection } from '@bottomtime/api';

import { Repository, SelectQueryBuilder } from 'typeorm';

import { FriendRequestEntity } from '../data';

export class FriendRequestQueryBuilder {
  private query: SelectQueryBuilder<FriendRequestEntity>;

  constructor(friendRequests: Repository<FriendRequestEntity>) {
    this.query = friendRequests
      .createQueryBuilder('request')
      .innerJoin('request.from', 'from')
      .innerJoin('request.to', 'to')
      .select([
        'request.created',
        'request.expires',
        'request.accepted',
        'request.reason',
        'from.avatar',
        'from.accountTier',
        'from.id',
        'from.location',
        'from.logBookSharing',
        'from.memberSince',
        'from.name',
        'from.username',
        'to.avatar',
        'to.accountTier',
        'to.id',
        'to.location',
        'to.logBookSharing',
        'to.memberSince',
        'to.name',
        'to.username',
      ])
      .orderBy('request.created', 'DESC');
  }

  build(): SelectQueryBuilder<FriendRequestEntity> {
    return this.query;
  }

  withAcknowledged(acknowledged?: boolean): this {
    if (acknowledged !== true) {
      this.query = this.query.andWhere('request.accepted IS NULL');
    }
    return this;
  }

  withUser(userId: string, direction?: FriendRequestDirection): this {
    switch (direction) {
      case FriendRequestDirection.Incoming:
        this.query = this.query.andWhere('request.to = :userId', { userId });
        break;

      case FriendRequestDirection.Outgoing:
        this.query = this.query.andWhere('request.from = :userId', { userId });
        break;

      default:
        this.query = this.query.andWhere(
          '(request.from = :userId OR request.to = :userId)',
          { userId },
        );
        break;
    }

    return this;
  }

  withExpired(expired?: boolean): this {
    if (!expired) {
      this.query = this.query.andWhere('request.expires > NOW()');
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.offset(skip ?? 0).limit(limit ?? 100);
    return this;
  }

  withRequest(userId1: string, userId2: string): this {
    this.query = this.query
      .where('request.from = :userId1 AND request.to = :userId2', {
        userId1,
        userId2,
      })
      .orWhere('request.from = :userId2 AND request.to = :userId1', {
        userId1,
        userId2,
      });
    return this;
  }
}
