import { Express, NextFunction, Request, Response } from 'express';
import Joi from 'joi';

import {
  PasswordStrengthSchema,
  RoleSchema,
  UsernameSchema,
} from '../../users';
import { ForbiddenError, ValidationError } from '../../errors';
import { assertValid } from '../../helpers/validation';
import { UserRole } from '../../constants';
import { requireAdmin, requireAuth } from './auth';
import { loadUserAccount } from './users';

const ChangeEmailBodySchema = Joi.object({
  newEmail: Joi.string().required(),
}).required();

const ChangePasswordBodySchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: PasswordStrengthSchema.required(),
}).required();

const ChangeRoleBodySchema = Joi.object({
  newRole: RoleSchema.required(),
}).required();

const ChangeUsernameBodySchema = Joi.object({
  newUsername: UsernameSchema.required(),
}).required();

export async function changeEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (
      req.user!.role < UserRole.Admin &&
      req.user!.id !== req.selectedUser!.id
    ) {
      throw new ForbiddenError(
        "Request denied. You are not permitted to change another user's email",
      );
    }

    assertValid(req.body, ChangeEmailBodySchema);

    await req.selectedUser!.changeEmail(req.body.newEmail);
    res.sendStatus(204);

    req.log.info(
      `Email address for user "${
        req.selectedUser!.username
      }" has been changed to "${req.body.newEmail}".`,
    );
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.user!.id !== req.selectedUser!.id) {
      throw new ForbiddenError(
        "Request denied. You are not permitted to change another user's password.",
      );
    }

    assertValid(req.body, ChangePasswordBodySchema);

    const changed = await req.selectedUser!.changePassword(
      req.body.oldPassword,
      req.body.newPassword,
    );

    if (changed) {
      res.sendStatus(204);
      req.log.info(
        `Password for user "${req.selectedUser!.username}" has been changed.`,
      );
    } else {
      next(
        new ValidationError(
          'Password could not be changed. Old password was incorrect.',
        ),
      );
    }
  } catch (error) {
    next(error);
  }
}

export async function changeRole(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.user!.id === req.selectedUser!.id) {
      throw new ForbiddenError(
        'Request denied. Admins may not change their own roles. (Safety FTW!)',
      );
    }

    assertValid(req.body, ChangeRoleBodySchema);

    await req.selectedUser!.changeRole(req.body.newRole);
    req.log.info(
      `Role updated for user "${req.selectedUser!.username}". New role: ${
        req.body.newRole
      }.`,
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function changeUsername(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (
      req.user!.role < UserRole.Admin &&
      req.user!.id !== req.selectedUser!.id
    ) {
      throw new ForbiddenError(
        "Request denied. You may not change another user's username.",
      );
    }

    assertValid(req.body, ChangeUsernameBodySchema);

    await req.selectedUser!.changeUsername(req.body.newUsername);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function lockAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.user!.id === req.selectedUser!.id) {
      throw new ForbiddenError(
        'Request denied. You may not lock yourself out of your own account. Safety first!',
      );
    }

    await req.selectedUser!.lockAccount();
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function unlockAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await req.selectedUser!.unlockAccount();
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export function configureUserUpdateRoutes(app: Express) {
  const UserRoute = '/users/:username';
  app.post(
    `${UserRoute}/changeEmail`,
    requireAuth,
    loadUserAccount,
    changeEmail,
  );
  app.post(
    `${UserRoute}/changePassword`,
    requireAuth,
    loadUserAccount,
    changePassword,
  );
  app.post(
    `${UserRoute}/changeRole`,
    requireAdmin,
    loadUserAccount,
    changeRole,
  );
  app.post(
    `${UserRoute}/changeUsername`,
    requireAuth,
    loadUserAccount,
    changeUsername,
  );
  app.post(
    `${UserRoute}/lockAccount`,
    requireAdmin,
    loadUserAccount,
    lockAccount,
  );
  app.post(
    `${UserRoute}/unlockAccount`,
    requireAdmin,
    loadUserAccount,
    unlockAccount,
  );
}
