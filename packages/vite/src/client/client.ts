import axios, { AxiosInstance } from 'axios';
import { UsersApiClient } from './users';

export type ApiClientOptions = {
  authToken?: string;
};

export class ApiClient {
  private readonly client: AxiosInstance;

  readonly users: UsersApiClient;

  constructor(options?: ApiClientOptions) {
    this.client = axios.create({
      withCredentials: true,
    });

    if (options?.authToken) {
      this.client.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${options.authToken}`;
    }

    this.users = new UsersApiClient(this.client);
  }
}
