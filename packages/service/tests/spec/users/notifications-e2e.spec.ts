import {
  CreateOrUpdateNotificationParamsDTO,
  NotificationDTO,
  UserRole,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import { NotificationEntity, UserEntity } from '../../../src/data';
import { NotificationsService, UsersModule } from '../../../src/users';
import { NotificationsController } from '../../../src/users/notifications.controller';
import { dataSource } from '../../data-source';
import NotificationTestData from '../../fixtures/notifications.json';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';
import { parseNotificationJSON } from '../../utils/create-test-notification';

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  email: 'admin@site.org',
  emailLowered: 'admin@site.org',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
};

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  email: 'RoflCopter17@gmail.com',
  emailLowered: 'roflcopter17@gmail.com',
  passwordHash: '$2b$04$EIK2SpqsdmO.nwAOPJ9wt.9o2z732N9s23pLrdPxz8kqXB1A3yhdS',
  avatar: 'https://example.com/avatar.png',
  bio: 'This is a test user.',
  experienceLevel: 'Advanced',
  location: 'Seattle, WA',
  name: 'Joe Regular',
  startedDiving: '2000-01-01',
};

const OtherUserId = '735520d7-4964-46a1-bd79-5a0832555715';
const OtherUserData: Partial<UserEntity> = {
  id: OtherUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Other.Dude',
  usernameLowered: 'other.dude',
  email: 'otherguy@gmail.org',
  emailLowered: 'otherguy@gmail.org',
};

function getUrl(
  notificationId?: string,
  username?: string,
  action?: 'dismiss' | 'undismiss',
): string {
  let url = `/api/users/${username || RegularUserData.username}/notifications`;

  if (notificationId) {
    url = `${url}/${notificationId}`;
  }

  if (action) {
    url = `${url}/${action}`;
  }

  return url;
}

describe('Notifications End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let Users: Repository<UserEntity>;
  let Notifications: Repository<NotificationEntity>;

  let regularUser: UserEntity;
  let adminUser: UserEntity;
  let otherUser: UserEntity;
  let authHeader: [string, string];
  let otherAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [TypeOrmModule.forFeature([NotificationEntity]), UsersModule],
      providers: [NotificationsService],
      controllers: [NotificationsController],
    });
    server = app.getHttpServer();
    Users = dataSource.getRepository(UserEntity);
    Notifications = dataSource.getRepository(NotificationEntity);

    regularUser = createTestUser(RegularUserData);
    otherUser = createTestUser(OtherUserData);
    adminUser = createTestUser(AdminUserData);

    authHeader = await createAuthHeader(RegularUserId);
    otherAuthHeader = await createAuthHeader(OtherUserId);
    adminAuthHeader = await createAuthHeader(AdminUserId);
  });

  beforeEach(async () => {
    await Users.save([regularUser, otherUser, adminUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing notifications', () => {
    let notificationData: NotificationEntity[];

    beforeAll(() => {
      notificationData = NotificationTestData.map((notification) =>
        parseNotificationJSON(notification, regularUser),
      );
    });

    beforeEach(async () => {
      await Notifications.save(notificationData);
    });

    it('will return un-dismissed notifications for a user', async () => {
      const { body: result } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .expect(200);

      expect(result.totalCount).toBe(21);
      expect(result.data).toHaveLength(21);
      expect(result.data).toMatchSnapshot();
    });

    it('will allow notifications to be listed given query string options', async () => {
      const { body: result } = await request(server)
        .get(getUrl())
        .query({ showDismissed: true, skip: 10, limit: 5 })
        .set(...authHeader)
        .expect(200);

      expect(result.totalCount).toBe(50);
      expect(result.data).toHaveLength(5);
      expect(result.data).toMatchSnapshot();
    });

    it('will allow admins to view notifications for another user', async () => {
      const { body: result } = await request(server)
        .get(getUrl())
        .set(...adminAuthHeader)
        .expect(200);

      expect(result.totalCount).toBe(21);
      expect(result.data).toHaveLength(21);
      expect(
        result.data.map((notification: NotificationDTO) => notification.title),
      ).toMatchSnapshot();
    });

    it('will return an empty result set if the user has no notifications', async () => {
      const { body: result } = await request(server)
        .get(getUrl(undefined, otherUser.username))
        .set(...otherAuthHeader)
        .expect(200);

      expect(result.totalCount).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('will return a 400 response if the query string parameters are invalid', async () => {
      const {
        body: { details },
      } = await request(server)
        .get(getUrl())
        .query({ showDismissed: 'sure', skip: -4, limit: true })
        .set(...authHeader)
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is unauthenticated', async () => {
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the notifications', async () => {
      await request(server)
        .get(getUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .get(getUrl(undefined, 'joe.blow'))
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when retrieving a single notification', () => {
    let notificaitonData: NotificationEntity;

    beforeAll(() => {
      notificaitonData = parseNotificationJSON(
        NotificationTestData[3],
        regularUser,
      );
    });

    beforeEach(async () => {
      await Notifications.save(notificaitonData);
    });

    it('will retrieve the requested notification', async () => {
      const { body: result } = await request(server)
        .get(getUrl(notificaitonData.id))
        .set(...authHeader)
        .expect(200);

      expect(result).toMatchSnapshot();
    });

    it('will retrieve the requested notification even if it is dismissed', async () => {
      const data = parseNotificationJSON(NotificationTestData[0], regularUser);
      await Notifications.save(data);

      const { body: result } = await request(server)
        .get(getUrl(data.id))
        .set(...authHeader)
        .expect(200);

      expect(result).toMatchSnapshot();
    });

    it('will allow admins to retrieve notifications for other users', async () => {
      const { body: result } = await request(server)
        .get(getUrl(notificaitonData.id, regularUser.username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(result.title).toBe(notificaitonData.title);
    });

    it('will return a 401 response if the user is unauthenticated', async () => {
      await request(server).get(getUrl(notificaitonData.id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the notification', async () => {
      await request(server)
        .get(getUrl(notificaitonData.id))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the notification ID is invalid', async () => {
      await request(server)
        .get(getUrl('invalid-id'))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the notification does not exist', async () => {
      await request(server)
        .get(getUrl('f3669787-82e5-458f-a8ad-98d3f57dda6e'))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .get(getUrl(notificaitonData.id, 'joe.blow'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when creating a new notification', () => {
    it('will create the new notification and return the result in the response body', async () => {
      const options: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-circle',
        title: 'Alert!!',
        message: 'The bleep-blorps are blarping now.',
        active: new Date('2024-03-26T12:39:38.187Z'),
        expires: new Date('2024-04-26T12:39:38.187Z'),
      };

      const { body: result } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);

      expect(result.id).toBeDefined();
      expect(result.icon).toBe(options.icon);
      expect(result.title).toBe(options.title);
      expect(result.message).toBe(options.message);
      expect(result.active).toBe(options.active!.toISOString());
      expect(result.expires).toBe(options.expires!.toISOString());
      expect(result.dismissed).toBe(false);

      const saved = await Notifications.findOneByOrFail({ id: result.id });
      expect(saved.active).toEqual(options.active);
      expect(saved.expires).toEqual(options.expires);
      expect(saved.icon).toBe(options.icon);
      expect(saved.message).toBe(options.message);
      expect(saved.title).toBe(options.title);
      expect(saved.dismissed).toBe(false);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const options = {
        icon: true,
        title: '',
        message: 'The bleep-blorps are blarping now.',
        active: 'soon',
        expires: 2077,
      };

      const {
        body: { details },
      } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send(options)
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing required fields', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is unauthenticated', async () => {
      const options = {
        icon: true,
        title: '',
        message: 'The bleep-blorps are blarping now.',
        active: 'soon',
        expires: 2077,
      };
      await request(server).post(getUrl()).send(options).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      const options = {
        icon: true,
        title: '',
        message: 'The bleep-blorps are blarping now.',
        active: 'soon',
        expires: 2077,
      };
      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send(options)
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      const options = {
        icon: true,
        title: '',
        message: 'The bleep-blorps are blarping now.',
        active: 'soon',
        expires: 2077,
      };
      await request(server)
        .post(getUrl(undefined, '95413da7-7536-4355-b5ab-b8a69ae0894a'))
        .set(...authHeader)
        .send(options)
        .expect(404);
    });
  });

  describe('when updating an existing notification', () => {
    let notifcationData: NotificationEntity;

    beforeAll(() => {
      notifcationData = parseNotificationJSON(
        NotificationTestData[3],
        regularUser,
      );
    });

    beforeEach(async () => {
      await Notifications.save(notifcationData);
    });

    it('will update an existing notification and return the updated DTO', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };

      const { body: result } = await request(server)
        .put(getUrl(notifcationData.id))
        .set(...adminAuthHeader)
        .send(newOptions)
        .expect(200);

      expect(result.icon).toBe(newOptions.icon);
      expect(result.title).toBe(newOptions.title);
      expect(result.message).toBe(newOptions.message);
      expect(result.active).toBe(newOptions.active!.toISOString());
      expect(result.expires).toBe(newOptions.expires!.toISOString());
      expect(result.dismissed).toBe(false);

      const saved = await Notifications.findOneByOrFail({ id: result.id });
      expect(saved.active).toEqual(newOptions.active);
      expect(saved.expires).toEqual(newOptions.expires);
      expect(saved.icon).toBe(newOptions.icon);
      expect(saved.message).toBe(newOptions.message);
      expect(saved.title).toBe(newOptions.title);
      expect(saved.dismissed).toBe(false);
    });

    it('will mark a modified notification as active if it was previously dismissed', async () => {
      await Notifications.update(
        { id: notifcationData.id },
        { dismissed: true },
      );
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };

      const { body: result } = await request(server)
        .put(getUrl(notifcationData.id))
        .set(...adminAuthHeader)
        .send(newOptions)
        .expect(200);

      expect(result.icon).toBe(newOptions.icon);
      expect(result.title).toBe(newOptions.title);
      expect(result.message).toBe(newOptions.message);
      expect(result.active).toBe(newOptions.active!.toISOString());
      expect(result.expires).toBe(newOptions.expires!.toISOString());
      expect(result.dismissed).toBe(false);

      const saved = await Notifications.findOneByOrFail({ id: result.id });
      expect(saved.active).toEqual(newOptions.active);
      expect(saved.expires).toEqual(newOptions.expires);
      expect(saved.icon).toBe(newOptions.icon);
      expect(saved.message).toBe(newOptions.message);
      expect(saved.title).toBe(newOptions.title);
      expect(saved.dismissed).toBe(false);
    });

    it('will use the current date and time for the "active" property if it is omitted', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };

      const now = Date.now();
      const { body: result } = await request(server)
        .put(getUrl(notifcationData.id))
        .set(...adminAuthHeader)
        .send(newOptions)
        .expect(200);

      expect(new Date(result.active).valueOf()).toBeCloseTo(now, -3);

      const saved = await Notifications.findOneOrFail({
        where: { id: result.id },
        select: ['active'],
      });
      expect(saved.active.valueOf()).toBeCloseTo(now, -3);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const {
        body: { details },
      } = await request(server)
        .put(getUrl(notifcationData.id))
        .set(...adminAuthHeader)
        .send({ icon: true, title: '', message: 77, active: 'yesterday' })
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing required fields', async () => {
      const { body } = await request(server)
        .put(getUrl(notifcationData.id))
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is unauthenticated', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };
      await request(server)
        .put(getUrl(notifcationData.id))
        .send(newOptions)
        .expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };
      await request(server)
        .put(getUrl(notifcationData.id))
        .set(...authHeader)
        .send(newOptions)
        .expect(403);
    });

    it('will return a 404 response if the notification ID is invalid', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };
      await request(server)
        .put(getUrl('invalid-id'))
        .set(...adminAuthHeader)
        .send(newOptions)
        .expect(404);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };
      await request(server)
        .put(getUrl(notifcationData.id, 'joe.blow'))
        .set(...adminAuthHeader)
        .send(newOptions)
        .expect(404);
    });

    it('will return a 404 response if the notification does not exist', async () => {
      const newOptions: CreateOrUpdateNotificationParamsDTO = {
        icon: 'fas fa-exclamation-triangle',
        title: 'Warning!',
        message: 'The bleep-blorps are still blarping.',
        active: new Date('2024-03-28T12:39:38.187Z'),
        expires: new Date('2024-04-28T12:39:38.187Z'),
      };
      await request(server)
        .put(getUrl('f3669787-82e5-458f-a8ad-98d3f57dda6e'))
        .set(...adminAuthHeader)
        .send(newOptions)
        .expect(404);
    });
  });

  describe('when deleting a notification', () => {
    let notificationData: NotificationEntity;

    beforeAll(() => {
      notificationData = parseNotificationJSON(
        NotificationTestData[3],
        regularUser,
      );
    });

    beforeEach(async () => {
      await Notifications.save(notificationData);
    });

    it('will delete a notification and return a 204 response', async () => {
      await request(server)
        .delete(getUrl(notificationData.id))
        .set(...adminAuthHeader)
        .expect(204);

      const result = await Notifications.findOneBy({ id: notificationData.id });
      expect(result).toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(notificationData.id)).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .delete(getUrl(notificationData.id))
        .set(...authHeader)
        .expect(403);
    });

    it('will return a 404 response if the notification ID is invalid', async () => {
      await request(server)
        .delete(getUrl('invalid-id'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .delete(getUrl(notificationData.id, 'joe.blow'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the notification does not exist', async () => {
      await request(server)
        .delete(getUrl('f3669787-82e5-458f-a8ad-98d3f57dda6e'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  [true, false].forEach((dismissed) => {
    describe(`when ${
      dismissed ? 'undismissing' : 'dismissing'
    } a notification`, () => {
      let notificationData: NotificationEntity;

      beforeAll(() => {
        notificationData = parseNotificationJSON(
          NotificationTestData[dismissed ? 0 : 3],
          regularUser,
        );
      });

      beforeEach(async () => {
        await Notifications.save(notificationData);
      });

      it(`will ${
        dismissed ? 'undismiss' : 'dismiss'
      } the notification and return a 204 response`, async () => {
        await request(server)
          .post(
            getUrl(
              notificationData.id,
              undefined,
              dismissed ? 'undismiss' : 'dismiss',
            ),
          )
          .set(...adminAuthHeader)
          .expect(204);

        const result = await Notifications.findOneByOrFail({
          id: notificationData.id,
        });
        expect(result.dismissed).toBe(!dismissed);
      });

      it(`will do nothing and return a 204 response if the notification is already ${
        dismissed ? 'undismissed' : 'dismissed'
      }`, async () => {
        await Notifications.update({ id: notificationData.id }, { dismissed });
        await request(server)
          .post(
            getUrl(
              notificationData.id,
              undefined,
              dismissed ? 'dismiss' : 'undismiss',
            ),
          )
          .set(...adminAuthHeader)
          .expect(204);

        const result = await Notifications.findOneByOrFail({
          id: notificationData.id,
        });
        expect(result.dismissed).toBe(dismissed);
      });

      it('will return a 401 response if the user is not authenticated', async () => {
        await request(server)
          .post(
            getUrl(
              notificationData.id,
              undefined,
              dismissed ? 'undismiss' : 'dismiss',
            ),
          )
          .expect(401);
      });

      it('will return a 403 response if the user is not an admin', async () => {
        await request(server)
          .post(
            getUrl(
              notificationData.id,
              undefined,
              dismissed ? 'undismiss' : 'dismiss',
            ),
          )
          .set(...authHeader)
          .expect(403);
      });

      it('will return a 404 response if the notification ID is invalid', async () => {
        await request(server)
          .post(
            getUrl(
              'invalid-id',
              undefined,
              dismissed ? 'undismiss' : 'dismiss',
            ),
          )
          .set(...adminAuthHeader)
          .expect(404);
      });

      it('will return a 404 response if the target user does not exist', async () => {
        await request(server)
          .post(
            getUrl(
              notificationData.id,
              'joe.blow',
              dismissed ? 'undismiss' : 'dismiss',
            ),
          )
          .set(...adminAuthHeader)
          .send({ dismissed })
          .expect(404);
      });

      it('will return a 404 response if the notification does not exist', async () => {
        await request(server)
          .post(
            getUrl(
              'f3669787-82e5-458f-a8ad-98d3f57dda6e',
              undefined,
              dismissed ? 'undismiss' : 'dismiss',
            ),
          )
          .set(...adminAuthHeader)
          .expect(404);
      });
    });
  });
});
