/* eslint-disable no-process-env */
import { createMocks } from 'node-mocks-http';

import { DefaultUser } from '../../../../src/users/default-user';
import { fakeUser } from '../../../fixtures/fake-user';
import {
  createJwtCookie,
  getCurrentUser,
  logout,
  requireAdmin,
  requireAuth,
  updateLastLoginAndRedirectHome,
  validateLogin,
} from '../../../../src/server/routes/auth';
import { mongoClient } from '../../../mongo-client';

import { createTestLogger } from '../../../test-logger';
import { faker } from '@faker-js/faker';
import { Mock, Times } from 'moq.ts';
import { User } from '../../../../src/users';
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../../../../src/errors';
import { UserRole } from '../../../../src/constants';

const Log = createTestLogger('auth-routes');
const CookieName = 'bottomtime.platform';

describe('Auth Routes', () => {
  let oldEnv: object;

  beforeAll(() => {
    oldEnv = Object.assign({}, process.env);
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  describe('Get Current User', () => {
    it('Will retrieve the current user profile', () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
      });
      const expected = JSON.parse(JSON.stringify(user.toJSON()));

      getCurrentUser(req, res);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getJSONData()).toEqual({
        ...expected,
        anonymous: false,
      });
    });

    it('Will return info on an anonymous user if no one is logged in', () => {
      const { req, res } = createMocks({
        log: Log,
      });

      getCurrentUser(req, res);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getJSONData()).toEqual({
        anonymous: true,
      });
    });
  });

  describe('Logging Out', () => {
    it('Will remove session cookie and redirect user back to home page', async () => {
      process.env.BT_SESSION_COOKIE_NAME = CookieName;
      const { req, res } = createMocks({
        cookies: {
          [CookieName]:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Rldi5ib3R0b210aS5tZS8iLCJzdWIiOiJ1c2VyfDRkYmVmN2RjLTY2YzgtNDllOC04YTVhLWQ3OGMzMjA0MmZlYyIsImV4cCI6MTY5MDQyODk1MTc4NCwiaWF0IjoxNjkwMzg1NzUxNzg0fQ.FyXdrAaX1NiqVKzLqACIR60--h5C6K3UybB3PrylJzA',
        },
        log: Log,
      });

      await logout(req, res);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toEqual(302);
      expect(res._getRedirectUrl()).toEqual('/');
      expect(res.cookies).toMatchSnapshot();
    });
  });

  describe('Creating JWT cookie', () => {
    beforeEach(() => {
      jest.useFakeTimers({
        doNotFake: ['nextTick', 'setImmediate'],
        now: 1690398501959,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('Will issue a cookie for the user', async () => {
      process.env.BT_SESSION_COOKIE_DOMAIN = 'https://dev.bottomti.me';
      process.env.BT_SESSION_COOKIE_NAME = 'bottomtime.platform.dev';
      process.env.BT_SESSION_COOKIE_TTL = '90';
      process.env.BT_SESSION_SECRET = 'omg_tested';
      const userId = 'ec4fc0e0-d58a-4814-b905-43394e37d02f';
      const username = faker.internet.userName();
      const user = new Mock<User>()
        .setup((u) => u.id)
        .returns(userId)
        .setup((u) => u.username)
        .returns(username)
        .setup((u) => u.updateLastLogin())
        .returnsAsync()
        .object();
      const { req, res } = createMocks({
        log: Log,
        user,
      });
      const next = jest.fn();

      await createJwtCookie(req, res, next);

      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
      expect(res.cookies).toMatchSnapshot();
    });

    it('Will return an error if no user is signed in', async () => {
      const { req, res } = createMocks({
        log: Log,
      });
      const next = jest.fn();
      await createJwtCookie(req, res, next);
      expect(next.mock.lastCall).toMatchSnapshot();
      expect(res._isEndCalled()).toBe(false);
      expect(res.cookies).toEqual({});
    });
  });

  describe('Asserting that a user is logged in', () => {
    it('Will allow the request if user is logged in', () => {
      const user = new Mock<User>().object();
      const { req, res } = createMocks({ log: Log, user });
      const next = jest.fn();
      requireAuth(req, res, next);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will block the request if user is not logged in', () => {
      const { req, res } = createMocks({ log: Log });
      const next = jest.fn();
      requireAuth(req, res, next);
      expect(next.mock.lastCall[0]).toBeInstanceOf(UnauthorizedError);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Asserting that a user is logged in as an admin', () => {
    it('Will allow the request if user is logged in as an admin', () => {
      const user = new Mock<User>()
        .setup((u) => u.role)
        .returns(UserRole.Admin)
        .object();
      const { req, res } = createMocks({ log: Log, user });
      const next = jest.fn();
      requireAdmin(req, res, next);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will block the request if user is not logged in', () => {
      const { req, res } = createMocks({ log: Log });
      const next = jest.fn();
      requireAdmin(req, res, next);
      expect(next.mock.lastCall[0]).toBeInstanceOf(UnauthorizedError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will block the request if the user is logged in as a non-admin', () => {
      const user = new Mock<User>()
        .setup((u) => u.role)
        .returns(UserRole.User)
        .object();
      const { req, res } = createMocks({ log: Log, user });
      const next = jest.fn();
      requireAdmin(req, res, next);
      expect(next.mock.lastCall[0]).toBeInstanceOf(ForbiddenError);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Validating login requests', () => {
    it('Will allow valid request bodies', () => {
      const { req, res } = createMocks({
        body: {
          usernameOrEmail: 'steve',
          password: 'abcd1234',
        },
        log: Log,
      });
      const next = jest.fn();
      validateLogin(req, res, next);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    [
      {
        name: 'Will fail if username is missing',
        body: {
          password: 'abcd1234',
        },
      },
      {
        name: 'Will fail if password is missing',
        body: {
          usernameOrEmail: 'steve',
        },
      },
    ].forEach((testCase) => {
      it(testCase.name, () => {
        const { req, res } = createMocks({ body: testCase.body, log: Log });
        const next = jest.fn();
        validateLogin(req, res, next);
        expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
        expect(res._isEndCalled()).toBe(false);
      });
    });
  });

  describe('Updating user last login and redirecting to home page', () => {
    it('Will update user login and redirect', async () => {
      const user = new Mock<User>()
        .setup((u) => u.updateLastLogin())
        .returnsAsync();
      const { req, res } = createMocks({
        log: Log,
        user: user.object(),
      });
      const next = jest.fn();
      await updateLastLoginAndRedirectHome(req, res, next);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getRedirectUrl()).toBe('/');
      user.verify((u) => u.updateLastLogin, Times.Once());
    });

    it('Will return an error if updating last login fails', async () => {
      const error = new Error('nope');
      const user = new Mock<User>()
        .setup((u) => u.updateLastLogin())
        .throwsAsync(error);
      const { req, res } = createMocks({
        log: Log,
        user: user.object(),
      });
      const next = jest.fn();
      await updateLastLoginAndRedirectHome(req, res, next);
      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return an error if no user is logged in', async () => {
      const { req, res } = createMocks({ log: Log });
      const next = jest.fn();
      await updateLastLoginAndRedirectHome(req, res, next);
      expect(next.mock.lastCall).toMatchSnapshot();
      expect(res._isEndCalled()).toBe(false);
    });
  });
});
