import axios, { AxiosInstance } from 'axios';
import { UsersApiClient } from './users';

export class ApiClient {
  private readonly client: AxiosInstance;

  readonly users: UsersApiClient;

  constructor(baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      withCredentials: true,
    });
    this.users = new UsersApiClient(this.client);
  }
}
