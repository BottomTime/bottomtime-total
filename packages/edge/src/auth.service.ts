import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtPayload } from 'jsonwebtoken';

import { User } from './user';

@Injectable()
export class AuthService {
  async validateJwt(payload: JwtPayload): Promise<User> {
    if (!payload.sub) {
      throw new UnauthorizedException('JWT payload did not contain a subject.');
    }

    return { email: payload.sub };
  }
}
