import Logger from 'bunyan';
import { BunyanLoggerService } from '@bottomtime/common';
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
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'path';

export async function createApp(
  logger: Logger,
  createDeps: () => Promise<ServerDependencies>,
): Promise<INestApplication> {
  const logService = new BunyanLoggerService(logger);
  const deps = await createDeps();

  // Initialize the app with CORS settings and our provided logger.
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forRoot(deps),
    {
      cors: {
        // TODO: Limit domains.
        origin: (_origin, cb) => {
          cb(null, true);
        },
        credentials: true,
      },
      logger: logService,
    },
  );

  // Add Express middleware.
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

  // Enable Pug as view engine for rendering web pages
  app.setBaseViewsDir(path.resolve(__dirname, '../assets/templates'));
  app.setViewEngine('pug');

  // Add JWT authentication
  app.useGlobalGuards(new JwtOrAnonAuthGuard());

  // Add global error filter to format all error responses using standard JSON format.
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  return app;
}
