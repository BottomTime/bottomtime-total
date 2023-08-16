import { Express, NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { EmailSchema, PasswordStrengthSchema } from '../../users';
import { ForbiddenError, ValidationError } from '../../errors';
import { assertValid } from '../../helpers/validation';
import { UserRole } from '../../constants';
import { requireAdmin, requireAuth } from './auth';
import { loadUserAccount } from './users';
import { UsernameSchema } from '../../data';

const ChangeEmailBodySchema = z.object({
  newEmail: EmailSchema,
});
type ChangeEmailParams = z.infer<typeof ChangeEmailBodySchema>;

const ChangePasswordBodySchema = z.object({
  oldPassword: z.string(),
  newPassword: PasswordStrengthSchema,
});
type ChangePasswordParams = z.infer<typeof ChangePasswordBodySchema>;

const ChangeRoleBodySchema = z.object({
  newRole: z.nativeEnum(UserRole),
});
type ChangeRoleParams = z.infer<typeof ChangeRoleBodySchema>;

const ChangeUsernameBodySchema = z.object({
  newUsername: UsernameSchema,
});
type ChangeUsernameParams = z.infer<typeof ChangeUsernameBodySchema>;

export async function changeEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.selectedUser) {
      throw new Error('No user profile loaded.');
    }

    if (
      req.user!.role < UserRole.Admin &&
      req.user!.id !== req.selectedUser!.id
    ) {
      throw new ForbiddenError(
        "Request denied. You are not permitted to change another user's email",
      );
    }

    const { newEmail } = assertValid<ChangeEmailParams>(
      req.body,
      ChangeEmailBodySchema,
    );

    await req.selectedUser.changeEmail(newEmail);
    res.sendStatus(204);

    req.log.info(
      `Email address for user "${
        req.selectedUser!.username
      }" has been changed to "${newEmail}".`,
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
    if (!req.selectedUser) {
      throw new Error('No user profile loaded.');
    }

    if (req.user!.id !== req.selectedUser!.id) {
      throw new ForbiddenError(
        "Request denied. You are not permitted to change another user's password.",
      );
    }

    const { oldPassword, newPassword } = assertValid<ChangePasswordParams>(
      req.body,
      ChangePasswordBodySchema,
    );

    const changed = await req.selectedUser.changePassword(
      oldPassword,
      newPassword,
    );

    if (changed) {
      res.sendStatus(204);
      req.log.info(
        `Password for user "${req.selectedUser.username}" has been changed.`,
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
    if (!req.selectedUser) {
      throw new Error('No user profile loaded.');
    }

    if (req.user!.id === req.selectedUser!.id) {
      throw new ForbiddenError(
        'Request denied. Admins may not change their own roles. (Safety FTW!)',
      );
    }

    const { newRole } = assertValid<ChangeRoleParams>(
      req.body,
      ChangeRoleBodySchema,
    );

    await req.selectedUser.changeRole(newRole);
    req.log.info(
      `Role updated for user "${req.selectedUser.username}". New role: ${newRole}.`,
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
    if (!req.user) {
      throw new Error('Current user is not logged in.');
    }

    if (!req.selectedUser) {
      throw new Error('No user profile loaded.');
    }

    if (req.user.role < UserRole.Admin && req.user.id !== req.selectedUser.id) {
      throw new ForbiddenError(
        "Request denied. You may not change another user's username.",
      );
    }

    const { newUsername } = assertValid<ChangeUsernameParams>(
      req.body,
      ChangeUsernameBodySchema,
    );

    await req.selectedUser.changeUsername(newUsername);
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
    if (!req.user) {
      throw new Error('Current user is not logged in.');
    }

    if (!req.selectedUser) {
      throw new Error('User profile is not loaded.');
    }

    if (req.user.id === req.selectedUser.id) {
      throw new ForbiddenError(
        'Request denied. You may not lock yourself out of your own account. Safety first!',
      );
    }

    await req.selectedUser.lockAccount();
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
    if (!req.selectedUser) {
      throw new Error('User profile is not loaded.');
    }

    await req.selectedUser.unlockAccount();
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
