import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import Logger from 'bunyan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mustache from 'mustache-express';
import { resolve } from 'path';

import { AppModule } from './app.module';
import { GlobalErrorFilter } from './error.filter';
import { BunyanLoggerService } from './logger';
import './style.css';

export async function createApp(log: Logger): Promise<INestApplication> {
  const logger = new BunyanLoggerService(log);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin(_, cb) {
        cb(null, true);
      },
      credentials: true,
    },
    logger,
  });

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalErrorFilter(logger));

  app.useStaticAssets(resolve(__dirname, './public/'));
  app.setBaseViewsDir(resolve(__dirname, './views/'));
  app.engine('mst', mustache());
  app.setViewEngine('mst');

  return app;
}
