import { UserDTO, UserRole } from '@bottomtime/api';

import { AxiosInstance } from 'axios';

import { UserProfile } from './user-profile';

export class User {
  private _profile: UserProfile | undefined;

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
      this._profile = new UserProfile(this.data.profile);
    }

    return this._profile;
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
