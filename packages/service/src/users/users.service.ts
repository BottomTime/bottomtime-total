import {
  CreateUserParamsDTO,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  SearchUserProfilesParamsSchema,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

import { Config } from '../config';
import { UserEntity } from '../data';
import { User } from './user';
import { UsersQueryBuilder } from './users-query-builder';

const SearchUsersOptionsSchema = SearchUserProfilesParamsSchema.extend({
  role: z.nativeEnum(UserRole),
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
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,
  ) {}

  private async checkForConflicts(
    username: string,
    email?: string,
  ): Promise<void> {
    const [usernameTaken, emailTaken] = await Promise.all([
      this.Users.exists({
        where: { usernameLowered: username.toLocaleLowerCase() },
      }),
      email
        ? this.Users.exists({
            where: { emailLowered: email?.toLocaleLowerCase() },
          })
        : Promise.resolve(false),
    ]);

    if (usernameTaken && emailTaken) {
      throw new ConflictException(
        `The username "${username}" and email address "${email}" are already taken.`,
        { cause: { conflictingFields: ['username', 'email'] } },
      );
    } else if (usernameTaken) {
      throw new ConflictException(
        `A user with the username "${username}" already exists.`,
        { cause: { conflictingFields: ['username'] } },
      );
    } else if (emailTaken) {
      throw new ConflictException(
        `A user with the email address "${email}" already exists.`,
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
      : undefined;

    const data = new UserEntity();
    data.id = uuid();
    data.email = options.email ?? null;
    data.emailLowered = emailLowered;
    data.passwordHash = passwordHash ?? null;
    data.role = options.role || UserRole.User;
    data.username = options.username;
    data.usernameLowered = usernameLowered;

    data.bio = options.profile?.bio ?? null;
    data.experienceLevel = options.profile?.experienceLevel ?? null;
    data.location = options.profile?.location ?? null;
    data.logBookSharing =
      options.profile?.logBookSharing ?? LogBookSharing.Private;
    data.name = options.profile?.name ?? null;
    data.startedDiving = options.profile?.startedDiving ?? null;

    data.depthUnit = options.settings?.depthUnit || DepthUnit.Meters;
    data.pressureUnit = options.settings?.pressureUnit || PressureUnit.Bar;
    data.temperatureUnit =
      options.settings?.temperatureUnit || TemperatureUnit.Celsius;
    data.weightUnit = options.settings?.weightUnit || WeightUnit.Kilograms;

    await this.Users.save(data);

    return new User(this.Users, data);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const data = await this.Users.findOne({ where: { id } });
    return data ? new User(this.Users, data) : undefined;
  }

  async getUserByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<User | undefined> {
    const lowered = usernameOrEmail.toLowerCase();

    const data = await this.Users.findOne({
      where: [{ usernameLowered: lowered }, { emailLowered: lowered }],
    });

    return data ? new User(this.Users, data) : undefined;
  }

  async searchUsers(
    options: SearchUsersOptions = {},
  ): Promise<SearchUsersResult> {
    let queryBuilder = new UsersQueryBuilder(this.Users)
      .withQuery(options.query)
      .withRole(options.role)
      .withSortOrder(options.sortBy, options.sortOrder)
      .withPagination(options.skip, options.limit);

    if (options.filterFriends) {
      queryBuilder = queryBuilder.filterFriends();
    }

    const query = queryBuilder.build();

    this.log.debug('Attempting search for users', options);
    this.log.verbose('Performing user search with query', query.getSql());

    const [users, totalCount] = await query.getManyAndCount();

    return {
      users: users.map((d) => new User(this.Users, d)),
      totalCount,
    };
  }
}
