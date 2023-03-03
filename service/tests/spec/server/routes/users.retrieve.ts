import { faker } from '@faker-js/faker';
import { createMocks } from 'node-mocks-http';
import { SortOrder, UserRole } from '../../../../src/constants';
import { MissingResourceError, ValidationError } from '../../../../src/errors';
import {
  getUser,
  loadUserAccount,
  searchUsers,
} from '../../../../src/server/routes/users';
import { User, UsersSortBy } from '../../../../src/users';
import { DefaultUser } from '../../../../src/users/default-user';
import { DefaultUserManager } from '../../../../src/users/default-user-manager';
import { fakeUser, fakeUserWithId } from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { createTestLogger } from '../../../test-logger';

const Log = createTestLogger('user-routes-retrieve');

export default function () {
  describe('Load User Middleware', () => {
    it('Will load the selected user onto the request object', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      const { req, res } = createMocks({
        log: Log,
        params: {
          username: user.username,
        },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(user);

      await loadUserAccount(req, res, next);

      expect(req.selectedUser).toEqual(user);
      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalledWith();
    });

    it('Will pass on a MissingResourceError if user cannot be found', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const { req, res } = createMocks({
        log: Log,
        params: {
          username: faker.internet.userName(),
        },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(undefined);

      await loadUserAccount(req, res, next);

      expect(req.selectedUser).toBeUndefined();
      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(MissingResourceError);
    });

    it('Will pass on an error if the user manager throws an exception', async () => {
      const error = Error('nope');
      const userManager = new DefaultUserManager(mongoClient, Log);
      const { req, res } = createMocks({
        log: Log,
        params: {
          username: faker.internet.userName(),
        },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockRejectedValue(error);

      await loadUserAccount(req, res, next);

      expect(req.selectedUser).toBeUndefined();
      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('Get User', () => {
    it('Will return info on the requested user', async () => {
      const data = fakeUserWithId();
      const adminData = fakeUserWithId({ role: UserRole.Admin });
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
      });
      const expected = JSON.parse(JSON.stringify(user));

      await getUser(req, res);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(expected);
    });
  });

  describe('Search Users', () => {
    it('Will perform a search using the options provided on the query string', async () => {
      const query = {
        query: 'Mike',
        role: UserRole.User,
        skip: 200,
        limit: 50,
        sortBy: UsersSortBy.MemberSince,
        sortOrder: SortOrder.Descending,
      };
      const adminData = fakeUser({ role: UserRole.Admin });
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const userManager = new DefaultUserManager(mongoClient, Log);
      const { req, res } = createMocks({
        user: admin,
        query,
        userManager,
      });
      const expectedUsers = new Array<User>(3);
      for (let i = 0; i < expectedUsers.length; i++) {
        expectedUsers[i] = new DefaultUser(mongoClient, Log, fakeUser());
      }
      const spy = jest
        .spyOn(userManager, 'searchUsers')
        .mockResolvedValue(expectedUsers);
      const next = jest.fn();

      await searchUsers(req, res, next);

      expect(next).not.toBeCalled();
      expect(spy).toBeCalledWith(query);
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        count: expectedUsers.length,
        results: expectedUsers.map((user) =>
          JSON.parse(JSON.stringify(user.toJSON())),
        ),
      });
    });

    [
      {
        name: 'Negative skip',
        query: { skip: -1 },
      },
      {
        name: 'Negative page size',
        query: { skip: 0, limit: -1 },
      },
      {
        name: 'Zero page size',
        query: { skip: 0, limit: 0 },
      },
      {
        name: 'Excessive page size',
        query: { skip: 0, limit: 9001 },
      },
      {
        name: 'Invalid sort by',
        query: { sortBy: 'mothers-maiden-name' },
      },
      {
        name: 'Invalid sort order',
        query: { sortOrder: 'backwards' },
      },
      {
        name: 'Invalid role filter',
        query: { role: 'ultra-admin' },
      },
    ].forEach((test) => {
      it(`Will throw a ValidationError if query string is invalid: ${test.name}`, async () => {
        const adminData = fakeUserWithId({ role: UserRole.Admin });
        const admin = new DefaultUser(mongoClient, Log, adminData);
        const userManager = new DefaultUserManager(mongoClient, Log);
        const { req, res } = createMocks({
          log: Log,
          user: admin,
          query: test.query,
          userManager,
        });
        const spy = jest.spyOn(userManager, 'searchUsers');
        const next = jest.fn();

        await searchUsers(req, res, next);

        expect(next).toBeCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
        expect(res._isEndCalled()).toBe(false);
        expect(spy).not.toBeCalled();
      });
    });

    it('Will return an error if an exception is thrown', async () => {
      const error = Error('Search fail');
      const adminData = fakeUserWithId({ role: UserRole.Admin });
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const userManager = new DefaultUserManager(mongoClient, Log);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        userManager,
      });
      jest.spyOn(userManager, 'searchUsers').mockRejectedValue(error);
      const next = jest.fn();

      await searchUsers(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });
}
