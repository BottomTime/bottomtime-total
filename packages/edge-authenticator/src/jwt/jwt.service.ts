import { Injectable } from '@nestjs/common';

import { randomBytes } from 'crypto';
import { JwtPayload, sign } from 'jsonwebtoken';

import { Config } from '../config';

@Injectable()
export class JwtService {
  signJwt(email: string, audience: string | string[]): string {
    const jti = randomBytes(64).toString('base64url');
    const now = Date.now() / 1000;
    const payload: JwtPayload = {
      aud: audience,
      exp: now + Config.cookie.ttl,
      iat: now,
      jti,
      sub: email,
    };

    return sign(payload, Config.sessionSecret);
  }
}
