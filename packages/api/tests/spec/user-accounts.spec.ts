import mockFetch from 'fetch-mock-jest';

import {
  AccountTier,
  AdminSearchUsersParamsDTO,
  CreateUserParamsDTO,
  ErrorResponseDTO,
  Fetcher,
  HttpException,
  SortOrder,
  SuccessFailResponseDTO,
  UserRole,
  UsersSortBy,
} from '../../src';
import { UserAccountsApiClient } from '../../src/client/user-accounts';
import SearchResults from '../fixtures/user-search-results.json';
import { BasicUser } from '../fixtures/users';

describe('User accounts API client', () => {
  let client: UserAccountsApiClient;

  beforeAll(() => {
    client = new UserAccountsApiClient(new Fetcher());
  });

  afterEach(() => {
    mockFetch.restore();
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

    const { data, totalCount } = await client.searchUsers(params);

    expect(totalCount).toBe(SearchResults.totalCount);
    expect(data).toHaveLength(SearchResults.data.length);
    data.forEach((user, index) => {
      expect(user.id).toEqual(SearchResults.data[index].id);
    });
    expect(mockFetch.done()).toBe(true);
  });

  it('will request an email verification', async () => {
    mockFetch.post(
      `/api/users/${BasicUser.username}/requestEmailVerification`,
      204,
    );
    const result = await client.requestEmailVerification(BasicUser.username);
    mockFetch.done();
    expect({
      ...BasicUser,
      emailVerified: false,
    });
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
      expect(user).toEqual(BasicUser);
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

  describe('when changing account attributes', () => {
    it("will change a user's email address", async () => {
      const newEmail = 'new_email@gmail.org';
      mockFetch.post(
        {
          url: `/api/users/${BasicUser.username}/email`,
          body: { newEmail },
        },
        204,
      );

      const result = await client.changeEmail(BasicUser, newEmail);

      expect(mockFetch.done());
      expect(result).toEqual({
        ...BasicUser,
        email: newEmail,
        emailVerified: false,
      });
    });

    it("will change a user's username", async () => {
      const newUsername = 'new_username';
      mockFetch.post(
        {
          url: `/api/users/${BasicUser.username}/username`,
          body: { newUsername },
        },
        204,
      );
      const result = await client.changeUsername(BasicUser, newUsername);
      expect(mockFetch.done()).toBe(true);
      expect(result).toEqual({
        ...BasicUser,
        username: newUsername,
      });
    });

    it("will change a user's membership tier", async () => {
      const newAccountTier = AccountTier.Pro;
      mockFetch.post(
        {
          url: `/api/admin/users/${BasicUser.username}/membership`,
          body: { newAccountTier },
        },
        204,
      );
      const result = await client.changeMembership(BasicUser, newAccountTier);
      expect(mockFetch.done()).toBe(true);
      expect(result).toEqual({
        ...BasicUser,
        accountTier: newAccountTier,
      });
    });
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
});
