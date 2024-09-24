import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { JwtPayload } from 'jsonwebtoken';
import { Strategy } from 'passport-jwt';

import { AuthService } from '../auth.service';
import { Config } from '../config';
import { User } from '../user';
import { extractJwt } from './extract-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: Config.sessionSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return await this.authService.validateJwt(payload);
  }
}
