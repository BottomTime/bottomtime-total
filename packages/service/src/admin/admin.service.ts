import {
  AdminSearchUsersParamsDTO,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hash } from 'bcrypt';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Config } from '../config';
import { UserEntity } from '../data';
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

  async searchUsers(options: SearchUsersOptions): Promise<SearchUsersResults> {
    const where: FindOptionsWhere<UserEntity> = {};

    if (options.query) {
      // TODO
      // query.$text = {
      //   $search: options.query,
      //   $caseSensitive: false,
      //   $diacriticSensitive: false,
      // };
    }

    if (options.role) {
      where.role = options.role;
    }

    const query = this.Users.createQueryBuilder('users')
      .where(where)
      .orderBy(
        options.sortBy || UsersSortBy.MemberSince,
        options.sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC',
      )
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 100);

    const [users, totalCount] = await query.getManyAndCount();

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
