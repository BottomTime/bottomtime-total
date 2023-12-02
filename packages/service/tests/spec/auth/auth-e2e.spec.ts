import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../../utils/create-test-app';
import { createAuthHeader, createTestUser } from '../../utils';
import { User } from '../../../src/users/user';
import { CurrentUserSchema, UserSchema } from '@bottomtime/api';
import { UserData } from '../../../src/schemas';

const Password = 'XTdc4LG,+5R/QTgb';
const TestUserData: Partial<UserData> = {
  _id: '4E64038D-0ABF-4C1A-B678-55F8AFCB6B2D',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
  passwordHash: '$2b$04$qYwq/3B9EExkm.djcX5L4OpgYQJY.JIVJKYs52QYE561hIPbcH6Iu',
};

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

  it('will login a user with username and password', async () => {
    const userData = createTestUser(TestUserData);
    const user = new User(userData);
    const agent = request.agent(server);
    await userData.save();

    const { body: loginResponse } = await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: Password,
      })
      .expect(200);
    const login = UserSchema.parse(loginResponse);
    userData.lastLogin = login.lastLogin;

    // Last login should be updated.
    expect(login.lastLogin?.valueOf()).toBeCloseTo(Date.now(), -2);
    expect(UserSchema.parse(loginResponse)).toEqual(user.toJSON());

    // A cookie should be persisted that keeps the user logged in.
    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(CurrentUserSchema.parse(currentUserResponse)).toEqual({
      anonymous: false,
      ...user.toJSON(),
    });
  });

  it('will return a 401 error if password is incorrect', async () => {
    const userData = createTestUser(TestUserData);
    const agent = request.agent(server);
    await userData.save();

    await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: 'Wrong_password',
      })
      .expect(401);

    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(currentUserResponse).toEqual({ anonymous: true });
  });

  it('will return a 401 error if user attempts to log into a suspended account', async () => {
    const userData = createTestUser({
      ...TestUserData,
      isLockedOut: true,
    });
    const agent = request.agent(server);
    await userData.save();

    await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: Password,
      })
      .expect(401);

    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(currentUserResponse).toEqual({ anonymous: true });
  });

  it('will return a 401 error if user attempts to log into an account that does not exist', async () => {
    const agent = request.agent(server);
    await agent
      .post('/api/auth/login')
      .send({
        usernameOrEmail: TestUserData.username,
        password: Password,
      })
      .expect(401);

    const { body: currentUserResponse } = await agent
      .get('/api/auth/me')
      .expect(200);

    expect(currentUserResponse).toEqual({ anonymous: true });
  });
});
