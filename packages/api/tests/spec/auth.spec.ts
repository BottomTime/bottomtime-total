import mockFetch from 'fetch-mock-jest';

import {
  ErrorResponseDTO,
  Fetcher,
  HttpException,
  PasswordResetTokenStatus,
  UserRole,
} from '../../src';
import { AuthApiClient } from '../../src/client/auth';
import { BasicUser } from '../fixtures/users';

describe('Auth API client', () => {
  let client: AuthApiClient;

  beforeAll(() => {
    client = new AuthApiClient(new Fetcher());
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it("will change a user's role", async () => {
    const newRole = UserRole.Admin;
    mockFetch.post(
      {
        url: `/api/admin/users/${BasicUser.username}/role`,
        body: { newRole },
      },
      204,
    );
    const result = await client.changeRole(BasicUser, newRole);
    expect(mockFetch.done()).toBe(true);
    expect(result).toEqual({
      ...BasicUser,
      role: newRole,
    });
  });

  it("will suspend a user's account", async () => {
    mockFetch.post(`/api/admin/users/${BasicUser.username}/lockAccount`, 204);
    const result = await client.toggleAccountLock(BasicUser);
    expect(mockFetch.done()).toBe(true);
    expect(result).toEqual({
      ...BasicUser,
      isLockedOut: true,
    });
  });

  it('will reactivate a suspended account', async () => {
    mockFetch.post(`/api/admin/users/${BasicUser.username}/unlockAccount`, 204);
    const result = await client.toggleAccountLock({
      ...BasicUser,
      isLockedOut: true,
    });
    expect(mockFetch.done()).toBe(true);
    expect(result).toEqual(BasicUser);
  });

  describe('when logging in', () => {
    it('will return the user if the login is successful', async () => {
      const usernameOrEmail = 'test';
      const password = 'password';
      mockFetch.post(
        {
          url: '/api/auth/login',
          body: { usernameOrEmail, password },
        },
        {
          status: 200,
          body: BasicUser,
        },
      );

      const user = await client.login(usernameOrEmail, password);
      expect(user).toEqual(BasicUser);
      expect(mockFetch.done()).toBe(true);
    });

    it('will throw an error if the login fails', async () => {
      const error: ErrorResponseDTO = {
        message: 'Nope',
        method: 'POST',
        path: '/api/auth/login',
        status: 401,
      };
      mockFetch.post('/api/auth/login', {
        status: 401,
        body: error,
      });
      await expect(client.login('test', 'password')).rejects.toThrow(
        HttpException,
      );
      expect(mockFetch.done()).toBe(true);
    });
  });

  describe('when retrieving the current user', () => {
    it('will return null if the user is anonymous', async () => {
      mockFetch.get('/api/auth/me', { anonymous: true });
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
      expect(mockFetch.done()).toBe(true);
    });

    it('will return the user if the user is not anonymous', async () => {
      const expected = {
        ...BasicUser,
        anonymous: false,
      };
      mockFetch.get('/api/auth/me', expected);
      const user = await client.getCurrentUser();
      expect(user).toEqual(expected);
      expect(mockFetch.done()).toBe(true);
    });
  });

  describe('when changing a password', () => {
    it("will attempt to change a user's password and return true if successful", async () => {
      const oldPassword = 'old_password';
      const newPassword = 'new_password';
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

      const result = await client.changePassword(
        BasicUser,
        oldPassword,
        newPassword,
      );

      expect(mockFetch.done()).toBe(true);
      expect(result).toEqual({
        succeeded: true,
        user: {
          ...BasicUser,
          hasPassword: true,
          lastPasswordChange: expect.any(Date),
        },
      });
    });

    it("will attempt to change a user's password and return false if unsuccessful", async () => {
      const oldPassword = 'old_password';
      const newPassword = 'new_password';
      const reason = 'nope';
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
          body: { succeeded: false, reason },
        },
      );

      const result = await client.changePassword(
        BasicUser,
        oldPassword,
        newPassword,
      );
      expect(mockFetch.done()).toBe(true);
      expect(result).toEqual({
        succeeded: false,
        reason,
      });
    });

    it("will reset a user's password", async () => {
      const newPassword = 'new_password';
      mockFetch.post(
        {
          url: `/api/admin/users/${BasicUser.username}/password`,
          body: { newPassword },
        },
        204,
      );

      const result = await client.resetPassword(BasicUser, newPassword);

      expect(mockFetch.done()).toBe(true);
      expect(result.lastPasswordChange?.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(result).toEqual({
        ...BasicUser,
        hasPassword: true,
        lastPasswordChange: result.lastPasswordChange,
      });
    });
  });

  describe('when resetting a password', () => {
    it('will request a password reset token', async () => {
      mockFetch.post(
        `/api/users/${BasicUser.username}/requestPasswordReset`,
        204,
      );
      await client.requestPasswordResetToken(BasicUser.username);
      expect(mockFetch.done()).toBe(true);
    });

    it('will validate a password reset token', async () => {
      const token = 'abcd1234';
      mockFetch.get(
        `/api/users/${BasicUser.username}/resetPassword?token=${token}`,
        { status: 200, body: { status: PasswordResetTokenStatus.Expired } },
      );

      await expect(
        client.validatePasswordResetToken(BasicUser.username, token),
      ).resolves.toBe(PasswordResetTokenStatus.Expired);
      expect(mockFetch.done()).toBe(true);
    });

    it("will reset a user's password with a token", async () => {
      const newPassword = 'new_password';
      const token = 'tbTSqDIps0/QuDp9M1/2HJgrsa2TIN268+NRMKbw81U=';
      mockFetch.post(
        {
          url: `/api/users/${BasicUser.username}/resetPassword`,
          body: { newPassword, token },
        },
        {
          status: 200,
          body: { succeeded: true },
        },
      );

      await expect(
        client.resetPasswordWithToken(BasicUser.username, token, newPassword),
      ).resolves.toBe(true);
      expect(mockFetch.done()).toBe(true);
    });
  });

  describe('when dealing with OAuth providers', () => {
    it('will list oauth providers for the user', async () => {
      const providers = new Set(['google', 'discord']);
      mockFetch.get(`/api/auth/oauth/${BasicUser.username}`, {
        status: 200,
        body: [...providers],
      });
      await expect(
        client.getOAuthProviders(BasicUser.username),
      ).resolves.toEqual(providers);
      expect(mockFetch.done()).toBe(true);
    });

    it('will unlink an oauth provider', async () => {
      const provider = 'google';
      mockFetch.delete(
        `/api/auth/oauth/${BasicUser.username}/${provider}`,
        204,
      );
      await client.unlinkOAuthProvider(BasicUser.username, provider);
      expect(mockFetch.done()).toBe(true);
    });
  });
});
