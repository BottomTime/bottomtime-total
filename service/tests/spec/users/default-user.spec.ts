import { type Collection } from 'mongodb';
import { faker } from '@faker-js/faker';

import config from '../../../src/config';
import { ConflictError, ValidationError } from '../../../src/errors';
import { createTestLogger } from '../../test-logger';
import { DefaultUser } from '../../../src/users/default-user';
import { fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { Collections, type UserDocument } from '../../../src/data';
import { UserRole } from '../../../src/constants';

const Log = createTestLogger('default-user');

describe('Default User', () => {
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
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
      const expectedExpiration =
        new Date().valueOf() + config.emailTokenTTL * 60000;
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
      const expectedExpiration =
        new Date().valueOf() + config.emailTokenTTL * 60000;
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
      const expiration = new Date();
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

    it('Will not verify if token is expired', async () => {});

    it('Will not verify email if token is incorrect', async () => {});

    it('Will not verify email if a token has not been generated', async () => {});
  });
});
