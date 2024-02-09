import { UserDTO, UserRole } from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';
import AxiosAdapter from 'axios-mock-adapter';

import { UserProfile } from '../../../src/client';
import { User } from '../../../src/client/user';
import { UserSettings } from '../../../src/client/user-settings';
import { BasicUser } from '../../fixtures/users';

function getUser(axios: AxiosInstance, data?: Partial<UserDTO>): User {
  return new User(axios, { ...BasicUser, ...data });
}
describe('User API client', () => {
  let axiosInstance: AxiosInstance;
  let axiosAdapter: AxiosAdapter;
  let user: User;

  beforeAll(() => {
    axiosInstance = axios.create();
    axiosAdapter = new AxiosAdapter(axiosInstance);
  });

  afterEach(() => {
    axiosAdapter.reset();
  });

  afterAll(() => {
    axiosAdapter.restore();
  });

  it('will return properties correctly', () => {
    user = getUser(axiosInstance);
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
    user = getUser(axiosInstance);
    expect(user.displayName).toBe(BasicUser.profile.name);
  });

  it("will return the user's username as the display name if the profile name is not set", () => {
    user = getUser(axiosInstance, {
      profile: { ...BasicUser.profile, name: '' },
    });
    expect(user.displayName).toBe(BasicUser.username);
  });

  it("will change a user's email address", async () => {
    user = getUser(axiosInstance);
    const newEmail = 'new_email@gmail.org';
    axiosAdapter
      .onPost(`/api/users/${BasicUser.username}/email`, { newEmail })
      .reply(204);

    await user.changeEmail(newEmail);

    expect(user.email).toBe(newEmail);
    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it("will allow access to the user's profile", () => {
    user = getUser(axiosInstance);
    expect(user.profile).toBeInstanceOf(UserProfile);
    expect(user.profile.name).toBe(BasicUser.profile.name);
  });

  it("will attempt to change a user's password and return true if successful", async () => {
    const oldPassword = 'old_password';
    const newPassword = 'new_password';
    user = getUser(axiosInstance);
    axiosAdapter
      .onPost(`/api/users/${BasicUser.username}/password`, {
        oldPassword,
        newPassword,
      })
      .reply(200, { succeeded: true });

    await expect(user.changePassword(oldPassword, newPassword)).resolves.toBe(
      true,
    );

    expect(axiosAdapter.history.post.length).toBe(1);
    expect(user.lastPasswordChange!.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it("will attempt to change a user's password and return false if unsuccessful", async () => {
    const oldPassword = 'old_password';
    const newPassword = 'new_password';
    user = getUser(axiosInstance);
    axiosAdapter
      .onPost(`/api/users/${BasicUser.username}/password`, {
        oldPassword,
        newPassword,
      })
      .reply(200, { succeeded: false });

    await expect(user.changePassword(oldPassword, newPassword)).resolves.toBe(
      false,
    );

    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it("will change a user's role", async () => {
    user = getUser(axiosInstance);
    const newRole = UserRole.Admin;
    axiosAdapter
      .onPost(`/api/admin/users/${BasicUser.username}/role`, { newRole })
      .reply(204);

    await user.changeRole(newRole);

    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it("will change a user's username", async () => {
    user = getUser(axiosInstance);
    const newUsername = 'new_username';
    axiosAdapter
      .onPost(`/api/users/${BasicUser.username}/username`, { newUsername })
      .reply(204);

    await user.changeUsername(newUsername);

    expect(user.username).toBe(newUsername);
  });

  it('will request an email verification', async () => {
    user = getUser(axiosInstance);
    axiosAdapter
      .onPost(`/api/users/${BasicUser.username}/requestEmailVerification`)
      .reply(204);

    await user.requestEmailVerification();

    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it("will reset a user's password", async () => {
    user = getUser(axiosInstance, { hasPassword: false });
    const newPassword = 'new_password';
    axiosAdapter
      .onPost(`/api/admin/users/${BasicUser.username}/password`, {
        newPassword,
      })
      .reply(204);

    await user.resetPassword(newPassword);

    expect(user.hasPassword).toBe(true);
    expect(user.lastPasswordChange!.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it("will allow access to the user's settings", () => {
    user = getUser(axiosInstance);
    expect(user.settings).toBeInstanceOf(UserSettings);
    expect(user.settings.depthUnit).toBe(BasicUser.settings.depthUnit);
  });

  it("will suspend a user's account", async () => {
    user = getUser(axiosInstance);
    axiosAdapter
      .onPost(`/api/admin/users/${BasicUser.username}/lockAccount`)
      .reply(204);

    await user.toggleAccountLock();

    expect(user.isLockedOut).toBe(true);
    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it('will reactivate a suspended account', async () => {
    user = getUser(axiosInstance, { isLockedOut: true });
    axiosAdapter
      .onPost(`/api/admin/users/${BasicUser.username}/unlockAccount`)
      .reply(204);

    await user.toggleAccountLock();

    expect(user.isLockedOut).toBe(false);
    expect(axiosAdapter.history.post.length).toBe(1);
  });

  it('will render the user as a JSON object', () => {
    user = getUser(axiosInstance);
    expect(user.toJSON()).toEqual(BasicUser);
  });
});
