import { UserDTO, UserRole } from '@bottomtime/api';
import { Logger } from '@nestjs/common';
import { UserDocument } from '../schemas/user.document';
import { Maybe } from '../maybe';
import { Profile } from './profile';

export class User {
  private readonly log = new Logger(User.name);

  private _profile: Profile | undefined;

  constructor(private readonly data: UserDocument) {}

  get username(): string {
    return this.data.username;
  }

  get email(): Maybe<string> {
    return this.data.email;
  }

  get emailVerified(): boolean {
    return this.data.emailVerified;
  }

  get id(): string {
    return this.data._id;
  }

  get hasPassword(): boolean {
    return !!this.data.passwordHash;
  }

  get lastLogin(): Maybe<Date> {
    return this.data.lastLogin;
  }

  get lastPasswordChange(): Maybe<Date> {
    return this.data.lastPasswordChange;
  }

  get isLockedOut(): boolean {
    return this.data.isLockedOut;
  }

  get memberSince(): Date {
    return this.data.memberSince;
  }

  get profile(): Profile {
    if (this._profile) return this._profile;

    this._profile = new Profile(this.data);
    return this._profile;
  }

  get role(): UserRole {
    return this.data.role as UserRole;
  }

  toJSON(): UserDTO {
    return {
      emailVerified: this.emailVerified,
      hasPassword: this.hasPassword,
      id: this.id,
      isLockedOut: this.isLockedOut,
      memberSince: this.memberSince,
      profile: this.profile.toJSON(),
      role: this.role,
      username: this.username,
      email: this.email ?? undefined,
      lastLogin: this.lastLogin ?? undefined,
      lastPasswordChange: this.lastPasswordChange ?? undefined,
    };
  }
}
