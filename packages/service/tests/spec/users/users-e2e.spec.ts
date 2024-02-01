import {
  CreateUserParamsDTO,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UpdateProfileParamsDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { FriendModel, UserData, UserDocument, UserModel } from '@/schemas';
import { User } from '@/users';
import { INestApplication } from '@nestjs/common';

import { compare } from 'bcrypt';
import { Types } from 'mongoose';
import request from 'supertest';
import * as uuid from 'uuid';

import {
  TestMailer,
  createAuthHeader,
  createTestApp,
  createTestUser,
} from '../../utils';

jest.mock('uuid');

function requestUrl(username?: string): string {
  return username ? `/api/users/${username}` : '/api/users';
}

const TwoDaysInMs = 1000 * 60 * 60 * 24 * 2;

const AdminUserId = 'F3669787-82E5-458F-A8AD-98D3F57DDA6E';
const AdminUserData: UserData = {
  _id: AdminUserId,
  email: 'admin@site.org',
  emailLowered: 'admin@site.org',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  settings: {
    profileVisibility: ProfileVisibility.Private,
  },
};

const RegularUserPassword = 'wJ5]6H<w44,5';
const RegularUserId = '5A4699D8-48C4-4410-9886-B74B8B85CAC1';
const RegularUserData: UserData = {
  _id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  email: 'RoflCopter17@gmail.com',
  emailLowered: 'roflcopter17@gmail.com',
  passwordHash: '$2b$04$EIK2SpqsdmO.nwAOPJ9wt.9o2z732N9s23pLrdPxz8kqXB1A3yhdS',
  profile: {
    avatar: 'https://example.com/avatar.png',
    bio: 'This is a test user.',
    birthdate: '1980-01-01',
    certifications: new Types.DocumentArray([
      {
        agency: 'PADI',
        course: 'Open Water Diver',
        date: '2000-01-01',
      },
    ]),
    experienceLevel: 'Advanced',
    location: 'Seattle, WA',
    name: 'Joe Regular',
    startedDiving: '2000-01-01',
  },
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.FriendsOnly,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
  },
};

describe('Users End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regualarAuthHeader: [string, string];
  let mailClient: TestMailer;
  let adminUser: UserDocument;
  let regularUser: UserDocument;

  beforeAll(async () => {
    mailClient = new TestMailer();
    app = await createTestApp({
      mailClient,
    });
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regualarAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    adminUser = new UserModel(AdminUserData);
    regularUser = new UserModel(RegularUserData);
    await UserModel.insertMany([adminUser, regularUser]);
  });

  afterEach(() => {
    mailClient.clearMessages();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when requesting a user profile', () => {
    [
      { role: UserRole.Admin, visibility: ProfileVisibility.Private },
      { role: UserRole.Admin, visibility: ProfileVisibility.FriendsOnly },
      { role: UserRole.Admin, visibility: ProfileVisibility.Public },
      { role: UserRole.User, visibility: ProfileVisibility.FriendsOnly },
      { role: UserRole.User, visibility: ProfileVisibility.Public },
      { role: null, visibility: ProfileVisibility.Public },
    ].forEach(({ role, visibility }) => {
      it(`will return the profile when the calling user is ${
        role
          ? role === UserRole.Admin
            ? 'an administrator'
            : 'a regular user'
          : 'anonymous'
      } and the profile visibility is set to "${visibility}"`, async () => {
        const data = createTestUser({
          settings: { profileVisibility: visibility },
        });
        const user = new User(UserModel, data);
        const expected = JSON.parse(JSON.stringify(user.profile));
        const friendsSince = new Date();
        await data.save();
        await FriendModel.insertMany([
          new FriendModel({
            _id: 'D5A06BA4-C826-4EB6-A257-5C0A98F37721',
            userId: RegularUserId,
            friendId: data._id,
            friendsSince,
          }),
          new FriendModel({
            _id: '52730A5D-4F7C-4E9D-90CA-C53268CD8134',
            userId: data._id,
            friendId: RegularUserId,
            friendsSince,
          }),
        ]);

        if (role) {
          const { body: actual } = await request(server)
            .get(`/api/users/${user.username}`)
            .set(
              ...(role === UserRole.Admin
                ? adminAuthHeader
                : regualarAuthHeader),
            )
            .expect(200);
          expect(actual).toEqual(expected);
        } else {
          const { body: actual } = await request(server)
            .get(`/api/users/${user.username}`)
            .expect(200);
          expect(actual).toEqual(expected);
        }
      });
    });

    [
      { role: UserRole.User, visibility: ProfileVisibility.Private },
      { role: UserRole.User, visibility: ProfileVisibility.FriendsOnly },
      { role: null, visibility: ProfileVisibility.FriendsOnly },
      { role: null, visibility: ProfileVisibility.Private },
    ].forEach(({ role, visibility }) => {
      it(`will return a 401/403 response when the calling user is ${
        role ? 'a regular user' : 'anonymous'
      } and the profile visibility is set to "${visibility}"`, async () => {
        const data = createTestUser({
          settings: { profileVisibility: visibility },
        });
        await data.save();

        if (role) {
          await request(server)
            .get(`/api/users/${data.username}`)
            .set(...regualarAuthHeader)
            .expect(403);
        } else {
          await request(server).get(`/api/users/${data.username}`).expect(401);
        }
      });
    });
  });

  describe('when creating a new user account', () => {
    beforeAll(() => {
      jest.useFakeTimers({
        now: new Date('2024-01-15T12:40:18.319Z'),
        doNotFake: ['nextTick', 'setImmediate'],
      });
    });

    beforeEach(() => {
      jest
        .spyOn(uuid, 'v4')
        .mockReturnValue('a99a1193-3ef4-4816-85ce-e717a42dc99f');
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('will create a new account and sign in user', async () => {
      const agent = request.agent(server);
      const options: CreateUserParamsDTO = {
        username: 'User.McUserface',
        email: 'newuser@gmail.com',
        password: 'Str0ng_Password123!',
        role: UserRole.User,
        profile: {
          avatar: 'https://example.com/avatar.png',
          bio: 'This is a test user.',
          birthdate: '1980-01-01',
          certifications: [
            {
              agency: 'PADI',
              course: 'Open Water Diver',
              date: '2000-01-01',
            },
          ],
          experienceLevel: 'Advanced',
          location: 'Seattle, WA',
          name: 'User McUserface',
          startedDiving: '2000-01-01',
        },
      };

      const { body: user } = await agent
        .post('/api/users')
        .send(options)
        .expect(201);

      expect(user).toMatchSnapshot();

      const savedUser = await UserModel.findById(user.id);
      await expect(
        compare(options.password!, savedUser!.passwordHash!),
      ).resolves.toBe(true);
      expect(savedUser).not.toBeNull();
      savedUser!.passwordHash =
        '$2b$04$wProYOHv1Qgo9oj1nwDIuObvp7V6K1SSm0Gcp2TSPQPhOqY8RLBRa';
      savedUser!.emailVerificationToken =
        'oqh6qlk1wQsFvYiGO__KK0ZlQcMc6CW6I08zPbsgLtM';
      expect(savedUser).toMatchSnapshot();

      const { body: currentUser } = await agent.get('/api/auth/me').expect(200);
      expect(currentUser).toMatchSnapshot();
    });

    it('will create a new account with minimal properties', async () => {
      const agent = request.agent(server);
      const options: CreateUserParamsDTO = {
        username: 'User.McUserface',
      };

      const { body: user } = await agent
        .post('/api/users')
        .send(options)
        .expect(201);
      expect(user).toMatchSnapshot();

      const savedUser = await UserModel.findById(user.id);
      expect(savedUser).not.toBeNull();
      expect(savedUser).toMatchSnapshot();

      const { body: currentUser } = await agent.get('/api/auth/me').expect(200);
      expect(currentUser).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post('/api/users')
        .send({
          username: 'not a valid username',
          email: 33,
          pasword: 'too weak.',
          role: 'power_user',
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server).post('/api/users').expect(400);
    });

    it('will return a 403 response if the calling user attempts to create an admin account and is not an administrator themselves', async () => {
      await request(server)
        .post('/api/users')
        .set(...regualarAuthHeader)
        .send({
          username: 'User.McUserface',
          email: 'superadmin@site.com',
          password: 'Str0ng_Password123!',
          role: UserRole.Admin,
        })
        .expect(403);
    });

    it('will return a 401 response if the calling user attempts to create an admin account and is not authenticated', async () => {
      await request(server)
        .post('/api/users')
        .send({
          username: 'User.McUserface',
          email: 'superadmin@site.com',
          password: 'Str0ng_Password123!',
          role: UserRole.Admin,
        })
        .expect(401);
    });

    it('will return a 409 response if the username is already in use', async () => {
      const options: CreateUserParamsDTO = {
        username: RegularUserData.username.toUpperCase(),
        email: 'new_User@gmail.com',
        password: 'Str0ng_Password123!',
      };
      await request(server).post('/api/users').send(options).expect(409);
    });

    it('will return a 409 response if the email address is already in use', async () => {
      const options: CreateUserParamsDTO = {
        username: 'new_user',
        email: RegularUserData.email?.toUpperCase(),
        password: 'Str0ng_Password123!',
      };
      await request(server).post('/api/users').send(options).expect(409);
    });
  });

  describe('when changing usernames', () => {
    const url = `${requestUrl(RegularUserData.username)}/username`;

    it('will allow a user to change their username', async () => {
      const newUsername = 'New.Username88';
      await request(server)
        .post(url)
        .send({ newUsername })
        .set(...regualarAuthHeader)
        .expect(204);

      const { body: user } = await request(server)
        .get('/api/auth/me')
        .set(...regualarAuthHeader)
        .expect(200);

      expect(user.username).toEqual(newUsername);
    });

    it("will allow an admin to change another user's username", async () => {
      const newUsername = 'New.Username88';
      await request(server)
        .post(url)
        .send({ newUsername })
        .set(...adminAuthHeader)
        .expect(204);

      const { body: user } = await request(server)
        .get('/api/auth/me')
        .set(...regualarAuthHeader)
        .expect(200);

      expect(user.username).toEqual(newUsername);
    });

    it('will return a 400 response if the new username is invalid', async () => {
      await request(server)
        .post(url)
        .send({ newUsername: 'not a valid username' })
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 400 response if the new username is missing', async () => {
      await request(server)
        .post(url)
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      await request(server)
        .post(url)
        .send({ newUsername: 'Mike.Rogers33' })
        .expect(401);
    });

    it("will return a 403 response if user attempts to change another user's username", async () => {
      await request(server)
        .post(`${requestUrl(AdminUserData.username)}/username`)
        .set(...regualarAuthHeader)
        .send({ newUsername: 'Mike.Rogers33' })
        .expect(403);
    });

    it('will return a 404 resonse if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/changeUsername`)
        .set(...adminAuthHeader)
        .send({ newUsername: 'Mike.Rogers33' })
        .expect(404);
    });

    it('will return a 409 response if the indicated username is already taken', async () => {
      await request(server)
        .post(url)
        .set(...regualarAuthHeader)
        .send({ newUsername: AdminUserData.username })
        .expect(409);
    });
  });

  describe('when changing email address', () => {
    const url = `${requestUrl(RegularUserData.username)}/email`;

    it('will allow a user to change their email address', async () => {
      const newEmail = 'valid_email99@gmail.org';
      await request(server)
        .post(url)
        .send({ newEmail })
        .set(...regualarAuthHeader)
        .expect(204);

      const { body } = await request(server)
        .get('/api/auth/me')
        .set(...regualarAuthHeader)
        .expect(200);

      expect(body.email).toEqual(newEmail);
    });

    it("will allow an admin to change another user's email address", async () => {
      const newEmail = 'valid_email99@gmail.org';
      await request(server)
        .post(url)
        .send({ newEmail })
        .set(...adminAuthHeader)
        .expect(204);

      const { body } = await request(server)
        .get('/api/auth/me')
        .set(...regualarAuthHeader)
        .expect(200);

      expect(body.email).toEqual(newEmail);
    });

    it('will return a 400 response if the new email is invalid', async () => {
      await request(server)
        .post(url)
        .send({ newEmail: 'not a valid email' })
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 400 response if the new email address is missing', async () => {
      await request(server)
        .post(url)
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 401 resonse if calling user is not authenticated', async () => {
      await request(server)
        .post(url)
        .send({ newEmail: 'Doug.Derpinton27@aol.com' })
        .expect(401);
    });

    it('will return a 403 response if the calling user is not the account owner', async () => {
      await request(server)
        .post(`${requestUrl(AdminUserData.username)}/email`)
        .set(...regualarAuthHeader)
        .send({ newEmail: 'AnotherEmail@live.com' })
        .expect(403);
    });

    it('will return a 404 response if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/email`)
        .set(...adminAuthHeader)
        .send({ newEmail: 'scammer.bot69@email.com' })
        .expect(404);
    });

    it('will return a 409 response if the indicated email address is already in use', async () => {
      await request(server)
        .post(url)
        .set(...regualarAuthHeader)
        .send({ newEmail: AdminUserData.email })
        .expect(409);
    });
  });

  describe('when changing password', () => {
    const newPassword = 'New_Password123!';
    const passwordUrl = `${requestUrl(RegularUserData.username)}/password`;

    it("will change the user's password", async () => {
      const {
        body: { succeeded },
      } = await request(server)
        .post(passwordUrl)
        .send({ oldPassword: RegularUserPassword, newPassword })
        .set(...regualarAuthHeader)
        .expect(200);
      expect(succeeded).toBe(true);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.passwordHash).toBeDefined();
      await expect(
        compare(newPassword, savedUser!.passwordHash!),
      ).resolves.toBe(true);
    });

    it('will indicate when the password change failed', async () => {
      const {
        body: { succeeded },
      } = await request(server)
        .post(passwordUrl)
        .send({ oldPassword: 'not the right password', newPassword })
        .set(...regualarAuthHeader)
        .expect(200);

      expect(succeeded).toBe(false);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.passwordHash).toBeDefined();
      const derp = await compare(
        RegularUserPassword,
        savedUser?.passwordHash ?? '',
      );
      expect(derp).toBe(true);
      await expect(
        compare(RegularUserPassword, savedUser!.passwordHash!),
      ).resolves.toBe(true);
    });

    it('will return a 400 response if the new password is invalid', async () => {
      await request(server)
        .post(passwordUrl)
        .send({ oldPassword: RegularUserPassword, newPassword: 'weak sauce' })
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 400 response if the new password is missing', async () => {
      await request(server)
        .post(passwordUrl)
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if user is not authenticated', async () => {
      await request(server)
        .post(passwordUrl)
        .send({ oldPassword: RegularUserPassword, newPassword })
        .expect(401);
    });

    it("will return a 403 response if user attempts to change another user's password", async () => {
      await request(server)
        .post(`${requestUrl(AdminUserData.username)}/password`)
        .send({ oldPassword: RegularUserPassword, newPassword })
        .set(...regualarAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/password`)
        .send({ oldPassword: RegularUserPassword, newPassword })
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when verifying email addresses', () => {
    const requestVerificationUrl = `${requestUrl(
      RegularUserData.username,
    )}/requestEmailVerification`;
    const verifyUrl = `${requestUrl(RegularUserData.username)}/verifyEmail`;

    it('will request a verification token', async () => {
      const {
        body: { succeeded },
      } = await request(server)
        .post(requestVerificationUrl)
        .set(...regualarAuthHeader)
        .expect(202);
      expect(succeeded).toBe(true);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.emailVerificationToken).toBeDefined();
      expect(
        savedUser?.emailVerificationTokenExpiration?.valueOf(),
      ).toBeCloseTo(Date.now() + TwoDaysInMs, -2);

      expect(mailClient.sentMail).toHaveLength(1);
      expect(mailClient.sentMail[0].recipients.to).toContain(
        RegularUserData.email,
      );
      expect(mailClient.sentMail[0].body).toContain(
        savedUser?.emailVerificationToken,
      );
    });

    it('will do nothing if email address is already verified', async () => {
      regularUser.emailVerified = true;
      await regularUser.save();

      const {
        body: { succeeded },
      } = await request(server)
        .post(requestVerificationUrl)
        .set(...regualarAuthHeader)
        .expect(202);
      expect(succeeded).toBe(false);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.emailVerificationToken).toBeUndefined();
      expect(mailClient.sentMail).toHaveLength(0);
    });

    it('will do nothing if user does not have an email address on their account', async () => {
      regularUser.email = undefined;
      regularUser.emailLowered = undefined;
      await regularUser.save();

      const {
        body: { succeeded },
      } = await request(server)
        .post(requestVerificationUrl)
        .set(...regualarAuthHeader)
        .expect(202);
      expect(succeeded).toBe(false);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.emailVerificationToken).toBeUndefined();
      expect(mailClient.sentMail).toHaveLength(0);
    });

    it('will return a 401 response when requesting a verificaiton token if user is unauthenticated', async () => {
      await request(server).post(requestVerificationUrl).expect(401);
    });

    it('will return a 403 response when requesting a verificaiton token error if user is not the account owner', async () => {
      await request(server)
        .post(`${requestUrl(AdminUserData.username)}/requestEmailVerification`)
        .set(...regualarAuthHeader)
        .expect(403);
    });

    it('will return a 404 response when requesting a verificaiton token if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/requestEmailVerification`)
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will verify an email address', async () => {
      const token = 'abcd1234';
      regularUser.emailVerificationToken = token;
      regularUser.emailVerificationTokenExpiration = new Date(
        Date.now() + 10000,
      );
      await regularUser.save();

      const {
        body: { succeeded },
      } = await request(server).post(verifyUrl).send({ token }).expect(200);
      expect(succeeded).toBe(true);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.emailVerified).toBe(true);
      expect(savedUser?.emailVerificationToken).toBeNull();
      expect(savedUser?.emailVerificationTokenExpiration).toBeNull();
    });

    it('will indicate if the verification failed', async () => {
      const token = 'abcd1234';
      regularUser.emailVerificationToken = token;
      // Expired token!
      regularUser.emailVerificationTokenExpiration = new Date(
        Date.now() - 10000,
      );
      await regularUser.save();

      const {
        body: { succeeded },
      } = await request(server).post(verifyUrl).send({ token }).expect(200);
      expect(succeeded).toBe(false);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.emailVerified).toBe(false);
    });

    it('will return a 400 response when verifying an email when the token is invalid', async () => {
      await request(server).post(verifyUrl).send({ token: 9 }).expect(400);
    });

    it('will return a 400 response when verfiying an email when the token is missing', async () => {
      await request(server).post(verifyUrl).expect(400);
    });

    it('will return a 404 response when verifying an email if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/verifyEmail`)
        .send({ token: 'abcd1234' })
        .expect(404);
    });
  });

  describe('when resetting a password', () => {
    const newPassword = 'New_Password123!';
    const requestTokenUrl = `${requestUrl(
      RegularUserData.username,
    )}/requestPasswordReset`;
    const resetPasswordUrl = `${requestUrl(
      RegularUserData.username,
    )}/resetPassword`;

    it('will request a password token', async () => {
      await request(server).post(requestTokenUrl).expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.passwordResetToken).toBeDefined();
      expect(savedUser?.passwordResetTokenExpiration?.valueOf()).toBeCloseTo(
        Date.now() + TwoDaysInMs,
        -2,
      );

      expect(mailClient.sentMail).toHaveLength(1);
      expect(mailClient.sentMail[0].recipients.to).toContain(
        RegularUserData.email,
      );
      expect(mailClient.sentMail[0].body).toContain(
        savedUser?.passwordResetToken,
      );
    });

    it('will return a 404 response if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/requestPasswordReset`)
        .expect(404);
    });

    it('will reset a password', async () => {
      const token = 'abcd1234';
      regularUser.passwordResetToken = token;
      regularUser.passwordResetTokenExpiration = new Date(Date.now() + 10000);
      await regularUser.save();

      const {
        body: { succeeded },
      } = await request(server)
        .post(resetPasswordUrl)
        .send({ token, newPassword })
        .expect(200);
      expect(succeeded).toBe(true);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(savedUser?.passwordHash).toBeDefined();
      expect(savedUser?.passwordResetToken).toBeNull();
      expect(savedUser?.passwordResetTokenExpiration).toBeNull();
      await expect(
        compare(newPassword, savedUser!.passwordHash!),
      ).resolves.toBe(true);
    });

    it('will inidicate if password reset failed', async () => {
      const token = 'abcd1234';
      regularUser.passwordResetToken = token;
      regularUser.passwordResetTokenExpiration = new Date(Date.now() - 10000);
      await regularUser.save();

      const {
        body: { succeeded },
      } = await request(server)
        .post(resetPasswordUrl)
        .send({ token, newPassword })
        .expect(200);
      expect(succeeded).toBe(false);

      const savedUser = await UserModel.findById(RegularUserId);
      await expect(
        compare(RegularUserPassword, savedUser!.passwordHash!),
      ).resolves.toBe(true);
    });

    it('will return a 400 response if the new password is invalid', async () => {
      await request(server)
        .post(resetPasswordUrl)
        .send({
          token: 33,
          newPassword: 'nope',
        })
        .expect(400);
    });

    it('will return a 400 response if the new password is missing', async () => {
      await request(server).post(resetPasswordUrl).expect(400);
    });

    it('will return a 404 response if the indicated user does not exist', async () => {
      await request(server)
        .post(`${requestUrl('Not.A.User')}/resetPassword`)
        .send({ token: 'abcd1234' })
        .expect(404);
    });
  });

  describe('when updating profile information', () => {
    const profileUrl = `${requestUrl(RegularUserData.username)}`;
    const newProfileInfo: UpdateProfileParamsDTO = {
      avatar: 'https://avatars.com/my_picture.jpg',
      bio: 'I really like diving and updating profiles.',
      birthdate: '1992-03-30',
      certifications: [
        {
          agency: 'PADI',
          course: 'Open Water Diver',
          date: '2000-01-01',
        },
        {
          agency: 'PADI',
          course: 'Advanced Open Water Diver',
          date: '2002-01-01',
        },
      ],
      experienceLevel: 'Mega Expert',
      location: 'Vancouver, BC',
      name: 'Joe Exotic',
      startedDiving: '2015-01-01',
    };

    it('will update profile information', async () => {
      await request(server)
        .put(profileUrl)
        .set(...regualarAuthHeader)
        .send(newProfileInfo)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.profile))).toEqual(
        newProfileInfo,
      );
    });

    it('will allow partial updates to profile information', async () => {
      const newProfileInfo: UpdateProfileParamsDTO = {
        bio: 'I really like diving and updating profiles.',
        certifications: [
          {
            agency: 'PADI',
            course: 'Open Water Diver',
            date: '2000-01-01',
          },
          {
            agency: 'PADI',
            course: 'Advanced Open Water Diver',
            date: '2002-01-01',
          },
        ],
        experienceLevel: 'Mega Expert',
      };

      await request(server)
        .patch(profileUrl)
        .set(...regualarAuthHeader)
        .send(newProfileInfo)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.profile))).toEqual({
        ...RegularUserData.profile,
        ...newProfileInfo,
      });
    });

    it('will allow users to clear their profile information', async () => {
      await request(server)
        .put(profileUrl)
        .set(...regualarAuthHeader)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.profile))).toEqual({
        certifications: [],
      });
    });

    it('will allow admins to update another user profile', async () => {
      await request(server)
        .put(profileUrl)
        .set(...adminAuthHeader)
        .send(newProfileInfo)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.profile))).toEqual(
        newProfileInfo,
      );
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const badData = {
        derp: 'nope',
        avatar: 'https://avatars.com/my_picture.jpg',
        bio: true,
        birthdate: new Date(),
        certifications: [
          {
            agency: 'PADI',
            date: '2000-01-01',
          },
          {
            course: 'Advanced Open Water Diver',
            date: '2002-01-01',
          },
        ],
        experienceLevel: 'Mega Expert',
        location: 27,
        startedDiving: '2015-01-01',
      };

      await request(server)
        .put(profileUrl)
        .set(...regualarAuthHeader)
        .send(badData)
        .expect(400);
      await request(server)
        .patch(profileUrl)
        .set(...regualarAuthHeader)
        .send(badData)
        .expect(400);
    });

    it('will return a 401 response if the calling user is not authenticated', async () => {
      await request(server).put(profileUrl).send(newProfileInfo).expect(401);
      await request(server).patch(profileUrl).send(newProfileInfo).expect(401);
    });

    it('will return a 403 response if the calling user is not the account owner', async () => {
      const url = `${requestUrl(AdminUserData.username)}`;
      await request(server)
        .put(url)
        .set(...regualarAuthHeader)
        .send(newProfileInfo)
        .expect(403);
      await request(server)
        .patch(url)
        .set(...regualarAuthHeader)
        .send(newProfileInfo)
        .expect(403);
    });

    it('will return a 404 response if the indicated user does not exist', async () => {
      const url = `${requestUrl('Not.A.User')}`;
      await request(server)
        .put(url)
        .set(...adminAuthHeader)
        .send(newProfileInfo)
        .expect(404);
      await request(server)
        .patch(url)
        .set(...adminAuthHeader)
        .send(newProfileInfo)
        .expect(404);
    });
  });

  describe('when changing settings', () => {
    const settingsUrl = `${requestUrl(RegularUserData.username)}/settings`;

    it('will update settings with new values', async () => {
      const newSettings = {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
        profileVisibility: ProfileVisibility.Private,
      };
      await request(server)
        .put(settingsUrl)
        .set(...regualarAuthHeader)
        .send(newSettings)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.settings))).toEqual(
        newSettings,
      );
    });

    it('will allow a partial update of settings', async () => {
      const newSettings = {
        pressureUnit: PressureUnit.PSI,
        profileVisibility: ProfileVisibility.Private,
      };
      await request(server)
        .patch(settingsUrl)
        .set(...regualarAuthHeader)
        .send(newSettings)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.settings))).toEqual({
        ...RegularUserData.settings,
        ...newSettings,
      });
    });

    it("will allow admins to update another user's settings", async () => {
      const newSettings = {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
        profileVisibility: ProfileVisibility.Private,
      };
      await request(server)
        .put(settingsUrl)
        .set(...adminAuthHeader)
        .send(newSettings)
        .expect(204);

      const savedUser = await UserModel.findById(RegularUserId);
      expect(JSON.parse(JSON.stringify(savedUser?.settings))).toEqual(
        newSettings,
      );
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .put(settingsUrl)
        .set(...regualarAuthHeader)
        .send({ derp: 'nope', depthUnit: 17, profileVisibility: 'everyone' })
        .expect(400);
      await request(server)
        .patch(settingsUrl)
        .set(...regualarAuthHeader)
        .send({ derp: 'nope', depthUnit: 17, profileVisibility: 'everyone' })
        .expect(400);
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .put(settingsUrl)
        .set(...regualarAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the calling user is not authenticated', async () => {
      const newSettings = {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
        profileVisibility: ProfileVisibility.Private,
      };
      await request(server).put(settingsUrl).send(newSettings).expect(401);
      await request(server).patch(settingsUrl).send(newSettings).expect(401);
    });

    it('will return a 403 response if the calling user is not the account owner', async () => {
      const url = `${requestUrl(AdminUserData.username)}/settings`;
      const newSettings = {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
        profileVisibility: ProfileVisibility.Private,
      };
      await request(server)
        .put(url)
        .set(...regualarAuthHeader)
        .send(newSettings)
        .expect(403);
      await request(server)
        .patch(url)
        .set(...regualarAuthHeader)
        .send(newSettings)
        .expect(403);
    });

    it('will return a 404 response if the indicated user does not exist', async () => {
      const url = `${requestUrl('Not.A.User')}/settings`;
      const newSettings = {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
        profileVisibility: ProfileVisibility.Private,
      };
      await request(server)
        .put(url)
        .set(...adminAuthHeader)
        .send(newSettings)
        .expect(404);
      await request(server)
        .patch(url)
        .set(...adminAuthHeader)
        .send(newSettings)
        .expect(404);
    });
  });
});
