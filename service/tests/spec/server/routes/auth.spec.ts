import { createMocks } from 'node-mocks-http';
import { faker } from '@faker-js/faker';

import { DefaultUser } from '../../../../src/users/default-user';
import { fakeUser } from '../../../fixtures/fake-user';
import { getCurrentUser, logout } from '../../../../src/server/routes/auth';
import { mongoClient } from '../../../mongo-client';

import { createTestLogger } from '../../../test-logger';

const Log = createTestLogger('auth-routes');

describe('Auth Routes', () => {
  describe('Get Current User', () => {
    it('Will retrieve the current user profile', () => {
      const sessionID = faker.datatype.uuid();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        sessionID,
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
      const sessionID = faker.datatype.uuid();
      const { req, res } = createMocks({
        sessionID,
        log: Log,
      });

      getCurrentUser(req, res);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getJSONData()).toEqual({
        id: sessionID,
        anonymous: true,
      });
    });
  });

  describe('Logging Out', () => {
    it('Will end a user session', async () => {
      const spy = jest
        .fn()
        .mockImplementation((options: unknown, cb: (error?: any) => void) => {
          expect(options).toEqual({ keepSessionInfo: false });
          cb();
        });
      const { req, res } = createMocks({
        log: Log,
        logout: spy,
      });
      const next = jest.fn();

      await logout(req, res, next);

      expect(spy).toBeCalled();
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toEqual(302);
      expect(res._getRedirectUrl()).toEqual('/');
    });

    it('Will return an error if session store throws an exception', async () => {
      const error = new Error('Uh oh! Session store is broken.');
      const spy = jest
        .fn()
        .mockImplementation((options: unknown, cb: (error?: any) => void) => {
          expect(options).toEqual({ keepSessionInfo: false });
          cb(error);
        });
      const { req, res } = createMocks({
        log: Log,
        logout: spy,
      });
      const next = jest.fn();

      await logout(req, res, next);

      expect(spy).toBeCalled();
      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });
});
