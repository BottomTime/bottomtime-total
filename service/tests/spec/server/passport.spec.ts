import { createRequest } from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import { ObjectId } from 'mongodb';

import { createTestLogger } from '../../test-logger';
import { DefaultUserManager } from '../../../src/users/default-user-manager';
import { fakePassword, fakeUser } from '../../fixtures/fake-user';
import {
  deserializeUser,
  loginWithPassword,
  serializeUser,
} from '../../../src/server/passport';
import { mongoClient } from '../../mongo-client';
import { DefaultUser } from '../../../src/users/default-user';

jest.mock('../../../src/users/default-user-manager');

const Log = createTestLogger('passport-callbacks');

describe('Passport Callbacks', () => {
  describe('Local Strategy Callback', () => {
    it('Will return a user if successful', async () => {
      const username = faker.internet.userName();
      const password = fakePassword();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const user = new DefaultUser(
        mongoClient,
        Log,
        fakeUser(
          {
            username,
          },
          password,
        ),
      );
      const req = createRequest({
        log: Log,
        userManager,
      });
      const authenticate = jest
        .spyOn(userManager, 'authenticateUser')
        .mockResolvedValue(user);
      const cb = jest.fn();

      await loginWithPassword(req, username, password, cb);

      expect(authenticate).toBeCalledWith(username, password);
      expect(cb).toBeCalledWith(null, user);
    });

    it('Will return false if unsuccessful', async () => {
      const username = faker.internet.userName();
      const password = fakePassword();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const req = createRequest({
        log: Log,
        userManager,
      });
      const authenticate = jest
        .spyOn(userManager, 'authenticateUser')
        .mockResolvedValue(undefined);
      const cb = jest.fn();

      await loginWithPassword(req, username, password, cb);

      expect(authenticate).toBeCalledWith(username, password);
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will return an error if an exception occurs', async () => {
      const error = new Error('nope');
      const username = faker.internet.userName();
      const password = fakePassword();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const req = createRequest({
        log: Log,
        userManager,
      });
      const authenticate = jest
        .spyOn(userManager, 'authenticateUser')
        .mockRejectedValue(error);
      const cb = jest.fn();

      await loginWithPassword(req, username, password, cb);

      expect(authenticate).toBeCalledWith(username, password);
      expect(cb).toBeCalledWith(error);
    });
  });

  describe('Serialize and Deserialize User', () => {
    it('Will serialize a user and return the ID', async () => {
      const req = createRequest({
        log: Log,
      });
      const data = fakeUser({
        _id: new ObjectId(),
      });
      const user = new DefaultUser(mongoClient, Log, data);
      const cb = jest.fn();

      serializeUser(req, user, cb);

      expect(cb).toBeCalledWith(null, user.id);
    });

    it('Will deserialize a user', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const req = createRequest({
        log: Log,
        userManager,
      });
      const data = fakeUser({ _id: new ObjectId() });
      const user = new DefaultUser(mongoClient, Log, data);
      const cb = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUser')
        .mockResolvedValue(user);

      await deserializeUser(req, user.id, cb);

      expect(getUser).toBeCalledWith(user.id);
      expect(cb).toBeCalledWith(null, user);
    });

    it('Will fail to deserialize a user if the user ID cannot be found', async () => {
      const userId = faker.database.mongodbObjectId();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUser')
        .mockResolvedValue(undefined);

      await deserializeUser(req, userId, cb);

      expect(getUser).toBeCalledWith(userId);
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will fail to deserialize a user if the account is locked', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const req = createRequest({
        log: Log,
        userManager,
      });
      const data = fakeUser({ _id: new ObjectId(), isLockedOut: true });
      const user = new DefaultUser(mongoClient, Log, data);
      const cb = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUser')
        .mockResolvedValue(user);

      await deserializeUser(req, user.id, cb);

      expect(getUser).toBeCalledWith(user.id);
      expect(cb).toBeCalledWith(null, false);
    });

    it('Will return an error if an exception is thrown while deserializing a user', async () => {
      const error = new Error('Oh noes!');
      const userId = faker.database.mongodbObjectId();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const req = createRequest({
        log: Log,
        userManager,
      });
      const cb = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUser')
        .mockRejectedValue(error);

      await deserializeUser(req, userId, cb);

      expect(getUser).toBeCalledWith(userId);
      expect(cb).toBeCalledWith(error);
    });
  });
});
