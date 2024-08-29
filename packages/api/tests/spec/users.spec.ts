import mockFetch from 'fetch-mock-jest';

import { HttpException, User } from '../../src/client';
import { Fetcher } from '../../src/client/fetcher';
import { UsersApiClient } from '../../src/client/users';
import {
  AdminSearchUsersParamsDTO,
  CreateUserParamsDTO,
  ErrorResponseDTO,
  PasswordResetTokenStatus,
  SortOrder,
  SuccessFailResponseDTO,
  UserRole,
  UsersSortBy,
} from '../../src/types';
import SearchResults from '../fixtures/user-search-results.json';
import { BasicUser } from '../fixtures/users';

describe('Users API client', () => {
  let fetcher: Fetcher;
  let client: UsersApiClient;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new UsersApiClient(fetcher);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  describe('when checking if usernames or emails are available', () => {
    it('will return true if the username is not found', async () => {
      mockFetch.head('/api/users/test', 404);
      const result = await client.isUsernameOrEmailAvailable('test');
      expect(result).toBe(true);
      expect(mockFetch.done()).toBe(true);
    });

    it('will return false if the username is found', async () => {
      mockFetch.head('/api/users/test', 200);
      const result = await client.isUsernameOrEmailAvailable('test');
      expect(result).toBe(false);
      expect(mockFetch.done()).toBe(true);
    });

    it('will URL-encode an email address', async () => {
      mockFetch.head('api/users/test%40example.com', 404);
      await client.isUsernameOrEmailAvailable('test@example.com');
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
      mockFetch.get('/api/auth/me', { anonymous: false, ...BasicUser });
      const user = await client.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.toJSON()).toEqual(BasicUser);
      expect(mockFetch.done()).toBe(true);
    });
  });

  describe('when creating a user', () => {
    const requestData: CreateUserParamsDTO = {
      username: BasicUser.username,
      email: BasicUser.email,
      password: 'password',
      role: UserRole.User,
      profile: {
        name: BasicUser.profile.name,
      },
      settings: { ...BasicUser.settings },
    };

    it('will return the new user account if the creation is successful', async () => {
      mockFetch.post(
        {
          url: '/api/users',
          body: requestData,
        },
        {
          status: 201,
          body: BasicUser,
        },
      );
      const user = await client.createUser(requestData);
      expect(user.toJSON()).toEqual(BasicUser);
      expect(mockFetch.done()).toBe(true);
    });

    it('will allow any errors to bubble up', async () => {
      const error: ErrorResponseDTO = {
        status: 409,
        message: 'Username already exists',
        method: 'POST',
        path: '/api/users',
      };
      mockFetch.post(
        {
          url: '/api/users',
          body: requestData,
        },
        {
          status: 409,
          body: error,
        },
      );
      await expect(client.createUser(requestData)).rejects.toThrow(
        HttpException,
      );
      expect(mockFetch.done()).toBe(true);
    });
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
      expect(user.toJSON()).toEqual(BasicUser);
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

  it('will perform a search for users', async () => {
    const params: AdminSearchUsersParamsDTO = {
      query: 'bob',
      role: UserRole.User,
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Ascending,
      skip: 50,
      limit: 200,
    };
    mockFetch.get(
      '/api/admin/users?query=bob&role=user&sortBy=username&sortOrder=asc&skip=50&limit=200',
      { status: 200, body: SearchResults },
    );

    const { users, totalCount } = await client.searchUsers(params);

    expect(totalCount).toBe(SearchResults.totalCount);
    expect(users).toHaveLength(SearchResults.users.length);
    users.forEach((user, index) => {
      expect(user.id).toEqual(SearchResults.users[index].id);
    });
    expect(mockFetch.done()).toBe(true);
  });

  describe('when verifying an email address', () => {
    it('will return success if the request succeeds', async () => {
      const expected: SuccessFailResponseDTO = { succeeded: true };
      mockFetch.post(`/api/users/${BasicUser.username}/verifyEmail`, {
        status: 200,
        body: expected,
      });
      const actual = await client.verifyEmail(BasicUser.username, 'token');

      expect(actual).toEqual(expected);
      expect(mockFetch.done()).toBe(true);
    });

    it('will return failure with a reason if the request fails', async () => {
      const expected: SuccessFailResponseDTO = {
        succeeded: false,
        reason: 'Your token does not rhyme.',
      };
      mockFetch.post(`/api/users/${BasicUser.username}/verifyEmail`, {
        status: 200,
        body: expected,
      });
      const actual = await client.verifyEmail(BasicUser.username, 'token');

      expect(actual).toEqual(expected);
      expect(mockFetch.done()).toBe(true);
    });
  });

  it('will wrap a user DTO in a User instance', () => {
    const user = client.wrapDTO(BasicUser);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe(BasicUser.username);
  });
});
