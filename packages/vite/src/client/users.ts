import {
  AdminSearchUsersParamsDTO,
  AdminSearchUsersResponseSchema,
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
      return new User(this.apiClient, UserSchema.parse(data));
    }
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const { data } = await this.apiClient.post('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    return new User(this.apiClient, UserSchema.parse(data));
  }

  // TODO: We need these endpoints on the backend first.
  // async requestPasswordReset(usernameOrEmail: string): Promise<void> {
  //   const url = `/api/users/${encodeURIComponent(
  //     usernameOrEmail,
  //   )}/resetPassword`;
  // }

  // async resetPasswordWithToken(
  //   token: string,
  //   newPassword: string,
  // ): Promise<void> {
  //   const url = `/api/users/resetPassword/${encodeURIComponent(token)}`;
  //   await this.apiClient.post(url, { newPassword });
  // }

  async searchUsers(
    options: AdminSearchUsersParamsDTO,
  ): Promise<{ users: User[]; totalCount: number }> {
    const { data } = await this.apiClient.get('/api/admin/users', {
      params: options,
    });
    const response = AdminSearchUsersResponseSchema.parse(data);

    return {
      users: response.users.map((user) => new User(this.apiClient, user)),
      totalCount: response.totalCount,
    };
  }

  wrapDTO(dto: unknown): User {
    return new User(this.apiClient, UserSchema.parse(dto));
  }
}
