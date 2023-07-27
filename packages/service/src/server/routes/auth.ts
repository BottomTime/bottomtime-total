import { Express } from 'express';
import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

import config from '../../config';
import { ForbiddenError, UnauthorizedError } from '../../errors';
import { UserRole } from '../../constants';
import { assertValid } from '../../helpers/validation';
import { issueAuthCookie } from '../jwt';

const LoginSchema = Joi.object({
  usernameOrEmail: Joi.string().required(),
  password: Joi.string().required(),
}).required();

export function getCurrentUser(req: Request, res: Response) {
  res.json({
    anonymous: !req.user,
    ...req.user?.toJSON(),
  });
}

export function logout(req: Request, res: Response) {
  res.clearCookie(config.sessions.cookieName);
  res.redirect('/');
}

export async function createJwtCookie(
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
    await issueAuthCookie(req.user, res);

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new UnauthorizedError());
  } else if (req.user.role < UserRole.Admin) {
    next(
      new ForbiddenError(
        'Your request has been denied. Only administrators are permitted to perform the requested action.',
      ),
    );
  } else {
    next();
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new UnauthorizedError());
  } else {
    next();
  }
}

export function validateLogin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    assertValid(req.body, LoginSchema);
    next();
  } catch (error) {
    next(error);
  }
}

export async function updateLastLoginAndRedirectHome(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new Error('User is not currently signed in!');
    }

    await req.user!.updateLastLogin();
    req.log.info(`User has successfully logged in: ${req.user!.username}`);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
}

export function configureAuthRoutes(app: Express) {
  app.get('/auth/me', getCurrentUser);
  app.post(
    '/auth/login',
    validateLogin,
    passport.authenticate('local', { session: false }),
    createJwtCookie,
    async (req, res) => {
      await req.user!.updateLastLogin();
      req.log.info(`User has successfully logged in: ${req.user!.username}`);
      res.json(req.user);
    },
  );
  app.get('/auth/logout', logout);

  app.get('/auth/google', passport.authenticate('google'));
  app.get(
    '/auth/google/callback',
    passport.authenticate('google'),
    createJwtCookie,
    updateLastLoginAndRedirectHome,
  );

  app.get('/auth/github', passport.authenticate('github'));
  app.get(
    '/auth/github/callback',
    passport.authenticate('github'),
    createJwtCookie,
    updateLastLoginAndRedirectHome,
  );
}
