import { JwtPayload, verify } from 'jsonwebtoken';
import { AuthService } from '../../../src/auth';
import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import { createTestUser } from '../../utils';
import { Config } from '../../../src/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

const Password = 'XTdc4LG,+5R/QTgb';
const TestUserData: Partial<UserData> = {
  _id: '4E64038D-0ABF-4C1A-B678-55F8AFCB6B2D',
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
  let service: AuthService;

  beforeAll(() => {
    service = new AuthService(UserModel);
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
      const user = createTestUser();
      const payload = createJwtPayload(`user|${TestUserData._id}`);
      await expect(service.validateJwt(payload)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it("will assert that the user's account has not been suspended", async () => {
      const user = createTestUser({ ...TestUserData, isLockedOut: true });
      const payload = createJwtPayload(`user|${TestUserData._id}`);
      await user.save();
      await expect(service.validateJwt(payload)).rejects.toThrowError(
        ForbiddenException,
      );
    });

    it('will return the user if the token is valid', async () => {
      const user = createTestUser(TestUserData);
      const payload = createJwtPayload(`user|${TestUserData._id}`);
      const expected = new User(user);
      await user.save();

      const actual = await service.validateJwt(payload);

      expect(actual.toJSON()).toEqual(expected.toJSON());
    });
  });

  describe('when authenticating a user', () => {
    it('will return a user if username and password match', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(userDocument);
      await userDocument.save();

      const actual = await service.authenticateUser(
        TestUserData.username!.toUpperCase(),
        Password,
      );

      expect(actual?.lastLogin?.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(actual?.toJSON()).toEqual({
        ...expected.toJSON(),
        lastLogin: actual?.lastLogin,
      });
    });

    it('will return a user if email and password match', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(userDocument);

      await userDocument.save();
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
      const userDocument = createTestUser(TestUserData);
      await userDocument.save();

      await expect(
        service.authenticateUser(TestUserData.username!, 'wrong_password!'),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if account has no password set', async () => {
      const userDocument = createTestUser(TestUserData, null);
      await userDocument.save();

      await expect(
        service.authenticateUser(TestUserData.username!, Password),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if account is currently locked', async () => {
      const userDocument = createTestUser({
        ...TestUserData,
        isLockedOut: true,
      });
      await userDocument.save();

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
