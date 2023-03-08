/* eslint-disable no-process-env */
import { Collection } from 'mongodb';
import { Express } from 'express';
import { faker } from '@faker-js/faker';
import request from 'supertest';

import { createTestLogger } from '../../../test-logger';
import { createTestServer } from '../../../test-app';
import { fakePassword, fakeUser } from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { Collections, UserDocument } from '../../../../src/data';
import { DefaultUser } from '../../../../src/users/default-user';

const Log = createTestLogger('auth-e2e');

describe('Auth End-to-End Tests', () => {
  let app: Express;
  let oldEnv: object;
  let Users: Collection<UserDocument>;

  beforeAll(async () => {
    oldEnv = Object.assign({}, process.env);
    process.env.BT_PASSWORD_SALT_ROUNDS = '1';
    app = await createTestServer({
      log: Log,
      mongoClient,
    });
    Users = mongoClient.db().collection(Collections.Users);
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  it('Will reject login if username or password does not match', async () => {
    const agent = request.agent(app);
    const password = fakePassword();
    const userData = fakeUser({}, password);
    await Users.insertOne(userData);

    await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: faker.internet.userName(),
        password,
      })
      .expect(401);

    await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password: fakePassword(),
      })
      .expect(401);
  });

  it('User can login, retrieve their account information, and logout', async () => {
    const password = fakePassword();
    const agent = request.agent(app);
    const userData = fakeUser({}, password);
    await Users.insertOne(userData);
    const expectedUser = JSON.parse(
      JSON.stringify(new DefaultUser(mongoClient, Log, userData)),
    );

    // Login
    const { body: loginResult } = await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: expectedUser.username,
        password,
      })
      .expect(200);
    expectedUser.lastLogin = loginResult.lastLogin;
    expect(loginResult).toEqual(expectedUser);

    // Get current user info
    const { body: authenticatedUserResult } = await agent
      .get('/auth/me')
      .expect(200);
    expect(authenticatedUserResult).toEqual({
      ...expectedUser,
      anonymous: false,
    });

    // Logout
    await agent.get('/auth/logout').expect(302);

    // Current user should now be anonymous
    const { body: anonymousUserResult } = await agent
      .get('/auth/me')
      .expect(200);
    const sessionId = anonymousUserResult.id;
    expect(sessionId.length).toBeGreaterThan(10);
    expect(anonymousUserResult).toEqual({
      id: sessionId,
      anonymous: true,
    });
  });
});
