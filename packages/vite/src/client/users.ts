import {
  CreateUserParamsDTO,
  CurrentUserSchema,
  UserSchema,
} from '@bottomtime/api';

import { AxiosInstance, isAxiosError } from 'axios';

import { User } from './user';

export class UsersApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean> {
    try {
      await this.apiClient.head(`/api/users/${usernameOrEmail}`);
      return false;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return true;
      }

      throw error;
    }
  }

  async createUser(options: CreateUserParamsDTO): Promise<User> {
    const { data } = await this.apiClient.post('/api/users', options);
    return new User(this.apiClient, UserSchema.parse(data));
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.apiClient.get('/api/auth/me');

    const currentUser = CurrentUserSchema.parse(data);
    if (currentUser.anonymous) {
      return null;
    } else {
      return new User(this.apiClient, currentUser);
    }
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const { data } = await this.apiClient.post('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    return new User(this.apiClient, UserSchema.parse(data));
  }
}
