import jwt from 'jsonwebtoken';
import { Response } from 'express';

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

export async function issueAuthCookie(
  user: User,
  res: Response,
): Promise<void> {
  const token = await signUserToken(user);
  res.cookie(config.sessions.cookieName, token, {
    expires: new Date(Date.now() + config.sessions.cookieTTL * 60000),
    domain: config.sessions.cookieDomain,
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    signed: false,
  });
  await user.updateLastLogin();
}
