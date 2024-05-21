import { INestApplication } from '@nestjs/common';

import { Server } from 'http';
import request from 'supertest';

import { createTestApp } from '../utils/create-test-app';

describe('App E2E tests', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    app = await createTestApp();
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
