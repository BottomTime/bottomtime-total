import { ProfileDTO, SortOrder, UserRole, UsersSortBy } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { FriendshipEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestUserData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';

const SearchUrl = '/api/users';

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  email: 'admin@site.org',
  emailLowered: 'admin@site.org',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
};

describe('Searching Profiles E2E Tests', () => {
  let app: INestApplication;
  let server: HttpServer;
  let friends: FriendshipEntity[];
  let authHeader: [string, string];
  let adminAuthHeader: [string, string];

  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let users: UserEntity[];
  let adminUser: UserEntity;

  beforeAll(async () => {
    const now = new Date();
    friends = [];
    users = TestUserData.map((data) => parseUserJSON(data));
    adminUser = createTestUser(AdminUserData);
    users.push(adminUser);
    [authHeader, adminAuthHeader] = await Promise.all([
      await createAuthHeader(users[0].id),
      await createAuthHeader(AdminUserId),
    ]);
    app = await createTestApp();
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
  });

  beforeEach(async () => {
    await Users.save(users);
    await Friends.save(friends);
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

    expect(body.totalCount).toBe(17);
    expect(body.users).toHaveLength(10);
    expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
  });

  it('will allow anonymous users to list public profiles', async () => {
    const { body } = await request(server)
      .get(SearchUrl)
      .query({ limit: 25 })
      .expect(200);

    expect(body.totalCount).toBe(34);
    expect(body.users).toHaveLength(25);
    expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
  });

  it('will allow admins to list all profiles, including private', async () => {
    const { body } = await request(server)
      .get(SearchUrl)
      .set(...adminAuthHeader)
      .query({ limit: 30 })
      .expect(200);

    expect(body.totalCount).toBe(101);
    expect(body.users).toHaveLength(30);
    expect(body.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
  });

  it('will perform a text search for user profiles', async () => {
    const options = {
      query: 'ipsam',
    };
    const { body: result } = await request(server)
      .get(SearchUrl)
      .set(...authHeader)
      .query(options)
      .expect(200);

    expect(result.totalCount).toBe(3);
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
      sortOrder: SortOrder.Ascending,
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

      expect(body.totalCount).toBe(17);
      expect(
        body.users.map((u: ProfileDTO) => ({
          username: u.username,
          memberSince: u.memberSince,
        })),
      ).toMatchSnapshot();
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
