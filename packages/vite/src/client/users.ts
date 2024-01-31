import {
  CreateUserOptionsSchema,
  CreateUserParamsDTO,
  CurrentUserDTO,
  UserDTO,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

import { User } from './user';

export class UsersApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async createUser(options: CreateUserParamsDTO): Promise<User> {
    CreateUserOptionsSchema.parse(options);
    const { data } = await this.apiClient.post<UserDTO>('/api/users', options);
    return new User(this.apiClient, data);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.apiClient.get<CurrentUserDTO>('/api/auth/me');

    if (data.anonymous) {
      return null;
    } else {
      return new User(this.apiClient, data as UserDTO);
    }
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const { data } = await this.apiClient.post<UserDTO>('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    return new User(this.apiClient, data);
  }
}
