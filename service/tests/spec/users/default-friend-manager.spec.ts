import { Collection } from 'mongodb';
import {
  Collections,
  FriendSubDocument,
  UserDocument,
} from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import {
  DefaultFriend,
  DefaultFriendManager,
  DefaultProfile,
  DefaultUser,
  FriendsManager,
  User,
  FriendsSortBy,
} from '../../../src/users';
import { fakeProfile, fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { faker } from '@faker-js/faker';
import config from '../../../src/config';
import { InvalidOperationError, ValidationError } from '../../../src/errors';
import { ProfileVisibility, SortOrder } from '../../../src/constants';

const Log = createTestLogger('default-friend-manager');

describe('Default Friend Manager', () => {
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
  });

  describe('isFriendsWith()', () => {
    it('Will return true if the user ID is in the friends array', async () => {
      const friendData = fakeUser();
      const userData = fakeUser({
        friends: [{ friendId: friendData._id, friendsSince: new Date() }],
      });
      await Users.insertMany([userData, friendData]);
      const friendManager = new DefaultFriendManager(
        mongoClient,
        Log,
        userData._id,
      );
      await expect(friendManager.isFriendsWith(friendData._id)).resolves.toBe(
        true,
      );
    });

    it('Will return false if the user ID is not in the friends array', async () => {
      const friendData = fakeUser();
      const otherUser = fakeUser({
        friends: [{ friendId: friendData._id, friendsSince: new Date() }],
      });
      const userData = fakeUser();
      await Users.insertMany([userData, friendData, otherUser]);
      const friendManager = new DefaultFriendManager(
        mongoClient,
        Log,
        userData._id,
      );
      await expect(friendManager.isFriendsWith(friendData._id)).resolves.toBe(
        false,
      );
    });
  });

  describe('Removing Friends', () => {
    it('Will remove an existing friend relationship', async () => {
      const friendData = fakeUser();
      const userData = fakeUser({
        friends: [{ friendId: friendData._id, friendsSince: new Date() }],
      });
      const friendManager = new DefaultFriendManager(
        mongoClient,
        Log,
        userData._id,
      );
      await Users.insertMany([userData, friendData]);

      await friendManager.removeFriend(friendData._id);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.friends).toHaveLength(0);
    });

    it.todo('Will do nothing if friend relationship does not exist');
  });

  describe('Adding Friends', () => {
    it('Will add a new friend', async () => {
      const userData = fakeUser();
      const friendData = fakeUser();
      const friendProfile = new DefaultProfile(mongoClient, Log, friendData);
      const friendManager = new DefaultFriendManager(
        mongoClient,
        Log,
        userData._id,
      );
      await Users.insertMany([userData, friendData]);

      const friend = await friendManager.addFriend(friendProfile);
      expect(friend.friend).toEqual(friendProfile);
      expect(friend.friendsSince.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.friends).toHaveLength(1);
      expect(result!.friends![0]).toEqual({
        friendId: friend.friend.userId,
        friendsSince: friend.friendsSince,
      });
    });

    it('Will do nothing if friend relationship already exists', async () => {
      const userData = fakeUser();
      const friendData = fakeUser();
      userData.friends = [
        {
          friendId: faker.datatype.uuid(),
          friendsSince: new Date(),
        },
        {
          friendId: friendData._id,
          friendsSince: new Date(),
        },
        {
          friendId: faker.datatype.uuid(),
          friendsSince: new Date(),
        },
      ];
      const friendProfile = new DefaultProfile(mongoClient, Log, friendData);
      const friendManager = new DefaultFriendManager(
        mongoClient,
        Log,
        userData._id,
      );
      await Users.insertMany([userData, friendData]);

      const friend = await friendManager.addFriend(friendProfile);
      expect(friend.friend).toEqual(friendProfile);
      expect(friend.friendsSince.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.friends).toEqual(userData.friends);
    });

    it('Will throw InvalidOperation error if friend limit is exceeded', async () => {
      const userData = fakeUser();
      const friendData = fakeUser();
      userData.friends = new Array<FriendSubDocument>(config.friendsLimit);
      for (let i = 0; i < userData.friends.length; i++) {
        userData.friends[i] = {
          friendId: faker.datatype.uuid(),
          friendsSince: faker.date.past(4),
        };
      }
      const friendProfile = new DefaultProfile(mongoClient, Log, friendData);
      const friendManager = new DefaultFriendManager(
        mongoClient,
        Log,
        userData._id,
      );
      await Users.insertMany([userData, friendData]);

      await expect(friendManager.addFriend(friendProfile)).rejects.toThrowError(
        InvalidOperationError,
      );

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.friends).toEqual(userData.friends);
    });
  });

  describe('Listing Friends', () => {
    let user: User;
    let friends: DefaultFriend[];
    let friendManager: FriendsManager;

    beforeEach(async () => {
      const userData = fakeUser({
        username: faker.internet.userName(),
        friends: [],
      });
      friends = [];
      const friendData = new Array<UserDocument>(100);
      for (let i = 0; i < friendData.length; i++) {
        friendData[i] = fakeUser({
          username: faker.internet.userName().replace('_', '.'),
          profile: fakeProfile({
            profileVisibility: faker.helpers.arrayElement([
              ProfileVisibility.Public,
              ProfileVisibility.FriendsOnly,
            ]),
          }),
        });
        const friendship = {
          friendId: friendData[i]._id,
          friendsSince: friendData[i].memberSince,
        };
        userData.friends!.push(friendship);

        const profileData: any = {
          _id: friendData[i]._id,
          memberSince: friendData[i].memberSince,
          username: friendData[i].username,
          profile: friendData[i].profile,
        };
        friends.push(
          new DefaultFriend(
            friendship,
            new DefaultProfile(mongoClient, Log, profileData),
          ),
        );
      }

      await Users.insertMany([userData, ...friendData]);
      user = new DefaultUser(mongoClient, Log, userData);
      friendManager = new DefaultFriendManager(mongoClient, Log, user.id);
    });

    it('Will return results based on default search query', async () => {
      const expected = friends
        .sort(
          (a, b) =>
            b.friend.memberSince.valueOf() - a.friend.memberSince.valueOf(),
        )
        .slice(0, 100);
      const actual = await friendManager.listFriends({
        sortBy: FriendsSortBy.MemberSince,
      });
      expect(actual).toEqual(expected);
    });

    it('Will redact private profiles', async () => {
      const newFriends = new Array<UserDocument>(4);
      const newFriendships = new Array<FriendSubDocument>(newFriends.length);
      let expected = new Array<DefaultFriend>(newFriends.length);

      for (let i = 0; i < newFriends.length; i++) {
        newFriends[i] = fakeUser({
          profile: fakeProfile({
            profileVisibility: ProfileVisibility.Private,
          }),
        });
        newFriendships[i] = {
          friendId: newFriends[i]._id,
          friendsSince: faker.date.past(3),
        };
        const profileData: any = {
          _id: newFriends[i]._id,
          username: newFriends[i].username,
          memberSince: newFriends[i].memberSince,
          profile: { profileVisibility: ProfileVisibility.Private },
        };
        expected[i] = new DefaultFriend(
          newFriendships[i],
          new DefaultProfile(mongoClient, Log, profileData),
        );
      }
      expected = expected.sort((a, b) =>
        a.friend.username.localeCompare(b.friend.username),
      );

      await Users.insertMany(newFriends);
      await Users.updateOne(
        { _id: user.id },
        {
          $set: { friends: newFriendships },
        },
      );

      const actual = await friendManager.listFriends({
        sortBy: FriendsSortBy.Username,
      });

      expect(actual).toEqual(expected);
    });

    it('Will return an empty array if the user has no friends', async () => {
      await Users.updateOne(
        { _id: user.id },
        {
          $unset: { friends: 1 },
        },
      );
      const results = await friendManager.listFriends();
      expect(results).toHaveLength(0);
    });

    it('Will return the correct number of records', async () => {
      const expected = friends
        .sort(
          (a, b) =>
            b.friend.memberSince.valueOf() - a.friend.memberSince.valueOf(),
        )
        .slice(0, 20);
      const actual = await friendManager.listFriends({
        sortBy: FriendsSortBy.MemberSince,
        limit: 20,
      });
      expect(actual).toEqual(expected);
    });

    it('Will skip records if required', async () => {
      const expected = friends
        .sort(
          (a, b) =>
            b.friend.memberSince.valueOf() - a.friend.memberSince.valueOf(),
        )
        .slice(75, 100);
      const actual = await friendManager.listFriends({
        sortBy: FriendsSortBy.MemberSince,
        skip: 75,
        limit: 25,
      });
      expect(actual).toEqual(expected);
    });

    [
      FriendsSortBy.Username,
      FriendsSortBy.MemberSince,
      FriendsSortBy.FriendsSince,
    ].forEach((sortBy) => {
      it(`Will return a partial page if there is not enough data when sorting by ${sortBy}`, async () => {
        const results = await friendManager.listFriends({
          sortBy,
          skip: friends.length - 2,
          limit: 50,
        });
        expect(results).toHaveLength(2);
      });

      it(`Will return an empty array when page boundary is out of bounds and while sorting by ${sortBy}`, async () => {
        const results = await friendManager.listFriends({
          sortBy,
          skip: friends.length + 2,
          limit: 50,
        });
        expect(results).toHaveLength(0);
      });
    });

    [
      { sortBy: FriendsSortBy.Username, sortOrder: SortOrder.Ascending },
      { sortBy: FriendsSortBy.Username, sortOrder: SortOrder.Descending },
      { sortBy: FriendsSortBy.MemberSince, sortOrder: SortOrder.Ascending },
      { sortBy: FriendsSortBy.MemberSince, sortOrder: SortOrder.Descending },
      { sortBy: FriendsSortBy.FriendsSince, sortOrder: SortOrder.Ascending },
      { sortBy: FriendsSortBy.FriendsSince, sortOrder: SortOrder.Descending },
    ].forEach((testCase) => {
      it(`Will sort friends by ${testCase.sortBy} in ${testCase.sortOrder} order`, async () => {
        const expected = friends
          .sort((a, b) => {
            const multiplier =
              testCase.sortOrder === SortOrder.Ascending ? 1 : -1;
            switch (testCase.sortBy) {
              case FriendsSortBy.Username:
                return (
                  multiplier *
                  a.friend.username.localeCompare(b.friend.username)
                );

              case FriendsSortBy.MemberSince:
                return (
                  multiplier *
                  (a.friend.memberSince.valueOf() -
                    b.friend.memberSince.valueOf())
                );

              case FriendsSortBy.FriendsSince:
                return (
                  multiplier *
                  (a.friendsSince.valueOf() - b.friendsSince.valueOf())
                );

              default:
                return 0;
            }
          })
          .slice(0, 30);

        const actual = await friendManager.listFriends({
          sortBy: testCase.sortBy,
          sortOrder: testCase.sortOrder,
          limit: 30,
        });
        expect(actual).toEqual(expected);
      });
    });

    [
      {
        name: 'Invalid sortBy',
        options: {
          sortBy: 'rank',
        },
      },
      {
        name: 'Invalid sortOrder',
        options: {
          sortOrder: 'backwards',
        },
      },
      {
        name: 'Negative skip',
        options: {
          skip: -1,
        },
      },
      {
        name: 'Negative limit',
        options: {
          limit: -1,
        },
      },
      {
        name: 'Zero limit',
        options: {
          limit: 0,
        },
      },
      {
        name: 'Limit too high',
        options: {
          limit: 1001,
        },
      },
    ].forEach((testCase) => {
      it(`Will throw a ValidationError if the query options are invalid: ${testCase.name}`, async () => {
        await expect(
          friendManager.listFriends(testCase.options),
        ).rejects.toThrowError(ValidationError);
      });
    });
  });
});
