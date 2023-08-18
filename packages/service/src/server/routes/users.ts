import { Express } from 'express';
import Logger from 'bunyan';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { UserRole } from '../../constants';
import {
  ForbiddenError,
  MissingResourceError,
  UnauthorizedError,
} from '../../errors';
import { assertValid } from '../../helpers/validation';
import {
  CreateUserOptions,
  CreateUserOptionsSchema,
  PasswordStrengthSchema,
  SearchUsersOptions,
  SearchUsersOptionsSchema,
  User,
} from '../../users';
import {
  MailClient,
  ResetPasswordEmailTemplate,
  WelcomeEmailTemplate,
} from '../../email';
import { VerifyEmailTemplate } from '../../email/verify-email-template';
import { requireAdmin, requireAuth } from './auth';
import { issueAuthCookie } from '../jwt';
import { UsernameSchema } from '../../data';

const VerifyEmailBodySchema = z.object({
  token: z.string().trim(),
});
type VerifyEmailParams = z.infer<typeof VerifyEmailBodySchema>;

const ResetPasswordBodySchema = z.object({
  token: z.string().trim(),
  newPassword: PasswordStrengthSchema,
});
type ResetPasswordParams = z.infer<typeof ResetPasswordBodySchema>;

async function sendWelcomeEmail(
  mail: MailClient,
  user: User,
  log: Logger,
): Promise<void> {
  try {
    if (log.debug()) {
      log.debug(`Requesting email verification token for "${user.email}"...`);
    }
    const verifyEmailToken = await user.requestEmailVerificationToken();

    if (log.debug())
      log.debug(`Generating welcome email body for "${user.email}"...`);
    const mailTemplate = new WelcomeEmailTemplate();
    const messageBody = await mailTemplate.render({
      user,
      verifyEmailToken,
    });

    if (log.debug()) log.debug(`Sending welcome email to "${user.email}"...`);
    await mail.sendMail(
      { to: user.email! },
      'Welcome to Bottom Time!',
      messageBody,
    );
  } catch (mailError) {
    log.error(
      `Failed to send welcome email to new user: ${user.username}`,
      mailError,
    );
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { username } = req.params;
    const options = assertValid<CreateUserOptions>(
      {
        username,
        ...req.body,
      },
      CreateUserOptionsSchema,
    );

    if (options.role && options.role !== UserRole.User) {
      const errorMessage =
        'Unable to create new user account with elevated privileges. Only authenticated admins are able to do that.';
      if (!req.user) {
        throw new UnauthorizedError(errorMessage);
      }
      if (req.user.role !== UserRole.Admin) {
        throw new ForbiddenError(errorMessage);
      }
    }

    const user = await req.userManager.createUser(options);

    if (req.log.info()) {
      req.log.info('New user account created.', {
        username: user.username,
        email: user.email,
      });
    }

    // Sign in the new user if they are not currently logged in as someone else.
    if (!req.user) {
      await issueAuthCookie(user, res);
      req.log.info(
        `User has been logged into their newly-created account: "${user.username}"`,
      );
    }

    // Send the new user a welcome email.
    if (user.email) {
      await sendWelcomeEmail(req.mail, user, req.log);
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
    if (!req.selectedUser) {
      throw new Error('No user profile loaded.');
    }

    const { token, newPassword } = assertValid<ResetPasswordParams>(
      req.body,
      ResetPasswordBodySchema,
    );
    const succeeded = await req.selectedUser.resetPassword(token, newPassword);

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
    const options = assertValid<SearchUsersOptions>(
      req.query,
      SearchUsersOptionsSchema,
    );

    const users = await req.userManager.searchUsers(options);
    res.json({
      count: users.length,
      results: users.map((user) => user.toJSON()),
    });
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
    const { token } = assertValid<VerifyEmailParams>(
      req.body,
      VerifyEmailBodySchema,
    );

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
}
