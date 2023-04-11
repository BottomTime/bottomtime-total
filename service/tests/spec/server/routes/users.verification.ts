import { Collection } from 'mongodb';
import { createMocks } from 'node-mocks-http';

import { Collections, UserDocument } from '../../../../src/data';
import { createTestLogger } from '../../../test-logger';
import { DefaultUser, User } from '../../../../src/users';
import { fakeProfile, fakeUser } from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { TestMailer } from '../../../utils/test-mailer';
import {
  requestVerificationEmail,
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

      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(InvalidOperationError);
      expect(requestToken).not.toBeCalled();
      expect(res._isEndCalled()).toBe(false);
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
    it.todo('Write tests for doing password resets');
  });
}
