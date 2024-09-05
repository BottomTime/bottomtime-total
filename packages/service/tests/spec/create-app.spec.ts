import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { createApp } from '../../src/create-app';
import { Log } from '../utils/test-logger';

describe('Create App function', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('will instantiate the appliation', async () => {
    app = await createApp(AppModule, Log);
    await app.init();

    const { body: status } = await request(app.getHttpServer())
      .get('/')
      .expect(200);
    expect(status.api).toEqual('Bottom Time Service');
  });
});
