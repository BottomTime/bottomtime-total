import request from 'superagent';

import { DefaultUser, DefaultUserManager, UserData } from '@/users';
import { ProfileVisibility, UserRole } from '@/constants';
import { scope } from '../../utils/scope';

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
  profile: {
    profileVisibility: ProfileVisibility.FriendsOnly,
  },
};

describe('Default User Manager', () => {
  it('Will authenticate a user', async () => {
    const username = AuthUser.username;
    const password = 'abc13464$$';
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    scope
      .post('/api/auth/login', { usernameOrEmail: username, password })
      .reply(200, AuthUser);

    const actual = await userManager.authenticateUser(username, password);

    expect(actual).toEqual(expected);
  });

  it('Will get the currently logged in user', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    scope.get('/api/auth/me').reply(200, {
      anonymous: false,
      ...AuthUser,
    });

    const actual = await userManager.getCurrentUser();

    expect(actual).toEqual(expected);
  });

  it('Will return undefined if getCurrentUser is called anonymously', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    scope.get('/api/auth/me').reply(200, {
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
    scope
      .put(`/api/users/${username}`, { email, password })
      .reply(201, expected);

    const actual = await userManager.createUser({ username, email, password });

    expect(actual).toEqual(expected);
  });

  it('Will retrieve a user by username', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    const expected = new DefaultUser(agent, AuthUser);
    scope.get(`/api/users/${AuthUser.username}`).reply(200, AuthUser);
    const actual = await userManager.getUserByUsername(AuthUser.username);

    expect(actual).toEqual(expected);
  });

  it('Will request a password reset email', async () => {
    const agent = request.agent();
    const userManager = new DefaultUserManager(agent);
    scope
      .post(`/api/users/${AuthUser.username}/requestPasswordReset`)
      .reply(204);
    await userManager.requestPasswordReset(AuthUser.username);
    expect(scope.isDone()).toBe(true);
  });

  [true, false].forEach((successful) => {
    it(`Will return ${successful} if password reset is ${
      successful ? 'successful' : 'unsuccessful'
    }`, async () => {
      const newPassword = '(HUG87987y&(*hoih';
      const token = 'abcd12345678';
      const agent = request.agent();
      const userManager = new DefaultUserManager(agent);
      scope
        .post(`/api/users/${AuthUser.username}/`, { token, newPassword })
        .reply(200, { succeeded: successful });
      await expect(
        userManager.resetPassword(AuthUser.username, token, newPassword),
      ).resolves.toBe(successful);
    });
  });
});
