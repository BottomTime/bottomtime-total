import mockFetch from 'fetch-mock-jest';

import { AccountTier } from '../../dist';
import { UserProfile } from '../../src/client';
import { Fetcher } from '../../src/client/fetcher';
import { User } from '../../src/client/user';
import { UserSettings } from '../../src/client/user-settings';
import { UserDTO, UserRole } from '../../src/types';
import { BasicUser } from '../fixtures/users';

function getUser(fetcher: Fetcher, data?: Partial<UserDTO>): User {
  return new User(fetcher, { ...BasicUser, ...data });
}

describe('User API client', () => {
  let fetcher: Fetcher;
  let user: User;

  beforeAll(() => {
    fetcher = new Fetcher();
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    user = getUser(fetcher);
    expect(user.id).toBe(BasicUser.id);
    expect(user.email).toBe(BasicUser.email);
    expect(user.emailVerified).toBe(BasicUser.emailVerified);
    expect(user.hasPassword).toBe(BasicUser.hasPassword);
    expect(user.isLockedOut).toBe(BasicUser.isLockedOut);
    expect(user.lastLogin).toBe(BasicUser.lastLogin);
    expect(user.lastPasswordChange).toBe(BasicUser.lastPasswordChange);
    expect(user.memberSince).toEqual(new Date(BasicUser.memberSince));
    expect(user.role).toBe(BasicUser.role);
    expect(user.username).toBe(BasicUser.username);
  });

  it("will return the user's profile name as a display name", () => {
    user = getUser(fetcher);
    expect(user.displayName).toBe(BasicUser.profile.name);
  });

  it("will return the user's username as the display name if the profile name is not set", () => {
    user = getUser(fetcher, {
      profile: { ...BasicUser.profile, name: '' },
    });
    expect(user.displayName).toBe(BasicUser.username);
  });

  it("will change a user's email address", async () => {
    user = getUser(fetcher);
    const newEmail = 'new_email@gmail.org';
    mockFetch.post(
      {
        url: `/api/users/${BasicUser.username}/email`,
        body: { newEmail },
      },
      204,
    );

    await user.changeEmail(newEmail);

    expect(mockFetch.done());
    expect(user.email).toBe(newEmail);
  });

  it("will allow access to the user's profile", () => {
    user = getUser(fetcher);
    expect(user.profile).toBeInstanceOf(UserProfile);
    expect(user.profile.name).toBe(BasicUser.profile.name);
  });

  it("will attempt to change a user's password and return true if successful", async () => {
    const oldPassword = 'old_password';
    const newPassword = 'new_password';
    user = getUser(fetcher);
    mockFetch.post(
      {
        url: `/api/users/${BasicUser.username}/password`,
        body: {
          oldPassword,
          newPassword,
        },
      },
      {
        status: 200,
        body: { succeeded: true },
      },
    );

    await expect(user.changePassword(oldPassword, newPassword)).resolves.toBe(
      true,
    );

    expect(mockFetch.done()).toBe(true);
    expect(user.lastPasswordChange!.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it("will attempt to change a user's password and return false if unsuccessful", async () => {
    const oldPassword = 'old_password';
    const newPassword = 'new_password';
    user = getUser(fetcher);
    mockFetch.post(
      {
        url: `/api/users/${BasicUser.username}/password`,
        body: {
          oldPassword,
          newPassword,
        },
      },
      {
        status: 200,
        body: { succeeded: false },
      },
    );

    await expect(user.changePassword(oldPassword, newPassword)).resolves.toBe(
      false,
    );
    expect(mockFetch.done()).toBe(true);
  });

  it("will change a user's role", async () => {
    user = getUser(fetcher);
    const newRole = UserRole.Admin;
    mockFetch.post(
      {
        url: `/api/admin/users/${BasicUser.username}/role`,
        body: { newRole },
      },
      204,
    );
    await user.changeRole(newRole);
    expect(mockFetch.done()).toBe(true);
  });

  it("will change a user's username", async () => {
    user = getUser(fetcher);
    const newUsername = 'new_username';
    mockFetch.post(
      {
        url: `/api/users/${BasicUser.username}/username`,
        body: { newUsername },
      },
      204,
    );
    await user.changeUsername(newUsername);
    expect(mockFetch.done()).toBe(true);
  });

  it("will change a user's membership", async () => {
    user = getUser(fetcher);
    const newAccountTier = AccountTier.ShopOwner;
    mockFetch.post(
      {
        url: `/api/users/${BasicUser.username}/membership`,
        body: { accountTier: newAccountTier },
      },
      {
        status: 200,
        body: { succeeded: true },
      },
    );
    await user.changeMembership(newAccountTier);
    expect(mockFetch.done()).toBe(true);
  });

  it('will request an email verification', async () => {
    user = getUser(fetcher);
    mockFetch.post(
      `/api/users/${BasicUser.username}/requestEmailVerification`,
      204,
    );
    await user.requestEmailVerification();
    mockFetch.done();
  });

  it("will reset a user's password", async () => {
    user = getUser(fetcher, { hasPassword: false });
    const newPassword = 'new_password';
    mockFetch.post(
      {
        url: `/api/admin/users/${BasicUser.username}/password`,
        body: { newPassword },
      },
      204,
    );

    await user.resetPassword(newPassword);

    expect(mockFetch.done()).toBe(true);
    expect(user.hasPassword).toBe(true);
    expect(user.lastPasswordChange!.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it("will allow access to the user's settings", () => {
    user = getUser(fetcher);
    expect(user.settings).toBeInstanceOf(UserSettings);
    expect(user.settings.depthUnit).toBe(BasicUser.settings.depthUnit);
  });

  it("will suspend a user's account", async () => {
    user = getUser(fetcher);
    mockFetch.post(`/api/admin/users/${BasicUser.username}/lockAccount`, 204);
    await user.toggleAccountLock();
    expect(mockFetch.done()).toBe(true);
    expect(user.isLockedOut).toBe(true);
  });

  it('will reactivate a suspended account', async () => {
    user = getUser(fetcher, { isLockedOut: true });
    mockFetch.post(`/api/admin/users/${BasicUser.username}/unlockAccount`, 204);
    await user.toggleAccountLock();
    expect(mockFetch.done()).toBe(true);
    expect(user.isLockedOut).toBe(false);
  });

  it('will render the user as a JSON object', () => {
    user = getUser(fetcher);
    expect(user.toJSON()).toEqual(BasicUser);
  });

  it('will list oauth providers for the user', async () => {
    user = getUser(fetcher);
    const providers = new Set(['google', 'discord']);
    mockFetch.get(`/api/auth/oauth/${BasicUser.username}`, {
      status: 200,
      body: [...providers],
    });
    await expect(user.getOAuthProviders()).resolves.toEqual(providers);
    expect(mockFetch.done()).toBe(true);
  });

  it('will unlink an oauth provider', async () => {
    user = getUser(fetcher);
    const provider = 'google';
    mockFetch.delete(`/api/auth/oauth/${BasicUser.username}/${provider}`, 204);
    await user.unlinkOAuthProvider(provider);
    expect(mockFetch.done()).toBe(true);
  });
});
