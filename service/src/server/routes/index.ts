import { Express, NextFunction } from 'express';
import Logger from 'bunyan';
import passport from 'passport';

import {
  changeEmail,
  changePassword,
  changeRole,
  changeUsername,
  createUser,
  getUser,
  loadUserAccount,
  lockAccount,
  requestPasswordResetEmail,
  requestVerificationEmail,
  resetPassword,
  searchUsers,
  unlockAccount,
  verifyEmail,
} from './users';
import {
  getCurrentUser,
  logout,
  requireAdmin,
  requireAuth,
  validateLogin,
} from './auth';
import { globalErrorHandler, notFound } from './errors';

export function configureRouting(app: Express, log: Logger) {
  // Auth routes...
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

  // User management routes...
  const UserRoute = '/users/:username';
  app.get('/users', requireAdmin, searchUsers);
  app
    .route(UserRoute)
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
  app.post(`${UserRoute}/changeRole`, requireAuth, loadUserAccount, changeRole);
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
  app.post(
    `${UserRoute}/requestPasswordReset`,
    loadUserAccount,
    requestPasswordResetEmail,
  );
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

  // These are global error handlers and must be added last!
  log.debug('[EXPRESS] Adding error handling middleware...');
  app.all('*', notFound);
  app.use(globalErrorHandler);
}
