import axios, { AxiosError, AxiosInstance } from 'axios';
import nock, { Scope } from 'nock';

import { User } from '../../src/client';
import { UsersApiClient } from '../../src/client/users';
import {
  AdminSearchUsersParamsDTO,
  CreateUserParamsDTO,
  PasswordResetTokenStatus,
  SortOrder,
  SuccessFailResponseDTO,
  UserRole,
  UsersSortBy,
} from '../../src/types';
import { createScope } from '../fixtures/nock';
import SearchResults from '../fixtures/user-search-results.json';
import { BasicUser } from '../fixtures/users';

describe('Users API client', () => {
  let axiosInstance: AxiosInstance;
  let client: UsersApiClient;
  let scope: Scope;

  beforeAll(() => {
    scope = createScope();
    axiosInstance = axios.create();
    client = new UsersApiClient(axiosInstance);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('when checking if usernames or emails are available', () => {
    it('will return true if the username is not found', async () => {
      scope.head('/api/users/test').reply(404);
      const result = await client.isUsernameOrEmailAvailable('test');
      expect(result).toBe(true);
    });

    it('will return false if the username is found', async () => {
      scope.head('/api/users/test').reply(200);
      const result = await client.isUsernameOrEmailAvailable('test');
      expect(result).toBe(false);
    });

    it('will re-throw an error if the request fails', async () => {
      scope.head('/api/users/test').replyWithError('Nope');
      await expect(client.isUsernameOrEmailAvailable('test')).rejects.toThrow(
        AxiosError,
      );
    });

    it('will URL-encode an email address', async () => {
      scope.head('/api/users/test%40example.com').reply(404);
      await client.isUsernameOrEmailAvailable('test@example.com');
    });
  });

  describe('when retrieving the current user', () => {
    it('will return null if the user is anonymous', async () => {
      scope.get('/api/auth/me').reply(200, { anonymous: true });
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
    });

    it('will return the user if the user is not anonymous', async () => {
      scope.get('/api/auth/me').reply(200, {
        anonymous: false,
        ...BasicUser,
      });
      const user = await client.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.toJSON()).toEqual(BasicUser);
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
      scope
        .post('/api/users', JSON.stringify(requestData))
        .reply(201, BasicUser);
      const user = await client.createUser(requestData);
      expect(user.toJSON()).toEqual(BasicUser);
    });

    it('will allow any errors to bubble up', async () => {
      scope.post('/api/users', JSON.stringify(requestData)).reply(409);
      await expect(client.createUser(requestData)).rejects.toThrow(AxiosError);
    });
  });

  describe('when logging in', () => {
    it('will return the user if the login is successful', async () => {
      const usernameOrEmail = 'test';
      const password = 'password';
      scope
        .post('/api/auth/login', { usernameOrEmail, password })
        .reply(200, BasicUser);

      const user = await client.login(usernameOrEmail, password);
      expect(user.toJSON()).toEqual(BasicUser);
    });

    it('will throw an error if the login fails', async () => {
      scope.post('/api/auth/login').reply(401);
      await expect(client.login('test', 'password')).rejects.toThrow(
        AxiosError,
      );
    });
  });

  describe('when resetting a password', () => {
    it('will request a password reset token', async () => {
      scope
        .post(`/api/users/${BasicUser.username}/requestPasswordReset`)
        .reply(204);
      await client.requestPasswordResetToken(BasicUser.username);
      expect(scope.isDone()).toBe(true);
    });

    it('will validate a password reset token', async () => {
      const token = 'abcd1234';
      scope
        .get(`/api/users/${BasicUser.username}/resetPassword`)
        .query({ token })
        .reply(200, { status: PasswordResetTokenStatus.Expired });

      await expect(
        client.validatePasswordResetToken(BasicUser.username, token),
      ).resolves.toBe(PasswordResetTokenStatus.Expired);
      expect(scope.isDone()).toBe(true);
    });

    it("will reset a user's password with a token", async () => {
      const newPassword = 'new_password';
      const token = 'tbTSqDIps0/QuDp9M1/2HJgrsa2TIN268+NRMKbw81U=';
      scope
        .post(`/api/users/${BasicUser.username}/resetPassword`, {
          newPassword,
          token,
        })
        .reply(200, { succeeded: true });

      await expect(
        client.resetPasswordWithToken(BasicUser.username, token, newPassword),
      ).resolves.toBe(true);
      expect(scope.isDone()).toBe(true);
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
    scope.get('/api/admin/users').query(params).reply(200, SearchResults);

    const { users, totalCount } = await client.searchUsers(params);

    expect(totalCount).toBe(SearchResults.totalCount);
    expect(users).toHaveLength(SearchResults.users.length);
    users.forEach((user, index) => {
      expect(user.id).toEqual(SearchResults.users[index].id);
    });
    expect(scope.isDone()).toBe(true);
  });

  describe('when verifying an email address', () => {
    it('will return success if the request succeeds', async () => {
      const expected: SuccessFailResponseDTO = { succeeded: true };
      scope
        .post(`/api/users/${BasicUser.username}/verifyEmail`)
        .reply(200, expected);
      const actual = await client.verifyEmail(BasicUser.username, 'token');

      expect(actual).toEqual(expected);
      expect(scope.isDone()).toBe(true);
    });

    it('will return failure with a reason if the request fails', async () => {
      const expected: SuccessFailResponseDTO = {
        succeeded: false,
        reason: 'Your token does not rhyme.',
      };
      scope
        .post(`/api/users/${BasicUser.username}/verifyEmail`)
        .reply(200, expected);
      const actual = await client.verifyEmail(BasicUser.username, 'token');

      expect(actual).toEqual(expected);
      expect(scope.isDone()).toBe(true);
    });
  });

  it('will wrap a user DTO in a User instance', () => {
    const user = client.wrapDTO(BasicUser);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe(BasicUser.username);
  });
});
