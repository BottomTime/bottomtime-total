import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user';
import { UserData, UserModel } from '../schemas';
import { Model } from 'mongoose';
import {
  CreateUserOptions,
  ProfileVisibility,
  UserRole,
} from '@bottomtime/api';
import { v4 as uuid } from 'uuid';
import { hash } from 'bcrypt';
import { Config } from '../config';

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectModel(UserModel.name)
    private readonly Users: Model<UserData>,
  ) {}

  async createUser(options: CreateUserOptions): Promise<User> {
    const passwordHash = options.password
      ? await hash(options.password, Config.passwordSaltRounds)
      : null;

    const data: UserData = {
      _id: uuid(),
      email: options.email ?? null,
      emailLowered: options.email ? options.email.toLowerCase() : null,
      emailVerified: false,
      isLockedOut: false,
      memberSince: new Date(),
      passwordHash,
      // profile: options.profile ?? null,
      role: options.role ?? UserRole.User,
      settings: {
        profileVisibility: ProfileVisibility.FriendsOnly,
      },
      username: options.username,
      usernameLowered: options.username.toLowerCase(),
    };
    const userDocument = await this.Users.create(data as any);

    return new User(userDocument);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const data = await this.Users.findById(id);
    return data ? new User(data) : undefined;
  }

  async getUserByUsernameOrEmail(
    usernameOrEmail: string,
  ): Promise<User | undefined> {
    const lowered = usernameOrEmail.toLowerCase();

    const data = await this.Users.findOne({
      $or: [{ usernameLowered: lowered }, { emailLowered: lowered }],
    });

    return data ? new User(data) : undefined;
  }

  async searchUsers(): Promise<User[]> {
    return [];
  }
}
