/* eslint-disable no-process-env */
import bcrypt, { compare } from 'bcrypt';
import { type Collection } from 'mongodb';
import { faker } from '@faker-js/faker';

import { ConflictError, ValidationError } from '../../../src/errors';
import { createTestLogger } from '../../test-logger';
import { DefaultUser } from '../../../src/users/default-user';
import { fakePassword, fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { Collections, type UserDocument } from '../../../src/data';
import { UserRole } from '../../../src/constants';
import { DefaultProfile } from '../../../src/users';

const Log = createTestLogger('default-user');

const TwoDaysInMinutes = 2 * 24 * 60;
const TwoDaysInMilliseconds = TwoDaysInMinutes * 60 * 1000;

describe('Default User', () => {
  let oldEnv: object;
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
    oldEnv = Object.assign({}, process.env);
    process.env.BT_TOKEN_TTL = TwoDaysInMinutes.toString();

    // Make hashing algorithm run fast-fast!!
    process.env.BT_PASSWORD_SALT_ROUNDS = '1';
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  it('Will return profile', () => {
    const data = fakeUser();
    const expected = new DefaultProfile(mongoClient, Log, data);
    const user = new DefaultUser(mongoClient, Log, data);
    const actual = user.profile;
    expect(actual).toEqual(expected);
  });

  describe('Changing Username', () => {
    it('Will change the username', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const newUsername = faker.internet.userName();
      const lowered = newUsername.toLocaleLowerCase();
      await Users.insertOne(data);

      await user.changeUsername(newUsername);

      expect(user.username).toEqual(newUsername);
      const result = await Users.findOne({ _id: data._id });
      expect(result).toBeDefined();
      expect(result?.username).toEqual(newUsername);
      expect(result?.usernameLowered).toEqual(lowered);
      expect(data.username).toEqual(newUsername);
      expect(data.usernameLowered).toEqual(lowered);
    });

    it('Will throw ConflictError if username is taken', async () => {
      const data = fakeUser();
      const other = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertMany([data, other]);

      await expect(
        user.changeUsername(other.username.toUpperCase()),
      ).rejects.toThrow(ConflictError);
    });

    it('Will throw ValidationError if username is invalid', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const invalid = ' ## NOt v@alid!';
      await Users.insertOne(data);
      await expect(user.changeUsername(invalid)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('Changing Email', () => {
    it("Will change a user's email address", async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const newEmail = faker.internet.email();
      const lowered = newEmail.toLowerCase();
      await Users.insertOne(data);

      await user.changeEmail(newEmail);

      expect(user.email).toEqual(newEmail);
      const result = await Users.findOne({ _id: data._id });
      expect(result).toBeDefined();
      expect(result?.email).toEqual(newEmail);
      expect(result?.emailLowered).toEqual(lowered);
      expect(result?.emailVerified).toBe(false);
      expect(data.email).toEqual(newEmail);
      expect(data.emailLowered).toEqual(lowered);
      expect(data.emailVerified).toBe(false);
    });

    it('Will throw a ConflictError if the email is taken', async () => {
      const existingUser = fakeUser();
      const otherUser = fakeUser();
      const user = new DefaultUser(mongoClient, Log, otherUser);
      await Users.insertMany([existingUser, otherUser]);

      await expect(user.changeEmail(existingUser.email!)).rejects.toThrowError(
        ConflictError,
      );

      expect(user.email).not.toEqual(existingUser.email);
    });

    it('Will throw a ValidationError if the email is invalid', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const invalid = ' ## NOt v@alid!';
      await Users.insertOne(data);
      await expect(user.changeEmail(invalid)).rejects.toThrow(ValidationError);
    });
  });

  describe('Changing Role', () => {
    it('Will change role', async () => {
      const data = fakeUser({ role: UserRole.Admin });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await user.changeRole(UserRole.User);

      expect(user.role).toEqual(UserRole.User);
      expect(data.role).toEqual(UserRole.User);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.role).toEqual(UserRole.User);
    });

    it('Will perform a no-op if the new role is the same as the old', async () => {
      const data = fakeUser({ role: UserRole.User });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await user.changeRole(UserRole.User);

      expect(user.role).toEqual(UserRole.User);
      expect(data.role).toEqual(UserRole.User);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.role).toEqual(UserRole.User);
    });
  });

  describe('Email Verification', () => {
    it('Will generate a verification token', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const expectedExpiration = new Date().valueOf() + TwoDaysInMilliseconds;
      await Users.insertOne(data);

      const token = await user.requestEmailVerificationToken();

      expect(token.length).toBeGreaterThan(20);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.emailVerificationToken).toEqual(token);
      expect(result?.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        expectedExpiration,
        -2,
      );
      expect(data.emailVerificationToken).toEqual(token);
      expect(data.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        expectedExpiration,
        -2,
      );
    });

    it('Will overwrite an existing token if one already exists', async () => {
      const data = fakeUser({
        emailVerificationToken: 'abc1235',
        emailVerificationTokenExpiration: new Date('2019-01-12'),
      });
      const user = new DefaultUser(mongoClient, Log, data);
      const expectedExpiration = new Date().valueOf() + TwoDaysInMilliseconds;
      await Users.insertOne(data);

      const token = await user.requestEmailVerificationToken();

      expect(token.length).toBeGreaterThan(20);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.emailVerificationToken).toEqual(token);
      expect(result?.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        expectedExpiration,
        -2,
      );
      expect(data.emailVerificationToken).toEqual(token);
      expect(data.emailVerificationTokenExpiration?.valueOf()).toBeCloseTo(
        expectedExpiration,
        -2,
      );
    });

    it('Will verify email if token is good', async () => {
      const token = faker.random.alphaNumeric(20);
      const expiration = faker.date.soon(15);
      const data = fakeUser({
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationTokenExpiration: expiration,
      });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.verifyEmail(token)).resolves.toBe(true);

      expect(user.emailVerified).toBe(true);
      expect(data.emailVerified).toBe(true);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.emailVerified).toBe(true);
    });

    it('Will not verify if token is expired', async () => {
      const token = faker.random.alphaNumeric(20);
      const expiration = faker.date.recent(20);
      const data = fakeUser({
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationTokenExpiration: expiration,
      });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.verifyEmail(token)).resolves.toBe(false);

      expect(user.emailVerified).toBe(false);
      expect(data.emailVerified).toBe(false);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.emailVerified).toBe(false);
    });

    it('Will not verify email if token is incorrect', async () => {
      const token = faker.random.alphaNumeric(20);
      const expiration = faker.date.soon(20);
      const data = fakeUser({
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationTokenExpiration: expiration,
      });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.verifyEmail('nope')).resolves.toBe(false);

      expect(user.emailVerified).toBe(false);
      expect(data.emailVerified).toBe(false);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.emailVerified).toBe(false);
    });

    it('Will not verify email if a token has not been generated', async () => {
      const token = faker.random.alphaNumeric(20);
      const data = fakeUser({
        emailVerified: false,
      });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.verifyEmail(token)).resolves.toBe(false);

      expect(user.emailVerified).toBe(false);
      expect(data.emailVerified).toBe(false);
      const result = await Users.findOne({ _id: data._id });
      expect(result?.emailVerified).toBe(false);
    });
  });

  describe('Changing Passwords', () => {
    it('Will change a password', async () => {
      const oldPassword = 'blah123';
      const newPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.changePassword(oldPassword, newPassword)).resolves.toBe(
        true,
      );

      const result = await Users.findOne({ _id: data._id });
      expect(data.lastPasswordChange?.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );
      expect(result?.lastPasswordChange?.valueOf()).toBeCloseTo(
        new Date().valueOf(),
        -2,
      );
      await Promise.all([
        expect(bcrypt.compare(newPassword, data.passwordHash!)).resolves.toBe(
          true,
        ),
        expect(
          bcrypt.compare(newPassword, result!.passwordHash!),
        ).resolves.toBe(true),
      ]);
    });

    it('Will not change a password if the old password does not mach', async () => {
      const oldPassword = 'blah123';
      const newPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(
        user.changePassword('not_Corr3ct!!', newPassword),
      ).resolves.toBe(false);

      const result = await Users.findOne({ _id: data._id });
      expect(data.lastPasswordChange).toBeUndefined();
      expect(result?.lastPasswordChange).toBeUndefined();
      await Promise.all([
        expect(bcrypt.compare(oldPassword, data.passwordHash!)).resolves.toBe(
          true,
        ),
        expect(
          bcrypt.compare(oldPassword, result!.passwordHash!),
        ).resolves.toBe(true),
      ]);
    });

    it('Will not change a password if the new password does not meet strength requirements', async () => {
      const oldPassword = 'blah123';
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(
        user.changePassword(oldPassword, 'too weak'),
      ).rejects.toThrowError(ValidationError);

      const result = await Users.findOne({ _id: data._id });
      expect(data.lastPasswordChange).toBeUndefined();
      expect(result?.lastPasswordChange).toBeUndefined();
      await Promise.all([
        expect(bcrypt.compare(oldPassword, data.passwordHash!)).resolves.toBe(
          true,
        ),
        expect(
          bcrypt.compare(oldPassword, result!.passwordHash!),
        ).resolves.toBe(true),
      ]);
    });

    it('Will not change a password if the user does not yet have a password set', async () => {
      const newPassword = fakePassword();
      const data = fakeUser({}, null);
      const user = new DefaultUser(mongoClient, Log, data);
      expect(user.hasPassword).toBe(false);
      await Users.insertOne(data);

      await expect(
        user.changePassword('not_Corr3ct!!', newPassword),
      ).resolves.toBe(false);

      const result = await Users.findOne({ _id: data._id });
      expect(data.lastPasswordChange).toBeUndefined();
      expect(result?.lastPasswordChange).toBeUndefined();
      expect(data.passwordHash).toBeUndefined();
      expect(result?.passwordHash).toBeUndefined();
    });
  });

  describe('Resetting Passwords', () => {
    it('Will forcefully reset a password', async () => {
      const data = fakeUser();
      const newPassword = fakePassword();
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await user.forceResetPassword(newPassword);

      const result = await Users.findOne({ _id: data._id });
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

    it('Will not allow a forceful password reset if new password does not meet strength requirements', async () => {
      const oldPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.forceResetPassword('too weak')).rejects.toThrowError(
        ValidationError,
      );

      const result = await Users.findOne({ _id: data._id });
      expect(data.lastPasswordChange).toBeUndefined();
      expect(result?.lastPasswordChange).toBeUndefined();
      await Promise.all([
        expect(compare(oldPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(oldPassword, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('Will generate a password reset token', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      const token = await user.requestPasswordResetToken();

      expect(token.length).toBeGreaterThan(20);

      const result = await Users.findOne({ _id: data._id });
      expect(data.passwordResetToken).toEqual(token);
      expect(data.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        new Date().valueOf() + TwoDaysInMilliseconds,
        -2,
      );
      expect(result?.passwordResetToken).toEqual(token);
      expect(result?.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        new Date().valueOf() + TwoDaysInMilliseconds,
        -2,
      );
    });

    it('Will overwrite an existing password reset token', async () => {
      const data = fakeUser({
        passwordResetToken: faker.random.alphaNumeric(25),
        passwordResetTokenExpiration: faker.date.recent(21),
      });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      const token = await user.requestPasswordResetToken();

      expect(token.length).toBeGreaterThan(20);

      const result = await Users.findOne({ _id: data._id });
      expect(data.passwordResetToken).toEqual(token);
      expect(data.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        new Date().valueOf() + TwoDaysInMilliseconds,
        -2,
      );
      expect(result?.passwordResetToken).toEqual(token);
      expect(result?.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        new Date().valueOf() + TwoDaysInMilliseconds,
        -2,
      );
    });

    it('Will reset a password with token', async () => {
      const token = faker.random.alphaNumeric(25);
      const newPassword = fakePassword();
      const data = fakeUser({
        passwordResetToken: token,
        passwordResetTokenExpiration: faker.date.soon(20),
      });
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(true);

      const result = await Users.findOne({ _id: data._id });
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

    it('Will refuse a password reset if the token is incorrect', async () => {
      const token = faker.random.alphaNumeric(25);
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser(
        {
          passwordResetToken: token,
          passwordResetTokenExpiration: faker.date.soon(20),
        },
        oldPassword,
      );
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.resetPassword('wrong', newPassword)).resolves.toBe(
        false,
      );

      const result = await Users.findOne({ _id: data._id });
      await Promise.all([
        expect(compare(oldPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(oldPassword, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('Will refuse a password reset if the token is expired', async () => {
      const token = faker.random.alphaNumeric(25);
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser(
        {
          passwordResetToken: token,
          passwordResetTokenExpiration: faker.date.recent(20),
        },
        oldPassword,
      );
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(false);

      const result = await Users.findOne({ _id: data._id });
      await Promise.all([
        expect(compare(oldPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(oldPassword, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('Will refuse a password reset a reset token has not been generated', async () => {
      const token = faker.random.alphaNumeric(25);
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.resetPassword(token, newPassword)).resolves.toBe(false);

      const result = await Users.findOne({ _id: data._id });
      await Promise.all([
        expect(compare(oldPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(oldPassword, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });

    it('Will refuse a password reset if the new password does not meet strength requirements', async () => {
      const token = faker.random.alphaNumeric(25);
      const oldPassword = fakePassword();
      const data = fakeUser(
        {
          passwordResetToken: token,
          passwordResetTokenExpiration: faker.date.soon(20),
        },
        oldPassword,
      );
      const user = new DefaultUser(mongoClient, Log, data);
      await Users.insertOne(data);

      await expect(user.resetPassword(token, 'too weak')).rejects.toThrowError(
        ValidationError,
      );

      const result = await Users.findOne({ _id: data._id });
      await Promise.all([
        expect(compare(oldPassword, data.passwordHash!)).resolves.toBe(true),
        expect(compare(oldPassword, result!.passwordHash!)).resolves.toBe(true),
      ]);
    });
  });

  describe('Locking and Unlocking Accounts', () => {
    [false, true].forEach((isLocked) => {
      it(`Will toggle account isLocked to ${isLocked}`, async () => {
        const data = fakeUser({ isLockedOut: isLocked });
        const user = new DefaultUser(mongoClient, Log, data);
        await Users.insertOne(data);

        if (isLocked) await user.unlockAccount();
        else await user.lockAccount();

        const result = await Users.findOne({ _id: data._id });
        expect(user.isLockedOut).toBe(!isLocked);
        expect(data.isLockedOut).toBe(!isLocked);
        expect(result?.isLockedOut).toBe(!isLocked);
      });

      it(`Will be a no-op if account isLocked is already ${isLocked}`, async () => {
        const data = fakeUser({ isLockedOut: isLocked });
        const user = new DefaultUser(mongoClient, Log, data);
        await Users.insertOne(data);

        if (isLocked) await user.lockAccount();
        else await user.unlockAccount();

        const result = await Users.findOne({ _id: data._id });
        expect(user.isLockedOut).toBe(isLocked);
        expect(data.isLockedOut).toBe(isLocked);
        expect(result?.isLockedOut).toBe(isLocked);
      });
    });
  });
});
