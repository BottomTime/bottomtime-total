import { Express } from 'express';
import Joi from 'joi';
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
  ProfileVisibilitySchema,
  RoleSchema,
  User,
  UsernameSchema,
  UsersSortBy,
} from '../../users';
import { ResetPasswordEmailTemplate, WelcomeEmailTemplate } from '../../email';
import { VerifyEmailTemplate } from '../../email/verify-email-template';
import { requireAdmin, requireAuth } from './auth';

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
  profileVisibility: ProfileVisibilitySchema,
});

const SearchUsersQuerySchema = Joi.object({
  query: Joi.string(),
  role: RoleSchema,
  sortBy: Joi.string().valid(...Object.values(UsersSortBy)),
  sortOrder: Joi.string().valid(...Object.values(SortOrder)),
  skip: Joi.number().min(0),
  limit: Joi.number().positive().max(200),
});

const VerifyEmailBodySchema = Joi.object({
  token: Joi.string().required(),
}).required();

const ResetPasswordBodySchema = Joi.object({
  token: Joi.string().trim().required(),
  newPassword: PasswordStrengthSchema.required(),
}).required();

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

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    assertValid(req.params.username, UsernameSchema.required());
    const { parsed: options } = assertValid(req.body, CreateUserBodySchema);

    const user = await req.userManager.createUser({
      username: req.params.username,
      ...options,
    });

    req.log.info('New user account created.', {
      username: user.username,
      email: user.email,
    });

    // Sign in the new user if they are not currently logged in as someone else.
    if (!req.user) {
      await loginUser(req, user);
      await user.updateLastLogin();
      req.log.info(
        `User has been logged into their newly-created account: "${user.username}"`,
      );
    }

    // Send the new user a welcome email.
    if (user.email) {
      try {
        req.log.debug(
          `Requesting email verification token for "${user.email}"...`,
        );
        const verifyEmailToken = await user.requestEmailVerificationToken();

        req.log.debug(`Generating welcome email body for "${user.email}"...`);
        const mailTemplate = new WelcomeEmailTemplate();
        const messageBody = await mailTemplate.render({
          user,
          verifyEmailToken,
        });

        req.log.debug(`Sending welcome email to "${user.email}"...`);
        req.log.debug(req.mail);
        await req.mail.sendMail(
          { to: user.email },
          'Welcome to Bottom Time!',
          messageBody,
        );
      } catch (mailError) {
        req.log.error(
          `Failed to send welcome email to new user: ${req.params.username}`,
          mailError,
        );
      }
    }

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUserExists(req: Request, res: Response) {
  res.sendStatus(200);
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

export async function requestPasswordResetEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await req.userManager.getUserByUsernameOrEmail(
      req.params.username,
    );
    if (!user || !user.email) {
      res.sendStatus(204);
      return;
    }

    req.log.debug(
      `Requesting password reset token for user "${user.username}"...`,
    );
    const mailTemplate = new ResetPasswordEmailTemplate();
    const resetToken = await user.requestPasswordResetToken();

    req.log.debug(`Generating and sending password reset email....`);
    const messageBody = await mailTemplate.render({
      user,
      resetToken,
    });
    await req.mail.sendMail(
      { to: user.email },
      'Reset your Bottom Time password',
      messageBody,
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function requestVerificationEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.selectedUser;
    if (!user?.email) {
      // Fail silently if the user does not have an email address set.
      res.json({ succeeded: false });
      return;
    }

    const mailTemplate = new VerifyEmailTemplate();
    const verifyEmailToken = await user.requestEmailVerificationToken();

    const messageBody = await mailTemplate.render({
      user,
      verifyEmailToken,
    });
    await req.mail.sendMail(
      { to: user.email },
      'Verify your email address',
      messageBody,
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      parsed: { token, newPassword },
    } = assertValid(req.body, ResetPasswordBodySchema);
    const user = req.selectedUser!;

    const succeeded = await user.resetPassword(token, newPassword);

    res.json({ succeeded });
  } catch (error) {
    next(error);
  }
}

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

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.selectedUser!;
    const {
      parsed: { token },
    } = assertValid(req.body, VerifyEmailBodySchema);

    const verified = await user.verifyEmail(token);

    res.json({ verified });
  } catch (error) {
    next(error);
  }
}

export function configureUserRoutes(app: Express) {
  const UserRoute = '/users/:username';
  app.get('/users', requireAdmin, searchUsers);
  app
    .route(UserRoute)
    .head(loadUserAccount, getUserExists)
    .get(requireAdmin, loadUserAccount, getUser)
    .put(createUser);
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
    `${UserRoute}/requestEmailVerification`,
    requireAuth,
    loadUserAccount,
    requestVerificationEmail,
  );
  app.post(`${UserRoute}/requestPasswordReset`, requestPasswordResetEmail);
  app.post(`${UserRoute}/resetPassword`, loadUserAccount, resetPassword);
  app.post(
    `${UserRoute}/verifyEmail`,
    requireAuth,
    loadUserAccount,
    verifyEmail,
  );
  app.post(
    `${UserRoute}/unlockAccount`,
    requireAdmin,
    loadUserAccount,
    unlockAccount,
  );
}
