import {
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendRequestsParams,
  ListFriendRequestsResponseDTO,
  ListFriendsParams,
  ListFriendsResponseDTO,
  ProfileVisibility,
  SortOrder,
} from '@bottomtime/api';

import { FriendRequestEntity, FriendshipEntity, UserEntity } from '@/data';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { DataSource, LessThan, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

// List Friends Types
export type Friend = FriendDTO;
export type ListFriendsOptions = ListFriendsParams & {
  userId: string;
};
export type ListFriendsResults = ListFriendsResponseDTO;

// List Friend Requests Types
export type FriendRequest = FriendRequestDTO;
export type ListFriendRequestOptions = ListFriendRequestsParams & {
  userId: string;
};
export type ListFriendRequestsResults = ListFriendRequestsResponseDTO;

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;
const UserSelectFields: string[] = [
  'id',
  'username',
  'memberSince',
  'avatar',
  'name',
  'location',
  'profileVisibility',
];
const FriendSelectFields = [
  ...UserSelectFields.map((field) => `friend.${field}`),
  'friendships.friendsSince',
];
const FriendRequestSelectFields = [
  'requests.created',
  'requests.expires',
  'requests.accepted',
  'requests.reason',
  ...UserSelectFields.map((field) => `from.${field}`),
  ...UserSelectFields.map((field) => `to.${field}`),
];
@Injectable()
export class FriendsService {
  private static DefaultListFriendsOptions: Partial<ListFriendsOptions> = {
    skip: 0,
    limit: 100,
    sortBy: FriendsSortBy.FriendsSince,
  };

  private readonly log: Logger = new Logger(FriendsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly Friends: Repository<FriendshipEntity>,
    @InjectRepository(FriendRequestEntity)
    private readonly FriendRequests: Repository<FriendRequestEntity>,
  ) {}

  private static toFriendDTO(friend: FriendshipEntity): FriendDTO {
    return {
      id: friend.friend.id,
      username: friend.friend.username,
      memberSince: friend.friend.memberSince,
      friendsSince: friend.friendsSince,
      ...(friend.friend.profileVisibility === ProfileVisibility.Private
        ? {}
        : {
            avatar: friend.friend.avatar ?? undefined,
            name: friend.friend.name ?? undefined,
            location: friend.friend.location ?? undefined,
          }),
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
      created: request.created,
      expires: request.expires,
      direction,
      accepted: request.accepted ?? undefined,
      reason: request.reason ?? undefined,
      friendId: friend.id,
      friend: {
        id: friend.id,
        username: friend.username,
        memberSince: friend.memberSince,
        ...(friend.profileVisibility === ProfileVisibility.Private
          ? {}
          : {
              avatar: friend.avatar ?? undefined,
              name: friend.name ?? undefined,
              location: friend.location ?? undefined,
            }),
      },
    };
  }

  async listFriends(options: ListFriendsOptions): Promise<ListFriendsResults> {
    options = {
      ...FriendsService.DefaultListFriendsOptions,
      ...options,
    };

    let sortBy: string;
    let sortOrder: SortOrder | undefined = options.sortOrder;

    switch (options.sortBy) {
      case FriendsSortBy.FriendsSince:
        sortBy = 'friendships.friendsSince';
        sortOrder ||= SortOrder.Descending;
        break;

      case FriendsSortBy.MemberSince:
        sortBy = 'friend.memberSince';
        sortOrder ||= SortOrder.Descending;
        break;

      case FriendsSortBy.Username:
      default:
        sortBy = 'friend.username';
        sortOrder ||= SortOrder.Ascending;
        break;
    }

    const query = this.Friends.createQueryBuilder('friendships')
      .innerJoin('friendships.friend', 'friend')
      .where('friendships.user = :userId', { userId: options.userId })
      .select(FriendSelectFields)
      .orderBy(sortBy, sortOrder === SortOrder.Descending ? 'DESC' : 'ASC')
      .offset(options.skip)
      .limit(options.limit ?? 100);

    this.log.debug(
      `Attempting to retrieve friends for user with ID "${options.userId}"...`,
    );
    this.log.verbose(query.getSql());

    const [friends, totalCount] = await query.getManyAndCount();

    return {
      friends: friends.map(FriendsService.toFriendDTO),
      totalCount,
    };
  }

  async getFriend(
    userId: string,
    friendId: string,
  ): Promise<Friend | undefined> {
    const query = this.Friends.createQueryBuilder('friendships')
      .innerJoin('friendships.friend', 'friend')
      .where('friendships.user = :userId', { userId })
      .andWhere('friendships.friend = :friendId', { friendId })
      .select(FriendSelectFields);

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
  ): Promise<ListFriendRequestsResults> {
    let query = this.FriendRequests.createQueryBuilder('requests')
      .innerJoin('requests.from', 'from')
      .innerJoin('requests.to', 'to')
      .select(FriendRequestSelectFields)
      .orderBy('requests.created', 'DESC')
      .offset(options.skip)
      .limit(options.limit ?? 100);

    switch (options.direction) {
      case FriendRequestDirection.Incoming:
        query = query.where('requests.to = :userId', {
          userId: options.userId,
        });
        break;

      case FriendRequestDirection.Outgoing:
        query = query.where('requests.from = :userId', {
          userId: options.userId,
        });
        break;

      case FriendRequestDirection.Both:
      default:
        query = query.where(
          'requests.from = :userId OR requests.to = :userId',
          { userId: options.userId },
        );
        break;
    }

    this.log.debug(
      `Listing friend requests for user with ID "${options.userId}"...`,
    );
    this.log.verbose(`Listing friend requests using query`, query.getSql());

    const [requests, totalCount] = await query.getManyAndCount();

    return {
      friendRequests: requests.map((friend) =>
        FriendsService.toFriendRequestDTO(friend, options.userId),
      ),
      totalCount,
    };
  }

  async getFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<FriendRequest | undefined> {
    const query = this.FriendRequests.createQueryBuilder('requests')
      .innerJoin('requests.from', 'from')
      .innerJoin('requests.to', 'to')
      .select(FriendRequestSelectFields)
      .where('requests.from = :userId AND requests.to = :friendId', {
        userId,
        friendId,
      })
      .orWhere('requests.from = :friendId AND requests.to = :userId', {
        userId,
        friendId,
      });

    this.log.debug(
      `Attempting to retrieve friend request between users "${userId}" and "${friendId}"...`,
    );
    this.log.verbose(query.getSql());

    const request = await query.getOne();
    return request
      ? FriendsService.toFriendRequestDTO(request, userId)
      : undefined;
  }

  async createFriendRequest(from: string, to: string): Promise<FriendRequest> {
    if (from === to) {
      throw new BadRequestException('You cannot friend yourself.');
    }

    const [user, friend, requestExists, friendshipExists] = await Promise.all([
      this.Users.findOneBy({ id: from }),
      this.Users.findOneBy({ id: to }),
      this.FriendRequests.existsBy([
        { from: { id: from }, to: { id: to } },
        { from: { id: to }, to: { id: from } },
      ]),
      this.Friends.existsBy([
        { user: { id: from }, friend: { id: to } },
        { user: { id: to }, friend: { id: from } },
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
    request.to = friend;
    request.from = user;
    await this.FriendRequests.save(request);

    return FriendsService.toFriendRequestDTO(request, from);
  }

  async acceptFriendRequest(from: string, to: string): Promise<boolean> {
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
      });

      if (!request) return false;
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
      request.from = { id: from } as UserEntity;
      request.to = { id: to } as UserEntity;
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

      return true;
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    }
  }

  async rejectFriendRequest(
    from: string,
    to: string,
    reason?: string,
  ): Promise<boolean> {
    const request = await this.FriendRequests.findOne({
      where: {
        from: { id: from },
        to: { id: to },
      },
      select: ['id', 'accepted', 'expires'],
    });

    if (!request) return false;

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
    request.from = { id: from } as UserEntity;
    request.to = { id: to } as UserEntity;
    await this.FriendRequests.save(request);

    return true;
  }

  async cancelFriendRequest(from: string, to: string): Promise<boolean> {
    const request = await this.FriendRequests.findOne({
      where: {
        from: { id: from },
        to: { id: to },
      },
      select: ['id', 'accepted'],
    });

    if (!request) return false;

    if (request.accepted) {
      throw new BadRequestException(
        'This friend request has already been accepted. You may need to unfriend the user instead.',
      );
    }

    const { affected } = await this.FriendRequests.delete({
      from: { id: from },
      to: { id: to },
    });
    return typeof affected === 'number' && affected > 0;
  }

  async purgeExpiredFriendRequests(): Promise<number> {
    const { affected } = await this.FriendRequests.delete({
      expires: LessThan(new Date()),
    });
    return typeof affected === 'number' ? affected : 0;
  }
}
