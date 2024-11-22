import { NotificationType, UserRole } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Server } from 'http';
import request from 'supertest';
import { Repository } from 'typeorm';

import {
  NotificationEntity,
  NotificationWhitelistEntity,
  UserEntity,
} from '../../../src/data';
import { ConfigCatClient } from '../../../src/dependencies';
import { FeaturesModule } from '../../../src/features';
import { NotificationsService } from '../../../src/notifications';
import { NotificationPermissionsController } from '../../../src/notifications/notification-permissions.controller';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  ConfigCatClientMock,
  createAuthHeader,
  createTestApp,
  createTestUser,
} from '../../utils';

const UserData: Partial<UserEntity> = {
  id: '379d35a8-08bf-4bd4-b7d7-f6cc627243a7',
  username: 'testy_mctesterson23',
};

function getUrl(
  notificationType?: NotificationType,
  username?: string,
): string {
  return `/api/users/${
    username || UserData.username
  }/notifications/permissions/${notificationType || NotificationType.Email}`;
}

describe('Notification whitelist management E2E tests', () => {
  let app: INestApplication;
  let server: Server;
  let Users: Repository<UserEntity>;
  let Whitelists: Repository<NotificationWhitelistEntity>;
  let features: ConfigCatClientMock;

  let user: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;

  let userAuthHeader: [string, string];
  let otherUserAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    features = new ConfigCatClientMock();
    app = await createTestApp(
      {
        imports: [
          TypeOrmModule.forFeature([
            NotificationEntity,
            NotificationWhitelistEntity,
          ]),
          FeaturesModule,
          UsersModule,
        ],
        providers: [NotificationsService],
        controllers: [NotificationPermissionsController],
      },
      {
        provide: ConfigCatClient,
        use: features,
      },
    );
    await app.init();
    server = app.getHttpAdapter().getInstance();

    Users = dataSource.getRepository(UserEntity);
    Whitelists = dataSource.getRepository(NotificationWhitelistEntity);

    user = createTestUser(UserData);
    otherUser = createTestUser();
    admin = createTestUser({ role: UserRole.Admin });

    [userAuthHeader, otherUserAuthHeader, adminAuthHeader] = await Promise.all([
      createAuthHeader(user.id),
      createAuthHeader(otherUser.id),
      createAuthHeader(admin.id),
    ]);
  });

  beforeEach(async () => {
    await Users.save([user, otherUser, admin]);
    features.flags[NotificationsFeature.key] = true;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when retrieving a whitelist', () => {
    let whitelistData: NotificationWhitelistEntity;

    beforeAll(() => {
      whitelistData = {
        id: '7339333d-d30a-4d28-8e85-196eb5e019b8',
        user,
        type: NotificationType.Email,
        whitelist: ['membership.*', 'friendRequest.accepted'],
      };
    });

    it('will return the requested whitelist', async () => {
      await Whitelists.save(whitelistData);
      const { body } = await request(server)
        .get(getUrl())
        .set(...userAuthHeader)
        .expect(200);

      expect(body).toEqual(whitelistData.whitelist);
    });

    it('will return a default whitelist if none exists', async () => {
      await Whitelists.save(whitelistData);
      const { body } = await request(server)
        .get(getUrl(NotificationType.PushNotification))
        .set(...userAuthHeader)
        .expect(200);

      expect(body).toEqual(['*']);
    });

    it("will allow an admin to view a user's whitelist", async () => {
      await Whitelists.save(whitelistData);
      const { body } = await request(server)
        .get(getUrl())
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toEqual(whitelistData.whitelist);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to request the whitelist', async () => {
      await request(server)
        .get(getUrl())
        .set(...otherUserAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(getUrl(undefined, 'nonexistent_user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 501 response if the notifications feature is not enabled', async () => {
      features.flags[NotificationsFeature.key] = false;
      await request(server)
        .get(getUrl())
        .set(...userAuthHeader)
        .expect(501);
    });
  });

  describe('when saving a whitelist', () => {
    it('will save a new whitelist', async () => {
      const whitelist = ['user.*', 'friendRequest.accepted'];
      await request(server)
        .put(getUrl())
        .set(...userAuthHeader)
        .send(whitelist)
        .expect(204);

      const saved = await Whitelists.findOneByOrFail({
        user: { id: user.id },
        type: NotificationType.Email,
      });

      expect(saved.whitelist).toEqual(whitelist);
    });

    it('will update an existing whitelist', async () => {
      const whitelist = ['user.*', 'friendRequest.accepted'];
      await Whitelists.save({
        id: '7339333d-d30a-4d28-8e85-196eb5e019b8',
        user,
        type: NotificationType.PushNotification,
        whitelist,
      });

      const newWhitelist = ['user.*'];

      await request(server)
        .put(getUrl(NotificationType.PushNotification))
        .set(...userAuthHeader)
        .send(newWhitelist)
        .expect(204);

      const saved = await Whitelists.findOneByOrFail({
        user: { id: user.id },
        type: NotificationType.PushNotification,
      });

      expect(saved.whitelist).toEqual(newWhitelist);
    });

    it('will allow an admin to save a user whitelist', async () => {
      const whitelist = ['user.*', 'friendRequest.accepted'];
      await request(server)
        .put(getUrl())
        .set(...userAuthHeader)
        .send(whitelist)
        .expect(204);

      const saved = await Whitelists.findOneByOrFail({
        user: { id: user.id },
        type: NotificationType.Email,
      });

      expect(saved.whitelist).toEqual(whitelist);
    });

    it('will return a 400 response if the whitelist is missing', async () => {
      await request(server)
        .put(getUrl())
        .set(...userAuthHeader)
        .expect(400);
    });

    it('will return a 400 response if the whitelist is invalid', async () => {
      await request(server)
        .put(getUrl())
        .set(...userAuthHeader)
        .send({ whitelist: 'membership.*' })
        .expect(400);
    });

    it('will return a 400 response if the whitelist contains invalid event keys', async () => {
      await request(server)
        .put(getUrl())
        .set(...userAuthHeader)
        .send({ whitelist: ['membership.*', 'invalidEventKey'] })
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getUrl())
        .send(['user.*', 'friendRequest.accepted'])
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to save the whitelist', async () => {
      await request(server)
        .put(getUrl())
        .set(...otherUserAuthHeader)
        .send(['user.*', 'friendRequest.accepted'])
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .put(getUrl(undefined, 'nonexistent_user'))
        .set(...otherUserAuthHeader)
        .send(['user.*', 'friendRequest.accepted'])
        .expect(404);
    });

    it('will return a 501 response if the notification feature is not enabled', async () => {
      features.flags[NotificationsFeature.key] = false;
      await request(server)
        .put(getUrl())
        .set(...userAuthHeader)
        .send(['user.*', 'friendRequest.accepted'])
        .expect(501);
    });
  });

  describe('when resetting a whitelist', () => {
    let whitelistData: NotificationWhitelistEntity;

    beforeAll(() => {
      whitelistData = {
        id: '7339333d-d30a-4d28-8e85-196eb5e019b8',
        user,
        type: NotificationType.PushNotification,
        whitelist: ['membership.*', 'friendRequest.accepted'],
      };
    });

    it('will reset a whitelist', async () => {
      await Whitelists.save(whitelistData);
      await request(server)
        .delete(getUrl(NotificationType.PushNotification))
        .set(...userAuthHeader)
        .expect(204);

      await expect(
        Whitelists.findOneBy({ user, type: whitelistData.type }),
      ).resolves.toBeNull();
    });

    it('will do nothing if the whitelist does not exist', async () => {
      await request(server)
        .delete(getUrl())
        .set(...userAuthHeader)
        .expect(204);
    });

    it('will allow an admin to reset a user whitelist', async () => {
      await Whitelists.save(whitelistData);
      await request(server)
        .delete(getUrl(NotificationType.PushNotification))
        .set(...userAuthHeader)
        .expect(204);

      await expect(
        Whitelists.findOneBy({ user, type: whitelistData.type }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to reset the whitelist', async () => {
      await request(server)
        .delete(getUrl())
        .set(...otherUserAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .delete(getUrl(undefined, 'nonexistent_user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 501 response if the notifications feature is not enabled', async () => {
      features.flags[NotificationsFeature.key] = false;
      await request(server)
        .delete(getUrl())
        .set(...userAuthHeader)
        .expect(501);
    });
  });
});
