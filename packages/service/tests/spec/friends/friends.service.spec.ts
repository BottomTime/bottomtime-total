import {
  DepthUnit,
  FriendRequestDirection,
  FriendsSortBy,
  PressureUnit,
  ProfileVisibility,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import {
  FriendRequestEntity,
  FriendshipEntity,
  UserEntity,
} from '../../../src/data';
import { FriendsService } from '../../../src/friends';
import { dataSource } from '../../data-source';
import TestFriendRequestData from '../../fixtures/friend-requests.json';
import TestFriendData from '../../fixtures/friend-search-data.json';
import TestFriendshipData from '../../fixtures/friends.json';
import { InsertableUser, createTestUser } from '../../utils';

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;

const TestUserData: Partial<UserEntity> = {
  id: 'ea60a001-a27b-4fb8-a1f2-998ab77d9726',
  email: 'Marlee60@gmail.com',
  emailLowered: 'marlee60@gmail.com',
  emailVerified: true,
  isLockedOut: false,
  lastLogin: new Date('2023-11-22T11:19:03.860Z'),
  lastPasswordChange: new Date('2022-07-16T22:05:07.094Z'),
  memberSince: new Date('2019-02-13T23:22:31.727Z'),
  passwordHash: '$2b$04$ob6zcztbDs5jBN.G.fNBTuqPoP8GVqLK94/cKkz8qiSNugnYAT8R6',
  role: UserRole.User,
  username: 'Marlee55',
  usernameLowered: 'marlee55',
  avatar:
    'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/338.jpg',
  bio: 'Minus aspernatur sit autem nam numquam ullam sed reiciendis quidem. Enim quia at. Ab rerum architecto mollitia modi odio suscipit quidem in eaque. Dolorem corrupti facere quos iste delectus iure beatae reiciendis. Neque odit consequuntur. Asperiores aperiam amet dolorum natus animi sint dicta. Consectetur sit enim quibusdam quae.',
  birthdate: '2012-07-10',
  experienceLevel: 'Professional',
  location: 'Stratford',
  name: 'Darrel Wuckert',
  startedDiving: '2023',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
  profileVisibility: ProfileVisibility.FriendsOnly,
};

describe('Friends Service', () => {
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let FriendRequests: Repository<FriendRequestEntity>;

  let service: FriendsService;
  let userData: UserEntity;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    FriendRequests = dataSource.getRepository(FriendRequestEntity);
    service = new FriendsService(Users, Friends, FriendRequests);
    userData = new UserEntity();
    Object.assign(userData, TestUserData);
  });

  describe('when listing friends', () => {
    let userData: UserEntity;
    let friends: InsertableUser[];
    let friendRelations: FriendshipEntity[];

    beforeAll(() => {
      userData = new UserEntity();
      Object.assign(userData, TestUserData);

      friends = TestFriendData.map((data) => {
        const user = new UserEntity();
        Object.assign(user, data);
        return user;
      });
      friendRelations = TestFriendshipData.map((r) => {
        const relation = new FriendshipEntity();
        Object.assign(relation, r);
        return relation;
      });
    });

    beforeEach(async () => {
      await Users.createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values(friends)
        .execute();
      await Friends.createQueryBuilder()
        .insert()
        .into(FriendshipEntity)
        .values(
          TestFriendshipData.map((r) => ({ ...r, user: { id: userData.id } })),
        )
        .execute();
    });

    it('will list friends with default options', async () => {
      const results = await service.listFriends({ userId: userData.id });
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination of friends', async () => {
      const results = await service.listFriends({
        userId: userData.id,
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
          userId: userData.id,
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
          id: 'ee942718-f5b4-4e74-8ac5-66b6ed254f90',
          username: 'Emerald_Johnson43',
          memberSince: new Date('2022-09-20T22:53:03.480Z'),
          name: 'Private Pete',
          location: 'Privateville',
          avatar: 'https://example.com/private-pete.jpg',
          depthUnit: DepthUnit.Meters,
          temperatureUnit: TemperatureUnit.Celsius,
          weightUnit: WeightUnit.Kilograms,
          pressureUnit: PressureUnit.Bar,
          profileVisibility: ProfileVisibility.Private,
        }),
        createTestUser({
          id: 'e53ac770-374f-4a62-9202-a8d230cc43f8',
          username: 'Dahlia.Kerluke59',
          memberSince: new Date('2022-03-21T22:58:19.726Z'),
          avatar:
            'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1232.jpg',
          name: 'Nick Heller',
          location: 'El Monte',
          depthUnit: DepthUnit.Meters,
          temperatureUnit: TemperatureUnit.Celsius,
          weightUnit: WeightUnit.Kilograms,
          pressureUnit: PressureUnit.Bar,
          profileVisibility: ProfileVisibility.FriendsOnly,
        }),
        createTestUser({
          id: 'edbc5d2c-da35-4724-a563-af88d69d5668',
          username: 'Elisabeth_Raynor30',
          memberSince: new Date('2021-07-02T08:27:54.544Z'),
          avatar:
            'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1087.jpg',
          name: 'Elena Bahringer',
          location: 'Diamond Bar',
          depthUnit: DepthUnit.Meters,
          temperatureUnit: TemperatureUnit.Celsius,
          weightUnit: WeightUnit.Kilograms,
          pressureUnit: PressureUnit.Bar,
          profileVisibility: ProfileVisibility.Public,
        }),
      ];
      const friendRelations = friends.map((data) => {
        const friendship = new FriendshipEntity();
        Object.assign(friendship, data);
        return friendship;
      });

      await Users.save(friends);
      await Friends.save(friendRelations);

      const results = await service.listFriends({ userId: user.id });

      expect(results).toMatchSnapshot();
    });
  });

  describe('when retrieving a single friend', () => {
    it('will return the friend if the friend exists', async () => {
      const friend = new UserEntity();
      Object.assign(friend, TestFriendData[0]);

      const friendRelation = new FriendshipEntity();
      friendRelation.id = friend.id;
      friendRelation.user = userData;
      friendRelation.friend = friend;
      friendRelation.friendsSince = new Date('2023-12-11T17:21:44.781Z');

      await Friends.save(friendRelation);

      const result = await service.getFriend(userData.id, friend.id);

      expect(result).toMatchSnapshot();
    });

    it("will respect the friend's privacy settings", async () => {
      const friend = new UserEntity();
      Object.assign(friend, TestFriendData[0]);
      friend.profileVisibility = ProfileVisibility.Private;
      await Users.save(friend);

      const friendRelation = new FriendshipEntity();
      friendRelation.id = friend.id;
      friendRelation.user = userData;
      friendRelation.friend = friend;
      friendRelation.friendsSince = new Date('2023-12-11T17:21:44.781Z');
      await Friends.save(friendRelation);

      const result = await service.getFriend(userData.id, friend.id);

      expect(result).toMatchSnapshot();
    });

    it('will return undefined if the users are not friends', async () => {
      const friend = new UserEntity();
      Object.assign(friend, TestFriendData[0]);
      await Promise.all([Users.save(friend), Users.save(userData)]);

      await expect(
        service.getFriend(userData.id, friend.id),
      ).resolves.toBeUndefined();
    });
  });

  describe('when removing a friend', () => {
    it('will remove the friend relationship and return true', async () => {
      const friendsSince = new Date('2023-12-11T17:21:44.781Z');
      const friend = new UserEntity();
      Object.assign(friend, TestFriendData[0]);
      await Promise.all([Users.save(userData), Users.save(friend)]);

      const friendRelations = new Array<FriendshipEntity>(2);
      friendRelations[0] = new FriendshipEntity();
      friendRelations[0].id = uuid();
      friendRelations[0].user = userData;
      friendRelations[0].friend = friend;
      friendRelations[0].friendsSince = friendsSince;

      friendRelations[1] = new FriendshipEntity();
      friendRelations[1].id = uuid();
      friendRelations[1].user = friend;
      friendRelations[1].friend = userData;
      friendRelations[1].friendsSince = friendsSince;

      await Friends.save(friendRelations);

      await expect(service.unFriend(userData.id, friend.id)).resolves.toBe(
        true,
      );

      await expect(
        FriendModel.findOne({
          $or: [
            {
              userId: user.id,
              friendId: friend.id,
            },
            {
              userId: friend.id,
              friendId: user.id,
            },
          ],
        }),
      ).resolves.toBeNull();
    });

    it('will return false if the friend relationship did not exist', async () => {
      const user = new UserModel(TestUserData);
      const friend = new UserModel(TestFriendData[0]);
      await UserModel.insertMany([user, friend]);
      await expect(service.unFriend(user.id, friend.id)).resolves.toBe(false);
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
            from: userData.id,
          });
        } else {
          return new FriendRequestModel({
            ...r,
            from: r.to,
            to: userData.id,
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
        userId: userData.id,
      });
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination of friend requests', async () => {
      const results = await service.listFriendRequests({
        userId: userData.id,
        skip: 10,
        limit: 5,
      });
      expect(results).toMatchSnapshot();
    });

    Object.values(FriendRequestDirection).forEach((direction) => {
      it(`will allow filtering by ${direction} friend requests`, async () => {
        const results = await service.listFriendRequests({
          userId: userData.id,
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
        originUser.id,
        destinationUser.id,
      );

      expect(friendRequest.direction).toBe(FriendRequestDirection.Outgoing);
      expect(friendRequest.friendId).toBe(destinationUser.id);
      expect(friendRequest.friend.id).toBe(destinationUser.id);
      expect(friendRequest.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(friendRequest.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );

      const stored = await FriendRequestModel.findOne({
        from: originUser.id,
        to: destinationUser.id,
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
        service.createFriendRequest(user.id, user.id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will not create a friend request if the origin user does not exist', async () => {
      const originUser = uuid();
      const destinationUser = createTestUser();
      await destinationUser.save();

      await expect(
        service.createFriendRequest(originUser, destinationUser.id),
      ).rejects.toThrowError(NotFoundException);
    });

    it('will not create a friend request if the destination user does not exist', async () => {
      const destinationUser = uuid();
      const originUser = createTestUser();
      await originUser.save();

      await expect(
        service.createFriendRequest(originUser.id, destinationUser),
      ).rejects.toThrowError(NotFoundException);
    });

    it('will not create a friend request if an existing request already exists matching the origin and destination', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
        created: new Date(),
        expires: new Date(Date.now() + TwoWeeksInMilliseconds),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.createFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(ConflictException);
    });

    it('will not create a friend request if an existing request already exists from the destination user to the origin user', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: destinationUser.id,
        to: originUser.id,
        created: new Date(),
        expires: new Date(Date.now() + TwoWeeksInMilliseconds),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.createFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(ConflictException);
    });

    it('will not create a friend request if the origin and destination user are already friends', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRelations = [
        new FriendModel({
          id: uuid(),
          userId: originUser.id,
          friendId: destinationUser.id,
          friendsSince: new Date(),
        }),
        new FriendModel({
          id: uuid(),
          userId: destinationUser.id,
          friendId: originUser.id,
          friendsSince: new Date(),
        }),
      ];

      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        FriendModel.insertMany(friendRelations),
      ]);

      await expect(
        service.createFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('when requesting a friend request', () => {
    it('will return the requested outgoing friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      const result = await service.getFriendRequest(
        originUser.id,
        destinationUser.id,
      );

      expect(result).toBeDefined();
      expect(result?.friendId).toBe(destinationUser.id);
      expect(result?.direction).toBe(FriendRequestDirection.Outgoing);
      expect(result?.created).toEqual(friendRequest.created);
      expect(result?.expires).toEqual(friendRequest.expires);
      expect(result?.friend.username).toBe(destinationUser.username);
    });

    it('will return the requested incoming friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: destinationUser.id,
        to: originUser.id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      const result = await service.getFriendRequest(
        originUser.id,
        destinationUser.id,
      );

      expect(result).toBeDefined();
      expect(result?.friendId).toBe(destinationUser.id);
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
        service.getFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if origin user does not exist', async () => {
      const destinationUser = createTestUser();
      await destinationUser.save();

      await expect(
        service.getFriendRequest(uuid(), destinationUser.id),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if destination user does not exist', async () => {
      const originUser = createTestUser();
      await originUser.save();

      await expect(
        service.getFriendRequest(originUser.id, uuid()),
      ).resolves.toBeUndefined();
    });
  });

  describe('when accepting, cancelling, or rejecting friend requests', () => {
    it('will accept a friend request and make both users friends', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const [relations, request] = await Promise.all([
        FriendModel.find({
          $or: [
            { userId: originUser.id, friendId: destinationUser.id },
            { userId: destinationUser.id, friendId: originUser.id },
          ],
        }),
        FriendRequestModel.findOne({
          to: destinationUser.id,
          from: originUser.id,
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
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(false);
    });

    it('will not accept a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
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
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will cancel a friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
        created: new Date(),
        expires: new Date(Date.now() + TwoWeeksInMilliseconds),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.cancelFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const request = await FriendRequestModel.findOne({
        from: originUser.id,
        to: destinationUser.id,
      });

      expect(request).toBeNull();
    });

    it('will not cancel a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Promise.all([originUser.save(), destinationUser.save()]);

      await expect(
        service.cancelFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(false);
    });

    it('will reject a friend request with no reason given and extend the expiration', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
        created: new Date(),
        expires: new Date(Date.now() + 100000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const request = await FriendRequestModel.findOne({
        from: originUser.id,
        to: destinationUser.id,
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
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
        created: new Date(),
        expires: new Date(Date.now() + 100000),
      });
      await Promise.all([
        originUser.save(),
        destinationUser.save(),
        friendRequest.save(),
      ]);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id, reason),
      ).resolves.toBe(true);

      const request = await FriendRequestModel.findOne({
        from: originUser.id,
        to: destinationUser.id,
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
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(false);
    });

    it('will not reject a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestModel({
        id: uuid(),
        from: originUser.id,
        to: destinationUser.id,
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
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });
  });
});
