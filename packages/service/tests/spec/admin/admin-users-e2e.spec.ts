import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';

import { compare } from 'bcrypt';
import request from 'supertest';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestUserData from '../../fixtures/user-search-data.json';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-06T00:05:49.712Z'),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
  profileVisibility: ProfileVisibility.Private,
};

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-06T00:05:49.712Z'),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
  profileVisibility: ProfileVisibility.Private,
};

describe('Admin End-to-End Tests', () => {
  let Users: Repository<UserEntity>;
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regualarAuthHeader: [string, string];
  let regularUser: UserEntity;
  let adminUser: UserEntity;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regualarAuthHeader = await createAuthHeader(RegularUserId);

    regularUser = new UserEntity();
    adminUser = new UserEntity();

    Object.assign(regularUser, RegularUserData);
    Object.assign(adminUser, AdminUserData);
  });

  beforeEach(async () => {
    await Promise.all([Users.save(regularUser), Users.save(adminUser)]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching users', () => {
    let userData: Omit<
      UserEntity,
      | 'certifications'
      | 'customData'
      | 'friends'
      | 'fulltext'
      | 'oauth'
      | 'tanks'
    >[];

    beforeAll(() => {
      userData = TestUserData.map((data) => {
        const user = new UserEntity();
        Object.assign(user, data);
        return user;
      });
    });

    beforeEach(async () => {
      await Users.createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values(userData)
        .execute();
    });

    it('will return a list of users', async () => {
      const { body: result } = await request(server)
        .get(`/api/admin/users`)
        .query({ limit: 15 })
        .set(...adminAuthHeader)
        .expect(200);

      expect(result).toMatchSnapshot();
    });

    it.skip('will filter results based on query string', async () => {
      const { body: result } = await request(server)
        .get(`/api/admin/users`)
        .query({
          query: 'city jenkins',
          role: UserRole.User,
        })
        .set(...adminAuthHeader)
        .expect(200);

      expect(result.users).toHaveLength(15);
      expect(result).toMatchSnapshot();
    });

    it('will return a 400 response if query string is invalid', async () => {
      await request(server)
        .get(`/api/admin/users?query=Joe&sortBy=NotAValidSortBy`)
        .query({
          role: 'wat',
          limit: -3,
          sortBy: 'NotAValidSortBy',
        })
        .set(...adminAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      await request(server).get(`/api/admin/users`).expect(401);
    });

    it('will return a 403 response if user is not an administrator', async () => {
      await request(server)
        .get(`/api/admin/users`)
        .set(...regualarAuthHeader)
        .expect(403);
    });
  });

  describe("when resetting a user's password", () => {
    const newPassword = '*%*G*^F*G9h98h*^*(&(&';

    it("will reset a user's password", async () => {
      const oldData = createTestUser();
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/password`)
        .set(...adminAuthHeader)
        .send({ newPassword })
        .expect(204);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      await expect(compare(newPassword, newData.passwordHash!)).resolves.toBe(
        true,
      );
    });

    it('will return a 400 response if password does not meet strength requirements', async () => {
      const oldData = createTestUser();
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/password`)
        .set(...adminAuthHeader)
        .send({ newPassword: 'weak' })
        .expect(400);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      await expect(compare('weak', newData.passwordHash!)).resolves.toBe(false);
    });

    it('will return a 404 response if the user account does not exist', async () => {
      await request(server)
        .post(`/api/admin/users/nope/password`)
        .set(...adminAuthHeader)
        .send({ newPassword })
        .expect(404);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const oldData = createTestUser();
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/password`)
        .send({ newPassword: 'weak' })
        .expect(401);
    });

    it('will return 403 response if user is not an administrator', async () => {
      const oldData = createTestUser();
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/password`)
        .set(...regualarAuthHeader)
        .send({ newPassword: 'weak' })
        .expect(403);
    });
  });

  describe("when changing a user's role", () => {
    it("will change a user's role", async () => {
      const oldData = createTestUser({ role: UserRole.User });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/role`)
        .set(...adminAuthHeader)
        .send({ newRole: UserRole.Admin })
        .expect(204);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData!.role).toBe(UserRole.Admin);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const oldData = createTestUser({ role: UserRole.User });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/role`)
        .set(...adminAuthHeader)
        .send({ newRole: 'Not a valid role' })
        .expect(400);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.role).toBe(UserRole.User);
    });

    it('will return 404 response if user is not found', async () => {
      await request(server)
        .post(`/api/admin/users/nope/role`)
        .set(...adminAuthHeader)
        .send({ newRole: UserRole.Admin })
        .expect(404);
    });

    it('will return 401 response if user is not authenticated', async () => {
      const oldData = createTestUser({ role: UserRole.User });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/role`)
        .send({ newRole: UserRole.Admin })
        .expect(401);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.role).toBe(UserRole.User);
    });

    it('will return 403 response if user is not an administrator', async () => {
      const oldData = createTestUser({ role: UserRole.User });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/role`)
        .set(...regualarAuthHeader)
        .send({ newRole: UserRole.Admin })
        .expect(403);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.role).toBe(UserRole.User);
    });
  });

  describe("when locking a user's account", () => {
    it('will lock an account', async () => {
      const oldData = createTestUser({ isLockedOut: false });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/lockAccount`)
        .set(...adminAuthHeader)
        .expect(204);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.isLockedOut).toBe(true);
    });

    it('will return 404 response if user is not found', async () => {
      await request(server)
        .post(`/api/admin/users/nope/lockAccount`)
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const oldData = createTestUser({ isLockedOut: false });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/lockAccount`)
        .expect(401);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.isLockedOut).toBe(false);
    });

    it('will return a 403 response if user is not an administrator', async () => {
      const oldData = createTestUser({ isLockedOut: false });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/lockAccount`)
        .set(...regualarAuthHeader)
        .expect(403);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.isLockedOut).toBe(false);
    });
  });

  describe('when unlocking a user account', () => {
    it('will unlock an account', async () => {
      const oldData = createTestUser({ isLockedOut: true });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/unlockAccount`)
        .set(...adminAuthHeader)
        .expect(204);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.isLockedOut).toBe(false);
    });

    it('will return 404 response if user is not found', async () => {
      await request(server)
        .post(`/api/admin/users/nope/unlockAccount`)
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      const oldData = createTestUser({ isLockedOut: true });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/unlockAccount`)
        .expect(401);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData!.isLockedOut).toBe(true);
    });

    it('will return a 403 response if user is not an administrator', async () => {
      const oldData = createTestUser({ isLockedOut: true });
      await Users.save(oldData);

      await request(server)
        .post(`/api/admin/users/${oldData.username}/unlockAccount`)
        .set(...regualarAuthHeader)
        .expect(403);

      const newData = await Users.findOneByOrFail({ id: oldData.id });
      expect(newData.isLockedOut).toBe(true);
    });
  });
});
