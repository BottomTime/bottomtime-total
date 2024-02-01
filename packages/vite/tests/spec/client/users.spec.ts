import axios, { AxiosError, AxiosInstance } from 'axios';
import AxiosAdapter from 'axios-mock-adapter';

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
      expect(user?.toJSON()).toEqual({
        anonymous: false,
        ...JSON.parse(JSON.stringify(BasicUser)),
      });
    });
  });

  describe('when creating a user', () => {});

  describe('when logging in', () => {
    it('will return the user if the login is successful', async () => {
      const usernameOrEmail = 'test';
      const password = 'password';
      axiosAdapter.onPost('/api/auth/login').reply(200, BasicUser);

      const user = await client.login(usernameOrEmail, password);
      expect(user.toJSON()).toEqual(JSON.parse(JSON.stringify(BasicUser)));
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
});
