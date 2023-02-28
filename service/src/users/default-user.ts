import { type Collection, type MongoClient } from 'mongodb';
import type Logger from 'bunyan';
import { randomBytes } from 'crypto';

import { assertValid } from '../helpers/validation';
import { Collections, type UserDocument } from '../data';
import config from '../config';
import { type User } from './interfaces';
import { type UserRole } from '../constants';
import { ConflictError } from '../errors';
import { EmailSchema, UsernameSchema } from './validation';

export class DefaultUser implements User {
  private readonly users: Collection<UserDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: UserDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
  }

  get id(): string {
    return this.data.id;
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

  get role(): UserRole {
    return this.data.role;
  }

  get hasPassword(): boolean {
    return !!this.data.passwordHash;
  }

  get isLockedOut(): boolean {
    return this.data.isLockedOut;
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

  async changeRole(newRole: UserRole): Promise<void> {
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
    const expirationOffset = config.emailTokenTTL * 60000;
    const expiration = new Date(new Date().valueOf() + expirationOffset);
    const token = randomBytes(16).toString('base64');

    console.log(token);
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
    throw new Error('Method not implemented.');
  }

  async requestPasswordResetToken(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async forceResetPassword(newPassword: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async lockAccount(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async unlockAccount(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
