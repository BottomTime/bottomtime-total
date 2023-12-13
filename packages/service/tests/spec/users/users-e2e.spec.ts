import { INestApplication } from '@nestjs/common';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';
import { UserData, UserModel } from '../../../src/schemas';
import { ProfileVisibility, UserRole } from '@bottomtime/api';
import { User } from '../../../src/users/user';
import request from 'supertest';

const AdminUserId = 'F3669787-82E5-458F-A8AD-98D3F57DDA6E';
const AdminUserData: UserData = {
  _id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  settings: {
    profileVisibility: ProfileVisibility.Private,
  },
};

const RegularUserId = '5A4699D8-48C4-4410-9886-B74B8B85CAC1';
const RegularUserData: UserData = {
  _id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  settings: {
    profileVisibility: ProfileVisibility.Private,
  },
};

describe('Users End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regualarAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regualarAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    const adminUser = new UserModel(AdminUserData);
    const regularUser = new UserModel(RegularUserData);
    await Promise.all([adminUser.save(), regularUser.save()]);
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
        await data.save();

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
});
