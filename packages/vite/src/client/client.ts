import axios, { AxiosInstance } from 'axios';
import { UsersApiClient } from './users';

export type ApiClientOptions = {
  authToken?: string;
  baseUrl?: string;
};

export class ApiClient {
  private readonly client: AxiosInstance;

  readonly users: UsersApiClient;

  constructor({ authToken, baseUrl }: ApiClientOptions) {
    this.client = axios.create({
      baseURL: baseUrl,
      withCredentials: true,
    });

    if (authToken) {
      this.client.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${authToken}`;
    }

    this.users = new UsersApiClient(this.client);
  }
}
