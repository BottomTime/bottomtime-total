import { Collection, Filter, FindOptions, MongoClient } from 'mongodb';
import Logger from 'bunyan';

import { Collections, FriendSubDocument, UserDocument } from '../data';
import {
  Friend,
  FriendsManager,
  ListFriendsOptions,
  Profile,
  FriendsSortBy,
} from './interfaces';
import { DefaultFriend } from './default-friend';
import config from '../config';
import { InvalidOperationError } from '../errors';
import { DefaultProfile } from './default-profile';
import { ProfileVisibility, SortOrder } from '../constants';
import { assertValid } from '../helpers/validation';
import { ListFriendsOptionsSchema } from './validation';

export class DefaultFriendManager implements FriendsManager {
  private readonly users: Collection<UserDocument>;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly userId: string,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
  }

  async addFriend(friend: Profile): Promise<Friend> {
    let friendship: FriendSubDocument | null | undefined;

    const userDocument = await this.users.findOne(
      { _id: this.userId },
      {
        projection: {
          _id: 0,
          friends: 1,
        },
      },
    );

    if ((userDocument?.friends?.length ?? 0) >= config.friendsLimit) {
      throw new InvalidOperationError(
        'Unable to add new friend. The current friends limit has been reached',
        {
          friendsLimit: config.friendsLimit,
        },
      );
    }

    friendship = userDocument?.friends?.find(
      (realtionship) => realtionship.friendId === friend.userId,
    );

    if (friendship) {
      return new DefaultFriend(friendship, friend);
    }

    friendship = {
      friendId: friend.userId,
      friendsSince: new Date(),
    };
    await this.users.updateOne(
      { _id: this.userId },
      {
        $push: { friends: friendship },
      },
    );
    return new DefaultFriend(friendship, friend);
  }

  async isFriendsWith(friendId: string): Promise<boolean> {
    this.log.debug(
      `Attempting to determine if "${this.userId}" is friends with "${friendId}"...`,
    );
    const result = await this.users.findOne(
      {
        _id: this.userId,
        'friends.friendId': friendId,
      },
      {
        projection: {
          _id: 1,
        },
      },
    );
    return !!result;
  }

  private constructQuery(
    friendIds: string[],
    options?: ListFriendsOptions,
  ): [Filter<UserDocument>, FindOptions<UserDocument>] {
    const queryFilter: Filter<UserDocument> = {
      _id: { $in: friendIds },
    };
    const queryOptions: FindOptions<UserDocument> = {
      projection: {
        _id: 1,
        memberSince: 1,
        username: 1,
        profile: 1,
      },
    };

    if (options?.sortBy === FriendsSortBy.MemberSince) {
      queryOptions.sort = {
        memberSince: options?.sortOrder === SortOrder.Ascending ? 1 : -1,
      };
    } else if (options?.sortBy === FriendsSortBy.Username) {
      queryOptions.sort = {
        username: options?.sortOrder === SortOrder.Descending ? -1 : 1,
      };
    }

    return [queryFilter, queryOptions];
  }

  private async listFriendsOrderedByFriendsSince(
    userData: UserDocument,
    options: ListFriendsOptions,
  ): Promise<Friend[]> {
    const from = options.skip ?? 0;
    const to = from + (options.limit ?? 100);
    const sortMultiplier = options.sortOrder === SortOrder.Ascending ? 1 : -1;

    userData.friends! = userData
      .friends!.sort(
        (a, b) =>
          sortMultiplier *
          (a.friendsSince.valueOf() - b.friendsSince.valueOf()),
      )
      .slice(from, to);

    const [queryFilter, queryOptions] = this.constructQuery(
      userData.friends.map((friend) => friend.friendId),
      options,
    );

    const profiles: Record<string, Profile> = {};
    const profilesCursor = this.users.find(queryFilter, queryOptions);
    await profilesCursor.forEach((profileData) => {
      // Redact private profile data...
      if (
        profileData.profile?.profileVisibility === ProfileVisibility.Private
      ) {
        profileData.profile = { profileVisibility: ProfileVisibility.Private };
      }

      profiles[profileData._id] = new DefaultProfile(
        this.mongoClient,
        this.log,
        profileData,
      );
    });

    return userData.friends.map(
      (friend) => new DefaultFriend(friend, profiles[friend.friendId]),
    );
  }

  async listFriends(options?: ListFriendsOptions): Promise<Friend[]> {
    const { parsed } = assertValid(options, ListFriendsOptionsSchema);
    const userData = await this.users.findOne(
      { _id: this.userId },
      {
        projection: {
          _id: 0,
          friends: 1,
        },
      },
    );
    if (!userData || !userData.friends) return [];

    // Sorting by "FriendsSince" works a little differently since we already have all of the data for paging and sorting
    // in memory...
    if (parsed?.sortBy === FriendsSortBy.FriendsSince) {
      return this.listFriendsOrderedByFriendsSince(userData, parsed);
    }

    // TODO: This can get to be very memory intensive... can I improve it?
    const relations: Record<string, FriendSubDocument> = {};
    userData.friends.forEach((relation) => {
      relations[relation.friendId] = relation;
    });

    const [queryFilter, queryOptions] = this.constructQuery(
      Object.keys(relations),
      parsed,
    );

    const profilesCursor = this.users
      .find(queryFilter, queryOptions)
      .skip(parsed?.skip ?? 0)
      .limit(parsed?.limit ?? 100)
      .map((user) => {
        // Redact private profile info.
        if (user.profile?.profileVisibility === ProfileVisibility.Private) {
          user.profile = { profileVisibility: ProfileVisibility.Private };
        }

        return new DefaultFriend(
          relations[user._id],
          new DefaultProfile(this.mongoClient, this.log, user),
        );
      });

    return await profilesCursor.toArray();
  }

  async removeFriend(friendId: string): Promise<void> {
    await this.users.updateOne(
      { _id: this.userId },
      {
        $pull: {
          friends: { friendId },
        },
      },
    );
  }
}
