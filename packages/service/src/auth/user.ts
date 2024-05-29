import { PasswordResetTokenStatus, UserDTO, UserRole } from '@bottomtime/api';

import { ConflictException, Logger } from '@nestjs/common';

import { compare, hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';

import { DefaultUserSettings } from '../common';
import { Config } from '../config';
import { UserEntity } from '../data';
import { Profile } from './profile';

type UserDataSettings = NonNullable<
  Pick<
    UserEntity,
    'depthUnit' | 'pressureUnit' | 'temperatureUnit' | 'weightUnit'
  >
>;
export type UserSettings = Required<{
  [K in keyof UserDataSettings]: Exclude<UserDataSettings[K], null>;
}>;

export class User implements Express.User {
  private readonly log = new Logger(User.name);

  private _profile: Profile | undefined;

  constructor(
    private readonly Users: Repository<UserEntity>,
    private readonly data: UserEntity,
  ) {}

  get username(): string {
    return this.data.username;
  }

  get email(): string | null {
    return this.data.email;
  }

  get emailVerified(): boolean {
    return this.data.emailVerified;
  }

  get id(): string {
    return this.data.id;
  }

  get hasPassword(): boolean {
    return !!this.data.passwordHash;
  }

  get lastLogin(): Date | null {
    return this.data.lastLogin;
  }

  get lastPasswordChange(): Date | null {
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

    this._profile = new Profile(this.Users, this.data);
    return this._profile;
  }

  get role(): UserRole {
    return this.data.role as UserRole;
  }

  get settings(): UserSettings {
    return {
      depthUnit: this.data.depthUnit ?? DefaultUserSettings.depthUnit,
      pressureUnit: this.data.pressureUnit ?? DefaultUserSettings.pressureUnit,
      temperatureUnit:
        this.data.temperatureUnit ?? DefaultUserSettings.temperatureUnit,
      weightUnit: this.data.weightUnit ?? DefaultUserSettings.weightUnit,
    };
  }

  async changeSettings(settings: Partial<UserSettings>): Promise<void> {
    if (settings.depthUnit) this.data.depthUnit = settings.depthUnit;

    if (settings.pressureUnit) this.data.pressureUnit = settings.pressureUnit;

    if (settings.temperatureUnit)
      this.data.temperatureUnit = settings.temperatureUnit;

    if (settings.weightUnit) this.data.weightUnit = settings.weightUnit;

    await this.Users.save(this.data);
  }

  async changeUsername(newUsername: string): Promise<void> {
    const lowered = newUsername.toLowerCase();

    this.log.debug(`Attempting to change username for user with ID ${this.id}`);
    const exists = await this.Users.findOne({
      where: { usernameLowered: lowered },
    });
    if (exists) {
      throw new ConflictException(
        `Username "${newUsername}" is already taken.`,
      );
    }

    this.data.username = newUsername;
    this.data.usernameLowered = lowered;

    await this.Users.save(this.data);
  }

  async changeEmail(newEmail: string): Promise<void> {
    const lowered = newEmail.toLowerCase();

    this.log.debug(`Attempting to change email for user with ID ${this.id}`);
    const exists = await this.Users.findOne({
      where: { emailLowered: lowered },
    });
    if (exists) {
      throw new ConflictException(`Email "${newEmail}" is already taken.`);
    }

    this.data.email = newEmail;
    this.data.emailLowered = lowered;

    // Invalidate any existing email verification token so that if there is one floating
    // around in the wild it cannot be re-played to verify a fake email address.
    this.data.emailVerificationToken = null;
    this.data.emailVerificationTokenExpiration = null;

    await this.Users.save(this.data);
  }

  async requestEmailVerificationToken(): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    this.data.emailVerificationToken = token;
    this.data.emailVerificationTokenExpiration = dayjs().add(2, 'day').toDate();
    await this.Users.save(this.data);

    return token;
  }

  async verifyEmail(token: string): Promise<boolean> {
    if (
      !this.data.emailVerificationToken ||
      !this.data.emailVerificationTokenExpiration
    ) {
      this.log.debug(
        `Email verification failed because user ${this.username} does not have a verification token set.`,
      );
      return false;
    }

    if (this.data.emailVerificationToken !== token) {
      this.log.debug(
        `Email verification failed for user ${this.username} because the proided token did not match.`,
      );
      return false;
    }

    if (this.data.emailVerificationTokenExpiration < new Date()) {
      this.log.debug(
        `Email verification for user ${this.username} failed because the token has expired.`,
      );
      return false;
    }

    this.data.emailVerified = true;
    this.data.emailVerificationToken = null;
    this.data.emailVerificationTokenExpiration = null;

    this.log.log(
      `User ${this.username} has verified their email address: ${this.email}.`,
    );
    await this.Users.save(this.data);

    return true;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    if (!this.data.passwordHash) {
      return false;
    }

    this.log.debug(`Attempting to change password for user ${this.username}`);
    const oldPassMatches = await compare(oldPassword, this.data.passwordHash);
    if (!oldPassMatches) {
      this.log.debug(
        `Password change for user ${this.username} failed because the old password was incorrect.`,
      );
      return false;
    }

    const passwordHash = await hash(newPassword, Config.passwordSaltRounds);

    this.data.passwordHash = passwordHash;
    this.data.lastPasswordChange = new Date();
    await this.Users.save(this.data);

    this.log.log(`User ${this.username} has changed their password.`);

    return true;
  }

  async requestPasswordResetToken(): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    this.data.passwordResetToken = token;
    this.data.passwordResetTokenExpiration = dayjs().add(2, 'day').toDate();

    await this.Users.save(this.data);

    return token;
  }

  validatePasswordResetToken(token: string): PasswordResetTokenStatus {
    if (
      !this.data.passwordResetToken ||
      !this.data.passwordResetTokenExpiration ||
      this.data.passwordResetToken !== token
    ) {
      return PasswordResetTokenStatus.Invalid;
    }

    if (this.data.passwordResetTokenExpiration < new Date()) {
      return PasswordResetTokenStatus.Expired;
    }

    return PasswordResetTokenStatus.Valid;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    this.log.debug(`Attempting to reset password for user ${this.username}`);

    if (
      this.data.passwordResetTokenExpiration! < new Date() ||
      token !== this.data.passwordResetToken
    ) {
      this.log.debug(
        `Password reset failed for user ${this.username}. No reset token was set.`,
      );
      return false;
    }

    const passwordHash = await hash(newPassword, Config.passwordSaltRounds);

    this.data.passwordHash = passwordHash;
    this.data.lastPasswordChange = new Date();
    this.data.passwordResetToken = null;
    this.data.passwordResetTokenExpiration = null;
    await this.Users.save(this.data);

    this.log.log(
      `User ${this.username} has successfully reset their password.`,
    );

    return true;
  }

  async updateLastLogin(): Promise<void> {
    this.data.lastLogin = new Date();
    await this.Users.save(this.data);
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
      settings: this.settings,
    };
  }

  toEntity(): UserEntity {
    return { ...this.data };
  }
}
