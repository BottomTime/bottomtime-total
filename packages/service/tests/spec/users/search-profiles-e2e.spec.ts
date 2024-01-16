import { HttpServer, INestApplication } from '@nestjs/common';
import {
  FriendDocument,
  FriendModel,
  UserData,
  UserDocument,
  UserModel,
} from '../../../src/schemas';
import TestUserData from '../../fixtures/user-search-data.json';
import { createAuthHeader, createTestApp } from '../../utils';
import request from 'supertest';
import {
  ProfileDTO,
  ProfileVisibility,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';
import { v4 as uuid } from 'uuid';

const SearchUrl = '/api/users';

const AdminUserId = 'F3669787-82E5-458F-A8AD-98D3F57DDA6E';
const AdminUserData: UserData = {
  _id: AdminUserId,
  email: 'admin@site.org',
  emailLowered: 'admin@site.org',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  settings: {
    profileVisibility: ProfileVisibility.Private,
  },
};

describe('Searching Profiles E2E Tests', () => {
  let app: INestApplication;
  let server: HttpServer;
  let friends: FriendDocument[];
  let users: UserDocument[];
  let authHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    const now = new Date();
    friends = [];
    users = TestUserData.map((data) => new UserModel(data));
    users.push(new UserModel(AdminUserData));
    users.forEach((user, index) => {
      switch (index % 3) {
        case 0:
          user.settings = { profileVisibility: ProfileVisibility.Public };
          break;

        case 1:
          user.settings = { profileVisibility: ProfileVisibility.FriendsOnly };
          if (index % 6 === 1) {
            friends.push(
              new FriendModel({
                _id: uuid(),
                userId: users[0]._id,
                friendId: users[index]._id,
                friendsSince: now,
              }),
              new FriendModel({
                _id: uuid(),
                userId: users[index]._id,
                friendId: users[0]._id,
                friendsSince: now,
              }),
            );
          }
          break;

        case 2:
          user.settings = { profileVisibility: ProfileVisibility.Private };
          break;
      }
    });
    [authHeader, adminAuthHeader] = await Promise.all([
      await createAuthHeader(users[0]._id),
      await createAuthHeader(AdminUserId),
    ]);
    app = await createTestApp();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await UserModel.insertMany(users);
    await FriendModel.insertMany(friends);
  });

  afterAll(async () => {
    await app.close();
  });

  it('will list profiles when no query string parameters are provided', async () => {
    const { body } = await request(server)
      .get(SearchUrl)
      .set(...authHeader)
      .query({ limit: 10 })
      .expect(200);

    expect(body.totalCount).toBe(101);
    expect(body.users).toHaveLength(10);
    expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();

    const ids = body.users.map((u: ProfileDTO) => u.userId);
    const findUsers = await UserModel.find({ _id: { $in: ids } });
    findUsers.forEach((user) => {
      expect([
        ProfileVisibility.Public,
        ProfileVisibility.FriendsOnly,
      ]).toContain(user.settings?.profileVisibility);
    });
  });

  it('will allow anonymous users to list public profiles', async () => {
    const { body } = await request(server)
      .get(SearchUrl)
      .query({ limit: 25 })
      .expect(200);

    expect(body.totalCount).toBe(67);
    expect(body.users).toHaveLength(25);
    expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();

    const ids = body.users.map((u: ProfileDTO) => u.userId);
    const findUsers = await UserModel.find({ _id: { $in: ids } });
    findUsers.forEach((user) => {
      expect(user.settings?.profileVisibility).toBe(ProfileVisibility.Public);
    });
  });

  it('will allow admins to list all profiles, including private', async () => {
    const { body } = await request(server)
      .get(SearchUrl)
      .set(...adminAuthHeader)
      .query({ limit: 30 })
      .expect(200);

    expect(body.totalCount).toBe(201);
    expect(body.users).toHaveLength(30);
    expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
  });

  it('will perform a text search for user profiles', async () => {
    const options = {
      query: 'Sally Port',
    };
    const { body: result } = await request(server)
      .get(SearchUrl)
      .set(...authHeader)
      .query(options)
      .expect(200);

    expect(result.totalCount).toBe(4);
    expect(result.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
  });

  [
    {
      sortBy: UsersSortBy.MemberSince,
      sortOrder: SortOrder.Ascending,
    },
    {
      sortBy: UsersSortBy.MemberSince,
      sortOrder: SortOrder.Descending,
    },
    {
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Descending,
    },
    {
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Descending,
    },
  ].forEach(({ sortBy, sortOrder }) => {
    it(`will sort results by ${sortBy} in ${sortOrder} order`, async () => {
      const { body } = await request(server)
        .get(SearchUrl)
        .set(...authHeader)
        .query({ sortBy, sortOrder })
        .expect(200);

      expect(body.totalCount).toBe(101);
      expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
    });
  });

  it('will return an empty result set if the query does not match any profiles', async () => {
    const options = {
      query: 'asdfasdfasdf',
    };
    const { body: result } = await request(server)
      .get(SearchUrl)
      .query(options)
      .expect(200);

    expect(result.totalCount).toBe(0);
    expect(result.users).toHaveLength(0);
  });

  it('will return a 400 response if the query string is invalid', async () => {
    const { body: error } = await request(server)
      .get(SearchUrl)
      .query({ sortBy: 'asdf', sortOrder: 17, query: true, limit: -1 })
      .expect(400);
    expect(error.details).toMatchSnapshot();
  });
});
