import jwt from 'jsonwebtoken';

import config from '../config';
import { User } from '../users';

export interface JwtPayload {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  jti?: string;
  nbf?: number;
  sub?: string;
  [key: string]: any;
}

export function signUserToken(user: User): Promise<string> {
  const now = Date.now();
  const expires = config.sessions.cookieTTL * 60000 + now;
  const payload: JwtPayload = {
    iss: config.baseUrl,
    sub: `user|${user.id}`,
    exp: expires,
    iat: now,
  };

  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, config.sessions.sessionSecret, {}, (error, token) => {
      if (error) reject(error);
      else resolve(token!);
    });
  });
}
