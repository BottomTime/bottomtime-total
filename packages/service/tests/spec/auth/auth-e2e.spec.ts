import { CurrentUserSchema, UserRole, UserSchema } from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { Repository } from 'typeorm';

import { AuthController, AuthService } from '../../../src/auth';
import { OAuthService } from '../../../src/auth/oauth.service';
import { Config } from '../../../src/config';
import {
  InvalidTokenEntity,
  UserEntity,
  UserOAuthEntity,
} from '../../../src/data';
import { UserFactory, UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  createAuthHeader,
  createTestUser,
  createUserFactory,
} from '../../utils';
import { createTestApp } from '../../utils/create-test-app';

const JwtId = 'a1b2c3d4e5f6g7h8i9j0';
const Password = 'XTdc4LG,+5R/QTgb';
const TestUserData: Partial<UserEntity> = {
  id: '4e64038d-0abf-4c1a-b678-55f8afcb6b2d',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
  passwordHash: '$2b$04$qYwq/3B9EExkm.djcX5L4OpgYQJY.JIVJKYs52QYE561hIPbcH6Iu',
};

describe('Auth Module E2E Tests', () => {
  let Users: Repository<UserEntity>;
  let InvalidatedTokens: Repository<InvalidTokenEntity>;
  let OAuth: Repository<UserOAuthEntity>;
  let userFactory: UserFactory;

  let app: INestApplication;
  let server: unknown;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    OAuth = dataSource.getRepository(UserOAuthEntity);
    InvalidatedTokens = dataSource.getRepository(InvalidTokenEntity);
    userFactory = createUserFactory();

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([InvalidTokenEntity, UserOAuthEntity]),
        UsersModule,
      ],
      providers: [AuthService, OAuthService],
      controllers: [AuthController],
    });
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('will return anonymous if current user is not logged in', async () => {
    const { body } = await request(server).get('/api/auth/me').expect(200);
    expect(body).toEqual({ anonymous: true });
  });

  it('will return the currently logged in user', async () => {
    const userData = createTestUser();
    const user = userFactory.createUser(userData);
    const authHeader = await createAuthHeader(user.id);
    await Users.save(userData);

    const { body } = await request(server)
      .get('/api/auth/me')
      .set(...authHeader)
      .expect(200);

    expect(CurrentUserSchema.parse(body)).toEqual({
      anonymous: false,
      ...user.toJSON(),
    });
  });

  it('will login a user with username and password', async () => {
    const userData = createTestUser(TestUserData);
    const user = userFactory.createUser(userData);
    const agent = request.agent(server);
    await Users.save(userData);

    const { body: loginResponse } = await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: Password,
      })
      .expect(200);
    const login = UserSchema.parse(loginResponse);
    userData.lastLogin = new Date(login.lastLogin!);

    // Last login should be updated.
    expect(login.lastLogin?.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(UserSchema.parse(loginResponse)).toEqual(user.toJSON());

    // A cookie should be persisted that keeps the user logged in.
    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(CurrentUserSchema.parse(currentUserResponse)).toEqual({
      anonymous: false,
      ...user.toJSON(),
    });
  });

  it('will return a 401 error if password is incorrect', async () => {
    const userData = createTestUser(TestUserData);
    const agent = request.agent(server);
    await Users.save(userData);

    await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: 'Wrong_password',
      })
      .expect(401);

    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(currentUserResponse).toEqual({ anonymous: true });
  });

  it('will return a 401 error if user attempts to log into a suspended account', async () => {
    const userData = createTestUser({
      ...TestUserData,
      isLockedOut: true,
    });
    const agent = request.agent(server);
    await Users.save(userData);

    await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: Password,
      })
      .expect(401);

    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(currentUserResponse).toEqual({ anonymous: true });
  });

  it('will return a 401 error if user attempts to log into an account that does not exist', async () => {
    const agent = request.agent(server);
    await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: TestUserData.username,
        password: Password,
      })
      .expect(401);

    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(currentUserResponse).toEqual({ anonymous: true });
  });

  describe('when querying OAuth connections for a user', () => {
    let user: UserEntity;
    let otherUser: UserEntity;
    let adminUser: UserEntity;

    let authHeader: [string, string];
    let otherAuthHeader: [string, string];
    let adminAuthHeader: [string, string];

    let oauthConnections: UserOAuthEntity[];
    let oauthUrl: string;

    beforeAll(async () => {
      user = createTestUser();
      otherUser = createTestUser();
      adminUser = createTestUser({ role: UserRole.Admin });
      oauthConnections = [
        {
          id: '6e4a2edb-56f5-46dc-a525-6df55a288d34',
          provider: 'Shmoogle',
          providerId: '12345',
          user: user,
        },
        {
          id: '61297bec-e886-401e-b60d-815325afc391',
          provider: 'Twittish',
          providerId: '67890',
          user: user,
        },
        {
          id: '37b458fd-b0a7-40cd-811d-e1d6b86f43ab',
          provider: 'LinkedUp',
          providerId: 'abcdef',
          user: user,
        },
        {
          id: '0b06885d-e860-4489-a781-7a9c302ef4f7',
          provider: 'Shmoogle',
          providerId: '54321',
          user: otherUser,
        },
        {
          id: 'b4f78f2f-49e9-4d1e-84eb-dfef0c2ab6cb',
          provider: 'Discard',
          providerId: '98765',
          user: otherUser,
        },
      ];
      oauthUrl = `/api/auth/oauth/${user.username}`;

      authHeader = await createAuthHeader(user.id);
      otherAuthHeader = await createAuthHeader(otherUser.id);
      adminAuthHeader = await createAuthHeader(adminUser.id);
    });

    beforeEach(async () => {
      await Users.save([user, otherUser, adminUser]);
      await OAuth.save(oauthConnections);
    });

    it('will return the OAuth connections for the user', async () => {
      const { body } = await request(server)
        .get(oauthUrl)
        .set(...authHeader)
        .expect(200);

      expect(body).toEqual(['LinkedUp', 'Shmoogle', 'Twittish']);
    });

    it('will allow an admin to query OAuth connections for any user', async () => {
      const { body } = await request(server)
        .get(oauthUrl)
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toEqual(['LinkedUp', 'Shmoogle', 'Twittish']);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server).get(oauthUrl).expect(401);
    });

    it('will return a 403 response if the user is not the account owner', async () => {
      await request(server)
        .get(oauthUrl)
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the target user account does not exist', async () => {
      await request(server)
        .get('/api/auth/oauth/NotARealUser')
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when unlinking an OAuth provider from a user account', () => {
    let user: UserEntity;
    let otherUser: UserEntity;
    let adminUser: UserEntity;

    let authHeader: [string, string];
    let otherAuthHeader: [string, string];
    let adminAuthHeader: [string, string];

    let oauthConnections: UserOAuthEntity[];
    let oauthUrl: string;

    beforeAll(async () => {
      user = createTestUser();
      otherUser = createTestUser();
      adminUser = createTestUser({ role: UserRole.Admin });
      oauthConnections = [
        {
          id: '6e4a2edb-56f5-46dc-a525-6df55a288d34',
          provider: 'Shmoogle',
          providerId: '12345',
          user: user,
        },
        {
          id: '61297bec-e886-401e-b60d-815325afc391',
          provider: 'Twittish',
          providerId: '67890',
          user: user,
        },
        {
          id: '37b458fd-b0a7-40cd-811d-e1d6b86f43ab',
          provider: 'LinkedUp',
          providerId: 'abcdef',
          user: user,
        },
        {
          id: '0b06885d-e860-4489-a781-7a9c302ef4f7',
          provider: 'Shmoogle',
          providerId: '54321',
          user: otherUser,
        },
        {
          id: 'b4f78f2f-49e9-4d1e-84eb-dfef0c2ab6cb',
          provider: 'Discard',
          providerId: '98765',
          user: otherUser,
        },
      ];
      oauthUrl = `/api/auth/oauth/${user.username}`;

      authHeader = await createAuthHeader(user.id);
      otherAuthHeader = await createAuthHeader(otherUser.id);
      adminAuthHeader = await createAuthHeader(adminUser.id);
    });

    beforeEach(async () => {
      await Users.save([user, otherUser, adminUser]);
      await OAuth.save(oauthConnections);
    });

    it('will unlink the indicated account', async () => {
      await request(server)
        .delete(`${oauthUrl}/Shmoogle`)
        .set(...authHeader)
        .expect(204);

      const { body } = await request(server)
        .get(oauthUrl)
        .set(...authHeader)
        .expect(200);

      expect(body).toEqual(['LinkedUp', 'Twittish']);
    });

    it('will allow an admin to unlink the indicated account', async () => {
      await request(server)
        .delete(`${oauthUrl}/Shmoogle`)
        .set(...adminAuthHeader)
        .expect(204);

      const { body } = await request(server)
        .get(oauthUrl)
        .set(...authHeader)
        .expect(200);

      expect(body).toEqual(['LinkedUp', 'Twittish']);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server).delete(`${oauthUrl}/Shmoogle`).expect(401);
    });

    it('will return a 403 response if the user is not the account owner', async () => {
      await request(server)
        .delete(`${oauthUrl}/Shmoogle`)
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the target user account does not exist', async () => {
      await request(server)
        .delete(`/api/auth/oauth/NotARealUser/Shmoogle`)
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the target OAuth provider does not exist', async () => {
      await request(server)
        .delete(`${oauthUrl}/NotARealProvider`)
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when logging out', () => {
    let user: UserEntity;
    let jwt: string;

    beforeAll(() => {
      user = createTestUser(TestUserData);
      jwt = sign(
        {
          exp: Date.now() + 200000,
          iat: Date.now(),
          iss: 'bottomti.me',
          jti: JwtId,
          sub: `user|${user.id}`,
        },
        Config.sessions.sessionSecret,
      );
    });

    beforeEach(async () => {
      await Users.save(user);
    });

    it('will log a user out and invalidate their token', async () => {
      const { headers } = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200);

      const invalidation = await InvalidatedTokens.findOneByOrFail({
        token: JwtId,
      });
      expect(invalidation.invalidated.valueOf()).toBeCloseTo(Date.now(), -3);

      expect(headers['set-cookie'][0]).toContain(
        `${Config.sessions.cookieName}=;`,
      );
    });

    it('will do nothing if the user is not logged in', async () => {
      await request(server).post('/api/auth/logout').expect(200);
    });

    it('will redirect to the indicated page if the redirectTo parameter is valid and safe', async () => {
      const { headers } = await request(server)
        .get(
          `/api/auth/logout?redirectTo=${encodeURIComponent('/logbook/mike')}`,
        )
        .set('Authorization', `Bearer ${jwt}`)
        .expect(302);

      await InvalidatedTokens.findOneByOrFail({ token: JwtId });
      expect(headers['set-cookie'][0]).toContain(
        `${Config.sessions.cookieName}=;`,
      );
      expect(headers['location']).toBe('/logbook/mike');
    });

    it('will redirect to the home page if the redirectTo parameter is invalid', async () => {
      const { headers } = await request(server)
        .get('/api/auth/logout?redirectTo=o!hai!')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(302);

      await InvalidatedTokens.findOneByOrFail({ token: JwtId });
      expect(headers['set-cookie'][0]).toContain(
        `${Config.sessions.cookieName}=;`,
      );
      expect(headers['location']).toBe('/');
    });

    it('will redirect to the home page if the redirectTo parameter attempts to go to another domain', async () => {
      const { headers } = await request(server)
        .get(
          `/api/auth/logout?redirectTo=${encodeURIComponent(
            'https://evil.com/steal-my-cookies',
          )}`,
        )
        .set('Authorization', `Bearer ${jwt}`)
        .expect(302);

      await InvalidatedTokens.findOneByOrFail({ token: JwtId });
      expect(headers['set-cookie'][0]).toContain(
        `${Config.sessions.cookieName}=;`,
      );
      expect(headers['location']).toBe('/');
    });

    it('will redirect to the homepage if the redirectTo parameter is not provided', async () => {
      const { headers } = await request(server)
        .get('/api/auth/logout')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(302);

      await InvalidatedTokens.findOneByOrFail({ token: JwtId });
      expect(headers['set-cookie'][0]).toContain(
        `${Config.sessions.cookieName}=;`,
      );
      expect(headers['location']).toBe('/');
    });
  });

  describe('when purging invalidated tokens', () => {
    let regularUser: UserEntity;
    let adminUser: UserEntity;
    let authHeader: [string, string];
    let adminAuthHeader: [string, string];

    beforeAll(async () => {
      regularUser = createTestUser();
      adminUser = createTestUser({ role: UserRole.Admin });

      [authHeader, adminAuthHeader] = await Promise.all([
        createAuthHeader(regularUser.id),
        createAuthHeader(adminUser.id),
      ]);
    });

    beforeEach(async () => {
      await Promise.all([
        InvalidatedTokens.save([
          {
            token: '40c71d11-46ca-455b-b264-5c61af7ad26c',
            invalidated: new Date('2021-04-18'),
          },
          {
            token: 'fdbb2ad4-0536-4ece-a82d-3a123dc2cc56',
            invalidated: new Date('2023-08-21'),
          },
          {
            token: 'cc43e379-c30d-4939-94c5-66793646cf99',
            invalidated: new Date('2025-12-24'),
          },
        ]),
        Users.save([regularUser, adminUser]),
      ]);
    });

    it('will purge invalidated tokens that have expired', async () => {
      const { body } = await request(server)
        .delete('/api/auth/invalidations')
        .set(...adminAuthHeader)
        .send({
          invalidatedBefore: new Date('2024-09-18T15:46:44Z').valueOf(),
        })
        .expect(200);

      expect(body).toEqual({ purged: 2 });

      const remaining = await InvalidatedTokens.find();
      expect(remaining).toEqual([
        {
          token: 'cc43e379-c30d-4939-94c5-66793646cf99',
          invalidated: new Date('2025-12-24'),
        },
      ]);
    });

    it('will return a 400 response if request body is missing', async () => {
      await request(server)
        .delete('/api/auth/invalidations')
        .set(...adminAuthHeader)
        .expect(400);

      await expect(InvalidatedTokens.count()).resolves.toBe(3);
    });

    it('will return a 400 response if request body is invalid', async () => {
      await request(server)
        .delete('/api/auth/invalidations')
        .set(...adminAuthHeader)
        .send({
          wat: 'nope',
          invalidatedBefore: 'yup',
        })
        .expect(400);

      await expect(InvalidatedTokens.count()).resolves.toBe(3);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .delete('/api/auth/invalidations')
        .send({
          invalidatedBefore: '2024-09-18T15:46:44Z',
        })
        .expect(401);

      await expect(InvalidatedTokens.count()).resolves.toBe(3);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .delete('/api/auth/invalidations')
        .set(...authHeader)
        .send({
          invalidatedBefore: '2024-09-18T15:46:44Z',
        })
        .expect(403);

      await expect(InvalidatedTokens.count()).resolves.toBe(3);
    });
  });
});
