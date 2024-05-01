import {
  DepthUnit,
  FriendsSortBy,
  LogBookSharing,
  PressureUnit,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { FriendshipEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import FriendRelationData from '../../fixtures/friends.json';
import FriendData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';

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

function friendUrl(username: string, friend?: string): string {
  return friend
    ? `/api/users/${username}/friends/${friend}`
    : `/api/users/${username}/friends`;
}

describe('Friends End-to-End Tests', () => {
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;

  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];
  let regularUser: UserEntity;
  let adminUser: UserEntity;
  let friendUsers: UserEntity[];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);

    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);

    regularUser = createTestUser(RegularUserData);
    adminUser = createTestUser(AdminUserData);
    friendUsers = FriendData.map((friend) => parseUserJSON(friend));
  });

  beforeEach(async () => {
    await Users.save([adminUser, regularUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing friends', () => {
    it('will return 400 if the query parameters do not pass validation', async () => {
      const { body } = await request(server)
        .get(friendUrl(regularUser.username))
        .set(...regularAuthHeader)
        .query({
          skip: -2,
          limit: 0,
          sortOrder: 'up',
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return 401 error if current user is not logged in', async () => {
      await request(server).get(friendUrl(regularUser.username)).expect(401);
    });

    it('will return 403 error if a non-admin user attempts to view friends of another user', async () => {
      await request(server)
        .get(friendUrl(adminUser.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return 404 error if target user is not found', async () => {
      await request(server)
        .get(friendUrl('not.a.user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    [
      {
        name: 'will allow regular users to query their friends',
        authHeader: () => regularAuthHeader,
      },
      {
        name: "will allow administrators to query other user's friends",
        authHeader: () => adminAuthHeader,
      },
    ].forEach(({ name, authHeader }) => {
      it(name, async () => {
        const friendRelationData = FriendRelationData.map((data, index) => {
          const relation = new FriendshipEntity();
          relation.id = data.id;
          relation.friendsSince = new Date(data.friendsSince);
          relation.user = regularUser;
          relation.friend = friendUsers[index];
          return relation;
        });
        await Users.save(friendUsers);
        await Friends.save(friendRelationData);

        const { body } = await request(server)
          .get(friendUrl(regularUser.username))
          .set(...authHeader())
          .query({
            sortBy: FriendsSortBy.Username,
            sortOrder: SortOrder.Ascending,
            skip: 10,
            limit: 10,
          })
          .expect(200);

        expect(body).toMatchSnapshot();
      });
    });
  });

  describe('when retrieving a friend', () => {
    let friend: UserEntity;

    beforeEach(async () => {
      friend = friendUsers[0];
      const relation = new FriendshipEntity();
      relation.id = FriendRelationData[0].id;
      relation.friendsSince = new Date(FriendRelationData[0].friendsSince);
      relation.user = regularUser;
      relation.friend = friend;

      await Users.save(friend);
      await Friends.save(relation);
    });

    it('will return a 401 error if user is not logged in', async () => {
      await request(server)
        .get(friendUrl(regularUser.username, friend.username))
        .expect(401);
    });

    it("will return a 403 error if the current user is not authorized to view the target user's friends", async () => {
      await request(server)
        .get(friendUrl(adminUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the target user does not exist', async () => {
      await request(server)
        .get(friendUrl('not.a.user', friend.username))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target friend does not exist', async () => {
      await request(server)
        .get(friendUrl(regularUser.username, 'not.a.user'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target user and target friend are not actually friends', async () => {
      await request(server)
        .get(friendUrl(regularUser.username, adminUser.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return the requested friend relation', async () => {
      const { body } = await request(server)
        .get(friendUrl(regularUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow admins to view any friend relation', async () => {
      const { body } = await request(server)
        .get(friendUrl(regularUser.username, friend.username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  describe('when unfriending someone', () => {
    let friend: UserEntity;

    beforeEach(async () => {
      friend = friendUsers[0];
      const relations = [new FriendshipEntity(), new FriendshipEntity()];

      relations[0].id = FriendRelationData[0].id;
      relations[0].friendsSince = new Date(FriendRelationData[0].friendsSince);
      relations[0].user = regularUser;
      relations[0].friend = friend;

      relations[1].id = FriendRelationData[1].id;
      relations[1].friendsSince = new Date(FriendRelationData[1].friendsSince);
      relations[1].user = friend;
      relations[1].friend = regularUser;

      await Users.save(friend);
      await Friends.save(relations);
    });

    it('will return a 401 error if user is not logged in', async () => {
      await request(server)
        .delete(friendUrl(regularUser.username, friend.username))
        .expect(401);
    });

    it('will return a 403 error if the current user is not authorized to unfriend the target user', async () => {
      await request(server)
        .delete(friendUrl(adminUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the target user does not exist', async () => {
      await request(server)
        .delete(friendUrl('not.a.user', friend.username))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target friend does not exist', async () => {
      await request(server)
        .delete(friendUrl(regularUser.username, 'not.a.user'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target user and target friend are not actually friends', async () => {
      await request(server)
        .delete(friendUrl(regularUser.username, adminUser.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 204 response if the friend relation is successfully deleted', async () => {
      await request(server)
        .delete(friendUrl(regularUser.username, friend.username))
        .set(...regularAuthHeader)
        .expect(204);

      const exists = await Friends.existsBy([
        { user: regularUser, friend },
        { user: friend, friend: regularUser },
      ]);

      expect(exists).toBe(false);
    });

    it('will allow admins to unfriend any user from any other user', async () => {
      await request(server)
        .delete(friendUrl(regularUser.username, friend.username))
        .set(...adminAuthHeader)
        .expect(204);

      const exists = await Friends.existsBy([
        { user: regularUser, friend },
        { user: friend, friend: regularUser },
      ]);

      expect(exists).toBe(false);
    });
  });
});
