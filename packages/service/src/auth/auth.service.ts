import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { randomBytes } from 'crypto';
import { CookieOptions, Request, Response } from 'express';
import { JwtPayload, decode, sign } from 'jsonwebtoken';
import { LessThan, Repository } from 'typeorm';

import { Config } from '../config';
import { InvalidTokenEntity } from '../data';
import { User, UsersService } from '../users';
import { extractJwtFromRequest } from './extract-jwt';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @InjectRepository(InvalidTokenEntity)
    private readonly invalidTokens: Repository<InvalidTokenEntity>,
  ) {}

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

  async purgeExpiredInvalidations(invalidatedBefore: Date): Promise<number> {
    const { affected } = await this.invalidTokens.delete({
      invalidated: LessThan(invalidatedBefore),
    });

    return affected ?? 0;
  }

  async revokeSession(req: Request, res: Response): Promise<void> {
    const jwtString = extractJwtFromRequest(req);
    if (jwtString) {
      const jwt = decode(jwtString);
      if (jwt && typeof jwt === 'object' && jwt.jti) {
        await this.invalidTokens.save({
          token: jwt.jti,
          invalidated: new Date(),
        });
      }
    }

    res.clearCookie(Config.sessions.cookieName, {
      path: '/',
      domain: Config.sessions.cookieDomain,
    });
  }

  async signJWT(subject: string): Promise<string> {
    const now = Date.now();
    const expires = Config.sessions.cookieTTL * 60000 + now;
    const payload: JwtPayload = {
      exp: expires,
      iat: now,
      iss: Config.baseUrl,
      jti: randomBytes(32).toString('base64url'),
      sub: subject,
    };

    return await new Promise<string>((resolve, reject) => {
      sign(payload, Config.sessions.sessionSecret, {}, (error, token) => {
        if (error) reject(error);
        else resolve(token!);
      });
    });
  }

  async validateJwt(payload: JwtPayload): Promise<User> {
    if (!payload.sub) {
      throw new UnauthorizedException('JWT payload did not contain a subject.');
    }

    if (!/^user\|.*/.test(payload.sub)) {
      throw new UnauthorizedException('Invalid subject in the JWT.');
    }

    const userId = payload.sub.substring(5);
    const [user, tokenInvalidated] = await Promise.all([
      this.users.getUserById(userId),
      payload.jti
        ? this.invalidTokens.existsBy({ token: payload.jti })
        : Promise.resolve(false),
    ]);

    if (tokenInvalidated) {
      throw new UnauthorizedException(
        'JWT has been invalided and is no longer recognized.',
      );
    }

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
}
