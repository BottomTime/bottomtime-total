import Logger from 'bunyan';
import { Express } from 'express';

import { globalErrorHandler, notFound } from './errors';

export function configureRouting(app: Express, log: Logger) {
  // These are global error handlers and must be added last!
  log.debug('[EXPRESS] Adding error handling middleware...');
  app.all('*', notFound);
  app.use(globalErrorHandler);
}
