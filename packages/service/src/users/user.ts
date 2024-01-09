import { UserDTO, UserRole } from '@bottomtime/api';
import { ConflictException, Logger } from '@nestjs/common';
import { UserData, UserDocument } from '../schemas/user.document';
import { Profile } from './profile';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { compare, hash } from 'bcrypt';
import { Config } from '../config';
import { UserSettings } from './user-settings';
import { Maybe } from '../common';

export class User implements Express.User {
  private readonly log = new Logger(User.name);

  private _profile: Profile | undefined;
  private _settings: UserSettings | undefined;

  constructor(
    private readonly Users: Model<UserData>,
    private readonly data: UserDocument,
  ) {}

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

  get settings(): UserSettings {
    if (this._settings) return this._settings;

    this._settings = new UserSettings(this.data);
    return this._settings;
  }

  async changeUsername(newUsername: string): Promise<void> {
    const lowered = newUsername.toLowerCase();

    this.log.debug(`Attempting to change username for user with ID ${this.id}`);
    const exists = await this.Users.findOne({ usernameLowered: lowered });
    if (exists) {
      throw new ConflictException(
        `Username "${newUsername}" is already taken.`,
      );
    }

    this.data.username = newUsername;
    this.data.usernameLowered = lowered;
    await this.data.save();
  }

  async changeEmail(newEmail: string): Promise<void> {
    const lowered = newEmail.toLowerCase();

    this.log.debug(`Attempting to change email for user with ID ${this.id}`);
    const exists = await this.Users.findOne({ emailLowered: lowered });
    if (exists) {
      throw new ConflictException(`Email "${newEmail}" is already taken.`);
    }

    this.data.email = newEmail;
    this.data.emailLowered = lowered;
    await this.data.save();
  }

  async requestEmailVerificationToken(): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    this.data.emailVerificationToken = token;
    this.data.emailVerificationTokenExpiration = dayjs().add(2, 'day').toDate();
    await this.data.save();

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
    await this.data.save();

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
    await this.data.save();

    this.log.log(`User ${this.username} has changed their password.`);

    return true;
  }

  async requestPasswordResetToken(): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    this.data.passwordResetToken = token;
    this.data.passwordResetTokenExpiration = dayjs().add(2, 'day').toDate();

    await this.data.save();

    return token;
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
    await this.data.save();

    this.log.log(
      `User ${this.username} has successfully reset their password.`,
    );

    return true;
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
      settings: this.settings.toJSON(),
    };
  }
}
