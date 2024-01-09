import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FriendRequestData,
  FriendRequestDocument,
  FriendRequestModel,
  UserData,
  UserDocument,
  UserModel,
} from '../schemas';
import { FilterQuery, Model } from 'mongoose';
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
import { FriendData, FriendModel } from '../schemas/friends.document';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { Collections } from '../schemas/collections';

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

const FriendProjection = {
  username: 1,
  memberSince: 1,
  'profile.avatar': 1,
  'profile.name': 1,
  'profile.location': 1,
  'settings.profileVisibility': 1,
} as const;

@Injectable()
export class FriendsService {
  private static DefaultListFriendsOptions: Partial<ListFriendsOptions> = {
    skip: 0,
    limit: 100,
    sortBy: FriendsSortBy.FriendsSince,
  };

  private readonly log: Logger = new Logger(FriendsService.name);

  constructor(
    @InjectModel(Collections.Users)
    private readonly Users: Model<UserData>,
    @InjectModel(Collections.Friends)
    private readonly Friends: Model<FriendData>,
    @InjectModel(Collections.FriendRequests)
    private readonly FriendRequests: Model<FriendRequestData>,
  ) {}

  private static toFriendDTO(friend: UserDocument, friendsSince: Date): Friend {
    const profileData =
      friend.settings?.profileVisibility === ProfileVisibility.Private
        ? {}
        : {
            avatar: friend.profile?.avatar ?? undefined,
            name: friend.profile?.name ?? undefined,
            location: friend.profile?.location ?? undefined,
          };

    return {
      id: friend._id,
      username: friend.username,
      friendsSince,
      memberSince: friend.memberSince,
      ...profileData,
    };
  }

  private static toFriendRequestDTO(
    userId: string,
    user: UserDocument,
    friend: UserDocument,
    friendRequest: FriendRequestDocument,
  ): FriendRequest {
    const direction =
      userId === user._id
        ? FriendRequestDirection.Outgoing
        : FriendRequestDirection.Incoming;
    const friendData: Omit<Friend, 'friendsSince'> =
      direction === FriendRequestDirection.Outgoing
        ? {
            id: friend._id,
            username: friend.username,
            memberSince: friend.memberSince,
            avatar: friend.profile?.avatar ?? undefined,
            name: friend.profile?.name ?? undefined,
            location: friend.profile?.location ?? undefined,
          }
        : {
            id: user._id,
            username: user.username,
            memberSince: user.memberSince,
            avatar: user.profile?.avatar ?? undefined,
            name: user.profile?.name ?? undefined,
            location: user.profile?.location ?? undefined,
          };

    return {
      friendId: friend._id,
      friend: friendData,
      direction,
      created: friendRequest.created,
      expires: friendRequest.expires,
      accepted: friendRequest.accepted ?? undefined,
      reason: friendRequest.reason ?? undefined,
    };
  }

  private async listFriendsByFriendsSince(
    options: ListFriendsOptions,
  ): Promise<ListFriendsResults> {
    const [sortedFriendIds, totalCount] = await Promise.all([
      this.Friends.find({
        userId: options.userId,
      })
        .populate({
          path: 'friendId',
          select: FriendProjection,
          model: UserModel,
        })
        .sort({ friendsSince: options.sortOrder === 'asc' ? 1 : -1 })
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 100)
        .exec(),
      this.Friends.estimatedDocumentCount({
        userId: options.userId,
      }),
    ]);

    return {
      friends: sortedFriendIds.map((friend) =>
        FriendsService.toFriendDTO(
          friend.friendId as unknown as UserDocument,
          friend.friendsSince,
        ),
      ),
      totalCount,
    };
  }

  private async listFriendsByOther(
    options: ListFriendsOptions,
  ): Promise<ListFriendsResults> {
    const friendRelations = await this.Friends.find(
      { userId: options.userId },
      { friendId: 1, friendsSince: 1 },
    ).exec();

    const friendsSince = friendRelations.reduce<Record<string, Date>>(
      (map, friend) => {
        map[friend.friendId] = friend.friendsSince;
        return map;
      },
      {},
    );

    let sort: { [key: string]: -1 | 1 };

    switch (options.sortBy) {
      case FriendsSortBy.MemberSince:
        sort = {
          memberSince: options.sortOrder === SortOrder.Ascending ? 1 : -1,
        };
        break;

      case FriendsSortBy.Username:
      default:
        sort = {
          username: options.sortOrder === SortOrder.Descending ? -1 : 1,
        };
        break;
    }

    const friends = await this.Users.find(
      {
        _id: {
          $in: Object.keys(friendsSince),
        },
      },
      FriendProjection,
    )
      .sort(sort)
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 100)
      .exec();

    return {
      friends: friends.map((friend) =>
        FriendsService.toFriendDTO(friend, friendsSince[friend._id]),
      ),
      totalCount: friendRelations.length,
    };
  }

  listFriends(options: ListFriendsOptions): Promise<ListFriendsResults> {
    options = {
      ...FriendsService.DefaultListFriendsOptions,
      ...options,
    };

    if (options.sortBy === FriendsSortBy.FriendsSince) {
      return this.listFriendsByFriendsSince(options);
    }

    this.log.debug(`Querying for friends where userId = ${options.userId}...`);
    return this.listFriendsByOther(options);
  }

  async getFriend(
    userId: string,
    friendId: string,
  ): Promise<Friend | undefined> {
    const friend = await this.Friends.findOne({ userId, friendId })
      .populate({
        path: 'friendId',
        select: FriendProjection,
        model: UserModel,
      })
      .exec();

    if (friend && typeof friend.friendId === 'object') {
      return FriendsService.toFriendDTO(
        friend.friendId as unknown as UserDocument,
        friend.friendsSince,
      );
    }

    return undefined;
  }

  async unFriend(userId: string, friendId: string): Promise<boolean> {
    const { deletedCount } = await this.Friends.deleteMany({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    });
    return deletedCount > 0;
  }

  async listFriendRequests(
    options: ListFriendRequestOptions,
  ): Promise<ListFriendRequestsResults> {
    let query: FilterQuery<FriendRequestData>;

    switch (options.direction) {
      case FriendRequestDirection.Incoming:
        query = { to: options.userId };
        break;

      case FriendRequestDirection.Outgoing:
        query = { from: options.userId };
        break;

      case FriendRequestDirection.Both:
      default:
        query = {
          $or: [{ from: options.userId }, { to: options.userId }],
        };
        break;
    }

    const [requestsData, totalCount] = await Promise.all([
      this.FriendRequests.find(query)
        .sort({ expires: -1 })
        .populate({
          path: 'from',
          select: FriendProjection,
          model: UserModel,
        })
        .populate({
          path: 'to',
          select: FriendProjection,
          model: UserModel,
        })
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 100)
        .exec(),
      this.FriendRequests.estimatedDocumentCount(query),
    ]);

    return {
      friendRequests: requestsData.map((fr) =>
        FriendsService.toFriendRequestDTO(
          options.userId,
          fr.from as unknown as UserDocument,
          fr.to as unknown as UserDocument,
          fr,
        ),
      ),
      totalCount,
    };
  }

  async getFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<FriendRequest | undefined> {
    const [friendRequest, user, friend] = await Promise.all([
      this.FriendRequests.findOne({
        $or: [
          { from: userId, to: friendId },
          { from: friendId, to: userId },
        ],
      }),
      this.Users.findById(userId),
      this.Users.findById(friendId),
    ]);

    if (friendRequest && user && friend) {
      return {
        friendId: friend._id,
        friend: FriendsService.toFriendDTO(friend, friendRequest.created),
        direction:
          userId === friendRequest.from
            ? FriendRequestDirection.Outgoing
            : FriendRequestDirection.Incoming,
        created: friendRequest.created,
        expires: friendRequest.expires,
        accepted: friendRequest.accepted ?? undefined,
        reason: friendRequest.reason ?? undefined,
      };
    }

    return undefined;
  }

  async createFriendRequest(from: string, to: string): Promise<FriendRequest> {
    if (from === to) {
      throw new BadRequestException('You cannot friend yourself.');
    }

    const [user, friend, requestExists, friendshipExists] = await Promise.all([
      this.Users.findById(from),
      this.Users.findById(to),
      FriendRequestModel.exists({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
      FriendModel.exists({
        $or: [
          { userId: from, friendId: to },
          { userId: to, friendId: from },
        ],
      }),
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

    const friendRequest = new FriendRequestModel({
      _id: uuid(),
      created: new Date(),
      expires: dayjs().add(14, 'days').toDate(),
      from,
      to,
    });
    await friendRequest.save();

    return FriendsService.toFriendRequestDTO(from, user, friend, friendRequest);
  }

  async acceptFriendRequest(from: string, to: string): Promise<boolean> {
    const friendRequest = await FriendRequestModel.findOne({ from, to });

    if (!friendRequest) return false;

    if (friendRequest.accepted === true) {
      throw new BadRequestException(
        'Friend request has already been accepted.',
      );
    }

    friendRequest.accepted = true;
    friendRequest.expires = dayjs().add(14, 'days').toDate();

    await Promise.all([
      friendRequest.save(),
      FriendModel.insertMany([
        new FriendModel({
          _id: uuid(),
          userId: from,
          friendId: to,
          friendsSince: new Date(),
        }),
        new FriendModel({
          _id: uuid(),
          userId: to,
          friendId: from,
          friendsSince: new Date(),
        }),
      ]),
    ]);

    return true;
  }

  async rejectFriendRequest(
    from: string,
    to: string,
    reason?: string,
  ): Promise<boolean> {
    const friendRequest = await this.FriendRequests.findOne({ from, to });

    if (!friendRequest) return false;

    if (friendRequest.accepted === true) {
      throw new BadRequestException(
        'Friend request has already been accepted.',
      );
    }

    friendRequest.accepted = false;
    friendRequest.expires = dayjs().add(14, 'days').toDate();
    friendRequest.reason = reason;
    await friendRequest.save();

    return true;
  }

  async cancelFriendRequest(from: string, to: string): Promise<boolean> {
    const { deletedCount } = await FriendRequestModel.deleteOne({ from, to });
    return deletedCount > 0;
  }
}
