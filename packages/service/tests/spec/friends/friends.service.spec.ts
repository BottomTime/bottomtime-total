import {
  FriendDocument,
  FriendModel,
  FriendRequestDocument,
  FriendRequestModel,
  UserData,
  UserDocument,
  UserModel,
} from '../../../src/schemas';

import TestFriendData from '../../fixtures/users.json';
import TestFriendRelationData from '../../fixtures/friends.json';
import TestFriendRequestData from '../../fixtures/friend-requests.json';
import { createTestUser } from '../../utils';
import { FriendsService } from '../../../src/friends';
import {
  FriendRequestDirection,
  FriendsSortBy,
  ProfileVisibility,
  SortOrder,
} from '@bottomtime/api';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;

const TestUserData: UserData = {
  _id: 'ea60a001-a27b-4fb8-a1f2-998ab77d9726',
  email: 'Marlee60@gmail.com',
  emailLowered: 'marlee60@gmail.com',
  emailVerified: true,
  isLockedOut: false,
  lastLogin: new Date('2023-11-22T11:19:03.860Z'),
  lastPasswordChange: new Date('2022-07-16T22:05:07.094Z'),
  memberSince: new Date('2019-02-13T23:22:31.727Z'),
  passwordHash: '$2b$04$ob6zcztbDs5jBN.G.fNBTuqPoP8GVqLK94/cKkz8qiSNugnYAT8R6',
  role: 'user',
  username: 'Marlee55',
  usernameLowered: 'marlee55',
  profile: {
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/338.jpg',
    bio: 'Minus aspernatur sit autem nam numquam ullam sed reiciendis quidem. Enim quia at. Ab rerum architecto mollitia modi odio suscipit quidem in eaque. Dolorem corrupti facere quos iste delectus iure beatae reiciendis. Neque odit consequuntur. Asperiores aperiam amet dolorum natus animi sint dicta. Consectetur sit enim quibusdam quae.',
    birthdate: '2012-07-10',
    experienceLevel: 'Professional',
    location: 'Stratford',
    name: 'Darrel Wuckert',
    startedDiving: '2023',
  },
  settings: {
    profileVisibility: 'friends',
  },
};

describe('Friends Service', () => {
  let service: FriendsService;

  beforeAll(() => {
    service = new FriendsService(UserModel, FriendModel, FriendRequestModel);
  });

  describe('when listing friends', () => {
    let userData: UserDocument;
    let friends: UserDocument[];
    let friendRelations: FriendDocument[];

    beforeEach(async () => {
      userData = new UserModel(TestUserData);

      friends = TestFriendData.map((u) => new UserModel(u));
      friendRelations = TestFriendRelationData.map(
        (r) =>
          new FriendModel({
            ...r,
            _id: r.friendId,
            userId: userData._id,
          }),
      );

      await Promise.all([
        UserModel.insertMany(friends),
        FriendModel.insertMany(friendRelations),
        userData.save(),
      ]);
    });

    it('will list friends with default options', async () => {
      const results = await service.listFriends({ userId: userData._id });
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination of friends', async () => {
      const results = await service.listFriends({
        userId: userData._id,
        skip: 25,
        limit: 5,
      });
      expect(results).toMatchSnapshot();
    });

    [
      { sortBy: FriendsSortBy.FriendsSince, sortOrder: SortOrder.Ascending },
      { sortBy: FriendsSortBy.FriendsSince, sortOrder: SortOrder.Descending },
      { sortBy: FriendsSortBy.MemberSince, sortOrder: SortOrder.Ascending },
      { sortBy: FriendsSortBy.MemberSince, sortOrder: SortOrder.Descending },
      { sortBy: FriendsSortBy.Username, sortOrder: SortOrder.Ascending },
      { sortBy: FriendsSortBy.Username, sortOrder: SortOrder.Descending },
    ].forEach(({ sortBy, sortOrder }) => {
      it(`will allow sorting by ${sortBy} in ${sortOrder} order`, async () => {
        const results = await service.listFriends({
          userId: userData._id,
          sortBy,
          sortOrder,
          limit: 10,
        });

        expect(results).toMatchSnapshot();
      });
    });

    it('will list friends, respecting the privacy of private accounts', async () => {
      const friendsSince = new Date('2023-12-11T17:21:44.781Z');
      const user = createTestUser();
      const friends = [
        createTestUser({
          _id: 'ee942718-f5b4-4e74-8ac5-66b6ed254f90',
          username: 'Emerald_Johnson43',
          memberSince: new Date('2022-09-20T22:53:03.480Z'),
          profile: {
            name: 'Private Pete',
            location: 'Privateville',
            avatar: 'https://example.com/private-pete.jpg',
          },
          settings: { profileVisibility: ProfileVisibility.Private },
        }),
        createTestUser({
          _id: 'e53ac770-374f-4a62-9202-a8d230cc43f8',
          username: 'Dahlia.Kerluke59',
          memberSince: new Date('2022-03-21T22:58:19.726Z'),
          profile: {
            avatar:
              'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1232.jpg',
            name: 'Nick Heller',
            location: 'El Monte',
          },
          settings: { profileVisibility: ProfileVisibility.FriendsOnly },
        }),
        createTestUser({
          _id: 'edbc5d2c-da35-4724-a563-af88d69d5668',
          username: 'Elisabeth_Raynor30',
          memberSince: new Date('2021-07-02T08:27:54.544Z'),
          profile: {
            avatar:
              'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1087.jpg',
            name: 'Elena Bahringer',
            location: 'Diamond Bar',
          },
          settings: { profileVisibility: ProfileVisibility.Public },
        }),
      ];
      const friendRelations = friends.map(
        (friend) =>
          new FriendModel({
            _id: friend._id,
            userId: user._id,
            friendId: friend._id,
            friendsSince,
          }),
      );

      await Promise.all([
        UserModel.insertMany(friends),
        FriendModel.insertMany(friendRelations),
        user.save(),
      ]);

      const results = await service.listFriends({ userId: user._id });

      expect(results).toMatchSnapshot();
    });
  });

  describe('when retrieving a single friend', () => {
    it('will return the friend if the friend exists', async () => {
      const user = new UserModel(TestUserData);
      const friend = new UserModel(TestFriendData[0]);
      const friendRelation = new FriendModel({
        _id: friend._id,
        userId: user._id,
        friendId: friend._id,
        friendsSince: new Date('2023-12-11T17:21:44.781Z'),
      });

      await Promise.all([
        UserModel.insertMany([user, friend]),
        friendRelation.save(),
      ]);

      const result = await service.getFriend(user._id, friend._id);

      expect(result).toMatchSnapshot();
    });

    it("will respect the friend's privacy settings", async () => {
      const user = new UserModel(TestUserData);
      const friend = new UserModel({
        ...TestFriendData[0],
        settings: { profileVisibility: ProfileVisibility.Private },
      });
      const friendRelation = new FriendModel({
        _id: friend._id,
        userId: user._id,
        friendId: friend._id,
        friendsSince: new Date('2023-12-11T17:21:44.781Z'),
      });

      await Promise.all([
        UserModel.insertMany([user, friend]),
        friendRelation.save(),
      ]);

      const result = await service.getFriend(user._id, friend._id);

      expect(result).toMatchSnapshot();
    });

    it('will return undefined if the users are not friends', async () => {
      const user = new UserModel(TestUserData);
      const friend = new UserModel(TestFriendData[0]);

      await UserModel.insertMany([user, friend]);

      await expect(
        service.getFriend(user._id, friend._id),
      ).resolves.toBeUndefined();
    });
  });

  describe('when removing a friend', () => {
    it('will remove the friend relationship and return true', async () => {
      const user = new UserModel(TestUserData);
      const friend = new UserModel(TestFriendData[0]);
      const friendRelations = [
        new FriendModel({
          _id: uuid(),
          userId: user._id,
          friendId: friend._id,
          friendsSince: new Date('2023-12-11T17:21:44.781Z'),
        }),
        new FriendModel({
          _id: uuid(),
          userId: friend._id,
          friendId: user._id,
          friendsSince: new Date('2023-12-11T17:21:44.781Z'),
        }),
      ];
      await Promise.all([
        UserModel.insertMany([user, friend]),
        FriendModel.insertMany(friendRelations),
      ]);

      await expect(service.unFriend(user._id, friend._id)).resolves.toBe(true);

      await expect(
        FriendModel.findOne({
          $or: [
            {
              userId: user._id,
              friendId: friend._id,
            },
            {
              userId: friend._id,
              friendId: user._id,
            },
          ],
        }),
      ).resolves.toBeNull();
    });

    it('will return false if the friend relationship did not exist', async () => {
      const user = new UserModel(TestUserData);
      const friend = new UserModel(TestFriendData[0]);
      await UserModel.insertMany([user, friend]);
      await expect(service.unFriend(user._id, friend._id)).resolves.toBe(false);
    });
  });

  describe('when listing friend requests', () => {
    let userData: UserDocument;
    let friends: UserDocument[];
    let friendRequests: FriendRequestDocument[];

    beforeEach(async () => {
      userData = new UserModel(TestUserData);
      friends = TestFriendData.map((u) => new UserModel(u));
      friendRequests = TestFriendRequestData.map((r, index) => {
        // Half incoming, half outgoing
        if (index % 2 === 0) {
          return new FriendRequestModel({
            ...r,
            from: userData._id,
          });
        } else {
          return new FriendRequestModel({
            ...r,
            from: r.to,
            to: userData._id,
          });
        }
      });

      await Promise.all([
        UserModel.insertMany(friends),
        FriendRequestModel.insertMany(friendRequests),
        userData.save(),
      ]);
    });

    it('will list friend requests with default options', async () => {
      const results = await service.listFriendRequests({
        userId: userData._id,
      });
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination of friend requests', async () => {
      const results = await service.listFriendRequests({
        userId: userData._id,
        skip: 10,
        limit: 5,
      });
      expect(results).toMatchSnapshot();
    });

    Object.values(FriendRequestDirection).forEach((direction) => {
      it(`will allow filtering by ${direction} friend requests`, async () => {
        const results = await service.listFriendRequests({
          userId: userData._id,
          direction,
          limit: 5,
        });
        expect(results).toMatchSnapshot();
      });
    });
  });

  describe('when creating a friend request', () => {
    it('will create a new friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Promise.all([originUser.save(), destinationUser.save()]);

      const friendRequest = await service.createFriendRequest(
        originUser._id,
        destinationUser._id,
      );

      expect(friendRequest.direction).toBe(FriendRequestDirection.Outgoing);
      expect(friendRequest.friendId).toBe(destinationUser._id);
      expect(friendRequest.friend.id).toBe(destinationUser._id);
      expect(friendRequest.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(friendRequest.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );

      const stored = await FriendRequestModel.findOne({
        from: originUser._id,
        to: destinationUser._id,
      });
      expect(stored).not.toBeNull();
      expect(stored!.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(stored!.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
    });

    it('will not create a friend request if the origin and destination user are the same', async () => {
      const user = createTestUser();
      await user.save();
      await expect(
        service.createFriendRequest(user._id, user._id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will not create a friend request if the origin user does not exist', async () => {
      const originUser = uuid();
      const destinationUser = createTestUser();
      await destinationUser.save();

      await expect(
        service.createFriendRequest(originUser, destinationUser._id),
      ).rejects.toThrowError(NotFoundException);
    });

    it('will not create a friend request if the destination user does not exist', async () => {
      const destinationUser = uuid();
      const originUser = createTestUser();
      await originUser.save();

      await expect(
        service.createFriendRequest(originUser._id, destinationUser),
      ).rejects.toThrowError(NotFoundException);
    });

    it('will not create a friend request if an existing request already exists matching the origin and destination', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + TwoWeeksInMilliseconds),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.createFriendRequest(originUser._id, destinationUser._id),
      ).rejects.toThrowError(ConflictException);
    });

    it('will not create a friend request if an existing request already exists from the destination user to the origin user', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: destinationUser._id,
        to: originUser._id,
        created: new Date(),
        expires: new Date(Date.now() + TwoWeeksInMilliseconds),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.createFriendRequest(originUser._id, destinationUser._id),
      ).rejects.toThrowError(ConflictException);
    });

    it('will not create a friend request if the origin and destination user are already friends', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRelations = [
        new FriendModel({
          _id: uuid(),
          userId: originUser._id,
          friendId: destinationUser._id,
          friendsSince: new Date(),
        }),
        new FriendModel({
          _id: uuid(),
          userId: destinationUser._id,
          friendId: originUser._id,
          friendsSince: new Date(),
        }),
      ];

      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        FriendModel.insertMany(friendRelations),
      ]);

      await expect(
        service.createFriendRequest(originUser._id, destinationUser._id),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('when requesting a friend request', () => {
    it('will return the requested outgoing friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      const result = await service.getFriendRequest(
        originUser._id,
        destinationUser._id,
      );

      expect(result).toBeDefined();
      expect(result?.friendId).toBe(destinationUser._id);
      expect(result?.direction).toBe(FriendRequestDirection.Outgoing);
      expect(result?.created).toEqual(friendRequest.created);
      expect(result?.expires).toEqual(friendRequest.expires);
      expect(result?.friend.username).toBe(destinationUser.username);
    });

    it('will return the requested incoming friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: destinationUser._id,
        to: originUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      const result = await service.getFriendRequest(
        originUser._id,
        destinationUser._id,
      );

      expect(result).toBeDefined();
      expect(result?.friendId).toBe(destinationUser._id);
      expect(result?.direction).toBe(FriendRequestDirection.Incoming);
      expect(result?.created).toEqual(friendRequest.created);
      expect(result?.expires).toEqual(friendRequest.expires);
      expect(result?.friend.username).toBe(destinationUser.username);
    });

    it('will return undefined if the friend request cannot be found', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Promise.all([originUser.save(), destinationUser.save()]);

      await expect(
        service.getFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if origin user does not exist', async () => {
      const destinationUser = createTestUser();
      await destinationUser.save();

      await expect(
        service.getFriendRequest(uuid(), destinationUser._id),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if destination user does not exist', async () => {
      const originUser = createTestUser();
      await originUser.save();

      await expect(
        service.getFriendRequest(originUser._id, uuid()),
      ).resolves.toBeUndefined();
    });
  });

  describe('when accepting, cancelling, or rejecting friend requests', () => {
    it('will accept a friend request and make both users friends', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.acceptFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBe(true);

      const [relations, request] = await Promise.all([
        FriendModel.find({
          $or: [
            { userId: originUser._id, friendId: destinationUser._id },
            { userId: destinationUser._id, friendId: originUser._id },
          ],
        }),
        FriendRequestModel.findOne({
          to: destinationUser._id,
          from: originUser._id,
        }),
      ]);

      // Request should be marked as accepted and the expiration extended.
      // The friend relationship should be created in both directions.
      expect(request).not.toBeNull();
      expect(request?.accepted).toBe(true);
      expect(request?.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
      expect(relations).toHaveLength(2);
    });

    it('will not accept a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Promise.all([originUser.save(), destinationUser.save()]);

      await expect(
        service.acceptFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBe(false);
    });

    it('will not accept a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
        accepted: true,
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.acceptFriendRequest(originUser._id, destinationUser._id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will cancel a friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + TwoWeeksInMilliseconds),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.cancelFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBe(true);

      const request = await FriendRequestModel.findOne({
        from: originUser._id,
        to: destinationUser._id,
      });

      expect(request).toBeNull();
    });

    it('will not cancel a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Promise.all([originUser.save(), destinationUser.save()]);

      await expect(
        service.cancelFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBe(false);
    });

    it('will reject a friend request with no reason given and extend the expiration', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 100000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.rejectFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBe(true);

      const request = await FriendRequestModel.findOne({
        from: originUser._id,
        to: destinationUser._id,
      });

      expect(request).not.toBeNull();
      expect(request?.accepted).toBe(false);
      expect(request!.reason).toBeUndefined();
      expect(request!.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
    });

    it('will reject a friend request with an optional reason and extend the expiration', async () => {
      const reason = 'You are a jerk.';
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 100000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.rejectFriendRequest(
          originUser._id,
          destinationUser._id,
          reason,
        ),
      ).resolves.toBe(true);

      const request = await FriendRequestModel.findOne({
        from: originUser._id,
        to: destinationUser._id,
      });

      expect(request).not.toBeNull();
      expect(request?.accepted).toBe(false);
      expect(request!.reason).toBe(reason);
      expect(request!.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
    });

    it('will not reject a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Promise.all([originUser.save(), destinationUser.save()]);

      await expect(
        service.rejectFriendRequest(originUser._id, destinationUser._id),
      ).resolves.toBe(false);
    });

    it('will not reject a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: originUser._id,
        to: destinationUser._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
        accepted: true,
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.rejectFriendRequest(originUser._id, destinationUser._id),
      ).rejects.toThrowError(BadRequestException);
    });
  });
});
