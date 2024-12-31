import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { createMocks, createResponse } from 'node-mocks-http';
import { Repository } from 'typeorm';

import { AuthService } from '../../../src/auth';
import { Config } from '../../../src/config';
import { InvalidTokenEntity, UserEntity } from '../../../src/data';
import { User, UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils';

const Password = 'XTdc4LG,+5R/QTgb';
const TestUserData: Partial<UserEntity> = {
  id: '4e64038d-0abf-4c1a-b678-55f8afcb6b2d',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
  passwordHash: '$2b$04$qYwq/3B9EExkm.djcX5L4OpgYQJY.JIVJKYs52QYE561hIPbcH6Iu',
};

const JwtId = 'a1b2c3d4e5f6g7h8i9j0';

function createJwtPayload(subject?: string, expired = false): JwtPayload {
  const payload: JwtPayload = {
    sub: subject,
    jti: JwtId,
    iat: Date.now(),
    exp: expired ? Date.now() - 10000 : Date.now() + 10000,
  };

  return payload;
}

jest.mock('../../../src/config');

describe('Auth Service', () => {
  let Users: Repository<UserEntity>;
  let InvalidatedTokens: Repository<InvalidTokenEntity>;
  let usersService: UsersService;
  let service: AuthService;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    InvalidatedTokens = dataSource.getRepository(InvalidTokenEntity);

    usersService = new UsersService(Users);
    service = new AuthService(usersService, InvalidatedTokens);
  });

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2021-01-01T00:00:00Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });

    const configMock = jest.mocked(Config);
    configMock.sessions.cookieName = 'bt-session';
    configMock.sessions.sessionSecret =
      'hdrh5XMCvsK6cuC3gjRvFBc7wKp6zY_7gRO-NxghW6Q';
    configMock.sessions.cookieDomain = 'localhost';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('when validating a JWT', () => {
    it('will assert that the subject is present', async () => {
      const payload = createJwtPayload();
      await expect(service.validateJwt(payload)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('will assert that the subect is formatted correctly', async () => {
      const payload = createJwtPayload('nope');
      await expect(service.validateJwt(payload)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('will assert that the user in the subject has a valid account', async () => {
      const payload = createJwtPayload(`user|${TestUserData.id}`);
      await expect(service.validateJwt(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("will assert that the user's account has not been suspended", async () => {
      const user = createTestUser({ ...TestUserData, isLockedOut: true });
      const payload = createJwtPayload(`user|${TestUserData.id}`);
      await Users.save(user);
      await expect(service.validateJwt(payload)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('will assert that the token has not been invalidated', async () => {
      const user = createTestUser(TestUserData);
      const payload = createJwtPayload(`user|${TestUserData.id}`);
      await Users.save(user);
      await InvalidatedTokens.save({ token: JwtId, invalidated: new Date() });

      await expect(service.validateJwt(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('will return the user if the token is valid', async () => {
      const user = createTestUser(TestUserData);
      const payload = createJwtPayload(`user|${TestUserData.id}`);
      const expected = new User(Users, user);
      await Users.save(user);

      const actual = await service.validateJwt(payload);

      expect(actual.toJSON()).toEqual(expected.toJSON());
    });
  });

  describe('when authenticating a user', () => {
    it('will return a user if username and password match', async () => {
      const userData = createTestUser(TestUserData);
      const expected = new User(Users, userData);
      await Users.save(userData);

      const actual = await service.authenticateUser(
        TestUserData.username!.toUpperCase(),
        Password,
      );

      expect(actual?.lastLogin?.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(actual?.toJSON()).toEqual({
        ...expected.toJSON(),
        lastLogin: actual?.lastLogin?.valueOf(),
      });
    });

    it('will return a user if email and password match', async () => {
      const userData = createTestUser(TestUserData);
      const expected = new User(Users, userData);

      await Users.save(userData);
      const actual = await service.authenticateUser(
        TestUserData.email!.toUpperCase(),
        Password,
      );

      expect(actual?.lastLogin?.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(actual?.toJSON()).toEqual({
        ...expected.toJSON(),
        lastLogin: actual?.lastLogin?.valueOf(),
      });
    });

    it('will return undefined if username or email are not found', async () => {
      await expect(
        service.authenticateUser('no_such_user', 's3cr3t..P@ssw#rd'),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if password is incorrect', async () => {
      const userData = createTestUser(TestUserData);
      await Users.save(userData);

      await expect(
        service.authenticateUser(TestUserData.username!, 'wrong_password!'),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if account has no password set', async () => {
      const userData = createTestUser(TestUserData, null);
      await Users.save(userData);

      await expect(
        service.authenticateUser(TestUserData.username!, Password),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if account is currently locked', async () => {
      const userData = createTestUser({
        ...TestUserData,
        isLockedOut: true,
      });
      await Users.save(userData);

      await expect(
        service.authenticateUser(TestUserData.username!, Password),
      ).resolves.toBeUndefined();
    });
  });

  describe('when revoking a session', () => {
    it('will invalidate the token and clear the session cookie', async () => {
      const jwt = sign(
        {
          exp: Date.now() + 200000,
          iat: Date.now(),
          iss: 'bottomti.me',
          jti: JwtId,
          sub: 'user|cac361c5-d08e-4b67-b8f9-9c7ae5e66c4e',
        },
        Config.sessions.sessionSecret,
      );
      const { req, res } = createMocks({
        cookies: {
          [Config.sessions.cookieName]: jwt,
        },
      });

      await service.revokeSession(req, res);

      const invalidation = await InvalidatedTokens.findOneByOrFail({
        token: JwtId,
      });
      expect(invalidation.invalidated.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(res.cookies[Config.sessions.cookieName].value).toBe('');
    });

    it('will invalidate a JWT if it appears in the authorization header', async () => {
      const jwt = sign(
        {
          exp: Date.now() + 200000,
          iat: Date.now(),
          iss: 'bottomti.me',
          jti: JwtId,
          sub: 'user|cac361c5-d08e-4b67-b8f9-9c7ae5e66c4e',
        },
        Config.sessions.sessionSecret,
      );

      const { req, res } = createMocks({
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      });

      await service.revokeSession(req, res);

      const invalidation = await InvalidatedTokens.findOneByOrFail({
        token: JwtId,
      });
      expect(invalidation.invalidated.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will do nothing if a JWT or session cookie cannot be found', async () => {
      const { req, res } = createMocks();
      await service.revokeSession(req, res);
    });

    it('will remove cookie if JWT is invalid', async () => {
      const { req, res } = createMocks({
        cookies: {
          [Config.sessions.cookieName]: 'nope',
        },
      });

      await service.revokeSession(req, res);

      expect(res.cookies[Config.sessions.cookieName].value).toBe('');
    });

    it('will remove cookie if JWT is missing token ID', async () => {
      const jwt = sign(
        {
          exp: Date.now() + 200000,
          iat: Date.now(),
          iss: 'bottomti.me',
          sub: 'user|cac361c5-d08e-4b67-b8f9-9c7ae5e66c4e',
        },
        Config.sessions.sessionSecret,
      );
      const { req, res } = createMocks({
        cookies: {
          [Config.sessions.cookieName]: jwt,
        },
      });

      await service.revokeSession(req, res);

      expect(res.cookies[Config.sessions.cookieName].value).toBe('');
    });
  });

  it('will correctly sign a JWT', async () => {
    const subject = 'My Secret Subject';
    const token = await service.signJWT(subject);

    const payload = await new Promise<JwtPayload>((resolve, reject) => {
      verify(token, Config.sessions.sessionSecret, {}, (error, payload) => {
        if (error) reject(error);
        else resolve(payload as JwtPayload);
      });
    });

    expect(payload.sub).toEqual(subject);
    expect(payload.iat).toBeCloseTo(Date.now(), -2);
    expect(payload.exp).toBeCloseTo(
      Date.now() + Config.sessions.cookieTTL * 60000,
      -2,
    );
    expect(payload.iss).toEqual(Config.baseUrl);
  });

  it('will issue a session cookie', async () => {
    const res = createResponse();
    const userData = createTestUser(TestUserData);
    const user = new User(Users, userData);

    await service.issueSessionCookie(user, res);

    expect(res.cookies[Config.sessions.cookieName].value).toBeDefined();
  });

  it('will purge expired tokens', async () => {
    await InvalidatedTokens.save([
      {
        token: 'token1',
        invalidated: new Date('2020-12-31T23:59:59Z'),
      },
      {
        token: 'token2',
        invalidated: new Date('2019-06-12T00:00:00Z'),
      },
      {
        token: 'token3',
        invalidated: new Date('2024-04-08T00:00:00Z'),
      },
    ]);

    await service.purgeExpiredInvalidations(new Date());

    const tokens = await InvalidatedTokens.find();
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token).toEqual('token3');
  });
});
