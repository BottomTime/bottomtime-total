import { compare, hash } from 'bcrypt';
import Logger from 'bunyan';
import { Collection, Filter, FindOptions, MongoClient } from 'mongodb';
import { v4 as uuid } from 'uuid';

import config from '../config';
import { ProfileVisibility, SortOrder, UserRole } from '../constants';
import { UserDocument } from '../data';
import { Collections } from '../schemas/collections';
import { ConflictError } from '../errors';
import { assertValid } from '../helpers/validation';
import { DefaultUser } from './default-user';
import {
  CreateUserOptions,
  CreateUserOptionsSchema,
  SearchUsersOptions,
  SearchUsersOptionsSchema,
  User,
  UserManager,
  UsersSortBy,
} from './interfaces';

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
    const { username, email, role, password, profile } =
      assertValid<CreateUserOptions>(options, CreateUserOptionsSchema);

    await this.checkForConflicts(username, email);

    const data: UserDocument = {
      _id: uuid(),
      emailVerified: false,
      isLockedOut: false,
      memberSince: new Date(),
      role: role ?? UserRole.User,
      username,
      usernameLowered: username.toLowerCase(),
    };

    if (email) {
      data.email = email;
      data.emailLowered = email.toLowerCase();
    }

    if (password) {
      data.passwordHash = await hash(password, config.passwordSaltRounds);
    }

    if (profile) {
      data.profile = profile;
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

  async searchUsers(options: SearchUsersOptions = {}): Promise<User[]> {
    options = assertValid(options, SearchUsersOptionsSchema);
    const query: Filter<UserDocument> = {};
    const queryOptions: FindOptions<UserDocument> = {
      projection: { friends: 0 },
    };

    if (options?.query) {
      query.$text = {
        $search: options.query,
        $diacriticSensitive: false,
        $caseSensitive: false,
      };
    }

    if (options?.profileVisibleTo) {
      if (options.profileVisibleTo === 'public') {
        query['profile.profileVisibility'] = ProfileVisibility.Public;
      } else {
        query.$or = [
          {
            _id: { $ne: options.profileVisibleTo },
            'profile.profileVisibility': ProfileVisibility.Public,
          },
          {
            'profile.profileVisibility': ProfileVisibility.FriendsOnly,
            friends: {
              $elemMatch: { friendId: options.profileVisibleTo },
            },
          },
        ];
      }
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

    const cursor = this.users
      .find(query, queryOptions)
      .skip(options?.skip ?? 0)
      .limit(options?.limit ?? 100);

    return await cursor
      .map((data) => new DefaultUser(this.mongoClient, this.log, data))
      .toArray();
  }

  private async checkForConflicts(
    username: string,
    email?: string,
  ): Promise<void> {
    const usernameLowered = username.toLowerCase();
    const emailLowered = email?.toLowerCase();

    const query = emailLowered
      ? {
          $or: [{ usernameLowered }, { emailLowered }],
        }
      : { usernameLowered: username.toLowerCase() };

    const conflict = await this.users.findOne(query, {
      projection: { emailLowered, usernameLowered },
    });

    if (conflict) {
      if (conflict.usernameLowered === usernameLowered) {
        throw new ConflictError(
          `Unable to create user account. Username "${username}" is already taken.`,
          'username',
        );
      }

      if (emailLowered && conflict.emailLowered === emailLowered) {
        throw new ConflictError(
          `Unable to create user account. Email address "${email}" is already taken.`,
          'email',
        );
      }
    }
  }
}
