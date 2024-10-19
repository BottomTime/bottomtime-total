import {
  DepthUnit,
  FriendRequestDirection,
  ListFriendRequestsParams,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  FriendRequestEntity,
  FriendshipEntity,
  UserEntity,
} from '../../../src/data';
import { FriendRequestsController, FriendsService } from '../../../src/friends';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestFriendRequestData from '../../fixtures/friend-requests.json';
import TestUserData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
};

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  logBookSharing: LogBookSharing.FriendsOnly,
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
};

function friendRequestUrl(username: string, friend?: string): string {
  return friend
    ? `/api/users/${username}/friendRequests/${friend}`
    : `/api/users/${username}/friendRequests`;
}

function acknowledgeRequestUrl(username: string, friend: string): string {
  return `${friendRequestUrl(username, friend)}/acknowledge`;
}

describe('Friend Requests End-to-End Tests', () => {
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let FriendRequests: Repository<FriendRequestEntity>;
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];

  let adminUser: UserEntity;
  let regularUser: UserEntity;
  let friends: UserEntity[];
  let friendRequests: FriendRequestEntity[];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    FriendRequests = dataSource.getRepository(FriendRequestEntity);

    adminUser = createTestUser(AdminUserData);
    regularUser = createTestUser(RegularUserData);

    friends = TestUserData.map((data) => parseUserJSON(data));

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          UserEntity,
          FriendshipEntity,
          FriendRequestEntity,
        ]),
        UsersModule,
      ],
      providers: [FriendsService],
      controllers: [FriendRequestsController],
    });
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    await Users.save([adminUser, regularUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  async function insertFriendRequests(
    user: UserEntity,
    count?: number,
  ): Promise<void> {
    friendRequests = TestFriendRequestData.slice(0, count).map(
      (data, index) => {
        const request = new FriendRequestEntity();
        request.id = data.id;
        request.created = new Date(data.created);
        request.expires = new Date(data.expires);

        if (index % 2 === 0) {
          request.from = user;
          request.to = friends[index];
        } else {
          request.from = friends[index];
          request.to = user;
        }

        return request;
      },
    );

    await Users.save(friends);
    await FriendRequests.save(friendRequests);
  }

  describe('when listing friend requests', () => {
    it('will return a 400 error if the query parameters do not pass validation', async () => {
      const { body } = await request(server)
        .get(friendRequestUrl(regularUser.username))
        .set(...regularAuthHeader)
        .query({ direction: 'invalid', limit: -1, sortBy: 'wat?' })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 error if the user is not logged in', async () => {
      await request(server)
        .get(friendRequestUrl(regularUser.username))
        .expect(401);
    });

    it('will return a 403 error if the user is not an admin and is not the user indicated in the request path', async () => {
      await request(server)
        .get(friendRequestUrl(adminUser.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the user indicated in the request path does not exist', async () => {
      await request(server)
        .get(friendRequestUrl('nope.not.here'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it("will return a list of the user's friend requests", async () => {
      const options: ListFriendRequestsParams = {
        direction: FriendRequestDirection.Both,
        skip: 12,
        limit: 6,
        showExpired: true,
      };
      await insertFriendRequests(regularUser);
      const { body } = await request(server)
        .get(friendRequestUrl(regularUser.username))
        .set(...regularAuthHeader)
        .query(options)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow admins to view friend requests for any user', async () => {
      const options: ListFriendRequestsParams = {
        direction: FriendRequestDirection.Both,
        skip: 12,
        limit: 6,
        showExpired: true,
      };
      await insertFriendRequests(regularUser);
      const { body } = await request(server)
        .get(friendRequestUrl(regularUser.username))
        .set(...adminAuthHeader)
        .query(options)
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  describe('when retrieving a single friend request', () => {
    beforeEach(async () => {
      await insertFriendRequests(regularUser, 8);
    });

    it('will return a 401 error if the user is not logged in', async () => {
      await request(server)
        .get(friendRequestUrl(regularUser.username, TestUserData[0].username))
        .expect(401);
    });

    it('will return a 403 error if the user is not an admin and is not the user indicated in the request path', async () => {
      await request(server)
        .get(friendRequestUrl(adminUser.username, TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the user indicated in the request path does not exist', async () => {
      await request(server)
        .get(friendRequestUrl('nope.not.here', TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend indicated in the request path does not exist', async () => {
      await request(server)
        .get(friendRequestUrl(regularUser.username, 'nope.not.here'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend request does not exist', async () => {
      await request(server)
        .get(friendRequestUrl(regularUser.username, TestUserData[35].username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return the requested friend request', async () => {
      const { body } = await request(server)
        .get(friendRequestUrl(regularUser.username, TestUserData[1].username))
        .set(...regularAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow admins to view friend requests for any user', async () => {
      const { body } = await request(server)
        .get(friendRequestUrl(regularUser.username, TestUserData[2].username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  describe('when creating friend requests', () => {
    let friend: UserEntity;

    beforeEach(async () => {
      friend = parseUserJSON(TestUserData[0]);
      await Users.save(friend);
    });

    it('will return a 400 error if the user attempts to send a friend request to themselves', async () => {
      await request(server)
        .put(friendRequestUrl(regularUser.username, regularUser.username))
        .set(...regularAuthHeader)
        .expect(400);
    });

    it('will return a 401 error if the user is not logged in', async () => {
      await request(server)
        .put(friendRequestUrl(regularUser.username, friend.username))
        .expect(401);
    });

    it('will return a 403 error if the user is not an admin and is not the user indicated in the request path', async () => {
      await request(server)
        .put(friendRequestUrl(adminUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the user indicated in the request path does not exist', async () => {
      await request(server)
        .put(friendRequestUrl('nope.not.here', friend.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend indicated in the request path does not exist', async () => {
      await request(server)
        .put(friendRequestUrl(regularUser.username, 'nope.not.here'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 409 error if the friend request already exists', async () => {
      const friendRequest = new FriendRequestEntity();
      friendRequest.id = uuid();
      friendRequest.from = regularUser;
      friendRequest.to = friend;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);
      await FriendRequests.save(friendRequest);

      await request(server)
        .put(friendRequestUrl(regularUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(409);
    });

    it('will return a 409 error if the users are already friends', async () => {
      const friendsSince = new Date('2020-01-01');
      const friendRelations = [new FriendshipEntity(), new FriendshipEntity()];

      friendRelations[0].id = uuid();
      friendRelations[0].user = regularUser;
      friendRelations[0].friend = friend;
      friendRelations[0].friendsSince = friendsSince;

      friendRelations[1].id = uuid();
      friendRelations[1].user = friend;
      friendRelations[1].friend = regularUser;
      friendRelations[1].friendsSince = friendsSince;

      await Friends.save(friendRelations);

      await request(server)
        .put(friendRequestUrl(regularUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(409);
    });

    it('will return the created friend request when the operation succeeds', async () => {
      const { body } = await request(server)
        .put(friendRequestUrl(regularUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(201);

      const friendRequest = await FriendRequests.findOneByOrFail({
        from: regularUser,
        to: friend,
      });
      expect(friendRequest).not.toBeNull();

      expect(new Date(body.created).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.direction).toBe(FriendRequestDirection.Outgoing);
      expect(new Date(body.expires).valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -3,
      );
      expect(body.friendId).toEqual(friend.id);
    });
  });

  describe('when cancelling a friend request', () => {
    let friend: UserEntity;

    beforeEach(async () => {
      friend = parseUserJSON(TestUserData[0]);
      const friendRequest = new FriendRequestEntity();

      friendRequest.id = uuid();
      friendRequest.from = regularUser;
      friendRequest.to = friend;
      friendRequest.created = new Date();
      friendRequest.expires = new Date(Date.now() + 10000);

      await Users.save(friend);
      await FriendRequests.save(friendRequest);
    });

    it('will return a 401 error if user is not logged in', async () => {
      await request(server)
        .delete(friendRequestUrl(regularUser.username, friend.username))
        .expect(401);
    });

    it('will return a 403 error if user is not an admin and did not create the friend request', async () => {
      await request(server)
        .delete(friendRequestUrl(adminUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the target user does not exist', async () => {
      await request(server)
        .delete(friendRequestUrl('not.a.user', friend.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target friend does not exist', async () => {
      await request(server)
        .delete(friendRequestUrl(regularUser.username, 'not.a.user'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend request does not exist', async () => {
      await request(server)
        .delete(friendRequestUrl(regularUser.username, adminUser.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will delete the requested friend request', async () => {
      await request(server)
        .delete(friendRequestUrl(regularUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(204);

      const deletedFriendRequest = await FriendRequests.existsBy({
        to: friend,
        from: regularUser,
      });
      expect(deletedFriendRequest).toBe(false);
    });

    it('will allow an admin to delete the requested friend request', async () => {
      await request(server)
        .delete(friendRequestUrl(regularUser.username, friend.username))
        .set(...adminAuthHeader)
        .expect(204);

      const deletedFriendRequest = await FriendRequests.existsBy({
        to: friend,
        from: regularUser,
      });
      expect(deletedFriendRequest).toBe(false);
    });
  });

  [true, false].forEach((accepted) => {
    describe(`when ${
      accepted ? 'accepting' : 'declining'
    } a friend request`, () => {
      let friend: UserEntity;

      beforeEach(async () => {
        friend = parseUserJSON(TestUserData[0]);
        const friendRequest = new FriendRequestEntity();

        friendRequest.id = uuid();
        friendRequest.from = friend;
        friendRequest.to = regularUser;
        friendRequest.created = new Date();
        friendRequest.expires = new Date(Date.now() + 10000);

        await Users.save(friend);
        await FriendRequests.save(friendRequest);
      });

      it('will return a 400 error if the request body is invalid', async () => {
        await request(server)
          .post(acknowledgeRequestUrl(regularUser.username, friend.username))
          .set(...regularAuthHeader)
          .send({ invalid: 'yup' })
          .expect(400);
      });

      it('will return a 401 error if the user is not logged in', async () => {
        await request(server)
          .post(acknowledgeRequestUrl(regularUser.username, friend.username))
          .send({ accepted })
          .expect(401);
      });

      it('will return a 403 error if the user is not an admin and did not create the friend request', async () => {
        await request(server)
          .post(acknowledgeRequestUrl(adminUser.username, friend.username))
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(403);
      });

      it('will return a 404 error if the target user does not exist', async () => {
        await request(server)
          .post(acknowledgeRequestUrl('not.a.user', friend.username))
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(404);
      });

      it('will return a 404 error if the target friend does not exist', async () => {
        await request(server)
          .post(acknowledgeRequestUrl(regularUser.username, 'not.a.user'))
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(404);
      });

      it('will return a 404 error if the friend request does not exist', async () => {
        await request(server)
          .post(acknowledgeRequestUrl(regularUser.username, adminUser.username))
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(404);
      });

      if (accepted) {
        it('will create a new friend relationship when the friend request is accepted', async () => {
          await request(server)
            .post(acknowledgeRequestUrl(regularUser.username, friend.username))
            .set(...regularAuthHeader)
            .send({ accepted: true })
            .expect(204);

          const [friendRelations, friendRequest] = await Promise.all([
            Friends.findBy([
              { user: regularUser, friend },
              { user: friend, friend: regularUser },
            ]),
            FriendRequests.findOneByOrFail({
              to: regularUser,
              from: friend,
            }),
          ]);

          expect(friendRelations).toHaveLength(2);
          expect(friendRequest.accepted).toBe(true);
        });
      } else {
        it('will not create a new friend relationship when the friend request is declined', async () => {
          const reason = 'You are a jerk.';
          await request(server)
            .post(acknowledgeRequestUrl(regularUser.username, friend.username))
            .set(...regularAuthHeader)
            .send({ accepted: false, reason })
            .expect(204);

          const [friendRelations, friendRequest] = await Promise.all([
            Friends.findBy([
              {
                user: regularUser,
                friend,
              },
              {
                user: friend,
                friend: regularUser,
              },
            ]),
            FriendRequests.findOneByOrFail({
              to: regularUser,
              from: friend,
            }),
          ]);

          expect(friendRelations).toHaveLength(0);
          expect(friendRequest.accepted).toBe(false);
          expect(friendRequest.reason).toBe(reason);
        });
      }
    });
  });
});
