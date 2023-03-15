import nock from 'nock';
import request from 'superagent';

import { DefaultUser, DefaultUserManager, UserData } from '@/users';
import { UserRole } from '@/constants';

const AuthUser: UserData = {
  id: 'abc1234',
  email: 'daryl42@gmail.com',
  emailVerified: true,
  hasPassword: true,
  isLockedOut: false,
  lastLogin: new Date(),
  memberSince: new Date(),
  role: UserRole.User,
  username: 'dman_42',
};

describe('Default User Manager', () => {
  it('Will authenticate a user', async () => {
    const username = AuthUser.username;
    const password = 'abc13464$$';
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    nock('http://localhost:80')
      .post('/api/auth/login', { usernameOrEmail: username, password })
      .reply(200, AuthUser);

    const actual = await userManager.authenticateUser(username, password);

    expect(actual).toEqual(expected);
  });

  it('Will get the currently logged in user', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    nock('http://localhost:80')
      .get('/api/auth/me')
      .reply(200, {
        anonymous: false,
        ...AuthUser,
      });

    const actual = await userManager.getCurrentUser();

    expect(actual).toEqual(expected);
  });

  it('Will return undefined if getCurrentUser is called anonymously', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    nock('http://localhost:80').get('/api/auth/me').reply(200, {
      anonymous: true,
      id: 'fwehfawpoefhwpohf',
    });

    await expect(userManager.getCurrentUser()).resolves.toBeUndefined();
  });

  it('Will create a new user based on the given options', async () => {
    const username = 'roger29';
    const password = '&*((HE(f8h892j34ij90';
    const email = 'roger@email.org';
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    nock('http://localhost:80')
      .put(`/api/users/${username}`, { email, password })
      .reply(201, expected);

    const actual = await userManager.createUser({ username, email, password });

    expect(actual).toEqual(expected);
  });

  it('Will retrieve a user by username', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    nock('http://localhost:80')
      .get(`/api/users/${AuthUser.username}`)
      .reply(200, AuthUser);

    const actual = await userManager.getUserByUsername(AuthUser.username);

    expect(actual).toEqual(expected);
  });
});
