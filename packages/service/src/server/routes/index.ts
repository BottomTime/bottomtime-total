import { Express } from 'express';
import Logger from 'bunyan';

import { configureAuthRoutes } from './auth';
import { configureDiveSitesRoutes } from './dive-sites';
import { configureDiveSiteReviewsRoutes } from './dive-site-reviews';
import { configureProfileRoutes } from './profiles';
import { configureTanksRoutes } from './tanks';
import { configureUserRoutes } from './users';
import { configureUserUpdateRoutes } from './users-update';
import { globalErrorHandler, notFound } from './errors';

export function configureRouting(app: Express, log: Logger) {
  log.debug('[EXPRESS] Registering API routes...');
  configureAuthRoutes(app);
  configureUserRoutes(app);
  configureUserUpdateRoutes(app);
  configureProfileRoutes(app);
  // configureDiveSitesRoutes(app);
  // configureDiveSiteReviewsRoutes(app);
  configureTanksRoutes(app);

  // Health check route... elaborate on this later.
  app.get('/health', (_req, res) => {
    res.json({
      status: 'HEALTHY',
    });
  });

  // These are global error handlers and must be added last!
  log.debug('[EXPRESS] Adding error handling middleware...');
  app.all('*', notFound);
  app.use(globalErrorHandler);
}
