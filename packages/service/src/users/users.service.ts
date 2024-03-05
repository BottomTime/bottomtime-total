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

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

import { Config } from '../config';
import { FriendshipEntity, UserCertificationEntity, UserEntity } from '../data';
import { User } from './user';

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
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,

    @InjectRepository(FriendshipEntity)
    private readonly Friends: Repository<FriendshipEntity>,
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
    data.email = options.email;
    data.emailLowered = emailLowered;
    data.passwordHash = passwordHash;
    data.role = options.role || UserRole.User;
    data.username = options.username;
    data.usernameLowered = usernameLowered;

    data.avatar = options.profile?.avatar;
    data.bio = options.profile?.bio;
    data.birthdate = options.profile?.birthdate;
    data.certifications = options.profile?.certifications?.map((cert) => {
      const certification = new UserCertificationEntity();
      certification.agency = cert.agency;
      certification.course = cert.course;
      certification.date = cert.date;
      return certification;
    });
    data.customData = options.profile?.customData;
    data.experienceLevel = options.profile?.experienceLevel;
    data.location = options.profile?.location;
    data.name = options.profile?.name;
    data.startedDiving = options.profile?.startedDiving;

    data.depthUnit = options.settings?.depthUnit || DepthUnit.Meters;
    data.pressureUnit = options.settings?.pressureUnit || PressureUnit.Bar;
    data.profileVisibility =
      options.settings?.profileVisibility || ProfileVisibility.FriendsOnly;
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
    let query = this.Users.createQueryBuilder('users').from(
      UserEntity,
      'users',
    );

    if (options.role) {
      query = query.andWhere('role = :role', { role: options.role });
    }

    if (options.query) {
      query = query.andWhere('fulltext @@ to_tsquery(:query)', {
        query: options.query,
      });
    }

    query = query.skip(options.skip ?? 0).take(options.limit ?? 100);

    const sortBy = options.sortBy || UsersSortBy.Username;
    const sortOrder = options.sortOrder
      ? options.sortOrder
      : sortBy === UsersSortBy.MemberSince
      ? SortOrder.Descending
      : SortOrder.Ascending;

    query = query.orderBy(
      sortBy,
      sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC',
    );

    const users: UserEntity[] = await query.execute();

    return {
      users: users.map((d) => new User(this.Users, d)),
      totalCount: 0,
    };
  }
}
