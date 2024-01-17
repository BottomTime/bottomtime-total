import {
  AdminSearchUsersParamsDTO,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserData, UserDocument, UserModelName } from '../schemas';
import { FilterQuery, Model } from 'mongoose';
import { hash } from 'bcrypt';
import { Config } from '../config';
import { User } from '../users/user';

export type SearchUsersOptions = AdminSearchUsersParamsDTO;
export type SearchUsersResults = {
  users: User[];
  totalCount: number;
};

@Injectable()
export class AdminService {
  private readonly log = new Logger(AdminService.name);

  constructor(
    @InjectModel(UserModelName)
    private readonly Users: Model<UserData>,
  ) {}

  private async findUser(
    usernameOrEmail: string,
  ): Promise<UserDocument | null> {
    const lowered = usernameOrEmail.toLowerCase();
    const user = await this.Users.findOne({
      $or: [{ usernameLowered: lowered }, { emailLowered: lowered }],
    });
    return user;
  }

  async searchUsers(options: SearchUsersOptions): Promise<SearchUsersResults> {
    const query: FilterQuery<UserData> = {};

    if (options.query) {
      query.$text = {
        $search: options.query,
        $caseSensitive: false,
        $diacriticSensitive: false,
      };
    }

    if (options.role) {
      query.role = options.role;
    }

    let sort: { [key: string]: SortOrder };
    switch (options.sortBy) {
      case UsersSortBy.MemberSince:
        sort = {
          memberSince: options.sortOrder,
        };
        break;

      case UsersSortBy.Username:
      default:
        sort = {
          username: options.sortOrder,
        };
        break;
    }

    const [users, totalCount] = await Promise.all([
      this.Users.find(query)
        .sort(sort)
        .skip(options.skip)
        .limit(options.limit)
        .exec(),
      this.Users.countDocuments().exec(),
    ]);
    this.Users.find();

    return {
      users: users.map((user) => new User(this.Users, user)),
      totalCount,
    };
  }

  async changeRole(
    usernameOrEmail: string,
    newRole: UserRole,
  ): Promise<boolean> {
    const user = await this.findUser(usernameOrEmail);

    if (user) {
      user.role = newRole;
      await user.save();
      return true;
    }

    return false;
  }

  async lockAccount(usernameOrPassword: string): Promise<boolean> {
    const user = await this.findUser(usernameOrPassword);

    if (user) {
      user.isLockedOut = true;
      await user.save();
      return true;
    }

    return false;
  }

  async resetPassword(
    usernameOrEmail: string,
    newPassword: string,
  ): Promise<boolean> {
    this.log.debug(`Attempting to reset password for ${usernameOrEmail}`);

    const user = await this.findUser(usernameOrEmail);

    if (user) {
      user.passwordHash = await hash(newPassword, Config.passwordSaltRounds);
      user.lastPasswordChange = new Date();
      await user.save();
      return true;
    }

    return false;
  }

  async unlockAccount(usernameOrPassword: string): Promise<boolean> {
    const user = await this.findUser(usernameOrPassword);

    if (user) {
      user.isLockedOut = false;
      await user.save();
      return true;
    }

    return false;
  }
}
