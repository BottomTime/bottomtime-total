import Logger from 'bunyan';
import { BunyanLogger } from './bunyan-logger';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import { User } from './users';
import { GlobalErrorFilter } from './global-error-filter';
import { INestApplication } from '@nestjs/common';
import { JwtOrAnonAuthGuard } from './auth/strategies/jwt.strategy';

export async function createApp(logger: Logger): Promise<INestApplication> {
  const logService = new BunyanLogger(logger);

  const app = await NestFactory.create(AppModule, {
    logger: logService,
  });

  app.use(cookieParser());
  app.use(useragent.express());
  app.use(
    cors({
      // TODO: Limit domains.
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Request-level logging.
    res.on('close', () => {
      const user = req.user ? (req.user as User) : undefined;
      logService.log('Request logged', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.useragent?.source,
        statusCode: res.statusCode,
        user: user
          ? {
              id: user.id,
              displayName: user.displayName,
            }
          : '<anonymous>',
      });
    });

    next();
  });

  app.useGlobalGuards(new JwtOrAnonAuthGuard());

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  return app;
}
