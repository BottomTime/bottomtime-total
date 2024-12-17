import {
  AccountTier,
  AdminSearchUsersParamsDTO,
  AdminSearchUsersResponseSchema,
  ApiList,
  ChangeEmailParamsDTO,
  ChangeUsernameParamsDTO,
  CreateUserParamsDTO,
  SuccessFailResponseDTO,
  SuccessFailResponseSchema,
  UserDTO,
  UserSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class UserAccountsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean> {
    const status = await this.apiClient.head(
      `/api/users/${encodeURIComponent(usernameOrEmail)}`,
    );
    return status === 404;
  }

  async createUser(options: CreateUserParamsDTO): Promise<UserDTO> {
    const { data } = await this.apiClient.post(
      '/api/users',
      options,
      UserSchema,
    );
    return data;
  }

  async getUser(usernameOrEmail: string): Promise<UserDTO> {
    const { data } = await this.apiClient.get(
      `/api/admin/users/${encodeURIComponent(usernameOrEmail)}`,
      undefined,
      UserSchema,
    );
    return data;
  }

  async searchUsers(
    query: AdminSearchUsersParamsDTO,
  ): Promise<ApiList<UserDTO>> {
    const { data } = await this.apiClient.get(
      '/api/admin/users',
      query,
      AdminSearchUsersResponseSchema,
    );
    return data;
  }

  async changeEmail(user: UserDTO, newEmail: string): Promise<UserDTO> {
    const params: ChangeEmailParamsDTO = { newEmail };
    await this.apiClient.post(`/api/users/${user.username}/email`, params);
    return {
      ...user,
      email: newEmail,
      emailVerified: false,
    };
  }

  async requestEmailVerification(usernameOrEmail: string): Promise<void> {
    await this.apiClient.post(
      `/api/users/${usernameOrEmail}/requestEmailVerification`,
    );
  }

  async verifyEmail(
    username: string,
    token: string,
  ): Promise<SuccessFailResponseDTO> {
    const { data } = await this.apiClient.post(
      `/api/users/${username}/verifyEmail`,
      { token },
      SuccessFailResponseSchema,
    );
    return data;
  }

  async changeUsername(user: UserDTO, newUsername: string): Promise<UserDTO> {
    const params: ChangeUsernameParamsDTO = { newUsername };
    await this.apiClient.post(`/api/users/${user.username}/username`, params);
    return {
      ...user,
      username: newUsername,
    };
  }

  async changeMembership(
    user: UserDTO,
    newAccountTier: AccountTier,
  ): Promise<UserDTO> {
    await this.apiClient.post(`/api/admin/users/${user.username}/membership`, {
      newAccountTier,
    });
    return {
      ...user,
      accountTier: newAccountTier,
    };
  }
}
