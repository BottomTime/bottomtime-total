import { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../../errors';
import { UserRole } from '../../constants';

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
      else res.sendStatus(204);
      resolve();
    });
  });
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new UnauthorizedError());
  } else if (req.user.role === UserRole.Admin) {
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
