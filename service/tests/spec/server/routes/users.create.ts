import { faker } from '@faker-js/faker';
import { createMocks } from 'node-mocks-http';
import { ProfileVisibility, UserRole } from '../../../../src/constants';
import { ForbiddenError, ValidationError } from '../../../../src/errors';
import { createUser } from '../../../../src/server/routes/users';
import { DefaultUser } from '../../../../src/users/default-user';
import { DefaultUserManager } from '../../../../src/users/default-user-manager';
import { fakePassword, fakeUser } from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { createTestLogger } from '../../../test-logger';

const Log = createTestLogger('user-routes-create');

export default function () {
  it('Will create a new user based on the criteria', async () => {
    const username = faker.internet.userName();
    const body = {
      email: faker.internet.email(),
      password: fakePassword(),
      profileVisibility: ProfileVisibility.Public,
    };
    const data = fakeUser();
    const user = new DefaultUser(mongoClient, Log, data);
    const userManager = new DefaultUserManager(mongoClient, Log);
    const login = jest.fn();
    const { req, res } = createMocks({
      log: Log,
      user,
      userManager,
      body,
      params: { username },
      login,
    });
    const expectedUser = new DefaultUser(
      mongoClient,
      Log,
      fakeUser(
        {
          username,
          email: body.email,
        },
        body.password,
      ),
    );
    const spy = jest
      .spyOn(userManager, 'createUser')
      .mockResolvedValue(expectedUser);
    const next = jest.fn();

    await createUser(req, res, next);

    expect(login).not.toBeCalled();
    expect(next).not.toBeCalled();
    expect(spy).toBeCalledWith({
      username,
      ...body,
    });
    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual(
      JSON.parse(JSON.stringify(expectedUser)),
    );
  });

  it('Will login a user automatically when they create an account while not logged in', async () => {
    const username = faker.internet.userName();
    const body = {
      email: faker.internet.email(),
      password: fakePassword(),
    };
    const userManager = new DefaultUserManager(mongoClient, Log);
    const login = jest.fn().mockImplementation((user, cb) => {
      expect(user).toBe(expectedUser);
      cb();
    });
    const { req, res } = createMocks({
      log: Log,
      userManager,
      body,
      params: { username },
      login,
    });
    const expectedUser = new DefaultUser(
      mongoClient,
      Log,
      fakeUser(
        {
          username: username,
          email: body.email,
        },
        body.password,
      ),
    );
    const spy = jest
      .spyOn(userManager, 'createUser')
      .mockResolvedValue(expectedUser);
    const next = jest.fn();

    await createUser(req, res, next);

    expect(next).not.toBeCalled();
    expect(login).toBeCalled();
    expect(spy).toBeCalledWith({
      username,
      ...body,
    });
    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual(
      JSON.parse(JSON.stringify(expectedUser)),
    );
  });

  it('Will return an error if an exception is thrown', async () => {
    const error = new Error('Nope');
    const data = fakeUser();
    const user = new DefaultUser(mongoClient, Log, data);
    const userManager = new DefaultUserManager(mongoClient, Log);
    const login = jest.fn();
    const { req, res } = createMocks({
      log: Log,
      user,
      userManager,
      params: {
        username: faker.internet.userName(),
      },
      login,
    });
    jest.spyOn(userManager, 'createUser').mockRejectedValue(error);
    const next = jest.fn();

    await createUser(req, res, next);

    expect(login).not.toBeCalled();
    expect(next).toBeCalledWith(error);
    expect(res._isEndCalled()).toBe(false);
  });

  it('Will return an error if an exception is thrown while logging in a user', async () => {
    const error = new Error('Nope');
    const userManager = new DefaultUserManager(mongoClient, Log);
    const expectedUser = new DefaultUser(mongoClient, Log, fakeUser());
    const login = jest.fn().mockImplementation((user, cb) => {
      expect(user).toBe(expectedUser);
      cb(error);
    });
    const { req, res } = createMocks({
      log: Log,
      userManager,
      params: {
        username: faker.internet.userName(),
      },
      login,
    });
    jest.spyOn(userManager, 'createUser').mockResolvedValue(expectedUser);
    const next = jest.fn();

    await createUser(req, res, next);

    expect(login).toBeCalled();
    expect(next).toBeCalledWith(error);
    expect(res._isEndCalled()).toBe(false);
  });

  [
    {
      name: 'Bad username',
      username: 'Not valid',
      body: {},
    },
    {
      name: 'Bad email',
      username: 'user123',
      body: {
        email: 'not an email',
      },
    },
    {
      name: 'Weak password',
      username: 'user123',
      body: {
        password: 'weakness',
      },
    },
    {
      name: 'Invalid profile visibility',
      username: 'user123',
      body: {
        profileVisibility: 'Just my friends, please',
      },
    },
  ].forEach((test) => {
    it(`Will return a ValidationError if the options are invlaid: ${test.name}`, async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      const login = jest.fn();
      const { req, res } = createMocks({
        log: Log,
        user,
        userManager,
        body: test.body,
        params: {
          username: test.username,
        },
        login,
      });
      const spy = jest.spyOn(userManager, 'createUser');
      const next = jest.fn();

      await createUser(req, res, next);

      expect(login).not.toBeCalled();
      expect(spy).not.toBeCalled();
      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });
  });
}
