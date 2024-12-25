import { UserRole } from '@bottomtime/api';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { Server } from 'http';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AdminFriendsController } from '../../../src/admin/admin-friends.controller';
import { AuthModule } from '../../../src/auth';
import { FriendRequestEntity, UserEntity } from '../../../src/data';
import { FriendsModule } from '../../../src/friends';
import { dataSource } from '../../data-source';
import UsersTestData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';

function generateTestFriendRequests(
  users: UserEntity[],
  targetDate: Date,
): FriendRequestEntity[] {
  const requests = new Array<FriendRequestEntity>(users.length - 1);
  for (let i = 1; i < requests.length; i++) {
    requests[i] = new FriendRequestEntity();
    requests[i].id = faker.string.uuid();

    if (i % 2 === 0) {
      requests[i].from = users[i + 1];
      requests[i].to = users[0];
    } else {
      requests[i].from = users[0];
      requests[i].to = users[i + 1];
    }

    requests[i].created = faker.date.recent({ days: 60, refDate: targetDate });
    requests[i].expires =
      i < 8
        ? faker.date.recent({ days: 20, refDate: targetDate })
        : faker.date.soon({ days: 20, refDate: targetDate });
  }
  return requests;
}

const FriendRequestsUrl = '/api/admin/friendRequests';

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
};

describe('Admin friends E2E tests', () => {
  let app: INestApplication;
  let server: Server;
  let Users: Repository<UserEntity>;
  let FriendRequests: Repository<FriendRequestEntity>;

  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];

  let adminUser: UserEntity;
  let regularUsers: UserEntity[];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [AuthModule, FriendsModule],
      controllers: [AdminFriendsController],
    });
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    FriendRequests = dataSource.getRepository(FriendRequestEntity);

    adminUser = createTestUser(AdminUserData);
    regularUsers = UsersTestData.slice(0, 20).map(parseUserJSON);

    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(regularUsers[0].id);
  });

  beforeEach(async () => {
    await Users.save([adminUser, ...regularUsers]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when purging expired friend requests', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('will purge expired requests relative to the current date', async () => {
      const now = new Date();
      jest.useFakeTimers({
        now,
        doNotFake: ['nextTick', 'setImmediate'],
      });

      const requests = generateTestFriendRequests(regularUsers, now);
      await FriendRequests.save(requests);

      const { body } = await request(server)
        .delete(FriendRequestsUrl)
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toEqual({
        requestsDeleted: 7,
      });

      const remainingRequests = await FriendRequests.find();
      expect(remainingRequests).toHaveLength(11);

      remainingRequests.forEach((req) => {
        expect(req.expires.valueOf()).toBeGreaterThanOrEqual(
          new Date().valueOf(),
        );
      });
    });

    it('will purge expired requests relative to a specific date', async () => {
      const targetDate = faker.date.future({ years: 10 });
      const requests = generateTestFriendRequests(regularUsers, targetDate);
      await FriendRequests.save(requests);

      const { body } = await request(server)
        .delete(FriendRequestsUrl)
        .set(...adminAuthHeader)
        .send({ expiration: targetDate.valueOf() })
        .expect(200);

      expect(body).toEqual({
        requestsDeleted: 7,
      });

      const remainingRequests = await FriendRequests.find();
      expect(remainingRequests).toHaveLength(11);

      remainingRequests.forEach((req) => {
        expect(req.expires.valueOf()).toBeGreaterThanOrEqual(
          new Date().valueOf(),
        );
      });
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .delete(FriendRequestsUrl)
        .set(...adminAuthHeader)
        .send({ expiration: 'invalid' })
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(FriendRequestsUrl).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .delete(FriendRequestsUrl)
        .set(...regularAuthHeader)
        .expect(403);
    });
  });
});
