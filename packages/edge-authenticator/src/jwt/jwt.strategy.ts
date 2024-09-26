import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { JwtPayload } from 'jsonwebtoken';
import { Strategy, StrategyOptions } from 'passport-jwt';

import { Config } from '../config';
import { User } from '../user';
import { extractJwt } from './extract-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const options: StrategyOptions = {
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: Config.sessionSecret,
    };
    super(options);
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload.sub) {
      throw new UnauthorizedException(
        'No email address provided in JWT subject',
      );
    }
    if (!payload.aud) {
      throw new UnauthorizedException('No audience provided in JWT');
    }

    return {
      email: payload.sub,
      authorizedDomains: Array.isArray(payload.aud)
        ? payload.aud
        : [payload.aud],
    };
  }
}
