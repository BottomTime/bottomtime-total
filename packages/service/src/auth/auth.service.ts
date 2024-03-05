import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { compare } from 'bcrypt';
import { Response } from 'express';
import { JwtPayload, sign } from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { Config } from '../config';
import { UserEntity } from '../data';
import { User } from '../users/user';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,
  ) {}

  async validateJwt(payload: JwtPayload): Promise<User> {
    if (!payload.sub) {
      throw new UnauthorizedException('JWT payload did not contain a subject.');
    }

    if (!/^user\|.*/.test(payload.sub)) {
      throw new UnauthorizedException('Invalid subject in the JWT.');
    }

    const userId = payload.sub.substring(5);
    const user = await this.Users.findOneBy({ id: userId });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid user indicated in the JWT subject.',
      );
    }

    if (user.isLockedOut) {
      throw new ForbiddenException(
        'Your account is currently suspended. You may not perform any actions on this site.',
      );
    }

    return new User(this.Users, user);
  }

  async authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | undefined> {
    const lowered = usernameOrEmail.toLowerCase();
    const data = await this.Users.findOneBy([
      { usernameLowered: lowered },
      { emailLowered: lowered },
    ]);

    if (!data || !data.passwordHash || data.isLockedOut) {
      return undefined;
    }

    const passwordMatches = await compare(password, data.passwordHash);
    if (!passwordMatches) {
      return undefined;
    }

    data.lastLogin = new Date();
    await this.Users.save(data);

    return new User(this.Users, data);
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

  async issueSessionCookie(user: User, res: Response): Promise<void> {
    const token = await this.signJWT(`user|${user.id}`);
    res.cookie(Config.sessions.cookieName, token, {
      domain: Config.sessions.cookieDomain,
      maxAge: Config.sessions.cookieTTL,
      httpOnly: true,
    });
  }
}
