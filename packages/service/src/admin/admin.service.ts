import { UserRole } from '@bottomtime/api';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserData, UserDocument, UserModel } from '../schemas';
import { Model } from 'mongoose';
import { hash } from 'bcrypt';
import { Config } from '../config';

@Injectable()
export class AdminService {
  private readonly log = new Logger(AdminService.name);

  constructor(
    @InjectModel(UserModel.name)
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
