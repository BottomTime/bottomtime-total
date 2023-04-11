/* eslint-disable no-process-env */
import { Collection } from 'mongodb';
import { compare } from 'bcrypt';
import { Express } from 'express';
import { faker } from '@faker-js/faker';
import request from 'supertest';

import { Collections, UserDocument } from '../../../../src/data';
import { createTestServer } from '../../../test-app';
import { createTestLogger } from '../../../test-logger';
import { fakePassword, fakeUser } from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { SortOrder, UserRole } from '../../../../src/constants';
import { DefaultUser } from '../../../../src/users/default-user';
import { UsersSortBy } from '../../../../src/users';

const Log = createTestLogger('users-e2e');

async function injectTestUsers(
  users: Collection<UserDocument>,
): Promise<UserDocument[]> {
  const data = new Array<UserDocument>(50);
  for (let i = 0; i < data.length; i++) {
    data[i] = fakeUser();
  }
  await users.insertMany(data);
  return data;
}

describe('Users End-To-End Tests', () => {
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

  it('Anonymous users can create an account and immediately start using it', async () => {
    const agent = request.agent(app);
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = fakePassword();
    const now = new Date().valueOf();

    // Create a new account
    const { body: newUser } = await agent
      .put(`/users/${username}`)
      .send({
        email,
        password,
      })
      .expect(201);

    expect(newUser.email).toEqual(email);
    expect(newUser.emailVerified).toBe(false);
    expect(newUser.hasPassword).toBe(true);
    expect(typeof newUser.id).toBe('string');
    expect(newUser.isLockedOut).toBe(false);
    expect(new Date(newUser.memberSince).valueOf()).toBeCloseTo(now, -4);
    expect(new Date(newUser.lastLogin).valueOf()).toBeCloseTo(now, -4);
    expect(newUser.role).toEqual(UserRole.User);
    expect(newUser.username).toEqual(username);

    // Get account info
    const { body: currentUser } = await agent.get('/auth/me').expect(200);

    expect(currentUser).toEqual({
      anonymous: false,
      ...newUser,
    });
  });

  it('Users can update their attributes', async () => {
    const password = fakePassword();
    const agent = request.agent(app);
    const userData = fakeUser({}, password);
    const userRoute = `/users/${userData.username}`;
    const newEmail = faker.internet.email();
    const newPassword = fakePassword();
    const newUsername = faker.internet.userName();
    await Users.insertOne(userData);

    // Login user
    await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: userData.username,
        password,
      })
      .expect(200);

    await agent
      .post(`${userRoute}/changeEmail`)
      .send({
        newEmail,
      })
      .expect(204);

    await agent
      .post(`${userRoute}/changePassword`)
      .send({
        oldPassword: password,
        newPassword,
      })
      .expect(204);

    await agent
      .post(`${userRoute}/changeUsername`)
      .send({
        newUsername,
      })
      .expect(204);

    const updatedUser = await Users.findOne({ _id: userData._id });
    expect(updatedUser!.username).toEqual(newUsername);
    expect(updatedUser!.email).toEqual(newEmail);
    await expect(
      compare(newPassword, updatedUser!.passwordHash!),
    ).resolves.toBe(true);
  });

  it("Anonymous users cannot modify other user's attributes", async () => {
    const otherUserPassword = fakePassword();
    const agent = request.agent(app);
    const otherUserData = fakeUser({}, otherUserPassword);
    const userRoute = `/users/${otherUserData.username}`;
    const newEmail = faker.internet.email();
    const newPassword = fakePassword();
    const newUsername = faker.internet.userName();
    await Users.insertOne(otherUserData);

    await agent
      .post(`${userRoute}/changeUsername`)
      .send({ newUsername })
      .expect(401);
    await agent.post(`${userRoute}/changeEmail`).send({ newEmail }).expect(401);
    await agent
      .post(`${userRoute}/changePassword`)
      .send({
        oldPassword: otherUserPassword,
        newPassword,
      })
      .expect(401);
    await agent.post(`${userRoute}/unlockAccount`).expect(401);
    await agent.post(`${userRoute}/lockAccount`).expect(401);

    const result = await Users.findOne({ _id: otherUserData._id });
    expect(result).toEqual(otherUserData);
  });

  it("Regular users cannot modify other users's attributes", async () => {
    const password = fakePassword();
    const otherUserPassword = fakePassword();
    const agent = request.agent(app);
    const userData = fakeUser({}, password);
    const otherUserData = fakeUser({}, otherUserPassword);
    const userRoute = `/users/${otherUserData.username}`;
    const newEmail = faker.internet.email();
    const newPassword = fakePassword();
    const newUsername = faker.internet.userName();
    await Users.insertMany([userData, otherUserData]);

    await agent.post('/auth/login').send({
      usernameOrEmail: userData.username,
      password,
    });

    await agent
      .post(`${userRoute}/changeUsername`)
      .send({ newUsername })
      .expect(403);
    await agent.post(`${userRoute}/changeEmail`).send({ newEmail }).expect(403);
    await agent
      .post(`${userRoute}/changePassword`)
      .send({
        oldPassword: otherUserPassword,
        newPassword,
      })
      .expect(403);
    await agent.post(`${userRoute}/unlockAccount`).expect(403);
    await agent.post(`${userRoute}/lockAccount`).expect(403);

    const result = await Users.findOne({ _id: otherUserData._id });
    expect(result).toEqual(otherUserData);
  });

  it("Admins can modify other users's attributes", async () => {
    const password = fakePassword();
    const otherUserPassword = fakePassword();
    const agent = request.agent(app);
    const userData = fakeUser({ role: UserRole.Admin }, password);
    const otherUserData = fakeUser({}, otherUserPassword);
    const userRoute = `/users/${otherUserData.username}`;
    const newEmail = faker.internet.email();
    const newUsername = faker.internet.userName();
    await Users.insertMany([userData, otherUserData]);

    await agent.post('/auth/login').send({
      usernameOrEmail: userData.username,
      password,
    });

    await agent.post(`${userRoute}/changeEmail`).send({ newEmail }).expect(204);
    await agent.post(`${userRoute}/unlockAccount`).expect(204);
    await agent.post(`${userRoute}/lockAccount`).expect(204);
    await agent
      .post(`${userRoute}/changeUsername`)
      .send({ newUsername })
      .expect(204);

    const result = await Users.findOne({ _id: otherUserData._id });
    expect(result!.username).toEqual(newUsername);
    expect(result!.isLockedOut).toBe(true);
    expect(result!.email).toEqual(newEmail);
    expect(result!.emailVerified).toBe(false);
  });

  it('Anonymous users cannot request account information on users', async () => {
    const agent = request.agent(app);
    const testUsers = await injectTestUsers(Users);
    await agent.get(`/users/${testUsers[0].username}`).expect(401);
    await agent.get(`/users`).query({ limit: 50 }).expect(401);
  });

  it('Regular users cannot request account information on other users', async () => {
    const agent = request.agent(app);
    const password = fakePassword();
    const user = fakeUser({}, password);
    const testUsers = await injectTestUsers(Users);
    await Users.insertOne(user);

    await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: user.username,
        password,
      })
      .expect(200);

    await agent.get(`/users/${testUsers[0].username}`).expect(403);
    await agent.get(`/users`).query({ limit: 50 }).expect(403);
  });

  it('Admins can request user data', async () => {
    const agent = request.agent(app);
    const password = fakePassword();
    const user = fakeUser({ role: UserRole.Admin }, password);
    const testUsers = await injectTestUsers(Users);
    await Users.insertOne(user);

    const {
      body: { lastLogin },
    } = await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: user.username,
        password,
      })
      .expect(200);

    user.lastLogin = lastLogin;
    testUsers.push(user);

    const { body: userResult } = await agent
      .get(`/users/${testUsers[0].username}`)
      .expect(200);
    expect(userResult).toEqual(
      JSON.parse(
        JSON.stringify(new DefaultUser(mongoClient, Log, testUsers[0])),
      ),
    );

    const { body: searchResult } = await agent
      .get(`/users`)
      .query({
        skip: 0,
        limit: 20,
        sortBy: UsersSortBy.MemberSince,
        sortOrder: SortOrder.Descending,
      })
      .expect(200);
    expect(searchResult).toEqual({
      count: 20,
      results: testUsers
        .sort((a, b) => b.memberSince.valueOf() - a.memberSince.valueOf())
        .slice(0, 20)
        .map((data) =>
          JSON.parse(JSON.stringify(new DefaultUser(mongoClient, Log, data))),
        ),
    });
  });

  it('Operations on non-existent users return 404 errors', async () => {
    const agent = request.agent(app);
    const adminPassword = fakePassword();
    const admin = fakeUser({ role: UserRole.Admin }, adminPassword);
    const userRoute = `/users/${faker.internet.userName()}`;
    const newEmail = faker.internet.email();
    const newPassword = fakePassword();
    const newUsername = faker.internet.userName();
    await Users.insertOne(admin);

    await agent
      .post('/auth/login')
      .send({
        usernameOrEmail: admin.username,
        password: adminPassword,
      })
      .expect(200);

    await agent.get(userRoute).expect(404);
    await agent
      .post(`${userRoute}/changeUsername`)
      .send({ newUsername })
      .expect(404);
    await agent.post(`${userRoute}/changeEmail`).send({ newEmail }).expect(404);
    await agent
      .post(`${userRoute}/changePassword`)
      .send({
        oldPassword: fakePassword(),
        newPassword,
      })
      .expect(404);
    await agent.post(`${userRoute}/unlockAccount`).expect(404);
    await agent.post(`${userRoute}/lockAccount`).expect(404);
  });
});
