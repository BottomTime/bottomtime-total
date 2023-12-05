import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user';
import { UserData, UserModel } from '../schemas';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  CreateUserOptions,
  ProfileVisibility,
  SearchUsersParamsSchema,
  SortOrder,
  UserRole,
  UsernameSchema,
  UsersSortBy,
} from '@bottomtime/api';
import { v4 as uuid } from 'uuid';
import { hash } from 'bcrypt';
import { Config } from '../config';
import { z } from 'zod';

const SearchUsersOptionsSchema = SearchUsersParamsSchema.extend({
  role: z.nativeEnum(UserRole),
  profileVisibleTo: z.union([z.literal('#public'), UsernameSchema]),
}).partial();
export type SearchUsersOptions = z.infer<typeof SearchUsersOptionsSchema>;

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectModel(UserModel.name)
    private readonly Users: Model<UserData>,
  ) {}

  private async checkForConflicts(
    username: string,
    email?: string,
  ): Promise<void> {
    const usernameTaken = await this.Users.exists({
      usernameLowered: username,
    });

    let emailTaken: { _id: string } | null = null;
    if (email) {
      emailTaken = await this.Users.exists({
        emailLowered: email,
      });
    }

    if (usernameTaken && emailTaken) {
      throw new ConflictException(
        `The username ${username} and email address ${email} are already taken.`,
        { cause: { conflictingFields: ['username', 'email'] } },
      );
    } else if (usernameTaken) {
      throw new ConflictException(
        `A user with the username ${username} already exists.`,
        { cause: { conflictingFields: ['username'] } },
      );
    } else if (emailTaken) {
      throw new ConflictException(
        `A user with the email address ${email} already exists.`,
        { cause: { conflictingFields: ['email'] } },
      );
    }
  }

  async createUser(options: CreateUserOptions): Promise<User> {
    const usernameLowered = options.username.toLowerCase();
    const emailLowered = options.email?.toLowerCase();

    await this.checkForConflicts(usernameLowered, emailLowered);

    const passwordHash = options.password
      ? await hash(options.password, Config.passwordSaltRounds)
      : null;

    const data: UserData = {
      _id: uuid(),
      email: options.email ?? null,
      emailLowered: emailLowered ?? null,
      emailVerified: false,
      isLockedOut: false,
      memberSince: new Date(),
      passwordHash,
      profile: options.profile
        ? {
            ...options.profile,
            certifications: options.profile.certifications
              ? new Types.DocumentArray(options.profile.certifications)
              : null,
          }
        : null,
      role: options.role ?? UserRole.User,
      settings: {
        profileVisibility: ProfileVisibility.FriendsOnly,
      },
      username: options.username,
      usernameLowered,
    };
    const userDocument = await this.Users.create(data as any);

    return new User(this.Users, userDocument);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const data = await this.Users.findById(id);
    return data ? new User(this.Users, data) : undefined;
  }

  async getUserByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<User | undefined> {
    const lowered = usernameOrEmail.toLowerCase();

    const data = await this.Users.findOne({
      $or: [{ usernameLowered: lowered }, { emailLowered: lowered }],
    });

    return data ? new User(this.Users, data) : undefined;
  }

  async searchUsers(options: SearchUsersOptions = {}): Promise<User[]> {
    const searchFilter: FilterQuery<UserData> = {};

    // Text-based search
    if (options.query) {
      searchFilter.$text = { $search: options.query, $caseSensitive: false };
    }

    // Role filter
    if (options.role) {
      searchFilter.role = options.role;
    }

    let query = this.Users.find(searchFilter);

    // Sort order
    if (!options.query) {
      let sortField = 'username';
      if (options.sortBy === UsersSortBy.MemberSince) sortField = 'memberSince';

      query = query.sort({
        [sortField]: options.sortOrder === SortOrder.Descending ? -1 : 1,
      });
    }

    // Pagination
    query = query.skip(options.skip ?? 0).limit(options.limit ?? 100);

    // Execute query and return results.
    const data = await query.exec();
    return data.map((d) => new User(this.Users, d));
  }
}
