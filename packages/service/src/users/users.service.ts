import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user';
import {
  FriendData,
  FriendModelName,
  UserData,
  UserModelName,
} from '../schemas';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  CreateUserParamsDTO,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  SearchUserProfilesParamsSchema,
  SortOrder,
  TemperatureUnit,
  UserRole,
  UsernameSchema,
  UsersSortBy,
  WeightUnit,
} from '@bottomtime/api';
import { v4 as uuid } from 'uuid';
import { hash } from 'bcrypt';
import { Config } from '../config';
import { z } from 'zod';

const SelectString = '-friends';

const SearchUsersOptionsSchema = SearchUserProfilesParamsSchema.extend({
  role: z.nativeEnum(UserRole),
  profileVisibleTo: z.union([z.literal('#public'), UsernameSchema]),
}).partial();
export type SearchUsersOptions = z.infer<typeof SearchUsersOptionsSchema>;
export type SearchUsersResult = {
  users: User[];
  totalCount: number;
};
export type CreateUserOptions = CreateUserParamsDTO;

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectModel(UserModelName)
    private readonly Users: Model<UserData>,
    @InjectModel(FriendModelName)
    private readonly Friends: Model<FriendData>,
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

  private async getFriendedBy(userId: string): Promise<string[]> {
    const friends = await this.Friends.find({
      friendId: userId,
    }).select('userId');

    return friends.map((f) => f.userId);
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
        depthUnit: DepthUnit.Meters,
        pressureUnit: PressureUnit.Bar,
        temperatureUnit: TemperatureUnit.Celsius,
        weightUnit: WeightUnit.Kilograms,
        profileVisibility: ProfileVisibility.FriendsOnly,
      },
      username: options.username,
      usernameLowered,
    };
    const userDocument = await this.Users.create(data);

    return new User(this.Users, userDocument);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const data = await this.Users.findById(id).select(SelectString).exec();
    return data ? new User(this.Users, data) : undefined;
  }

  async getUserByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<User | undefined> {
    const lowered = usernameOrEmail.toLowerCase();

    const data = await this.Users.findOne({
      $or: [{ usernameLowered: lowered }, { emailLowered: lowered }],
    })
      .select(SelectString)
      .exec();

    return data ? new User(this.Users, data) : undefined;
  }

  async searchUsers(
    options: SearchUsersOptions = {},
  ): Promise<SearchUsersResult> {
    const searchFilter: FilterQuery<UserData> = {};

    // Text-based search
    if (options.query) {
      searchFilter.$text = { $search: options.query, $caseSensitive: false };
    }

    // Role filter
    if (options.role) {
      searchFilter.role = options.role;
    }

    if (options.profileVisibleTo) {
      if (options.profileVisibleTo === '#public') {
        // All public profiles
        searchFilter['settings.profileVisibility'] = ProfileVisibility.Public;
      } else {
        // Public profiles or profiles visible to the current user as a friend
        const friendedBy = await this.getFriendedBy(options.profileVisibleTo);
        searchFilter.$or = [
          { 'settings.profileVisibility': ProfileVisibility.Public },
          {
            $and: [
              { _id: { $in: friendedBy } },
              { 'settings.profileVisibility': ProfileVisibility.FriendsOnly },
            ],
          },
        ];
      }
    }

    // Sort order
    let sort:
      | {
          [key: string]: -1 | 1;
        }
      | undefined = undefined;
    if (!options.query) {
      let sortField = 'username';
      if (options.sortBy === UsersSortBy.MemberSince) sortField = 'memberSince';

      sort = {
        [sortField]: options.sortOrder === SortOrder.Descending ? -1 : 1,
      };
    }

    // Execute query and return results.
    const [data, totalCount] = await Promise.all([
      this.Users.find(searchFilter)
        .select(SelectString)
        .sort(sort)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 100)
        .exec(),
      this.Users.countDocuments(searchFilter).exec(),
    ]);
    return {
      users: data.map((d) => new User(this.Users, d)),
      totalCount,
    };
  }

  async testFriendship(userIdA: string, userIdB: string): Promise<boolean> {
    const friend = await this.Friends.exists({
      $or: [
        { userId: userIdA, friendId: userIdB },
        { userId: userIdB, friendId: userIdA },
      ],
    }).exec();

    return !!friend;
  }
}
