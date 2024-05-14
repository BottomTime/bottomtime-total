import { AxiosInstance, isAxiosError } from 'axios';

import {
  AdminSearchUsersParamsDTO,
  AdminSearchUsersResponseSchema,
  CreateUserParamsDTO,
  CurrentUserSchema,
  PasswordResetTokenStatus,
  ProfileDTO,
  ProfileSchema,
  SearchProfilesResponseDTO,
  SearchProfilesResponseSchema,
  SearchUserProfilesParamsDTO,
  SuccessFailResponseDTO,
  UserSchema,
  ValidateResetPasswordTokenResponseDTO,
} from '../types';
import { User } from './user';
import { UserProfile } from './user-profile';

export class UsersApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean> {
    try {
      await this.apiClient.head(
        `/api/users/${encodeURIComponent(usernameOrEmail)}`,
      );
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

  async getUser(usernameOrEmail: string): Promise<User> {
    const { data } = await this.apiClient.get(
      `/api/admin/users/${encodeURIComponent(usernameOrEmail)}`,
    );
    return new User(this.apiClient, UserSchema.parse(data));
  }

  async getProfile(username: string): Promise<ProfileDTO> {
    const { data } = await this.apiClient.get(`/api/users/${username}`);
    return ProfileSchema.parse(data);
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const { data } = await this.apiClient.post('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    return new User(this.apiClient, UserSchema.parse(data));
  }

  async requestPasswordResetToken(usernameOrEmail: string): Promise<void> {
    await this.apiClient.post(
      `/api/users/${usernameOrEmail}/requestPasswordReset`,
    );
  }

  async validatePasswordResetToken(
    usernameOrEmail: string,
    token: string,
  ): Promise<PasswordResetTokenStatus> {
    const { data } =
      await this.apiClient.get<ValidateResetPasswordTokenResponseDTO>(
        `/api/users/${usernameOrEmail}/resetPassword`,
        {
          params: { token },
        },
      );

    return data.status;
  }

  async resetPasswordWithToken(
    usernameOrEmail: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const { data } = await this.apiClient.post<SuccessFailResponseDTO>(
      `/api/users/${usernameOrEmail}/resetPassword`,
      {
        newPassword,
        token,
      },
    );

    return data.succeeded;
  }

  async searchUsers(
    query: AdminSearchUsersParamsDTO,
  ): Promise<{ users: User[]; totalCount: number }> {
    const { data } = await this.apiClient.get('/api/admin/users', {
      params: query,
    });
    const response = AdminSearchUsersResponseSchema.parse(data);

    return {
      users: response.users.map((user) => new User(this.apiClient, user)),
      totalCount: response.totalCount,
    };
  }

  async searchProfiles(
    query: SearchUserProfilesParamsDTO,
  ): Promise<SearchProfilesResponseDTO> {
    const { data } = await this.apiClient.get('/api/users', { params: query });
    return SearchProfilesResponseSchema.parse(data);
  }

  wrapDTO(dto: unknown): User {
    return new User(this.apiClient, UserSchema.parse(dto));
  }

  wrapProfileDTO(dto: unknown): UserProfile {
    return new UserProfile(this.apiClient, ProfileSchema.parse(dto));
  }
}
