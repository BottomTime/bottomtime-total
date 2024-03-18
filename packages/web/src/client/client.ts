import axios, { AxiosHeaders, AxiosInstance } from 'axios';

import { DiveSitesApiClient } from './dive-sites';
import { UsersApiClient } from './users';

export type ApiClientOptions = {
  authToken?: string;
  baseURL?: string;
};

export class ApiClient {
  private readonly client: AxiosInstance;
  readonly users: UsersApiClient;
  readonly diveSites: DiveSitesApiClient;

  constructor(options?: ApiClientOptions) {
    const headers = new AxiosHeaders();
    if (options?.authToken) {
      headers.Authorization = `Bearer ${options.authToken}`;
    }

    this.client = axios.create({
      baseURL: options?.baseURL,
      headers,
      withCredentials: true,
    });

    this.users = new UsersApiClient(this.client);
    this.diveSites = new DiveSitesApiClient(this.client);
  }

  get axios(): AxiosInstance {
    return this.client;
  }
}
