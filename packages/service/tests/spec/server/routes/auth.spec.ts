/* eslint-disable no-process-env */
import { createMocks } from 'node-mocks-http';

import { DefaultUser } from '../../../../src/users/default-user';
import { fakeUser } from '../../../fixtures/fake-user';
import { getCurrentUser, logout } from '../../../../src/server/routes/auth';
import { mongoClient } from '../../../mongo-client';

import { createTestLogger } from '../../../test-logger';

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
});
