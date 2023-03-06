import Joi, { object } from 'joi';
import { NextFunction, Request, Response } from 'express';

import { SortOrder, UserRole } from '../../constants';
import {
  ForbiddenError,
  MissingResourceError,
  ValidationError,
} from '../../errors';
import { assertValid } from '../../helpers/validation';
import {
  EmailSchema,
  PasswordStrengthSchema,
  RoleSchema,
  User,
  UsernameSchema,
  UsersSortBy,
} from '../../users';

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

const CreateUserBodySchema = Joi.object({
  email: EmailSchema,
  password: PasswordStrengthSchema,
  role: RoleSchema,
});

const SearchUsersQuerySchema = Joi.object({
  query: Joi.string(),
  role: RoleSchema,
  sortBy: Joi.string().valid(...Object.values(UsersSortBy)),
  sortOrder: Joi.string().valid(...Object.values(SortOrder)),
  skip: Joi.number().min(0),
  limit: Joi.number().positive().max(200),
});

function loginUser(req: Request, user: User): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    req.login(user, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function changeEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (
      req.user!.role !== UserRole.Admin &&
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
      req.user!.role !== UserRole.Admin &&
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

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    assertValid(req.params.username, UsernameSchema.required());
    assertValid(req.body, CreateUserBodySchema);

    if (req.body.role && req.user?.role !== UserRole.Admin) {
      throw new ForbiddenError(
        "Request denied. Only administrators are allowed to define a new user's role when creating an account.",
      );
    }

    const user = await req.userManager.createUser({
      username: req.params.username,
      ...req.body,
    });

    req.log.info('New user account created.', {
      username: user.username,
      email: user.email,
      role: user.role,
    });

    if (!req.user) {
      await loginUser(req, user);
      await user.updateLastLogin();
      req.log.info(
        `User has been logged into their newly-created account: "${user.username}"`,
      );
    }

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response) {
  res.json(req.selectedUser);
}

export async function loadUserAccount(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    req.selectedUser = await req.userManager.getUserByUsernameOrEmail(
      req.params.username,
    );
    if (req.selectedUser) {
      next();
    } else {
      next(
        new MissingResourceError(
          `No user found with username: ${req.params.username}`,
        ),
      );
    }
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

export function requestPasswordResetEmail() {}

export function requestVerificationEmail() {}

export function resetPassword() {}

export async function searchUsers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { parsed } = assertValid(req.query, SearchUsersQuerySchema);

    const users = await req.userManager.searchUsers(parsed);
    res.json({
      count: users.length,
      results: users.map((user) => user.toJSON()),
    });
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

export function verifyEmail() {}
