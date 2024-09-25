import { INestApplication } from '@nestjs/common';

import { Server } from 'http';
import request from 'supertest';

import { createApp } from '../../src/app';
import { Log } from '../logger';

describe('App Initialization', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createApp(Log);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('will initialize the app and handle a request', async () => {
    const { text } = await request(server).get('/').expect(200);
    expect(text).toMatchSnapshot();
  });
});
