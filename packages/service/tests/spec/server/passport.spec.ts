import { createRequest } from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import { It, Mock } from 'moq.ts';

import { createTestLogger } from '../../test-logger';
import { fakePassword, fakeUser } from '../../fixtures/fake-user';
import {
  loginWithPassword,
  verifyJwtToken,
} from '../../../src/server/passport';
import { User, UserManager } from '../../../src/users';
import { JwtPayload } from '../../../src/server/jwt';

const Log = createTestLogger('passport-callbacks');

describe('Passport Callbacks', () => {
  describe('Local Strategy Callback', () => {
    it('Will return a user if successful', async () => {
      const username = faker.internet.userName();
      const password = fakePassword();
      const userData = fakeUser(
        {
          username,
        },
        password,
      );
      const user = new Mock<User>()
        .setup((u) => u.username)
        .returns(username)
        .setup((u) => u.id)
        .returns(userData._id)
        .object();
      const userManager = new Mock<UserManager>()
        .setup((um) => um.authenticateUser(username, password))
        .returnsAsync(user)
        .object();
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();

      await loginWithPassword(req, username, password, cb);

      expect(cb).toBeCalledWith(null, user);
    });

    it('Will return false if unsuccessful', async () => {
      const username = faker.internet.userName();
      const password = fakePassword();
      const userManager = new Mock<UserManager>()
        .setup((um) => um.authenticateUser(username, password))
        .returnsAsync(undefined)
        .object();
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();

      await loginWithPassword(req, username, password, cb);

      expect(cb).toBeCalledWith(null, false);
    });

    it('Will return an error if an exception occurs', async () => {
      const error = new Error('nope');
      const username = faker.internet.userName();
      const password = fakePassword();
      const userManager = new Mock<UserManager>()
        .setup((um) => um.authenticateUser(username, password))
        .throwsAsync(error)
        .object();
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();

      await loginWithPassword(req, username, password, cb);

      expect(cb).toBeCalledWith(error);
    });
  });

  describe('Deserializing user from JWT', () => {
    let user: User;
    let lockedUser: User;
    let userManager: UserManager;
    let payload: JwtPayload;

    beforeAll(() => {
      const userId = faker.datatype.uuid();
      const lockedUserId = faker.datatype.uuid();
      user = new Mock<User>()
        .setup((u) => u.username)
        .returns(faker.internet.userName())
        .setup((u) => u.id)
        .returns(userId)
        .setup((u) => u.isLockedOut)
        .returns(false)
        .object();
      lockedUser = new Mock<User>()
        .setup((u) => u.username)
        .returns(faker.internet.userName())
        .setup((u) => u.id)
        .returns(lockedUserId)
        .setup((u) => u.isLockedOut)
        .returns(true)
        .object();
      userManager = new Mock<UserManager>()
        .setup((um) => um.getUser(userId))
        .returnsAsync(user)
        .setup((um) => um.getUser(lockedUserId))
        .returnsAsync(lockedUser)
        .object();
      payload = {
        iss: 'https://api.bottomti.me/',
        exp: Date.now() + 100000,
        iat: Date.now() - 10000,
        sub: `user|${userId}`,
      };
    });

    it('Will deserialize a user', async () => {
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      await verifyJwtToken(req, payload, cb);
      expect(cb).toBeCalledWith(null, user);
    });

    it('Will fail to deserialize a user if the user ID cannot be found', async () => {
      const userManager = new Mock<UserManager>()
        .setup((um) => um.getUser(user.id))
        .returnsAsync(undefined)
        .object();
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      await verifyJwtToken(req, payload, cb);
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will fail to deserialize a user if the account is locked', async () => {
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      await verifyJwtToken(
        req,
        { ...payload, sub: `user|${lockedUser.id}` },
        cb,
      );
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will fail if subject is missing from token', async () => {
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      await verifyJwtToken(req, { ...payload, sub: '' }, cb);
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will fail if subject is malformed in token', async () => {
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      await verifyJwtToken(req, { ...payload, sub: 'nope!' }, cb);
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will return an error if an exception is thrown while deserializing a user', async () => {
      const error = new Error('Oh noes!');
      const userManager = new Mock<UserManager>()
        .setup((um) => um.getUser(It.IsAny<string>()))
        .throwsAsync(error)
        .object();
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      await verifyJwtToken(req, payload, cb);
      expect(cb).toBeCalledWith(error);
    });
  });

  it.todo('Test logging in with Google');
  it.todo('Test logging in with Github');
});
