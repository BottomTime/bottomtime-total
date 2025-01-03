import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { LogEntriesService, LogEntryFactory } from '../../../src/logEntries';
import { LogEntryReviewsController } from '../../../src/logEntries/log-entry-reviews.controller';
import { OperatorsModule } from '../../../src/operators';
import { UsersModule } from '../../../src/users';
import { createTestApp } from '../../utils';

describe('Log entry reviews E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          LogEntryEntity,
          LogEntryAirEntity,
          LogEntrySampleEntity,
        ]),
        UsersModule,
        DiveSitesModule,
        OperatorsModule,
      ],
      providers: [LogEntriesService, LogEntryFactory],
      controllers: [LogEntryReviewsController],
    });
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('works', () => {});
});
