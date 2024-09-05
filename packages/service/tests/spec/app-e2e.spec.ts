import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Server } from 'http';
import request from 'supertest';

import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../../src/data';
import { createTestApp } from '../utils/create-test-app';

describe('App E2E tests', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([DiveSiteEntity, LogEntryEntity, UserEntity]),
      ],
      providers: [AppService],
      controllers: [AppController],
    });
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('will respond to a ping', async () => {
    jest.spyOn(process, 'uptime').mockReturnValue(1.294);
    const { body } = await request(server).get('/').expect(200);
    expect(body).toMatchSnapshot();
  });

  it('will return metrics upon request', async () => {
    const { body } = await request(server).get('/api/metrics').expect(200);
    expect(body).toMatchSnapshot();
  });
});
