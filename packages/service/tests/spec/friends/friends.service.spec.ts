import {
  DepthUnit,
  FriendRequestDirection,
  FriendsSortBy,
  LogBookSharing,
  PressureUnit,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import {
  FriendRequestEntity,
  FriendshipEntity,
  UserEntity,
} from '../../../src/data';
import { FriendsService } from '../../../src/friends';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestFriendRequestData from '../../fixtures/friend-requests.json';
import TestFriendshipData from '../../fixtures/friends.json';
import TestFriendData from '../../fixtures/user-search-data.json';
import { InsertableUser, createTestUser } from '../../utils';
import { createTestFriendRequest } from '../../utils/create-test-friend-request';

type InsertableFriendship = Omit<FriendshipEntity, 'user' | 'friend'> & {
  user: InsertableUser;
  friend: InsertableUser;
};

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
  logBookSharing: LogBookSharing.Public,
  passwordHash: '$2b$04$ob6zcztbDs5jBN.G.fNBTuqPoP8GVqLK94/cKkz8qiSNugnYAT8R6',
  role: UserRole.User,
  username: 'Marlee55',
  usernameLowered: 'marlee55',
  avatar:
    'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/338.jpg',
  bio: 'Minus aspernatur sit autem nam numquam ullam sed reiciendis quidem. Enim quia at. Ab rerum architecto mollitia modi odio suscipit quidem in eaque. Dolorem corrupti facere quos iste delectus iure beatae reiciendis. Neque odit consequuntur. Asperiores aperiam amet dolorum natus animi sint dicta. Consectetur sit enim quibusdam quae.',
  experienceLevel: 'Professional',
  location: 'Stratford',
  name: 'Darrel Wuckert',
  startedDiving: '2023',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
};

describe('Friends Service', () => {
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let FriendRequests: Repository<FriendRequestEntity>;

  let service: FriendsService;
  let userData: UserEntity;
  let friendData: UserEntity[];

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    FriendRequests = dataSource.getRepository(FriendRequestEntity);

    service = new FriendsService(dataSource, Users, Friends, FriendRequests);

    userData = new UserEntity();
    Object.assign(userData, TestUserData);

    friendData = TestFriendData.map((data) => {
      const user = new UserEntity();
      Object.assign(user, data);
      return user;
    });
  });

  describe('when listing friends', () => {
    let friendships: FriendshipEntity[];

    beforeAll(() => {
      friendships = TestFriendshipData.map((r, index) => {
        const friendship = new FriendshipEntity();
        Object.assign(friendship, r);
        friendship.user = userData;
        friendship.friend = friendData[index];
        return friendship;
      });
    });

    beforeEach(async () => {
      await Users.save(userData);
      await Users.createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values(friendData as InsertableUser[])
        .execute();
      await Friends.createQueryBuilder()
        .insert()
        .into(FriendshipEntity)
        .values(friendships as InsertableFriendship[])
        .execute();
    });

    it('will list friends with default options', async () => {
      const results = await service.listFriends({ userId: userData.id });
      expect(results.friends).toHaveLength(100);
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination of friends', async () => {
      const results = await service.listFriends({
        userId: userData.id,
        skip: 25,
        limit: 5,
      });
      expect(results.friends).toHaveLength(5);
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

        expect(results.friends).toHaveLength(10);
        expect(results.totalCount).toBe(100);
        expect(
          results.friends.map((f) => ({
            username: f.username,
            friendsSince: f.friendsSince,
            memberSince: f.memberSince,
            name: f.name,
            location: f.location,
            avatar: f.avatar,
          })),
        ).toMatchSnapshot();
      });
    });
  });

  describe('when retrieving a single friend', () => {
    it('will return the friend if the friend exists', async () => {
      const friend = friendData[0];

      const friendRelation = new FriendshipEntity();
      friendRelation.id = friend.id;
      friendRelation.user = userData;
      friendRelation.friend = friend;
      friendRelation.friendsSince = new Date('2023-12-11T17:21:44.781Z');

      await Users.save([userData, friend]);
      await Friends.save(friendRelation);

      const result = await service.getFriend(userData.id, friend.id);

      expect(result).toMatchSnapshot();
    });

    it('will return undefined if the users are not friends', async () => {
      await Users.save([userData, friendData[0]]);
      await expect(
        service.getFriend(userData.id, friendData[0].id),
      ).resolves.toBeUndefined();
    });
  });

  describe('when testing to see if two users are friends', () => {
    it('will return true if the users are friends', async () => {
      const friend = friendData[0];

      const friendRelation = new FriendshipEntity();
      friendRelation.id = friend.id;
      friendRelation.user = userData;
      friendRelation.friend = friend;
      friendRelation.friendsSince = new Date('2023-12-11T17:21:44.781Z');

      await Users.save([userData, friend]);
      await Friends.save(friendRelation);

      await expect(service.areFriends(userData.id, friend.id)).resolves.toBe(
        true,
      );
    });

    it('will return false if the users are not friends', async () => {
      await Users.save([userData, friendData[0]]);
      await expect(
        service.areFriends(userData.id, friendData[0].id),
      ).resolves.toBe(false);
    });
  });

  describe('when removing a friend', () => {
    it('will remove the friend relationship and return true', async () => {
      const friendsSince = new Date('2023-12-11T17:21:44.781Z');
      const friend = friendData[0];
      await Users.save([userData, friend]);

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

      await expect(Friends.count()).resolves.toBe(0);
    });

    it('will return false if the friend relationship did not exist', async () => {
      const friend = friendData[0];
      await Users.save([userData, friend]);
      await expect(service.unFriend(userData.id, friend.id)).resolves.toBe(
        false,
      );
    });
  });

  describe('when listing friend requests', () => {
    let friendRequests: FriendRequestEntity[];

    beforeAll(() => {
      friendRequests = TestFriendRequestData.map((r, index) => {
        const request = new FriendRequestEntity();
        Object.assign(request, r);

        // Half incoming, half outgoing
        if (index % 2 === 0) {
          request.from = userData;
          request.to = friendData[index];
        } else {
          request.from = friendData[index];
          request.to = userData;
        }

        return request;
      });
    });

    beforeEach(async () => {
      await Users.save([userData, ...friendData]);
      await FriendRequests.save(friendRequests);
    });

    it('will list friend requests with default options', async () => {
      const results = await service.listFriendRequests({
        userId: userData.id,
        showExpired: true,
      });
      expect(results.friendRequests).toHaveLength(42);
      expect(results).toMatchSnapshot();
    });

    it('will allow pagination of friend requests', async () => {
      const results = await service.listFriendRequests({
        userId: userData.id,
        showExpired: true,
        skip: 10,
        limit: 5,
      });
      expect(results.friendRequests).toHaveLength(5);
      expect(results).toMatchSnapshot();
    });

    Object.values(FriendRequestDirection).forEach((direction) => {
      it(`will allow filtering by ${direction} friend requests`, async () => {
        const results = await service.listFriendRequests({
          userId: userData.id,
          direction,
          showExpired: true,
          limit: 5,
        });
        expect(results).toMatchSnapshot();
      });
    });

    it('will return acknowledged friend requests when requested', async () => {
      const results = await service.listFriendRequests({
        userId: userData.id,
        showExpired: true,
        showAcknowledged: true,
      });
      expect(results.friendRequests).toHaveLength(50);
      expect(results).toMatchSnapshot();
    });

    it('will filter out expired friend requests when requested', async () => {
      const results = await service.listFriendRequests({
        userId: userData.id,
      });
      expect(results).toEqual({
        friendRequests: [],
        totalCount: 0,
      });
    });
  });

  describe('when creating a friend request', () => {
    it('will create a new friend request', async () => {
      const originUser = new User(Users, createTestUser());
      const destinationUser = new User(Users, createTestUser());

      await Users.save([originUser.toEntity(), destinationUser.toEntity()]);
      const friendRequest = await service.createFriendRequest(
        originUser,
        destinationUser,
      );

      expect(friendRequest.direction).toBe(FriendRequestDirection.Outgoing);
      expect(friendRequest.friendId).toBe(destinationUser.id);
      expect(friendRequest.friend.id).toBe(destinationUser.id);
      expect(friendRequest.created.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(friendRequest.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );

      const stored = await FriendRequests.findOneByOrFail({
        from: originUser.toEntity(),
        to: destinationUser.toEntity(),
      });
      expect(stored.created.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(stored.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
    });

    it('will not create a friend request if the origin and destination user are the same', async () => {
      const userData = createTestUser();
      const user = new User(Users, userData);
      await Users.save(userData);
      await expect(service.createFriendRequest(user, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('will not create a friend request if an existing request already exists matching the origin and destination', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + TwoWeeksInMilliseconds);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.createFriendRequest(
          new User(Users, originUser),
          new User(Users, destinationUser),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('will not create a friend request if an existing request already exists from the destination user to the origin user', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = destinationUser;
      friendRequest.to = originUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + TwoWeeksInMilliseconds);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.createFriendRequest(
          new User(Users, originUser),
          new User(Users, destinationUser),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('will not create a friend request if the origin and destination user are already friends', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRelations = [new FriendshipEntity(), new FriendshipEntity()];

      friendRelations[0].id = uuid();
      friendRelations[0].user = originUser;
      friendRelations[0].friend = destinationUser;
      friendRelations[0].friendsSince = new Date();

      friendRelations[1].id = uuid();
      friendRelations[1].user = destinationUser;
      friendRelations[1].friend = originUser;
      friendRelations[1].friendsSince = new Date();

      await Users.save([originUser, destinationUser]);
      await Friends.save(friendRelations);

      await expect(
        service.createFriendRequest(
          new User(Users, originUser),
          new User(Users, destinationUser),
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('when requesting a friend request', () => {
    it('will return the requested outgoing friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

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
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = destinationUser;
      friendRequest.to = originUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

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
      await Users.save([originUser, destinationUser]);

      await expect(
        service.getFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if origin user does not exist', async () => {
      const destinationUser = createTestUser();
      await Users.save(destinationUser);

      await expect(
        service.getFriendRequest(uuid(), destinationUser.id),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if destination user does not exist', async () => {
      const originUser = createTestUser();
      await Users.save(originUser);

      await expect(
        service.getFriendRequest(originUser.id, uuid()),
      ).resolves.toBeUndefined();
    });
  });

  describe('when accepting, cancelling, or rejecting friend requests', () => {
    it('will accept a friend request and make both users friends', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const [relations, request] = await Promise.all([
        Friends.findBy([
          { user: originUser, friend: destinationUser },
          { user: destinationUser, friend: originUser },
        ]),
        FriendRequests.findOneByOrFail({
          to: destinationUser,
          from: originUser,
        }),
      ]);

      // Request should be marked as accepted and the expiration extended.
      // The friend relationship should be created in both directions.
      expect(request.accepted).toBe(true);
      expect(request.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -3,
      );
      expect(relations).toHaveLength(2);
    });

    it('will not accept a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Users.save([originUser, destinationUser]);

      await expect(
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(false);
    });

    it('will not accept a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);
      friendRequest.accepted = true;

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will not accept an expired friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date(Date.now() - 15000);
      friendRequest.expires = new Date(Date.now() - 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.acceptFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will cancel a friend request', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.cancelFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const request = await FriendRequests.findOneBy({
        from: originUser,
        to: destinationUser,
      });

      expect(request).toBeNull();
    });

    it('will cancel a friend request that has expired', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date(Date.now() - 15000);
      friendRequest.expires = new Date(Date.now() - 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.cancelFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const request = await FriendRequests.findOneBy({
        from: originUser,
        to: destinationUser,
      });

      expect(request).toBeNull();
    });

    it('will not cancel a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Users.save([originUser, destinationUser]);

      await expect(
        service.cancelFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(false);
    });

    it('will delete a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);
      friendRequest.accepted = true;

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.cancelFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const request = await FriendRequests.findOneBy({
        from: originUser,
        to: destinationUser,
      });

      expect(request).toBeNull();
    });

    it('will reject a friend request with no reason given and extend the expiration', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(true);

      const request = await FriendRequests.findOneByOrFail({
        from: originUser,
        to: destinationUser,
      });

      expect(request.accepted).toBe(false);
      expect(request.reason).toBeNull();
      expect(request.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
    });

    it('will reject a friend request with an optional reason and extend the expiration', async () => {
      const reason = 'You are a jerk.';
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id, reason),
      ).resolves.toBe(true);

      const request = await FriendRequests.findOneByOrFail({
        from: originUser,
        to: destinationUser,
      });

      expect(request.accepted).toBe(false);
      expect(request.reason).toBe(reason);
      expect(request.expires.valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
    });

    it('will not reject a friend request that does not exist', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      await Users.save([originUser, destinationUser]);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).resolves.toBe(false);
    });

    it('will not reject a friend request that has already been accepted', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);
      friendRequest.accepted = true;

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will not reject a friend request that has already been rejected', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);
      friendRequest.accepted = false;

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });

    it('will not reject a friend request that has expired', async () => {
      const originUser = createTestUser();
      const destinationUser = createTestUser();
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = originUser;
      friendRequest.to = destinationUser;
      friendRequest.created = new Date(Date.now() - 15000);
      friendRequest.expires = new Date(Date.now() - 10000);

      await Users.save([originUser, destinationUser]);
      await FriendRequests.save(friendRequest);

      await expect(
        service.rejectFriendRequest(originUser.id, destinationUser.id),
      ).rejects.toThrowError(BadRequestException);
    });
  });

  it('will purge friend requests that have expired', async () => {
    await Users.save([userData, ...friendData]);
    const friendRequests = new Array<FriendRequestEntity>(4);
    friendRequests[0] = createTestFriendRequest(userData.id, friendData[0].id, {
      expires: faker.date.recent({ days: 20 }),
    });
    friendRequests[1] = createTestFriendRequest(userData.id, friendData[1].id, {
      expires: faker.date.soon({ days: 10 }),
    });
    friendRequests[2] = createTestFriendRequest(friendData[2].id, userData.id, {
      expires: faker.date.recent({ days: 5 }),
    });
    friendRequests[3] = createTestFriendRequest(friendData[3].id, userData.id, {
      expires: faker.date.soon({ days: 15 }),
    });
    await FriendRequests.save(friendRequests);

    await service.purgeExpiredFriendRequests();

    const remaining = await FriendRequests.find();
    expect(remaining).toHaveLength(2);
    remaining.forEach((r) => {
      expect(r.expires.valueOf()).toBeGreaterThanOrEqual(Date.now());
    });
  });
});
