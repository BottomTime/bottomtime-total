import { INestApplication } from '@nestjs/common';
import { createAuthHeader, createTestApp } from '../../utils';
import request from 'supertest';
import { FriendModel, UserData, UserModel } from '../../../src/schemas';
import {
  DepthUnit,
  FriendsSortBy,
  PressureUnit,
  ProfileVisibility,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';
import { v4 as uuid } from 'uuid';

import FriendData from '../../fixtures/users.json';
import FriendRelationData from '../../fixtures/friends.json';

const AdminUserId = 'F3669787-82E5-458F-A8AD-98D3F57DDA6E';
const AdminUserData: UserData = {
  _id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  settings: {
    depthUnit: DepthUnit.Meters,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.Private,
  },
};

const RegularUserId = '5A4699D8-48C4-4410-9886-B74B8B85CAC1';
const RegularUserData: UserData = {
  _id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  settings: {
    depthUnit: DepthUnit.Meters,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.Private,
  },
};

function friendUrl(username: string, friend?: string): string {
  return friend
    ? `/api/users/${username}/friends/${friend}`
    : `/api/users/${username}/friends`;
}

describe('Friends End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    const adminUser = new UserModel(AdminUserData);
    const regularUser = new UserModel(RegularUserData);
    await UserModel.insertMany([adminUser, regularUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing friends', () => {
    it('will return 400 if the query parameters do not pass validation', async () => {
      const { body } = await request(server)
        .get(friendUrl(RegularUserData.username))
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
      await request(server)
        .get(friendUrl(RegularUserData.username))
        .expect(401);
    });

    it('will return 403 error if a non-admin user attempts to view friends of another user', async () => {
      await request(server)
        .get(friendUrl(AdminUserData.username))
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
        const friendData = FriendData.map((friend) => new UserModel(friend));
        const friendRelationData = FriendRelationData.map(
          (relation) =>
            new FriendModel({
              ...relation,
              _id: relation.friendId,
              userId: RegularUserId,
            }),
        );
        await Promise.all([
          UserModel.insertMany(friendData),
          FriendModel.insertMany(friendRelationData),
        ]);

        const { body } = await request(server)
          .get(friendUrl(RegularUserData.username))
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
    beforeEach(async () => {
      const friendData = new UserModel(FriendData[0]);
      const friendRelationData = new FriendModel({
        _id: FriendRelationData[0].friendId,
        userId: RegularUserId,
        friendId: FriendRelationData[0].friendId,
        friendsSince: new Date('2020-01-01'),
      });
      await Promise.all([friendData.save(), friendRelationData.save()]);
    });

    it('will return a 401 error if user is not logged in', async () => {
      await request(server)
        .get(friendUrl(RegularUserData.username, FriendData[0].username))
        .expect(401);
    });

    it("will return a 403 error if the current user is not authorized to view the target user's friends", async () => {
      await request(server)
        .get(friendUrl(AdminUserData.username, FriendData[0].username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the target user does not exist', async () => {
      await request(server)
        .get(friendUrl('not.a.user', FriendData[0].username))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target friend does not exist', async () => {
      await request(server)
        .get(friendUrl(RegularUserData.username, 'not.a.user'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target user and target friend are not actually friends', async () => {
      await request(server)
        .get(friendUrl(RegularUserData.username, AdminUserData.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return the requested friend relation', async () => {
      const { body } = await request(server)
        .get(friendUrl(RegularUserData.username, FriendData[0].username))
        .set(...regularAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow admins to view any friend relation', async () => {
      const { body } = await request(server)
        .get(friendUrl(RegularUserData.username, FriendData[0].username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  describe('when unfriending someone', () => {
    beforeEach(async () => {
      const friendData = new UserModel(FriendData[0]);
      const friendRelationData = [
        new FriendModel({
          _id: uuid(),
          userId: RegularUserId,
          friendId: FriendRelationData[0].friendId,
          friendsSince: new Date('2020-01-01'),
        }),
        new FriendModel({
          _id: uuid(),
          userId: FriendRelationData[0].friendId,
          friendId: RegularUserId,
          friendsSince: new Date('2020-01-01'),
        }),
      ];
      await Promise.all([
        friendData.save(),
        FriendModel.insertMany(friendRelationData),
      ]);
    });

    it('will return a 401 error if user is not logged in', async () => {
      await request(server)
        .delete(friendUrl(RegularUserData.username, FriendData[0].username))
        .expect(401);
    });

    it('will return a 403 error if the current user is not authorized to unfriend the target user', async () => {
      await request(server)
        .delete(friendUrl(AdminUserData.username, FriendData[0].username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the target user does not exist', async () => {
      await request(server)
        .delete(friendUrl('not.a.user', FriendData[0].username))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target friend does not exist', async () => {
      await request(server)
        .delete(friendUrl(RegularUserData.username, 'not.a.user'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target user and target friend are not actually friends', async () => {
      await request(server)
        .delete(friendUrl(RegularUserData.username, AdminUserData.username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 204 response if the friend relation is successfully deleted', async () => {
      await request(server)
        .delete(friendUrl(RegularUserData.username, FriendData[0].username))
        .set(...regularAuthHeader)
        .expect(204);

      const exists = await FriendModel.exists({
        $or: [
          { userId: RegularUserId, friendId: FriendData[0]._id },
          { userId: FriendData[0]._id, friendId: RegularUserId },
        ],
      });

      expect(exists).toBeNull();
    });

    it('will allow admins to unfriend any user from any other user', async () => {
      await request(server)
        .delete(friendUrl(RegularUserData.username, FriendData[0].username))
        .set(...adminAuthHeader)
        .expect(204);

      const exists = await FriendModel.exists({
        $or: [
          { userId: RegularUserId, friendId: FriendData[0]._id },
          { userId: FriendData[0]._id, friendId: RegularUserId },
        ],
      });

      expect(exists).toBeNull();
    });
  });
});
