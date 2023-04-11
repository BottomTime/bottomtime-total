import { compare, hash } from 'bcrypt';
import { Collection, MongoClient } from 'mongodb';
import Logger from 'bunyan';
import { randomBytes } from 'crypto';

import { assertValid } from '../helpers/validation';
import { Collections, UserDocument } from '../data';
import config from '../config';
import { User, Profile, UserSettings, FriendsManager } from './interfaces';
import { ConflictError } from '../errors';
import {
  EmailSchema,
  PasswordStrengthSchema,
  RoleSchema,
  UsernameSchema,
} from './validation';
import { DefaultProfile } from './default-profile';
import { DefaultUserSettings } from './default-user-settings';
import { DefaultFriendManager } from './default-friend-manager';

export class DefaultUser implements User {
  private _friends: FriendsManager | undefined;
  private _profile: Profile | undefined;
  private _settings: UserSettings | undefined;
  private readonly users: Collection<UserDocument>;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: UserDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
  }

  get id(): string {
    return this.data._id;
  }

  get username(): string {
    return this.data.username;
  }

  get email(): string | undefined {
    return this.data.email;
  }

  get emailVerified(): boolean {
    return this.data.emailVerified;
  }

  get friends(): FriendsManager {
    if (!this._friends) {
      this._friends = new DefaultFriendManager(
        this.mongoClient,
        this.log,
        this.id,
      );
    }

    return this._friends;
  }

  get role(): number {
    return this.data.role;
  }

  get hasPassword(): boolean {
    return !!this.data.passwordHash;
  }

  get isLockedOut(): boolean {
    return this.data.isLockedOut;
  }

  get memberSince(): Date {
    return this.data.memberSince;
  }

  get lastLogin(): Date | undefined {
    return this.data.lastLogin;
  }

  get lastPasswordChange(): Date | undefined {
    return this.data.lastPasswordChange;
  }

  get profile(): Profile {
    if (!this._profile) {
      this._profile = new DefaultProfile(this.mongoClient, this.log, this.data);
    }

    return this._profile;
  }

  get settings(): UserSettings {
    if (!this._settings) {
      this._settings = new DefaultUserSettings(
        this.mongoClient,
        this.log,
        this.data,
      );
    }

    return this._settings;
  }

  get displayName(): string {
    return this.profile.name ?? this.username;
  }

  async changeUsername(newUsername: string): Promise<void> {
    newUsername = newUsername.trim();
    const lowered = newUsername.toLocaleLowerCase();

    assertValid(newUsername, UsernameSchema);

    this.log.debug(`Checking for conflicting username: ${newUsername}`);

    const usernameTaken = await this.users.findOne(
      { usernameLowered: lowered },
      {
        projection: { _id: 1 },
      },
    );
    if (usernameTaken) {
      throw new ConflictError(
        `Unable to change username. Username "${newUsername}" is already taken.`,
        'username',
      );
    }

    this.log.debug(
      `Attempting to change username: ${this.data.username} -> ${newUsername}`,
    );

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          username: newUsername,
          usernameLowered: lowered,
        },
      },
    );

    this.data.username = newUsername;
    this.data.usernameLowered = lowered;
  }

  async changeEmail(newEmail: string): Promise<void> {
    newEmail = newEmail.trim();
    const lowered = newEmail.toLowerCase();

    assertValid(newEmail, EmailSchema);

    this.log.debug(`Checking for conflicting email: ${newEmail}`);

    const emailTaken = await this.users.findOne(
      { emailLowered: lowered },
      {
        projection: { _id: 1 },
      },
    );
    if (emailTaken) {
      throw new ConflictError(
        `Unable to change email address. Email "${newEmail}" is already taken.`,
        'email',
      );
    }

    this.log.debug(
      `Attempting to change email: ${this.data.email} -> ${newEmail}`,
    );

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          email: newEmail,
          emailLowered: lowered,
          emailVerified: false,
        },
      },
    );
    this.data.email = newEmail;
    (this.data.emailLowered = lowered), (this.data.emailVerified = false);
  }

  async changeRole(newRole: number): Promise<void> {
    assertValid(newRole, RoleSchema);

    if (newRole === this.data.role) {
      return;
    }

    this.log.debug(
      `Attempting to change role: ${this.data.role} => ${newRole}`,
    );

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: { role: newRole },
      },
    );
    this.data.role = newRole;
  }

  async requestEmailVerificationToken(): Promise<string> {
    const expirationOffset = config.tokenTTL * 60000;
    const expiration = new Date(new Date().valueOf() + expirationOffset);
    const token = randomBytes(24).toString('base64url');

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          emailVerificationToken: token,
          emailVerificationTokenExpiration: expiration,
        },
      },
    );
    this.data.emailVerificationToken = token;
    this.data.emailVerificationTokenExpiration = expiration;

    return token;
  }

  async verifyEmail(token: string): Promise<boolean> {
    if (
      !this.data.emailVerificationToken ||
      !this.data.emailVerificationTokenExpiration
    ) {
      this.log.debug(
        'Rejecting email verification: No verification token generated.',
      );
      return false;
    }

    if (token !== this.data.emailVerificationToken) {
      this.log.debug('Rejecting email verification: Incorrect token provided.');
      return false;
    }

    if (this.data.emailVerificationTokenExpiration < new Date()) {
      this.log.debug(
        'Rejecting email verification: Verification token expired.',
      );
      return false;
    }

    this.log.debug(
      `Attempting to set emailVerified flag for user: ${this.data.username}`,
    );

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          emailVerified: true,
        },
        $unset: {
          emailVerificationToken: true,
          emailVerificationTokenExpiration: true,
        },
      },
    );
    this.data.emailVerified = true;
    this.data.emailVerificationToken = undefined;
    this.data.emailVerificationTokenExpiration = undefined;

    return true;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    this.log.debug(`Attempting to change password for user ${this.username}`);

    assertValid(newPassword, PasswordStrengthSchema);

    if (!this.data.passwordHash) {
      this.log.debug(
        'Password change for user rejected because user does not yet have a password set.',
      );
      return false;
    }

    const oldPasswordMatches = await compare(
      oldPassword,
      this.data.passwordHash,
    );
    if (!oldPasswordMatches) {
      this.log.debug(
        'Password change for user rejected because old password was incorrect.',
      );
      return false;
    }

    const passwordHash = await hash(newPassword, config.passwordSaltRounds);
    const now = new Date();

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          passwordHash,
          lastPasswordChange: now,
        },
      },
    );
    this.data.passwordHash = passwordHash;
    this.data.lastPasswordChange = now;

    return true;
  }

  async requestPasswordResetToken(): Promise<string> {
    const token = randomBytes(24).toString('base64url');
    const expiration = new Date(config.tokenTTL * 60000 + new Date().valueOf());

    this.log.debug(`Attempting to reset password for user: ${this.username}`);

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          passwordResetToken: token,
          passwordResetTokenExpiration: expiration,
        },
      },
    );
    this.data.passwordResetToken = token;
    this.data.passwordResetTokenExpiration = expiration;

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    this.log.debug(`Attempting to reset password for user: ${this.username}`);

    assertValid(newPassword, PasswordStrengthSchema);

    if (
      !this.data.passwordResetToken ||
      !this.data.passwordResetTokenExpiration
    ) {
      this.log.debug(
        'Password reset attempt refused: No reset token has been generated.',
      );
      return false;
    }

    if (token !== this.data.passwordResetToken) {
      this.log.debug('Password reset attempt refused: Token was incorrect.');
      return false;
    }

    if (this.data.passwordResetTokenExpiration < new Date()) {
      this.log.debug('Password reset attempt refused: Token has expired.');
      return false;
    }

    const passwordHash = await hash(newPassword, config.passwordSaltRounds);
    const now = new Date();

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          passwordHash,
          lastPasswordChange: now,
        },
        $unset: {
          passwordResetToken: true,
          passwordResetTokenExpiration: true,
        },
      },
    );
    this.data.passwordHash = passwordHash;
    this.data.lastPasswordChange = now;
    this.data.passwordResetToken = undefined;
    this.data.passwordResetTokenExpiration = undefined;

    return true;
  }

  async forceResetPassword(newPassword: string): Promise<void> {
    this.log.debug(
      `Attempting to force password reset for user: ${this.username}`,
    );

    assertValid(newPassword, PasswordStrengthSchema);

    const passwordHash = await hash(newPassword, config.passwordSaltRounds);
    const now = new Date();

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          passwordHash,
          lastPasswordChange: now,
        },
      },
    );
    this.data.passwordHash = passwordHash;
    this.data.lastPasswordChange = now;
  }

  async lockAccount(): Promise<void> {
    await this.setAccountIsLocked(true);
  }

  async unlockAccount(): Promise<void> {
    await this.setAccountIsLocked(false);
  }

  private async setAccountIsLocked(isLocked: boolean): Promise<void> {
    if (isLocked === this.isLockedOut) return;

    this.log.debug(
      `Attempting to ${isLocked ? 'lock' : 'unlock'} account for user: ${
        this.username
      }`,
    );

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          isLockedOut: isLocked,
        },
      },
    );
    this.data.isLockedOut = isLocked;
  }

  async updateLastLogin(): Promise<void> {
    const now = new Date();
    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: { lastLogin: now },
      },
    );
    this.data.lastLogin = now;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      emailVerified: this.emailVerified,
      hasPassword: this.hasPassword,
      lastLogin: this.lastLogin,
      lastPasswordChange: this.lastPasswordChange,
      isLockedOut: this.isLockedOut,
      memberSince: this.memberSince,
      profile: this.profile,
      role: this.role,
    };
  }
}
