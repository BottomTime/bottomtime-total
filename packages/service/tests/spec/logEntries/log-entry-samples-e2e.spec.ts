import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Server } from 'http';
import request from 'supertest';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { LogEntriesService, LogEntryFactory } from '../../../src/logEntries';
import { LogEntrySampleController } from '../../../src/logEntries/log-entry-sample.controller';
import { createTestApp } from '../../utils';

describe('Log Entry Samples E2E', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          LogEntryEntity,
          LogEntryAirEntity,
          LogEntrySampleEntity,
        ]),
        DiveSitesModule,
      ],
      providers: [LogEntryFactory, LogEntriesService],
      controllers: [LogEntrySampleController],
    });
    await app.init();
    server = app.getHttpAdapter().getInstance();
  });

  afterAll(async () => {
    await app.close();
  });

  it.todo('write tests for these routes');
});
