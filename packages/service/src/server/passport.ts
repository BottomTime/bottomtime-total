import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

import config from '../config';
import { User } from '../users';
import {
  GoogleCallbackParameters,
  Profile as GoogleProfile,
} from 'passport-google-oauth20';

interface JwtPayload {
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  jti?: string;
  nbf?: number;
  sub?: string;
  [key: string]: any;
}

async function signJwtAsync(payload: JwtPayload): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.sessions.sessionSecret, {}, (error, token) => {
      if (error) reject(error);
      else resolve(token!);
    });
  });
}

export async function createJwtToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const now = Date.now();
  const expires = config.sessions.cookieTTL * 60000 + now;
  const payload = {
    iss: config.baseUrl,
    sub: `user|${req.user?.id}`,
    exp: expires,
    iat: now,
    jti: uuid(),
  };
  try {
    req.log.debug(`Issuing JWT cookie for user "${req.user?.username}"...`);
    const token = await signJwtAsync(payload);
    res.cookie(config.sessions.cookieName, token, {
      expires: new Date(expires),
      domain: config.sessions.cookieDomain,
      httpOnly: true,
      sameSite: 'strict',
      secure: config.isProduction,
      signed: false,
    });

    next();
  } catch (error) {
    next(error);
  }
}

export async function verifyJwtToken(
  req: Request,
  payload: JwtPayload,
  cb: (error: any, user?: User | false) => void,
): Promise<void> {
  try {
    if (!payload.sub || !/^\w+\|.+$/.test(payload.sub)) {
      req.log.debug(
        `[AUTH] Rejecting JWT token. Invalid subject: ${
          payload.sub ?? '<undefined>'
        }.`,
      );
      cb(null, false);
      return;
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const [type, id] = payload.sub.split('|');

    req.log.debug(
      `[AUTH] Attempting to deserialize user account. User ID: ${id}`,
    );
    let user = await req.userManager.getUser(id);

    if (!user) {
      req.log.warn(
        `[AUTH] Failed to deserialize user account. Account ID not found: ${id}`,
      );
    } else if (user?.isLockedOut) {
      req.log.warn(
        `[AUTH] Refusing to deserialize user account. Account has been flagged as locked. User ID: ${id}`,
      );
      user = undefined;
    } else {
      req.log.debug(
        `[AUTH] Successfully deserialize user account for ${user.username}`,
      );
    }

    cb(null, user ?? false);
  } catch (error) {
    cb(error);
  }
}

export async function loginWithPassword(
  req: Request,
  usernemeOrEmail: string,
  password: string,
  cb: (error: any, user?: User | false) => void,
) {
  try {
    const user = await req.userManager.authenticateUser(
      usernemeOrEmail,
      password,
    );

    if (user) {
      req.log.info(`[AUTH] User "${user.username} has successfully logged in.`);
    } else {
      req.log.warn(
        `[AUTH] Failed login attempt! Username or email: ${usernemeOrEmail}`,
      );
    }

    cb(null, user ?? false);
  } catch (error) {
    cb(error);
  }
}

export function loginWithGoogle(
  req: Request,
  accessToken: string,
  refreshToken: string,
  params: GoogleCallbackParameters,
  profile: GoogleProfile,
  cb: (err: Error | null, user?: User) => void,
) {
  cb(new Error('Not implemented yet.'));
}

export function loginWithGithub() {}
