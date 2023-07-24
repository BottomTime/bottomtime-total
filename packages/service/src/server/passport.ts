import { Request } from 'express';
import { User } from '../users';

interface JwtPayload {
  userId: string;
}

export function serializeUser(
  req: Request,
  user: Express.User,
  cb: (error: any, id?: string) => void,
) {
  req.log.debug(`[AUTH] Serializing user with ID: ${user.id}`);
  cb(null, user.id);
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
