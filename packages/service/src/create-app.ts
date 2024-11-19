import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import Logger from 'bunyan';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import helmet from 'helmet';

import { JwtOrAnonAuthGuard } from './auth/strategies/jwt.strategy';
import { BunyanLoggerService } from './bunyan-logger-service';
import { EdgeAuthGuard } from './edge-auth.guard';
import { GlobalErrorFilter } from './global-error-filter';
import { LogRequestInterceptor } from './log-request.interceptor';

export async function createApp(
  rootModule: unknown,
  logger: Logger,
): Promise<INestApplication> {
  const logService = new BunyanLoggerService(logger);

  // Initialize the app with CORS settings and our provided logger.
  const app = await NestFactory.create<NestExpressApplication>(rootModule, {
    cors: {
      // TODO: Limit domains.
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    },
    logger: logService,
    rawBody: true,
  });

  // Add Express middleware.
  app.use(helmet());
  app.use(cookieParser());
  app.use(useragent.express());

  // Add request logging.
  app.useGlobalInterceptors(new LogRequestInterceptor());

  // Add JWT authentication and Edge Auth for protected environments.
  app.useGlobalGuards(new EdgeAuthGuard(), new JwtOrAnonAuthGuard());

  // Add global error filter to format all error responses using standard JSON format.
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  return app;
}
