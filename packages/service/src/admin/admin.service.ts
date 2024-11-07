import {
  AdminSearchUsersParamsDTO,
  ApiList,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';

import { Config } from '../config';
import { UserEntity } from '../data';
import { User } from '../users';

export type SearchUsersOptions = AdminSearchUsersParamsDTO;

@Injectable()
export class AdminService {
  private readonly log = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,
  ) {}

  private async findUser(usernameOrEmail: string): Promise<UserEntity | null> {
    const lowered = usernameOrEmail.toLowerCase();
    const user = await this.Users.findOneBy([
      { usernameLowered: lowered },
      { emailLowered: lowered },
    ]);
    return user;
  }

  async searchUsers(options: SearchUsersOptions): Promise<ApiList<User>> {
    let query = this.Users.createQueryBuilder('users');

    if (options.query) {
      query = query.andWhere(
        "fulltext @@ websearch_to_tsquery('english', :query)",
        {
          query: options.query,
        },
      );
    }

    if (options.role) {
      query = query.andWhere({ role: options.role });
    }

    query = query
      .orderBy(
        `users.${options.sortBy || UsersSortBy.Username}`,
        options.sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC',
      )
      .offset(options.skip)
      .limit(options.limit ?? 100);

    this.log.verbose('Listing users using query:', query.getSql());
    const [users, totalCount] = await query.getManyAndCount();

    return {
      data: users.map((user) => new User(this.Users, user)),
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
      await this.Users.save(user);
      return true;
    }

    return false;
  }

  async lockAccount(usernameOrPassword: string): Promise<boolean> {
    const user = await this.findUser(usernameOrPassword);

    if (user) {
      user.isLockedOut = true;
      await this.Users.save(user);
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
      await this.Users.save(user);
      return true;
    }

    return false;
  }

  async unlockAccount(usernameOrPassword: string): Promise<boolean> {
    const user = await this.findUser(usernameOrPassword);

    if (user) {
      user.isLockedOut = false;
      await this.Users.save(user);
      return true;
    }

    return false;
  }
}
