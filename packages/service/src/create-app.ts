import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import Logger from 'bunyan';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import useragent from 'express-useragent';
import helmet from 'helmet';
import requestStats from 'request-stats';

import { JwtOrAnonAuthGuard } from './auth/strategies/jwt.strategy';
import { BunyanLoggerService } from './bunyan-logger-service';
import { Config } from './config';
import { edgeAuth } from './edge-auth';
import { GlobalErrorFilter } from './global-error-filter';
import { User } from './users';

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
  app.use(edgeAuth(Config.edgeAuth, logger));
  app.use((req: Request, res: Response, next: NextFunction) => {
    requestStats(req, res, (stats) => {
      const user = req.user ? (req.user as User) : undefined;
      logService.log('Request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.useragent?.source,
        statusCode: res.statusCode,
        duration: stats.time,
        bytesRecieved: stats.req.bytes,
        bytesSent: stats.res.bytes,
        user: user
          ? {
              id: user.id,
              username: user.username,
            }
          : '<anonymous>',
      });
    });

    next();
  });

  // Add JWT authentication
  app.useGlobalGuards(new JwtOrAnonAuthGuard());

  // Add global error filter to format all error responses using standard JSON format.
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  return app;
}
