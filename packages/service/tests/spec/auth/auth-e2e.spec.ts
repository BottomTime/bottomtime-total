import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../../utils/create-test-app';
import { createAuthHeader, createTestUser } from '../../utils';
import { User } from '../../../src/users/user';
import { CurrentUserSchema, UserSchema } from '@bottomtime/api';

describe('Auth Module E2E Tests', () => {
  let app: INestApplication;
  let server: unknown;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('will return anonymous if current user is not logged in', async () => {
    const { body } = await request(server).get('/api/auth/me').expect(200);
    expect(body).toEqual({ anonymous: true });
  });

  it('will return the currently logged in user', async () => {
    const userDocument = createTestUser();
    const user = new User(userDocument);
    const authHeader = await createAuthHeader(user.id);
    await userDocument.save();

    const { body } = await request(server)
      .get('/api/auth/me')
      .set(...authHeader)
      .expect(200);

    expect(CurrentUserSchema.parse(body)).toEqual({
      anonymous: false,
      ...user.toJSON(),
    });
  });
});
