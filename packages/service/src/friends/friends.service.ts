import {
  ApiList,
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  ListFriendRequestsParamsDTO,
  ListFriendsParamsDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { DataSource, LessThan, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { FriendRequestEntity, FriendshipEntity, UserEntity } from '../data';
import { User } from '../users';
import { FriendQueryBuilder } from './friend-query-builder';
import { FriendRequestQueryBuilder } from './friend-request-query-builder';

// List Friends Types
export type ListFriendsOptions = ListFriendsParamsDTO & {
  userId: string;
};

// List Friend Requests Types
export type ListFriendRequestOptions = ListFriendRequestsParamsDTO & {
  userId: string;
};

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class FriendsService {
  private readonly log: Logger = new Logger(FriendsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(FriendshipEntity)
    private readonly Friends: Repository<FriendshipEntity>,
    @InjectRepository(FriendRequestEntity)
    private readonly FriendRequests: Repository<FriendRequestEntity>,
  ) {}

  private static toFriendDTO(friend: FriendshipEntity): FriendDTO {
    return {
      userId: friend.user.id,
      username: friend.friend.username,
      memberSince: friend.friend.memberSince.valueOf(),
      friendsSince: friend.friendsSince.valueOf(),
      avatar: friend.friend.avatar ?? undefined,
      name: friend.friend.name ?? undefined,
      location: friend.friend.location ?? undefined,
      logBookSharing: friend.friend.logBookSharing,
      accountTier: friend.friend.accountTier,
    };
  }

  private static toFriendRequestDTO(
    request: FriendRequestEntity,
    userId: string,
  ): FriendRequestDTO {
    const direction =
      request.from.id === userId
        ? FriendRequestDirection.Outgoing
        : FriendRequestDirection.Incoming;

    const friend =
      direction === FriendRequestDirection.Outgoing ? request.to : request.from;

    return {
      created: request.created.valueOf(),
      expires: request.expires.valueOf(),
      direction,
      accepted: request.accepted ?? undefined,
      reason: request.reason ?? undefined,
      friendId: friend.id,
      friend: {
        userId: friend.id,
        username: friend.username,
        memberSince: friend.memberSince.valueOf(),
        avatar: friend.avatar ?? undefined,
        name: friend.name ?? undefined,
        location: friend.location ?? undefined,
        logBookSharing: friend.logBookSharing,
        accountTier: friend.accountTier,
      },
    };
  }

  async listFriends(options: ListFriendsOptions): Promise<ApiList<FriendDTO>> {
    const query = new FriendQueryBuilder(this.Friends)
      .withUserId(options.userId)
      .withSortOrder(options.sortBy, options.sortOrder)
      .withPagination(options.skip, options.limit)
      .build();

    this.log.debug(
      `Attempting to retrieve friends for user with ID "${options.userId}"...`,
    );
    this.log.verbose(query.getSql());

    const [friends, totalCount] = await query.getManyAndCount();

    return {
      data: friends.map(FriendsService.toFriendDTO),
      totalCount,
    };
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    this.log.debug(
      `Checking if users with IDs "${userId}" and "${friendId}" are friends...`,
    );

    return await this.Friends.exists({
      where: [
        { user: { id: userId }, friend: { id: friendId } },
        { user: { id: friendId }, friend: { id: userId } },
      ],
    });
  }

  async getFriend(
    userId: string,
    friendId: string,
  ): Promise<FriendDTO | undefined> {
    const query = new FriendQueryBuilder(this.Friends)
      .withUserId(userId)
      .withFriendId(friendId)
      .build();

    this.log.debug(`Attempting to retrieve friend with ID "${friendId}"...`);
    this.log.verbose(query.getSql());

    const friend = await query.getOne();

    if (friend) return FriendsService.toFriendDTO(friend);
    else return undefined;
  }

  async unFriend(userId: string, friendId: string): Promise<boolean> {
    const query = this.Friends.createQueryBuilder('friends')
      .delete()
      .where('user = :userId AND friend = :friendId', {
        userId,
        friendId,
      })
      .orWhere('user = :friendId AND friend = :userId', {
        userId,
        friendId,
      });

    this.log.debug(`Attempting to unfriend user with ID "${friendId}"...`);
    this.log.verbose(query.getSql());

    const { affected } = await query.execute();
    return typeof affected === 'number' && affected > 0;
  }

  async listFriendRequests(
    options: ListFriendRequestOptions,
  ): Promise<ApiList<FriendRequestDTO>> {
    const query = new FriendRequestQueryBuilder(this.FriendRequests)
      .withAcknowledged(options.showAcknowledged)
      .withExpired(options.showExpired)
      .withUser(options.userId, options.direction)
      .withPagination(options.skip, options.limit)
      .build();

    this.log.debug(
      `Listing friend requests for user with ID "${options.userId}"...`,
    );
    this.log.verbose(`Listing friend requests using query`, query.getSql());

    const [requests, totalCount] = await query.getManyAndCount();

    return {
      data: requests.map((friend) =>
        FriendsService.toFriendRequestDTO(friend, options.userId),
      ),
      totalCount,
    };
  }

  async getFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<FriendRequestDTO | undefined> {
    const query = new FriendRequestQueryBuilder(this.FriendRequests)
      .withRequest(userId, friendId)
      .build();

    this.log.debug(
      `Attempting to retrieve friend request between users "${userId}" and "${friendId}"...`,
    );
    this.log.verbose(query.getSql());

    const request = await query.getOne();
    return request
      ? FriendsService.toFriendRequestDTO(request, userId)
      : undefined;
  }

  async createFriendRequest(
    user: User,
    friend: User,
  ): Promise<FriendRequestDTO> {
    if (user.id === friend.id) {
      throw new BadRequestException('You cannot friend yourself.');
    }

    const [requestExists, friendshipExists] = await Promise.all([
      this.FriendRequests.existsBy([
        { from: { id: user.id }, to: { id: friend.id } },
        { from: { id: friend.id }, to: { id: user.id } },
      ]),
      this.Friends.existsBy([
        { user: { id: user.id }, friend: { id: friend.id } },
        { user: { id: friend.id }, friend: { id: user.id } },
      ]),
    ]);

    if (!user || !friend) {
      throw new NotFoundException(
        'User or friend accounts could not be found.',
      );
    }

    if (requestExists || friendshipExists) {
      throw new ConflictException(
        'A friend request or friendship already exists between the two users.',
      );
    }

    const request = new FriendRequestEntity();
    request.id = uuid();
    request.created = new Date();
    request.expires = new Date(Date.now() + TwoWeeksInMilliseconds);
    request.to = friend.toEntity();
    request.from = user.toEntity();
    await this.FriendRequests.save(request);

    return FriendsService.toFriendRequestDTO(request, user.id);
  }

  async acceptFriendRequest(
    from: string,
    to: string,
  ): Promise<FriendRequestDTO | undefined> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const friendRequests = runner.manager.getRepository(FriendRequestEntity);
      const friends = runner.manager.getRepository(FriendshipEntity);

      const request = await friendRequests.findOne({
        where: {
          from: { id: from },
          to: { id: to },
        },
        select: ['id', 'accepted', 'expires'],
        relations: ['to', 'from'],
      });

      if (!request) return undefined;
      if (request.accepted) {
        throw new BadRequestException(
          'Friend request has already been accepted.',
        );
      }
      if (request.expires < new Date()) {
        throw new BadRequestException('Friend request has expired.');
      }

      request.accepted = true;
      request.expires = new Date(Date.now() + TwoWeeksInMilliseconds);
      await friendRequests.save(request);

      const friendships = [new FriendshipEntity(), new FriendshipEntity()];

      const now = new Date();
      friendships[0].id = uuid();
      friendships[0].user = { id: from } as UserEntity;
      friendships[0].friend = { id: to } as UserEntity;
      friendships[0].friendsSince = now;

      friendships[1].id = uuid();
      friendships[1].user = { id: to } as UserEntity;
      friendships[1].friend = { id: from } as UserEntity;
      friendships[1].friendsSince = now;
      await friends.save(friendships);
      await runner.commitTransaction();

      return FriendsService.toFriendRequestDTO(request, from);
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    }
  }

  async rejectFriendRequest(
    from: string,
    to: string,
    reason?: string,
  ): Promise<FriendRequestDTO | undefined> {
    const request = await this.FriendRequests.findOne({
      where: {
        from: { id: from },
        to: { id: to },
      },
      select: ['id', 'accepted', 'expires'],
      relations: ['to', 'from'],
    });

    if (!request) return undefined;

    if (request.accepted === true) {
      throw new BadRequestException(
        'Friend request has already been accepted. You may need to unfriend the user instead.',
      );
    }
    if (request.accepted === false) {
      throw new BadRequestException(
        'Friend request has already been rejected.',
      );
    }
    if (request.expires < new Date()) {
      throw new BadRequestException('Friend request has expired.');
    }

    request.accepted = false;
    request.expires = new Date(Date.now() + TwoWeeksInMilliseconds);
    request.reason = reason ?? null;
    await this.FriendRequests.save(request);

    return FriendsService.toFriendRequestDTO(request, from);
  }

  async cancelFriendRequest(from: string, to: string): Promise<boolean> {
    const { affected } = await this.FriendRequests.delete({
      from: { id: from },
      to: { id: to },
    });
    return typeof affected === 'number' && affected > 0;
  }

  async purgeExpiredFriendRequests(date?: Date): Promise<number> {
    const { affected } = await this.FriendRequests.delete({
      expires: LessThan(date ?? new Date()),
    });
    return typeof affected === 'number' ? affected : 0;
  }
}
