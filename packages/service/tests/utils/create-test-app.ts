import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AuthModule } from '../../src/auth';
import { JwtOrAnonAuthGuard } from '../../src/auth/strategies/jwt.strategy';
import { BunyanLoggerService } from '../../src/bunyan-logger-service';
import { GlobalErrorFilter } from '../../src/global-error-filter';
import { dataSource } from '../data-source';
import { Log } from './test-logger';

export type ProviderOverride = {
  provide: unknown;
  use: unknown;
};

export async function createTestApp(
  metadata: ModuleMetadata,
  ...providerOverrides: ProviderOverride[]
): Promise<INestApplication> {
  const logService = new BunyanLoggerService(Log);

  const imports = [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory() {
        return dataSource.options;
      },
      async dataSourceFactory(options?: DataSourceOptions) {
        const ds = new DataSource(options ?? dataSource.options);
        return await ds.initialize();
      },
    }),
    PassportModule.register({
      session: false,
    }),
    AuthModule,
  ];

  if (metadata.imports) {
    metadata.imports.splice(0, 0, ...imports);
  } else {
    metadata.imports = imports;
  }

  let moduleBuilder = await Test.createTestingModule(metadata);
  for (const override of providerOverrides) {
    moduleBuilder = moduleBuilder
      .overrideProvider(override.provide)
      .useValue(override.use);
  }

  const module = await moduleBuilder.compile();
  const app = await module.createNestApplication<NestExpressApplication>({
    cors: {
      origin(_origin, cb) {
        cb(null, true);
      },
      credentials: true,
    },
    rawBody: true,
    logger: logService,
  });

  app.useBodyParser('json', { limit: '1mb' });
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalGuards(new JwtOrAnonAuthGuard());

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalErrorFilter(logService, httpAdapterHost));

  return await app.init();
}
