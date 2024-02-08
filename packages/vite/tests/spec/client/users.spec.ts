import {
  AdminSearchUsersParamsDTO,
  CreateUserParamsDTO,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import axios, { AxiosError, AxiosInstance } from 'axios';
import AxiosAdapter from 'axios-mock-adapter';

import SearchResults from '../../../../service/tests/fixtures/user-search-data.json';
import { User } from '../../../src/client';
import { UsersApiClient } from '../../../src/client/users';
import { BasicUser } from '../../fixtures/users';

describe('Users API client', () => {
  let axiosInstance: AxiosInstance;
  let axiosAdapter: AxiosAdapter;
  let client: UsersApiClient;

  beforeAll(() => {
    axiosInstance = axios.create();
    axiosAdapter = new AxiosAdapter(axiosInstance);
    client = new UsersApiClient(axiosInstance);
  });

  afterEach(() => {
    axiosAdapter.reset();
  });

  afterAll(() => {
    axiosAdapter.restore();
  });

  describe('when checking if usernames or emails are available', () => {
    it('will return true if the username is not found', async () => {
      axiosAdapter.onHead('/api/users/test').reply(404);
      const result = await client.isUsernameOrEmailAvailable('test');
      expect(result).toBe(true);
    });

    it('will return false if the username is found', async () => {
      axiosAdapter.onHead('/api/users/test').reply(200);
      const result = await client.isUsernameOrEmailAvailable('test');
      expect(result).toBe(false);
    });

    it('will re-throw an error if the request fails', async () => {
      axiosAdapter.onHead('/api/users/test').networkErrorOnce();
      await expect(client.isUsernameOrEmailAvailable('test')).rejects.toThrow(
        AxiosError,
      );
    });

    it('will URL-encode an email address', async () => {
      axiosAdapter.onHead('/api/users/test%40example.com').reply(404);
      await client.isUsernameOrEmailAvailable('test@example.com');
      expect(axiosAdapter.history.head[0]?.url).toEqual(
        '/api/users/test@example.com',
      );
    });
  });

  describe('when retrieving the current user', () => {
    it('will return null if the user is anonymous', async () => {
      axiosAdapter.onGet('/api/auth/me').reply(200, { anonymous: true });
      const user = await client.getCurrentUser();
      expect(user).toBeNull();
    });

    it('will return the user if the user is not anonymous', async () => {
      axiosAdapter.onGet('/api/auth/me').reply(200, {
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
      axiosAdapter.onPost('/api/users', requestData).reply(201, BasicUser);
      const user = await client.createUser(requestData);
      expect(user.toJSON()).toEqual(BasicUser);
    });

    it('will allow any errors to bubble up', async () => {
      axiosAdapter.onPost('/api/users', requestData).reply(409);
      await expect(client.createUser(requestData)).rejects.toThrow(AxiosError);
    });
  });

  describe('when logging in', () => {
    it('will return the user if the login is successful', async () => {
      const usernameOrEmail = 'test';
      const password = 'password';
      axiosAdapter
        .onPost('/api/auth/login', { usernameOrEmail, password })
        .reply(200, BasicUser);

      const user = await client.login(usernameOrEmail, password);
      expect(user.toJSON()).toEqual(BasicUser);
      expect(axiosAdapter.history.post[0]?.data).toEqual(
        JSON.stringify({
          usernameOrEmail,
          password,
        }),
      );
    });

    it('will throw an error if the login fails', async () => {
      axiosAdapter.onPost('/api/auth/login').reply(401);
      await expect(client.login('test', 'password')).rejects.toThrow(
        AxiosError,
      );
    });
  });

  it('will perform a search for users', async () => {
    const expectedTtotalCount = 838;
    const params: AdminSearchUsersParamsDTO = {
      query: 'bob',
      role: UserRole.User,
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Ascending,
      skip: 50,
      limit: 200,
    };

    axiosAdapter.onGet('/api/admin/users', { params }).reply(200, {
      totalCount: expectedTtotalCount,
      users: SearchResults.slice(0, 20),
    });
    const { users, totalCount } = await client.searchUsers(params);

    expect(totalCount).toBe(expectedTtotalCount);
    expect(users).toHaveLength(SearchResults.length);
    users.forEach((user, index) => {
      expect(user.toJSON()).toEqual(SearchResults[index]);
    });
  });

  it('will wrap a user DTO in a User instance', () => {
    const user = client.wrapDTO(BasicUser);
    expect(user).toBeInstanceOf(User);
    expect(user.username).toBe(BasicUser.username);
  });
});
