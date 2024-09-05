import { ProfileDTO, SortOrder, UsersSortBy } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import { Queues } from '../../../src/common';
import { FriendshipEntity, UserEntity } from '../../../src/data';
import { QueueModule } from '../../../src/queue';
import { UsersService } from '../../../src/users';
import { UserController } from '../../../src/users/user.controller';
import { UsersController } from '../../../src/users/users.controller';
import { dataSource } from '../../data-source';
import TestUserData from '../../fixtures/user-search-data.json';
import { createAuthHeader, createTestApp, parseUserJSON } from '../../utils';
import { createTestFriendship } from '../../utils/create-test-friendship';

const SearchUrl = '/api/users';

describe('Searching Profiles E2E Tests', () => {
  let app: INestApplication;
  let server: HttpServer;
  let authHeader: [string, string];

  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let users: UserEntity[];

  beforeAll(async () => {
    users = TestUserData.map((data) => parseUserJSON(data));
    authHeader = await createAuthHeader(users[0].id);
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([UserEntity]),
        QueueModule.forFeature({
          key: Queues.email,
          queueUrl: 'http://localhost:4566/000000000000/email-queue',
        }),
      ],
      providers: [UsersService],
      controllers: [UsersController],
    });
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
  });

  beforeEach(async () => {
    await Users.save(users);
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

    expect(body.totalCount).toBe(100);
    expect(body.users).toHaveLength(10);
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

    expect(result.totalCount).toBe(28);
    expect(result.users.map((u: ProfileDTO) => u.username)).toMatchSnapshot();
  });

  it('will allow filtering out profiles for the current user', async () => {
    const friendRelations: FriendshipEntity[] = [
      createTestFriendship(users[0].id, 'cbbdc55c-4f64-4fdf-ac63-5c42cfd80607'),
      createTestFriendship('cbbdc55c-4f64-4fdf-ac63-5c42cfd80607', users[0].id),

      createTestFriendship(users[0].id, 'a966e53e-0d66-4dff-8f7c-2c3658eea2e4'),
      createTestFriendship('a966e53e-0d66-4dff-8f7c-2c3658eea2e4', users[0].id),
    ];
    await Friends.save(friendRelations);

    const options = {
      filterFriends: true,
      limit: 15,
    };
    const { body: result } = await request(server)
      .get(SearchUrl)
      .set(...authHeader)
      .query(options)
      .expect(200);

    expect(result.totalCount).toBe(97);
    expect(
      result.users.map((u: ProfileDTO) => ({
        id: u.userId,
        username: u.username,
      })),
    ).toMatchSnapshot();
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

      expect(body.totalCount).toBe(100);
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
      .set(...authHeader)
      .query(options)
      .expect(200);

    expect(result.totalCount).toBe(0);
    expect(result.users).toHaveLength(0);
  });

  it('will return a 400 response if the query string is invalid', async () => {
    const { body: error } = await request(server)
      .get(SearchUrl)
      .set(...authHeader)
      .query({ sortBy: 'asdf', sortOrder: 17, query: true, limit: -1 })
      .expect(400);
    expect(error.details).toMatchSnapshot();
  });

  it('will return a 401 response if the user is not authenticated', async () => {
    await request(server).get(SearchUrl).expect(401);
  });
});
