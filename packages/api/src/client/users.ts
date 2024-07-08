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
import { Fetcher } from './fetcher';
import { User } from './user';
import { UserProfile } from './user-profile';

export class UsersApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean> {
    const status = await this.apiClient.head(
      `/api/users/${encodeURIComponent(usernameOrEmail)}`,
    );
    return status === 404;
  }

  async createUser(options: CreateUserParamsDTO): Promise<User> {
    const { data } = await this.apiClient.post(
      '/api/users',
      options,
      UserSchema,
    );
    return new User(this.apiClient, data);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: currentUser } = await this.apiClient.get(
      '/api/auth/me',
      undefined,
      CurrentUserSchema,
    );

    if (currentUser.anonymous) {
      return null;
    } else {
      return new User(this.apiClient, UserSchema.parse(currentUser));
    }
  }

  async getUser(usernameOrEmail: string): Promise<User> {
    const { data } = await this.apiClient.get(
      `/api/admin/users/${encodeURIComponent(usernameOrEmail)}`,
      undefined,
      UserSchema,
    );
    return new User(this.apiClient, data);
  }

  async getProfile(username: string): Promise<ProfileDTO> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}`,
      undefined,
      ProfileSchema,
    );
    return data;
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const { data } = await this.apiClient.post(
      '/api/auth/login',
      {
        usernameOrEmail,
        password,
      },
      UserSchema,
    );
    return new User(this.apiClient, data);
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
        { token },
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

  async verifyEmail(
    username: string,
    token: string,
  ): Promise<SuccessFailResponseDTO> {
    const { data } = await this.apiClient.post<SuccessFailResponseDTO>(
      `/api/users/${username}/verifyEmail`,
      { token },
    );
    return data;
  }

  async searchUsers(
    query: AdminSearchUsersParamsDTO,
  ): Promise<{ users: User[]; totalCount: number }> {
    const { data: response } = await this.apiClient.get(
      '/api/admin/users',
      query,
      AdminSearchUsersResponseSchema,
    );

    return {
      users: response.users.map((user) => new User(this.apiClient, user)),
      totalCount: response.totalCount,
    };
  }

  async searchProfiles(
    query: SearchUserProfilesParamsDTO,
  ): Promise<SearchProfilesResponseDTO> {
    const { data } = await this.apiClient.get(
      '/api/users',
      query,
      SearchProfilesResponseSchema,
    );
    return data;
  }

  wrapDTO(dto: unknown): User {
    return new User(this.apiClient, UserSchema.parse(dto));
  }

  wrapProfileDTO(dto: unknown): UserProfile {
    return new UserProfile(this.apiClient, ProfileSchema.parse(dto));
  }
}
