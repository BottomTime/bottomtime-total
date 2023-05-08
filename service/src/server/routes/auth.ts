import { Express } from 'express';
import Joi from 'joi';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';

import { ForbiddenError, UnauthorizedError } from '../../errors';
import { UserRole } from '../../constants';
import { assertValid } from '../../helpers/validation';

const LoginSchema = Joi.object({
  usernameOrEmail: Joi.string().required(),
  password: Joi.string().required(),
}).required();

export function getCurrentUser(req: Request, res: Response) {
  res.json({
    id: req.sessionID,
    anonymous: !req.user,
    ...req.user?.toJSON(),
  });
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  return new Promise<void>((resolve) => {
    req.logout({ keepSessionInfo: false }, (error) => {
      if (error) next(error);
      else res.redirect('/');
      resolve();
    });
  });
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

export function configureAuthRoutes(app: Express) {
  app.get('/auth/me', getCurrentUser);
  app.post(
    '/auth/login',
    validateLogin,
    passport.authenticate('local'),
    async (req, res) => {
      await req.user!.updateLastLogin();
      req.log.info(`User has successfully logged in: ${req.user!.username}`);
      res.json(req.user);
    },
  );
  app.get('/auth/logout', logout);
}
