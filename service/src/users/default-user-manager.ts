import { compare, hash } from 'bcrypt';
import Logger from 'bunyan';
import { Collection, Filter, FindOptions, MongoClient } from 'mongodb';
import { v4 as uuid } from 'uuid';

import config from '../config';
import { SortOrder, UserRole } from '../constants';
import { Collections, UserDocument } from '../data';
import { ConflictError } from '../errors';
import { assertValid } from '../helpers/validation';
import { DefaultUser } from './default-user';
import {
  CreateUserOptions,
  Profile,
  SearchProfilesOptions,
  SearchUsersOptions,
  User,
  UserManager,
  UsersSortBy,
} from './interfaces';
import { CreateUserOptionsSchema } from './validation';

export class DefaultUserManager implements UserManager {
  private readonly users: Collection<UserDocument>;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
  }

  private async queryByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<UserDocument | null> {
    usernameOrEmail = usernameOrEmail.trim().toLowerCase();
    const data = await this.users.findOne({
      $or: [
        { emailLowered: usernameOrEmail },
        { usernameLowered: usernameOrEmail },
      ],
    });

    return data;
  }

  async createUser(options: CreateUserOptions): Promise<User> {
    assertValid(options, CreateUserOptionsSchema);

    const username = options.username.trim();
    const usernameLowered = username.toLowerCase();

    const usernameConflict = await this.users.findOne(
      { usernameLowered },
      { projection: { _id: true } },
    );
    if (usernameConflict) {
      throw new ConflictError(
        `Unable to create user account. Username "${username}" is already taken.`,
        'username',
      );
    }

    const data: UserDocument = {
      _id: uuid(),
      emailVerified: false,
      isLockedOut: false,
      memberSince: new Date(),
      role: options.role ?? UserRole.User,
      username,
      usernameLowered,
    };

    if (options.profileVisibility) {
      data.profile = {
        profileVisibility: options.profileVisibility,
      };
    }

    if (options.email) {
      const email = options.email.trim();
      const emailLowered = email.toLowerCase();

      const emailConflict = await this.users.findOne(
        { emailLowered },
        { projection: { _id: true } },
      );
      if (emailConflict) {
        throw new ConflictError(
          `Unable to create user account. Email address "${username}" is already in use.`,
          'email',
        );
      }

      data.email = email;
      data.emailLowered = emailLowered;
    }

    if (options.password) {
      data.passwordHash = await hash(
        options.password,
        config.passwordSaltRounds,
      );
    }

    this.log.debug(`Attempting to create new user account: ${username}`);

    await this.users.insertOne(data);

    return new DefaultUser(this.mongoClient, this.log, data);
  }

  async getUser(id: string): Promise<User | undefined> {
    this.log.debug(`Attempting to query for user by id: ${id}`);

    const data = await this.users.findOne({ _id: id });
    return data ? new DefaultUser(this.mongoClient, this.log, data) : undefined;
  }

  async getUserByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<User | undefined> {
    this.log.debug(
      `Attempting to query for user by username or email: ${usernameOrEmail}`,
    );
    const data = await this.queryByUsernameOrEmail(usernameOrEmail);

    return data ? new DefaultUser(this.mongoClient, this.log, data) : undefined;
  }

  async authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | undefined> {
    this.log.debug(
      `Attempting to authenticate user by username or email: ${usernameOrEmail}`,
    );
    const data = await this.queryByUsernameOrEmail(usernameOrEmail);

    if (!data) {
      return undefined;
    }

    if (data.isLockedOut) {
      this.log.debug('Authentication rejected: account is locked.');
      return undefined;
    }

    if (!data.passwordHash) {
      this.log.debug('Authentication rejected: account has no password set.');
      return undefined;
    }

    const passwordValid = await compare(password, data.passwordHash);
    if (!passwordValid) {
      this.log.debug('Authentication rejected: Password is incorrect');
      return undefined;
    }

    return new DefaultUser(this.mongoClient, this.log, data);
  }

  async searchUsers(options?: SearchUsersOptions): Promise<User[]> {
    const query: Filter<UserDocument> = {};
    const queryOptions: FindOptions<UserDocument> = {};

    if (options?.query) {
      query.$text = {
        $search: options.query,
        $diacriticSensitive: false,
        $caseSensitive: false,
      };
    }

    if (options?.sortBy === UsersSortBy.Username) {
      queryOptions.sort = {
        username: options?.sortOrder === SortOrder.Descending ? -1 : 1,
      };
    } else if (options?.sortBy === UsersSortBy.MemberSince) {
      queryOptions.sort = {
        memberSince: options?.sortOrder === SortOrder.Ascending ? 1 : -1,
      };
    }

    if (options?.role) {
      query.role = options.role;
    }

    const results: User[] = [];
    const cursor = this.users
      .find(query, queryOptions)
      .skip(options?.skip ?? 0)
      .limit(options?.limit ?? 100);

    await cursor.forEach((data) => {
      results.push(new DefaultUser(this.mongoClient, this.log, data));
    });

    return results;
  }

  async searchProfiles(options?: SearchProfilesOptions): Promise<Profile[]> {
    return [];
  }
}
