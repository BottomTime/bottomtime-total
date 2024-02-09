import axios, { AxiosInstance } from 'axios';
import AxiosAdapter from 'axios-mock-adapter';

import { UsersApiClient } from '../../../src/client/users';

describe('User API client', () => {
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

  it('will return properties correctly', () => {});

  it('will update properties correctly', () => {});

  it("will allow access to the user's profile", () => {});

  it("will allow access to the user's settings", () => {});
});
