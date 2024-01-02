import Logger from 'bunyan';
import { BunyanLogger } from './bunyan-logger';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule, ServerDependencies } from './app.module';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import { NextFunction, Request, Response } from 'express';
import { User } from './users/user';
import { GlobalErrorFilter } from './global-error-filter';
import { INestApplication } from '@nestjs/common';
import { JwtOrAnonAuthGuard } from './auth/strategies/jwt.strategy';
import helmet from 'helmet';
import requestStats from 'request-stats';

export async function createApp(
  logger: Logger,
  createDeps: () => Promise<ServerDependencies>,
): Promise<INestApplication> {
  const logService = new BunyanLogger(logger);
  const deps = await createDeps();

  const app = await NestFactory.create(AppModule.forRoot(deps), {
    cors: {
      // TODO: Limit domains.
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    },
    logger: logService,
  });

  app.use(helmet());
  app.use(cookieParser());
  app.use(useragent.express());
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

  app.useGlobalGuards(new JwtOrAnonAuthGuard());

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  requestStats(app.getHttpServer(), (stats) => {
    logService.debug('Request stats', {
      duration: stats.time,
      bytesRecieved: stats.req.bytes,
      bytesSent: stats.res.bytes,
    });
  });

  return app;
}
