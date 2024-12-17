import {
  ChangePasswordParamsDTO,
  ChangeRoleParams,
  CurrentUserSchema,
  PasswordResetTokenStatus,
  ResetPasswordParams,
  SuccessFailResponseSchema,
  UserDTO,
  UserRole,
  UserSchema,
  ValidateResetPasswordTokenResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';

export type ChangePasswordResult =
  | {
      succeeded: true;
      user: UserDTO;
    }
  | {
      succeeded: false;
      reason: string;
    };

export class AuthApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async login(usernameOrEmail: string, password: string): Promise<UserDTO> {
    const { data } = await this.apiClient.post(
      '/api/auth/login',
      {
        usernameOrEmail,
        password,
      },
      UserSchema,
    );
    return data;
  }

  async logout(): Promise<boolean> {
    const {
      data: { succeeded },
    } = await this.apiClient.post(
      '/api/auth/logout',
      undefined,
      SuccessFailResponseSchema,
    );
    return succeeded;
  }

  async getCurrentUser(): Promise<UserDTO | null> {
    const { data } = await this.apiClient.get(
      '/api/auth/me',
      undefined,
      CurrentUserSchema,
    );
    return data.anonymous ? null : data;
  }

  async getOAuthProviders(usernameOrEmail: string): Promise<Set<string>> {
    const { data } = await this.apiClient.get<string[]>(
      `/api/auth/oauth/${usernameOrEmail}`,
    );
    return new Set(data);
  }

  async unlinkOAuthProvider(
    usernameOrEmail: string,
    provider: string,
  ): Promise<void> {
    await this.apiClient.delete(
      `/api/auth/oauth/${usernameOrEmail}/${provider}`,
    );
  }

  async requestPasswordResetToken(usernameOrEmail: string): Promise<void> {
    await this.apiClient.post(
      `/api/users/${usernameOrEmail}/requestPasswordReset`,
    );
  }

  async changePassword(
    user: UserDTO,
    oldPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    const params: ChangePasswordParamsDTO = { oldPassword, newPassword };
    const { data } = await this.apiClient.post(
      `/api/users/${user.username}/password`,
      params,
      SuccessFailResponseSchema,
    );

    if (data.succeeded) {
      return {
        succeeded: true,
        user: {
          ...user,
          hasPassword: true,
          lastPasswordChange: new Date(),
        },
      };
    }

    return {
      succeeded: false,
      reason: data.reason || 'Password change failed.',
    };
  }

  async validatePasswordResetToken(
    usernameOrEmail: string,
    token: string,
  ): Promise<PasswordResetTokenStatus> {
    const { data } = await this.apiClient.get(
      `/api/users/${usernameOrEmail}/resetPassword`,
      { token },
      ValidateResetPasswordTokenResponseSchema,
    );

    return data.status;
  }

  async resetPasswordWithToken(
    usernameOrEmail: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const { data } = await this.apiClient.post(
      `/api/users/${usernameOrEmail}/resetPassword`,
      {
        newPassword,
        token,
      },
      SuccessFailResponseSchema,
    );

    return data.succeeded;
  }

  async resetPassword(user: UserDTO, newPassword: string): Promise<UserDTO> {
    const params: ResetPasswordParams = { newPassword };
    await this.apiClient.post(
      `/api/admin/users/${user.username}/password`,
      params,
    );
    return {
      ...user,
      hasPassword: true,
      lastPasswordChange: new Date(),
    };
  }

  async changeRole(user: UserDTO, role: UserRole): Promise<UserDTO> {
    const params: ChangeRoleParams = { newRole: role };
    await this.apiClient.post(`/api/admin/users/${user.username}/role`, params);
    return {
      ...user,
      role,
    };
  }

  async toggleAccountLock(user: UserDTO): Promise<UserDTO> {
    const url = `/api/admin/users/${user.username}/${
      user.isLockedOut ? 'unlockAccount' : 'lockAccount'
    }`;
    await this.apiClient.post(url);
    return {
      ...user,
      isLockedOut: !user.isLockedOut,
    };
  }
}
