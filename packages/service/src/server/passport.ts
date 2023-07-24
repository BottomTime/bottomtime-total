import jwt from 'jsonwebtoken';
import { NextFunction, Request } from 'express';
import { v4 as uuid } from 'uuid';

import config from '../config';
import { User } from '../users';

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

export async function deserializeUser(
  req: Request,
  id: string,
  cb: (error: any, user?: User | false) => void,
) {
  try {
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

export async function createJwtToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const now = Date.now();
  const payload: JwtPayload = {
    iss: config.baseUrl,
    sub: `user|${req.user?.id}`,
    exp: config.sessions.cookieTTL * 60000 + now,
    iat: now,
    jti: uuid(),
  };
  const token = await new Promise<string>((resolve, reject) => {
    jwt.sign(payload, config.sessions.sessionSecret, {}, (error, token) => {
      if (error) reject(error);
      else resolve(token!);
    });
  });
}

export async function verifyJwtToken(
  req: Request,
  payload: JwtPayload,
  done: (error: Error, user?: User | false) => void,
): Promise<void> {}

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

export function loginWithGoogle() {}

export function loginWithGithub() {}
