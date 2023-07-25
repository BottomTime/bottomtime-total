import { NextFunction, Request, Response } from 'express';

import config from '../config';
import { User } from '../users';
import { Profile as GithubProfile } from 'passport-github2';
import {
  GoogleCallbackParameters,
  Profile as GoogleProfile,
} from 'passport-google-oauth20';
import { JwtPayload, signUserToken } from './jwt';

export async function createJwtToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new Error(
        'Attempted to generate a user token but no user is logged in!',
      );
    }

    req.log.debug(`Issuing JWT cookie for user "${req.user.username}"...`);
    const token = await signUserToken(req.user);
    res.cookie(config.sessions.cookieName, token, {
      expires: new Date(Date.now() + config.sessions.cookieTTL * 60000),
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
  req.log.debug('[AUTH] Verifying JWT token...', payload);
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

export function loginWithGithub(
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: GithubProfile,
  cb: (err: Error | null, user?: User) => void,
) {
  cb(new Error('Not implemented yet.'));
}
