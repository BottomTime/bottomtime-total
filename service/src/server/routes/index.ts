import { Express } from 'express';
import Logger from 'bunyan';

import { configureUserRoutes } from './users';
import { configureAuthRoutes } from './auth';
import { globalErrorHandler, notFound } from './errors';
import { configureProfileRoutes } from './profiles';
import { configureTanksRoutes } from './tanks';

export function configureRouting(app: Express, log: Logger) {
  log.debug('[EXPRESS] Registering API routes...');
  configureAuthRoutes(app);
  configureUserRoutes(app);
  configureProfileRoutes(app);
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
