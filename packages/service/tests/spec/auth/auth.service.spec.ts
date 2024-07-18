import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { JwtPayload, verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { AuthService } from '../../../src/auth';
import { Config } from '../../../src/config';
import { UserEntity } from '../../../src/data';
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

function createJwtPayload(subject?: string, expired = false): JwtPayload {
  const payload: JwtPayload = {
    sub: subject,
    iat: Date.now(),
    exp: expired ? Date.now() - 10000 : Date.now() + 10000,
  };

  return payload;
}

describe('Auth Service', () => {
  let Users: Repository<UserEntity>;
  let usersService: UsersService;
  let service: AuthService;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    usersService = new UsersService(Users);
    service = new AuthService(usersService);
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
        lastLogin: actual?.lastLogin,
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
        lastLogin: actual?.lastLogin,
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
});
