import { Collection } from 'mongodb';
import { createMocks } from 'node-mocks-http';

import { Collections, UserDocument } from '../../../../src/data';
import { createTestLogger } from '../../../test-logger';
import { DefaultUser, DefaultUserManager, User } from '../../../../src/users';
import {
  fakePassword,
  fakeProfile,
  fakeUser,
} from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { TestMailer } from '../../../utils/test-mailer';
import {
  requestPasswordResetEmail,
  requestVerificationEmail,
  resetPassword,
  verifyEmail,
} from '../../../../src/server/routes/users';
import { InvalidOperationError, ValidationError } from '../../../../src/errors';

const Log = createTestLogger('users-verification-routes');

export default function () {
  const mailClient = new TestMailer();
  let user: User;
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
  });

  beforeEach(async () => {
    const data = fakeUser({
      username: 'jake_f123',
      email: 'jake123@company.org',
      profile: fakeProfile({
        name: 'Jimmy F.',
      }),
    });
    user = new DefaultUser(mongoClient, Log, data);
    await Users.insertOne(data);
  });

  afterEach(() => {
    mailClient.clearMessages();
  });

  describe('Email Verification', () => {
    it('Will send a verification token to the user on demand', async () => {
      const token = 'secrettoken';
      const { req, res } = createMocks({
        log: Log,
        mail: mailClient,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      jest
        .spyOn(user, 'requestEmailVerificationToken')
        .mockResolvedValue(token);

      await requestVerificationEmail(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);

      expect(mailClient.sentMail).toHaveLength(1);
      expect(mailClient.sentMail[0].recipients).toEqual({ to: user.email });
      expect(mailClient.sentMail[0].subject).toMatchSnapshot();
      expect(mailClient.sentMail[0].body).toMatchSnapshot();
    });

    it('Will return an InvalidOperation error if the user does not have an email address', async () => {
      const userData = fakeUser();
      delete userData.email;
      delete userData.emailLowered;
      await Users.insertOne(userData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        mail: mailClient,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const requestToken = jest
        .spyOn(user, 'requestEmailVerificationToken')
        .mockResolvedValue('');

      await requestVerificationEmail(req, res, next);

      expect(next).not.toBeCalled();
      expect(requestToken).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getJSONData()).toEqual({ succeeded: false });
      expect(mailClient.sentMail).toHaveLength(0);
    });

    it('Will return a server error when requesting a token if MongoDB throws an exception', async () => {
      const error = new Error('Nope!!');
      const { req, res } = createMocks({
        log: Log,
        mail: mailClient,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      jest
        .spyOn(user, 'requestEmailVerificationToken')
        .mockRejectedValue(error);

      await requestVerificationEmail(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
      expect(mailClient.sentMail).toHaveLength(0);
    });

    [true, false].forEach((result) => {
      it(`Will return the result of email verification if result is ${result}`, async () => {
        const token = 'valid-token';
        const { req, res } = createMocks({
          log: Log,
          body: { token },
          selectedUser: user,
          user,
        });
        const next = jest.fn();
        const verify = jest
          .spyOn(user, 'verifyEmail')
          .mockResolvedValue(result);

        await verifyEmail(req, res, next);

        expect(next).not.toBeCalled();
        expect(verify).toBeCalledWith(token);
        expect(res._isEndCalled()).toBe(true);
        expect(res._getJSONData()).toEqual({ verified: result });
      });
    });

    it('Will return a ValidationError if request body is invalid', async () => {
      const { req, res } = createMocks({
        log: Log,
        body: { emailToken: 'not-valid' },
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const verify = jest.spyOn(user, 'verifyEmail').mockResolvedValue(true);

      await verifyEmail(req, res, next);

      expect(verify).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a ValidationError if request body is missing', async () => {
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const verify = jest.spyOn(user, 'verifyEmail').mockResolvedValue(true);

      await verifyEmail(req, res, next);

      expect(verify).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a ServerError if an exception occurs while updating the database', async () => {
      const error = new Error('Failed to MongoDB');
      const token = 'valid-token';
      const { req, res } = createMocks({
        log: Log,
        body: { token },
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const verify = jest.spyOn(user, 'verifyEmail').mockRejectedValue(error);

      await verifyEmail(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(verify).toBeCalledWith(token);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Password Resets', () => {
    it('Will request a password reset email with a token', async () => {
      const mail = new TestMailer();
      const userData = fakeUser({
        username: 'turbo667',
        email: 'jmcmurray@yahoo.org',
        profile: fakeProfile({
          name: 'Jerry M.',
        }),
      });
      const token = '289fh3028hf98rh28rh02h';
      const user = new DefaultUser(mongoClient, Log, userData);
      const userManager = new DefaultUserManager(mongoClient, Log);

      const { req, res } = createMocks({
        log: Log,
        mail,
        params: {
          username: user.username,
        },
        userManager,
      });
      const next = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(user);
      jest.spyOn(user, 'requestPasswordResetToken').mockResolvedValue(token);

      await requestPasswordResetEmail(req, res, next);

      expect(getUser).toBeCalledWith(user.username);
      expect(next).not.toBeCalled();
      expect(res._getStatusCode()).toBe(204);
      expect(res._isEndCalled()).toBe(true);

      expect(mail.sentMail).toHaveLength(1);
      expect(mail.sentMail[0].recipients).toEqual({ to: user.email });
      expect(mail.sentMail[0].body).toMatchSnapshot();
    });

    it('Will fail silently when requesting a reset token for a non-existent user', async () => {
      const mail = new TestMailer();
      const userManager = new DefaultUserManager(mongoClient, Log);

      const { req, res } = createMocks({
        log: Log,
        mail,
        params: {
          username: user.username,
        },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(undefined);

      await requestPasswordResetEmail(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._getStatusCode()).toBe(204);
      expect(res._isEndCalled()).toBe(true);
      expect(mail.sentMail).toHaveLength(0);
    });

    it('Will fail silently when requesting a reset token for a user with no email address specified', async () => {
      const mail = new TestMailer();
      const userData = fakeUser();
      delete userData.email;
      delete userData.emailLowered;
      const user = new DefaultUser(mongoClient, Log, userData);
      const userManager = new DefaultUserManager(mongoClient, Log);

      const { req, res } = createMocks({
        log: Log,
        mail,
        params: {
          username: user.username,
        },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(user);
      const getToken = jest.spyOn(user, 'requestPasswordResetToken');

      await requestPasswordResetEmail(req, res, next);

      expect(next).not.toBeCalled();
      expect(getToken).not.toBeCalled();
      expect(res._getStatusCode()).toBe(204);
      expect(res._isEndCalled()).toBe(true);
      expect(mail.sentMail).toHaveLength(0);
    });

    it('Will fail silently if an exception is thrown when requesting a password reset email', async () => {
      const error = new Error('Oops!');
      const mail = new TestMailer();
      const userManager = new DefaultUserManager(mongoClient, Log);

      const { req, res } = createMocks({
        log: Log,
        mail,
        params: {
          username: 'Bev47',
        },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockRejectedValue(error);

      await requestPasswordResetEmail(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
      expect(mail.sentMail).toHaveLength(0);
    });

    it('Will reset a password if the token is correct', async () => {
      const token = 'abc133';
      const newPassword = fakePassword();
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);

      const { req, res } = createMocks({
        body: {
          token,
          newPassword,
        },
        log: Log,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const spy = jest.spyOn(user, 'resetPassword').mockResolvedValue(true);

      await resetPassword(req, res, next);

      expect(next).not.toBeCalled();
      expect(spy).toBeCalledWith(token, newPassword);
      expect(res._isEndCalled()).toBe(true);
      expect(res._getJSONData()).toEqual({ succeeded: true });
    });

    it('Will indicate failure if a request to reset a password is rejected', async () => {
      const token = 'abc133';
      const newPassword = fakePassword();
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);

      const { req, res } = createMocks({
        body: {
          token,
          newPassword,
        },
        log: Log,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const spy = jest.spyOn(user, 'resetPassword').mockResolvedValue(false);

      await resetPassword(req, res, next);

      expect(next).not.toBeCalled();
      expect(spy).toBeCalledWith(token, newPassword);
      expect(res._isEndCalled()).toBe(true);
      expect(res._getJSONData()).toEqual({ succeeded: false });
    });

    [
      {
        name: 'New password is missing',
        body: {
          token: 'f92843h',
        },
      },
      {
        name: 'Token is missing',
        body: {
          newPassword: fakePassword(),
        },
      },
      {
        name: 'New password is weak',
        body: {
          token: 'f3982h2000',
          newPassword: 'too weak',
        },
      },
      {
        name: 'Request body is missing',
      },
    ].forEach((testCase) => {
      it(`Will return a ValidationError if the request body is invalid when resetting a password: ${testCase.name}`, async () => {
        const userData = fakeUser();
        const user = new DefaultUser(mongoClient, Log, userData);

        const { req, res } = createMocks({
          body: testCase.body,
          log: Log,
          selectedUser: user,
          user,
        });
        const next = jest.fn();
        const spy = jest.spyOn(user, 'resetPassword').mockResolvedValue(false);

        await resetPassword(req, res, next);

        expect(next).toBeCalled();
        expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
        expect(spy).not.toBeCalled();
        expect(res._isEndCalled()).toBe(false);
      });
    });

    it('Will return a server error if an exception is thrown while resetting a password', async () => {
      const token = 'abc133';
      const error = new Error('lol');
      const newPassword = fakePassword();
      const userData = fakeUser({
        passwordResetToken: token,
        passwordResetTokenExpiration: new Date(Date.now() + 10000),
      });
      const user = new DefaultUser(mongoClient, Log, userData);

      const { req, res } = createMocks({
        body: {
          token,
          newPassword,
        },
        log: Log,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      const spy = jest.spyOn(user, 'resetPassword').mockRejectedValue(error);

      await resetPassword(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(spy).toBeCalledWith(token, newPassword);
      expect(res._isEndCalled()).toBe(false);
    });
  });
}
