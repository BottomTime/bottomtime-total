/* eslint-disable no-process-env */
import { ConflictException } from '@nestjs/common';
import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users';
import { createTestUser } from '../../utils';
import { ProfileVisibility } from '@bottomtime/api';
import dayjs from 'dayjs';
import { compare } from 'bcrypt';

const Password = '%HBc..`9Cbt]3/S';
const TestUserData: UserData = {
  _id: '0050bf4c-faf4-4b06-be96-26954c983764',
  email: 'Emerson69@yahoo.com',
  emailLowered: 'emerson69@yahoo.com',
  emailVerified: false,
  isLockedOut: false,
  lastLogin: new Date('2023-12-01T08:44:35.319Z'),
  memberSince: new Date('2019-05-22T18:13:33.864Z'),
  passwordHash: '$2b$04$4VgfGazqB.bjgESl5S0yeu8XmZgDLU7k6u0NCdTmIFSa8sfX8CvYG',
  role: 'user',
  username: 'Emerson_Kohler',
  usernameLowered: 'emerson_kohler',
  profile: {
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/876.jpg',
    bio: 'Placeat magnam repudiandae eos velit labore. Molestias repellat magnam molestias possimus minus corrupti nihil nesciunt. Facilis aliquid ab harum saepe architecto quidem sunt dignissimos magnam. Culpa excepturi ex provident quibusdam quam. Similique eius deleniti nam vitae autem et. Quod ea modi facilis quam saepe sequi quis temporibus accusamus. Porro doloribus necessitatibus numquam. Impedit dolores quam hic fuga.',
    birthdate: '2013-03-07',
    experienceLevel: 'Professional',
    location: 'Baldwin Park',
    name: 'Luther Blick',
    startedDiving: '1986',
  },
  settings: {
    profileVisibility: ProfileVisibility.FriendsOnly,
  },
};

describe('User Class', () => {
  let oldEnv: object;

  beforeAll(() => {
    oldEnv = Object.assign({}, process.env);
    process.env.BT_PASSWORD_SALT_ROUNDS = '1';
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  it('will change the username', async () => {
    const newUsername = 'Mike.Durbin';
    const data = new UserModel(TestUserData);
    const user = new User(UserModel, data);
    await data.save();

    await user.changeUsername(newUsername);

    expect(user.username).toEqual(newUsername);

    const stored = await UserModel.findById(user.id);
    expect(stored!.username).toEqual(newUsername);
    expect(stored!.usernameLowered).toEqual(newUsername.toLowerCase());
  });

  it('will throw a ConflictException if username is taken', async () => {
    const existingUser = createTestUser();
    const data = new UserModel(TestUserData);
    const user = new User(UserModel, data);
    await UserModel.insertMany([existingUser, data]);

    await expect(
      user.changeUsername(existingUser.username),
    ).rejects.toThrowError(ConflictException);
  });

  it('will change the email address', async () => {
    const newEmail = 'Degenerate.Rat33@hotmail.com';
    const data = new UserModel(TestUserData);
    const user = new User(UserModel, data);
    await data.save();

    await user.changeEmail(newEmail);

    expect(user.email).toEqual(newEmail);

    const stored = await UserModel.findById(user.id);
    expect(stored!.email).toEqual(newEmail);
    expect(stored!.emailLowered).toEqual(newEmail.toLowerCase());
  });

  it('will throw a ConflictException if email is taken', async () => {
    const existingUser = createTestUser();
    const data = new UserModel(TestUserData);
    const user = new User(UserModel, data);
    await UserModel.insertMany([existingUser, data]);

    await expect(user.changeEmail(existingUser.email!)).rejects.toThrowError(
      ConflictException,
    );
  });

  describe('when verifying email addresses', () => {
    it('will generate a verification token', async () => {
      const data = new UserModel(TestUserData);
      const user = new User(UserModel, data);
      await data.save();

      const token = await user.requestEmailVerificationToken();
      expect(token.length).toBeGreaterThan(20);

      const stored = await UserModel.findById(user.id);
      expect(stored!.emailVerificationToken).toEqual(token);
      expect(stored!.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs(new Date()).add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will overwrite an existing token if one already exists', async () => {
      const data = new UserModel({
        ...TestUserData,
        emailVerificationToken: 'abc123',
        emailVerificationTokenExpiration: new Date(),
      });
      const user = new User(UserModel, data);
      await data.save();

      const token = await user.requestEmailVerificationToken();

      expect(token.length).toBeGreaterThan(20);

      const stored = await UserModel.findById(user.id);
      expect(stored!.emailVerificationToken).toEqual(token);
      expect(stored!.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs().add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will verify email if token is good', async () => {
      const token = 'abcd1234';
      const expiration = dayjs().add(3, 'hour').toDate();
      const data = new UserModel({
        ...TestUserData,
        emailVerificationToken: token,
        emailVerificationTokenExpiration: expiration,
      });
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.verifyEmail(token)).resolves.toBe(true);

      const stored = await UserModel.findById(user.id);
      expect(user.emailVerified).toBe(true);
      expect(stored!.emailVerified).toBe(true);
    });

    it('Will not verify email if a token has not been generated', async () => {
      const token = 'abcd1234';
      const data = new UserModel(TestUserData);
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.verifyEmail(token)).resolves.toBe(false);

      const stored = await UserModel.findById(user.id);
      expect(user.emailVerified).toBe(false);
      expect(stored!.emailVerified).toBe(false);
    });

    it('will not verify if token is expired', async () => {
      const token = 'abcd1234';
      const expiration = dayjs().subtract(3, 'hour').toDate();
      const data = new UserModel({
        ...TestUserData,
        emailVerificationToken: token,
        emailVerificationTokenExpiration: expiration,
      });
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.verifyEmail(token)).resolves.toBe(false);

      const stored = await UserModel.findById(user.id);
      expect(user.emailVerified).toBe(false);
      expect(stored!.emailVerified).toBe(false);
    });

    it('Will not verify email if token is incorrect', async () => {
      const token = 'abcd1234';
      const expiration = dayjs().add(3, 'hour').toDate();
      const data = new UserModel({
        ...TestUserData,
        emailVerificationToken: token,
        emailVerificationTokenExpiration: expiration,
      });
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.verifyEmail('wrong')).resolves.toBe(false);

      const stored = await UserModel.findById(user.id);
      expect(user.emailVerified).toBe(false);
      expect(stored!.emailVerified).toBe(false);
    });
  });

  describe('when changing passwords', () => {
    it('Will change a password', async () => {
      const newPassword = 'faw09*(*afoewnaowOHUPO';
      const data = createTestUser(TestUserData);
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.changePassword(Password, newPassword)).resolves.toBe(
        true,
      );

      const result = await UserModel.findById(user.id);
      expect(data.lastPasswordChange?.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );
      expect(result?.lastPasswordChange?.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );
      await Promise.all([
        expect(compare(newPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(newPassword, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('will not change a password if the user does not yet have a password set', async () => {
      const newPassword = 'faw09*(*afoewnaowOHUPO';
      const data = createTestUser(TestUserData, null);
      data.lastPasswordChange = undefined;
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.changePassword(Password, newPassword)).resolves.toBe(
        false,
      );

      const result = await UserModel.findById(user.id);
      expect(data.lastPasswordChange).toBeUndefined();
      expect(data.passwordHash).toBeUndefined();
      expect(result!.lastPasswordChange).toBeUndefined();
      expect(result!.passwordHash).toBeUndefined();
    });

    it('will not change a password if the old password does not mach', async () => {
      const newPassword = 'faw09*(*afoewnaowOHUPO';
      const data = createTestUser(TestUserData);
      data.lastPasswordChange = undefined;
      const user = new User(UserModel, data);
      await data.save();

      await expect(
        user.changePassword('not_Corr3ct!!', newPassword),
      ).resolves.toBe(false);

      const result = await UserModel.findById(user.id);
      expect(data.lastPasswordChange).toBeUndefined();
      expect(result!.lastPasswordChange).toBeUndefined();
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });
  });

  describe('when resetting passwords', () => {
    const token = 'llen5RTYeaIf_emwsGb-B8BPVEbT4YsAbo5A580bsxo';
    const newPassword = 'B(&G(g18h9H236f23ggT&^%&%*';

    it('will generate a password reset token', async () => {
      const data = createTestUser(TestUserData);
      const user = new User(UserModel, data);
      await data.save();

      const token = await user.requestPasswordResetToken();
      expect(token.length).toBeGreaterThan(20);

      expect(data.passwordResetToken).toEqual(token);

      const stored = await UserModel.findById(user.id);
      expect(stored!.passwordResetToken).toEqual(token);
      expect(stored!.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs().add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will overwrite an existing password reset token', async () => {
      const data = createTestUser({
        ...TestUserData,
        passwordResetToken: 'abc123',
        passwordResetTokenExpiration: new Date(),
      });
      const user = new User(UserModel, data);
      await data.save();

      const token = await user.requestPasswordResetToken();
      expect(token.length).toBeGreaterThan(20);

      expect(data.passwordResetToken).toEqual(token);

      const stored = await UserModel.findById(user.id);
      expect(stored!.passwordResetToken).toEqual(token);
      expect(stored!.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs().add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will reset a password with token', async () => {
      const data = createTestUser({
        passwordResetToken: token,
        passwordResetTokenExpiration: dayjs().add(2, 'hour').toDate(),
      });
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(true);
      const stored = await UserModel.findById(user.id);
      expect(data.lastPasswordChange?.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );
      expect(stored?.lastPasswordChange?.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );
      await Promise.all([
        expect(compare(newPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(newPassword, stored!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('will refuse a password reset if the token is incorrect', async () => {
      const data = createTestUser({
        ...TestUserData,
        passwordResetToken: token,
        passwordResetTokenExpiration: dayjs().add(2, 'hour').toDate(),
      });
      const user = new User(UserModel, data);
      await data.save();

      await expect(
        user.resetPassword('wrong', 'B(&G(g18h9H236f23ggT&^%&%*'),
      ).resolves.toBe(false);

      const stored = await UserModel.findById(user.id);
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, stored!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('will refuse a password reset if the token is expired', async () => {
      const data = createTestUser({
        ...TestUserData,
        passwordResetToken: token,
        passwordResetTokenExpiration: dayjs().subtract(2, 'hour').toDate(),
      });
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(false);

      const stored = await UserModel.findById(user.id);
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, stored!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('Will refuse a password reset a reset token has not been generated', async () => {
      const data = createTestUser(TestUserData);
      const user = new User(UserModel, data);
      await data.save();

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(false);

      const stored = await UserModel.findById(user.id);
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, stored!.passwordHash!)).resolves.toBe(true),
      ]);
    });
  });
});
