import { AuthService } from '../../../src/auth';
import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import { createTestUser } from '../../utils';

const Password = 'XTdc4LG,+5R/QTgb';
const TestUserData: Partial<UserData> = {
  _id: '4E64038D-0ABF-4C1A-B678-55F8AFCB6B2D',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
  passwordHash: '$2b$04$qYwq/3B9EExkm.djcX5L4OpgYQJY.JIVJKYs52QYE561hIPbcH6Iu',
};

describe('Auth Service', () => {
  let service: AuthService;

  beforeAll(() => {
    service = new AuthService(UserModel);
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
});
