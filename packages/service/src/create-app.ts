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
import { Config } from './config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function setupDocumentation(app: INestApplication): void {
  const documentationConfig = new DocumentBuilder()
    .setTitle('Bottom Time Applciation')
    .setDescription('Bottom Time application backend APIs.')
    .setContact(
      'Chris Carleton',
      'https://bottomti.me/',
      'mrchriscarleton@gmail.com',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerAuth',
    )
    .addCookieAuth(Config.sessions.cookieName, { type: 'http' }, 'cookieAuth')
    .addTag('Admin', 'Restricted endpoints accessible only to administrators.')
    .addTag('Auth', 'Endpoints used for authentication or authorization.')
    .addTag(
      'Users',
      'Endpoints pertaining to the management of user accounts or profiles.',
    )
    .addServer(Config.baseUrl)
    .build();

  const documentation = SwaggerModule.createDocument(app, documentationConfig);
  SwaggerModule.setup('docs', app, documentation);
}

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
    performance.mark('request-start');
    // Request-level logging.
    res.on('close', () => {
      const user = req.user ? (req.user as User) : undefined;
      logService.log('Request', {
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

    performance.mark('request-end');
    logService.debug('Request performance', {
      requestDuration: performance.measure(
        'request-duration',
        'request-start',
        'request-end',
      ).duration,
      // TODO: Figure out how to get this values.
      bytesSent: req.get('Content-Length'),
      bytesReturned: res.get('Content-Length'),
    });

    next();
  });

  app.useGlobalGuards(new JwtOrAnonAuthGuard());

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  setupDocumentation(app);

  return app;
}
