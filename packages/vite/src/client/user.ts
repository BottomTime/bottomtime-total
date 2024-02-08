import {
  ChangeEmailParamsDTO,
  ChangeRoleParams,
  ChangeUsernameParamsDTO,
  ResetPasswordParams,
  UserDTO,
  UserRole,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

import { UserProfile } from './user-profile';
import { UserSettings } from './user-settings';

export class User {
  private _profile: UserProfile | undefined;
  private _settings: UserSettings | undefined;

  constructor(
    private readonly client: AxiosInstance,
    private readonly data: UserDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get displayName(): string {
    return this.profile.name || this.username;
  }

  get email(): string | undefined {
    return this.data.email;
  }

  get emailVerified(): boolean {
    return this.data.emailVerified;
  }

  get hasPassword(): boolean {
    return this.data.hasPassword;
  }

  get isLockedOut(): boolean {
    return this.data.isLockedOut;
  }

  get lastLogin(): Date | undefined {
    return this.data.lastLogin;
  }

  get lastPasswordChange(): Date | undefined {
    return this.data.lastPasswordChange;
  }

  get memberSince(): Date {
    return new Date(this.data.memberSince);
  }

  get role(): UserRole {
    return this.data.role;
  }

  get username(): string {
    return this.data.username;
  }

  get profile(): UserProfile {
    if (!this._profile) {
      this._profile = new UserProfile(this.client, this.data);
    }

    return this._profile;
  }

  async changeEmail(newEmail: string): Promise<void> {
    const params: ChangeEmailParamsDTO = { newEmail };
    await this.client.post(`/api/users/${this.username}/email`, params);
    this.data.email = newEmail;
  }

  async changeRole(role: UserRole): Promise<void> {
    const params: ChangeRoleParams = { newRole: role };
    await this.client.post(`/api/admin/users/${this.username}/role`, params);
    this.data.role = role;
  }

  async changeUsername(newUsername: string): Promise<void> {
    const params: ChangeUsernameParamsDTO = { newUsername };
    await this.client.post(`/api/users/${this.username}/username`, params);
    this.data.username = newUsername;
  }

  async resetPassword(newPassword: string): Promise<void> {
    const params: ResetPasswordParams = { newPassword };
    await this.client.post(
      `/api/admin/users/${this.username}/password`,
      params,
    );
    this.data.hasPassword = true;
    this.data.lastPasswordChange = new Date();
  }

  get settings(): UserSettings {
    if (!this._settings) {
      this._settings = new UserSettings(this.client, this.data);
    }

    return this._settings;
  }

  async toggleAccountLock(): Promise<void> {
    const url = `/api/admin/users/${this.username}/${
      this.isLockedOut ? 'unlockAccount' : 'lockAccount'
    }`;
    await this.client.post(url);
    this.data.isLockedOut = !this.data.isLockedOut;
  }

  toJSON(): UserDTO {
    return { ...this.data };
  }
}
