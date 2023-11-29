import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserData, UserModel } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/user';
import { compare } from 'bcrypt';
import { JwtPayload, sign } from 'jsonwebtoken';
import { Config } from '../config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserModel.name) private readonly Users: Model<UserData>,
  ) {}

  async authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | undefined> {
    const lowered = usernameOrEmail.toLowerCase();
    const data = await this.Users.findOne({
      $or: [{ usernameLowered: lowered }, { emailLowered: lowered }],
    });

    if (!data || !data.passwordHash || data.isLockedOut) {
      return undefined;
    }

    const passwordMatches = await compare(password, data.passwordHash);
    if (!passwordMatches) {
      return undefined;
    }

    data.lastLogin = new Date();
    await data.save();

    return new User(data);
  }

  async signJWT(subject: string): Promise<string> {
    const now = Date.now();
    const expires = Config.sessions.cookieTTL * 60000 + now;
    const payload: JwtPayload = {
      exp: expires,
      iat: now,
      iss: Config.baseUrl,
      sub: subject,
    };

    return await new Promise<string>((resolve, reject) => {
      sign(payload, Config.sessions.sessionSecret, {}, (error, token) => {
        if (error) reject(error);
        else resolve(token!);
      });
    });
  }
}
