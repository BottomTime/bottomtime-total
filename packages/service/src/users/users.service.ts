import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user';
import { UserData, UserModel } from '../schemas';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectModel(UserModel.name)
    private readonly Users: Model<UserData>,
  ) {}

  async createUser(): Promise<User> {
    throw new Error('not implemented');
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
