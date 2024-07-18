import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { CookieOptions, Response } from 'express';
import { JwtPayload, sign } from 'jsonwebtoken';

import { Config } from '../config';
import { User, UsersService } from '../users';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  async validateJwt(payload: JwtPayload): Promise<User> {
    if (!payload.sub) {
      throw new UnauthorizedException('JWT payload did not contain a subject.');
    }

    if (!/^user\|.*/.test(payload.sub)) {
      throw new UnauthorizedException('Invalid subject in the JWT.');
    }

    const userId = payload.sub.substring(5);
    const user = await this.users.getUserById(userId);

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

    return user;
  }

  async authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.users.getUserByUsernameOrEmail(usernameOrEmail);

    if (!user || !user.hasPassword || user.isLockedOut) {
      return undefined;
    }

    const passwordMatches = await user.checkPassword(password);
    if (!passwordMatches) {
      return undefined;
    }

    await user.updateLastLogin();
    return user;
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
    this.log.debug('Generaed JWT.');
    const options: CookieOptions = {
      path: '/',
      domain: Config.sessions.cookieDomain,
      maxAge: Config.sessions.cookieTTL,
      httpOnly: true,
      secure: Config.sessions.secureCookie,
    };
    this.log.debug(`Issuing cookie "${Config.sessions.cookieName}":`, options);
    res.cookie(Config.sessions.cookieName, token, options);
  }

  revokeSessionCookie(res: Response) {
    res.clearCookie(Config.sessions.cookieName, {
      path: '/',
      domain: Config.sessions.cookieDomain,
    });
  }
}
