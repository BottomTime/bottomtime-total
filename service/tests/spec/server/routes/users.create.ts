import { faker } from '@faker-js/faker';
import { createMocks } from 'node-mocks-http';
import { UserRole } from '../../../../src/constants';
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
    const body = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: fakePassword(),
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
      login,
    });
    const expectedUser = new DefaultUser(
      mongoClient,
      Log,
      fakeUser(
        {
          username: body.username,
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
    expect(spy).toBeCalledWith(body);
    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual(
      JSON.parse(JSON.stringify(expectedUser)),
    );
  });

  it('Will login a user automatically when they create an account while not logged in', async () => {
    const body = {
      username: faker.internet.userName(),
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
      login,
    });
    const expectedUser = new DefaultUser(
      mongoClient,
      Log,
      fakeUser(
        {
          username: body.username,
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
    expect(spy).toBeCalledWith(body);
    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual(
      JSON.parse(JSON.stringify(expectedUser)),
    );
  });

  it('Will return an error if an exception is thrown', async () => {
    const error = new Error('Nope');
    const body = {
      username: faker.internet.userName(),
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
    const body = {
      username: faker.internet.userName(),
    };
    const userManager = new DefaultUserManager(mongoClient, Log);
    const expectedUser = new DefaultUser(mongoClient, Log, fakeUser());
    const login = jest.fn().mockImplementation((user, cb) => {
      expect(user).toBe(expectedUser);
      cb(error);
    });
    const { req, res } = createMocks({
      log: Log,
      userManager,
      body,
      login,
    });
    jest.spyOn(userManager, 'createUser').mockResolvedValue(expectedUser);
    const next = jest.fn();

    await createUser(req, res, next);

    expect(login).toBeCalled();
    expect(next).toBeCalledWith(error);
    expect(res._isEndCalled()).toBe(false);
  });

  it('Will not allow regular users to set roles', async () => {
    const body = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: fakePassword(),
      role: UserRole.Admin,
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
      login,
    });
    const spy = jest.spyOn(userManager, 'createUser');
    const next = jest.fn();

    await createUser(req, res, next);

    expect(login).not.toBeCalled();
    expect(spy).not.toBeCalled();
    expect(next).toBeCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(res._isEndCalled()).toBe(false);
  });

  it('Will allow admins to set roles', async () => {
    const body = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: fakePassword(),
      role: UserRole.Admin,
    };
    const data = fakeUser({ role: UserRole.Admin });
    const user = new DefaultUser(mongoClient, Log, data);
    const userManager = new DefaultUserManager(mongoClient, Log);
    const login = jest.fn();
    const { req, res } = createMocks({
      log: Log,
      user,
      userManager,
      body,
      login,
    });
    const expectedUser = new DefaultUser(
      mongoClient,
      Log,
      fakeUser(
        {
          username: body.username,
          email: body.email,
          role: body.role,
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
    expect(spy).toBeCalledWith(body);
    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual(
      JSON.parse(JSON.stringify(expectedUser)),
    );
  });

  [
    {
      name: 'Bad username',
      body: {
        username: 'Not valid',
      },
    },
    {
      name: 'Missing username',
      body: {},
    },
    {
      name: 'Bad email',
      body: {
        username: 'user123',
        email: 'not an email',
      },
    },
    {
      name: 'Invalid role',
      body: {
        username: 'user123',
        role: 'lord-of-data',
      },
    },
    {
      name: 'Weak password',
      body: {
        username: 'user123',
        password: 'weakness',
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
