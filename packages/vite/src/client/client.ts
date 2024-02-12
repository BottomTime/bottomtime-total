import axios, { AxiosInstance } from 'axios';

import { UsersApiClient } from './users';

export type ApiClientOptions = {
  baseURL?: string;
};

export class ApiClient {
  private readonly client: AxiosInstance;
  readonly users: UsersApiClient;

  constructor(options?: ApiClientOptions) {
    this.client = axios.create({
      baseURL: options?.baseURL,
      withCredentials: true,
    });

    this.users = new UsersApiClient(this.client);
  }

  get axios(): AxiosInstance {
    return this.client;
  }
}
