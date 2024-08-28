import {
  AccountTier,
  PasswordResetTokenStatus,
  UserRole,
} from '@bottomtime/api';

import { ConflictException } from '@nestjs/common';

import { compare } from 'bcryptjs';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';

import { Config } from '../../../src/config';
import { UserEntity } from '../../../src/data';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils';

jest.mock('../../../src/config');

const Password = '%HBc..`9Cbt]3/S';
const TestUserData: Partial<UserEntity> = {
  id: '0050bf4c-faf4-4b06-be96-26954c983764',
  accountTier: AccountTier.Basic,
  email: 'Emerson69@yahoo.com',
  emailLowered: 'emerson69@yahoo.com',
  emailVerified: false,
  isLockedOut: false,
  lastLogin: new Date('2023-12-01T08:44:35.319Z'),
  memberSince: new Date('2019-05-22T18:13:33.864Z'),
  passwordHash: '$2b$04$4VgfGazqB.bjgESl5S0yeu8XmZgDLU7k6u0NCdTmIFSa8sfX8CvYG',
  role: UserRole.User,
  username: 'Emerson_Kohler',
  usernameLowered: 'emerson_kohler',
  avatar:
    'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/876.jpg',
  bio: 'Placeat magnam repudiandae eos velit labore. Molestias repellat magnam molestias possimus minus corrupti nihil nesciunt. Facilis aliquid ab harum saepe architecto quidem sunt dignissimos magnam. Culpa excepturi ex provident quibusdam quam. Similique eius deleniti nam vitae autem et. Quod ea modi facilis quam saepe sequi quis temporibus accusamus. Porro doloribus necessitatibus numquam. Impedit dolores quam hic fuga.',
  experienceLevel: 'Professional',
  location: 'Baldwin Park',
  name: 'Luther Blick',
  startedDiving: '1986',
};

describe('User Class', () => {
  let Users: Repository<UserEntity>;
  let data: UserEntity;
  let user: User;

  beforeAll(() => {
    Config.passwordSaltRounds = 1;
    Users = dataSource.getRepository(UserEntity);
  });

  beforeEach(() => {
    data = new UserEntity();
    Object.assign(data, TestUserData);
    user = new User(Users, data);
  });

  it('will change the username', async () => {
    const newUsername = 'Mike.Durbin';
    await Users.save(data);

    await user.changeUsername(newUsername);
    expect(user.username).toEqual(newUsername);

    const stored = await Users.findOneBy({ id: user.id });
    expect(stored!.username).toEqual(newUsername);
    expect(stored!.usernameLowered).toEqual(newUsername.toLowerCase());
  });

  it('will throw a ConflictException if username is taken', async () => {
    const existingUser = createTestUser();
    await Promise.all([Users.save(existingUser), Users.save(data)]);
    await expect(
      user.changeUsername(existingUser.username),
    ).rejects.toThrowError(ConflictException);
  });

  it('will change the email address', async () => {
    const newEmail = 'Degenerate.Rat33@hotmail.com';
    await Users.save(data);

    await user.changeEmail(newEmail);
    expect(user.email).toEqual(newEmail);

    const stored = await Users.findOneBy({ id: user.id });
    expect(stored!.email).toEqual(newEmail);
    expect(stored!.emailLowered).toEqual(newEmail.toLowerCase());
  });

  it('will throw a ConflictException if email is taken', async () => {
    const existingUser = createTestUser();
    await Promise.all([Users.save(existingUser), Users.save(data)]);
    await expect(user.changeEmail(existingUser.email!)).rejects.toThrowError(
      ConflictException,
    );
  });

  describe('when verifying email addresses', () => {
    it('will generate a verification token', async () => {
      await Users.save(data);

      const token = await user.requestEmailVerificationToken();
      expect(token.length).toBeGreaterThan(20);

      const stored = await Users.findOneBy({ id: user.id });
      expect(stored!.emailVerificationToken).toEqual(token);
      expect(stored!.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs(new Date()).add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will overwrite an existing token if one already exists', async () => {
      data.emailVerificationToken = 'abc123';
      data.emailVerificationTokenExpiration = new Date();
      await Users.save(data);

      const token = await user.requestEmailVerificationToken();

      expect(token.length).toBeGreaterThan(20);

      const stored = await Users.findOneBy({ id: user.id });
      expect(stored!.emailVerificationToken).toEqual(token);
      expect(stored!.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs().add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will verify email if token is good', async () => {
      const token = 'abcd1234';
      const expiration = dayjs().add(3, 'hour').toDate();
      data.emailVerificationToken = token;
      data.emailVerificationTokenExpiration = expiration;
      await Users.save(data);

      await expect(user.verifyEmail(token)).resolves.toBe(true);

      const stored = await Users.findOneBy({ id: user.id });
      expect(user.emailVerified).toBe(true);
      expect(stored!.emailVerified).toBe(true);
    });

    it('Will not verify email if a token has not been generated', async () => {
      const token = 'abcd1234';
      await Users.save(data);

      await expect(user.verifyEmail(token)).resolves.toBe(false);

      const stored = await Users.findOneBy({ id: user.id });
      expect(user.emailVerified).toBe(false);
      expect(stored!.emailVerified).toBe(false);
    });

    it('will not verify if token is expired', async () => {
      const token = 'abcd1234';
      const expiration = dayjs().subtract(3, 'hour').toDate();
      data.emailVerificationToken = token;
      data.emailVerificationTokenExpiration = expiration;
      await Users.save(data);

      await expect(user.verifyEmail(token)).resolves.toBe(false);

      const stored = await Users.findOneBy({ id: user.id });
      expect(user.emailVerified).toBe(false);
      expect(stored!.emailVerified).toBe(false);
    });

    it('Will not verify email if token is incorrect', async () => {
      const token = 'abcd1234';
      const expiration = dayjs().add(3, 'hour').toDate();
      data.emailVerificationToken = token;
      data.emailVerificationTokenExpiration = expiration;
      await Users.save(data);

      await expect(user.verifyEmail('wrong')).resolves.toBe(false);

      const stored = await Users.findOneBy({ id: user.id });
      expect(user.emailVerified).toBe(false);
      expect(stored!.emailVerified).toBe(false);
    });
  });

  describe('when changing passwords', () => {
    it('Will change a password', async () => {
      const newPassword = 'faw09*(*afoewnaowOHUPO';
      await Users.save(data);

      await expect(user.changePassword(Password, newPassword)).resolves.toBe(
        true,
      );

      const result = await Users.findOneBy({ id: user.id });
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
      data.lastPasswordChange = null;
      data.passwordHash = null;
      await Users.save(data);

      await expect(user.changePassword(Password, newPassword)).resolves.toBe(
        false,
      );

      const result = await Users.findOneBy({ id: user.id });
      expect(data.lastPasswordChange).toBeNull();
      expect(data.passwordHash).toBeNull();
      expect(result!.lastPasswordChange).toBeNull();
      expect(result!.passwordHash).toBeNull();
    });

    it('will not change a password if the old password does not mach', async () => {
      const newPassword = 'faw09*(*afoewnaowOHUPO';
      data.lastPasswordChange = null;
      await Users.save(data);

      await expect(
        user.changePassword('not_Corr3ct!!', newPassword),
      ).resolves.toBe(false);

      const result = await Users.findOneBy({ id: user.id });
      expect(data.lastPasswordChange).toBeNull();
      expect(result!.lastPasswordChange).toBeNull();
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });
  });

  describe('when changing membership', () => {
    it('will change the account tier', async () => {
      const newTier = AccountTier.ShopOwner;
      await Users.save(data);

      await user.changeMembership(newTier);

      const stored = await Users.findOneByOrFail({ id: user.id });
      expect(user.accountTier).toEqual(newTier);
      expect(stored.accountTier).toEqual(newTier);
    });
  });

  describe('when validating a password reset token', () => {
    const token = 'llen5RTYeaIf_emwsGb-B8BPVEbT4YsAbo5A580bsxo';

    it('will return valid if the token is valid', () => {
      const data = createTestUser({
        ...TestUserData,
        passwordResetToken: token,
        passwordResetTokenExpiration: new Date(Date.now() + 20000),
      });
      const user = new User(Users, data);

      expect(user.validatePasswordResetToken(token)).toBe(
        PasswordResetTokenStatus.Valid,
      );
    });

    it('will return invalid if the token is incorrect', () => {
      const data = createTestUser({
        ...TestUserData,
        passwordResetToken: token,
        passwordResetTokenExpiration: new Date(Date.now() + 20000),
      });
      const user = new User(Users, data);

      expect(user.validatePasswordResetToken('nope')).toBe(
        PasswordResetTokenStatus.Invalid,
      );
    });

    it('wil return invalid if the user does not have a password reset token set', () => {
      const data = createTestUser(TestUserData);
      const user = new User(Users, data);

      expect(user.validatePasswordResetToken('nope')).toBe(
        PasswordResetTokenStatus.Invalid,
      );
    });

    it('will return expired if the token is expired', () => {
      const data = createTestUser({
        ...TestUserData,
        passwordResetToken: token,
        passwordResetTokenExpiration: new Date(Date.now() - 20000),
      });
      const user = new User(Users, data);

      expect(user.validatePasswordResetToken(token)).toBe(
        PasswordResetTokenStatus.Expired,
      );
    });
  });

  describe('when resetting passwords', () => {
    const token = 'llen5RTYeaIf_emwsGb-B8BPVEbT4YsAbo5A580bsxo';
    const newPassword = 'B(&G(g18h9H236f23ggT&^%&%*';

    it('will generate a password reset token', async () => {
      const data = createTestUser(TestUserData);
      const user = new User(Users, data);
      await Users.save(data);

      const token = await user.requestPasswordResetToken();
      expect(token.length).toBeGreaterThan(20);

      expect(data.passwordResetToken).toEqual(token);

      const stored = await Users.findOneBy({ id: user.id });
      expect(stored!.passwordResetToken).toEqual(token);
      expect(stored!.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        dayjs().add(2, 'day').valueOf(),
        -2,
      );
    });

    it('will overwrite an existing password reset token', async () => {
      data.passwordResetToken = 'abc123';
      data.passwordResetTokenExpiration = new Date();
      await Users.save(data);

      const token = await user.requestPasswordResetToken();
      expect(token.length).toBeGreaterThan(20);

      expect(data.passwordResetToken).toEqual(token);

      const stored = await Users.findOneBy({ id: user.id });
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
      const user = new User(Users, data);
      await Users.save(data);

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(true);
      const stored = await Users.findOneBy({ id: user.id });
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
      data.passwordResetToken = token;
      data.passwordResetTokenExpiration = dayjs().add(2, 'hour').toDate();
      await Users.save(data);

      await expect(
        user.resetPassword('wrong', 'B(&G(g18h9H236f23ggT&^%&%*'),
      ).resolves.toBe(false);

      const stored = await Users.findOneBy({ id: user.id });
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
      data.passwordResetToken = token;
      data.passwordResetTokenExpiration = dayjs().subtract(2, 'hour').toDate();
      await Users.save(data);

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(false);

      const stored = await Users.findOneBy({ id: user.id });
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, stored!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('Will refuse a password reset a reset token has not been generated', async () => {
      const data = createTestUser(TestUserData);
      const user = new User(Users, data);
      await Users.save(data);

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(false);

      const stored = await Users.findOneBy({ id: user.id });
      await Promise.all([
        expect(compare(Password, data.passwordHash!)).resolves.toBe(true),
        expect(compare(Password, stored!.passwordHash!)).resolves.toBe(true),
      ]);
    });
  });

  it('will attach a Stripe customer ID', async () => {
    const stripeCustomerId = 'cus_1234';
    const user = new User(Users, data);
    await Users.save(data);

    await user.attachStripeCustomerId(stripeCustomerId);

    expect(user.stripeCustomerId).toEqual(stripeCustomerId);
    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.stripeCustomerId).toEqual(stripeCustomerId);
  });
});
