import { UserRole } from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import { AlertsController } from '../../../src/alerts/alerts.controller';
import { AlertsService } from '../../../src/alerts/alerts.service';
import { AlertEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import AlertTestData from '../../fixtures/alerts.json';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';
import { parseAlertJSON } from '../../utils/create-test-alert';

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  emailVerified: false,
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

function getUrl(alertId?: string): string {
  let url = '/api/alerts';

  if (alertId) {
    url = `${url}/${alertId}`;
  }

  return url;
}

describe('Alerts End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let Alerts: Repository<AlertEntity>;
  let Users: Repository<UserEntity>;
  let alertData: AlertEntity[];
  let regularUser: UserEntity;
  let adminUser: UserEntity;
  let authHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [TypeOrmModule.forFeature([AlertEntity])],
      providers: [AlertsService],
      controllers: [AlertsController],
    });
    server = app.getHttpServer();

    Alerts = dataSource.getRepository(AlertEntity);
    Users = dataSource.getRepository(UserEntity);

    adminUser = createTestUser(AdminUserData);
    regularUser = createTestUser(RegularUserData);
    alertData = AlertTestData.map((data) => parseAlertJSON(data));

    authHeader = await createAuthHeader(regularUser.id);
    adminAuthHeader = await createAuthHeader(adminUser.id);
  });

  beforeEach(async () => {
    await Users.save([adminUser, regularUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing alerts', () => {
    beforeEach(async () => {
      await Alerts.save(alertData);
    });

    it('will return a list of alerts with default params', async () => {
      const { body: result } = await request(server).get(getUrl()).expect(200);
      expect(result.totalCount).toBe(alertData.length);
      expect(result.data).toHaveLength(10);
      expect(result.data).toMatchSnapshot();
    });

    it('will return a list of alerts with params provided in the query string', async () => {
      const { body: result } = await request(server)
        .get(getUrl())
        .query({
          showDismissed: true,
          skip: 4,
          limit: 8,
        })
        .expect(200);

      expect(result.totalCount).toBe(alertData.length);
      expect(result.data).toHaveLength(8);
      expect(result.data).toMatchSnapshot();
    });

    it('will return a 400 response if the query string contains invalid params', async () => {
      const {
        body: { details },
      } = await request(server)
        .get(getUrl())
        .query({
          showDismissed: 'why not?',
          skip: -4,
          limit: 'lots',
        })
        .expect(400);

      expect(details).toMatchSnapshot();
    });
  });

  describe('when retrieving a single alert', () => {
    let alert: AlertEntity;

    beforeAll(() => {
      alert = alertData[0];
    });

    beforeEach(async () => {
      await Alerts.save(alert);
    });

    it('will return the indicated alert', async () => {
      const { body: result } = await request(server)
        .get(getUrl(alert.id))
        .expect(200);

      expect(result.id).toBe(alert.id);
      expect(result.icon).toBe(alert.icon);
      expect(result.title).toBe(alert.title);
      expect(result.message).toBe(alert.message);
      expect(result.active).toEqual(alert.active.valueOf());
      expect(result.expires).toBe(alert.expires!.valueOf());
    });

    it('will return the indicated alert even if it was dismissed by the current user', async () => {
      const { body: result } = await request(server)
        .get(getUrl(alert.id))
        .expect(200);

      expect(result.id).toBe(alert.id);
      expect(result.icon).toBe(alert.icon);
      expect(result.title).toBe(alert.title);
      expect(result.message).toBe(alert.message);
      expect(result.active).toEqual(alert.active.valueOf());
      expect(result.expires).toBe(alert.expires!.valueOf());
    });

    it('will return a 404 response if the alert ID is invalid', async () => {
      await request(server).get(getUrl('not-a-real-id')).expect(404);
    });

    it('will return a 404 if the alert does not exist', async () => {
      await request(server)
        .get(getUrl('0d641fca-41f5-46e5-a8da-b6e97680a9ff'))
        .expect(404);
    });
  });

  describe('when creating a new alert', () => {
    it('will create a new alert and return it', async () => {
      const alert = {
        icon: 'icon',
        title: 'title',
        message: 'message',
        active: new Date().valueOf(),
        expires: new Date().valueOf(),
      };

      const { body: result } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send(alert)
        .expect(201);

      expect(result.icon).toBe(alert.icon);
      expect(result.title).toBe(alert.title);
      expect(result.message).toBe(alert.message);
      expect(result.active).toEqual(alert.active);
      expect(result.expires).toBe(alert.expires);

      const saved = await Alerts.findOneByOrFail({ id: result.id });
      expect(saved.active).toEqual(new Date(alert.active));
      expect(saved.expires).toEqual(new Date(alert.expires));
      expect(saved.icon).toBe(alert.icon);
      expect(saved.message).toBe(alert.message);
      expect(saved.title).toBe(alert.title);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send({
          icon: 17,
          title: '',
          message: true,
          active: 'not a date',
          expires: 'not a date',
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing required properties', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl())
        .send({
          icon: 'icon',
          title: 'title',
          message: 'message',
          active: new Date(),
          expires: new Date(),
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          icon: 'icon',
          title: 'title',
          message: 'message',
          active: new Date(),
          expires: new Date(),
        })
        .expect(403);
    });
  });

  describe('when deleting an alert', () => {
    let alert: AlertEntity;

    beforeAll(() => {
      alert = alertData[0];
    });

    beforeEach(async () => {
      await Alerts.save(alertData);
      await Alerts.createQueryBuilder()
        .relation('dismissals')
        .of(alert)
        .add(regularUser);
    });

    it('will delete the indicated alert', async () => {
      await request(server)
        .delete(getUrl(alert.id))
        .set(...adminAuthHeader)
        .expect(204);

      await expect(Alerts.findOneBy({ id: alert.id })).resolves.toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(alert.id)).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .delete(getUrl(alert.id))
        .set(...authHeader)
        .expect(403);
    });

    it('will return a 404 response if the alert ID is invalid', async () => {
      await request(server)
        .delete(getUrl('not-a-real-id'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the alert does not exist', async () => {
      await request(server)
        .delete(getUrl('0d641fca-41f5-46e5-a8da-b6e97680a9ff'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when updating an existing alert', () => {
    let alert: AlertEntity;

    beforeAll(() => {
      alert = alertData[0];
    });

    beforeEach(async () => {
      await Alerts.save(alert);
    });

    it('will update an alert with new properties', async () => {
      const updated = {
        icon: 'new icon',
        title: 'new title',
        message: 'new message',
        active: new Date('2024-03-26T21:33:45.497Z').valueOf(),
        expires: new Date('2024-04-26T21:33:45.497Z').valueOf(),
      };

      const { body: result } = await request(server)
        .put(getUrl(alert.id))
        .set(...adminAuthHeader)
        .send(updated)
        .expect(200);

      expect(result.icon).toBe(updated.icon);
      expect(result.title).toBe(updated.title);
      expect(result.message).toBe(updated.message);
      expect(result.active).toEqual(updated.active);
      expect(result.expires).toBe(updated.expires);

      const saved = await Alerts.findOneByOrFail({ id: result.id });
      expect(saved.active).toEqual(new Date(updated.active));
      expect(saved.expires).toEqual(new Date(updated.expires));
      expect(saved.icon).toBe(updated.icon);
      expect(saved.message).toBe(updated.message);
      expect(saved.title).toBe(updated.title);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const {
        body: { details },
      } = await request(server)
        .put(getUrl(alert.id))
        .set(...adminAuthHeader)
        .send({
          icon: 17,
          title: '',
          message: true,
          active: 'not a date',
          expires: 'not a date',
        })
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing required properties', async () => {
      const {
        body: { details },
      } = await request(server)
        .put(getUrl(alert.id))
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getUrl(alert.id))
        .send({
          icon: 'icon',
          title: 'title',
          message: 'message',
          active: new Date(),
          expires: new Date(),
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .put(getUrl(alert.id))
        .set(...authHeader)
        .send({
          icon: 'icon',
          title: 'title',
          message: 'message',
          active: new Date(),
          expires: new Date(),
        })
        .expect(403);
    });

    it('will return a 404 response if the alert ID is invalid', async () => {
      await request(server)
        .put(getUrl('not-a-real-id'))
        .set(...adminAuthHeader)
        .send({
          icon: 'icon',
          title: 'title',
          message: 'message',
          active: new Date(),
          expires: new Date(),
        })
        .expect(404);
    });

    it('will return a 404 response if the alert does not exist', async () => {
      await request(server)
        .put(getUrl('0d641fca-41f5-46e5-a8da-b6e97680a9ff'))
        .set(...adminAuthHeader)
        .send({
          icon: 'icon',
          title: 'title',
          message: 'message',
          active: new Date(),
          expires: new Date(),
        })
        .expect(404);
    });
  });

  describe('when dismissing an alert', () => {
    let alert: AlertEntity;

    beforeAll(() => {
      alert = alertData[0];
    });

    beforeEach(async () => {
      await Alerts.save(alert);
    });

    it('will dismiss an alert and return a 204 response', async () => {
      await request(server)
        .post(`${getUrl(alert.id)}/dismiss`)
        .set(...authHeader)
        .expect(204);

      const dismissed = await Alerts.createQueryBuilder()
        .relation('dismissals')
        .of(alert)
        .loadMany();

      expect(dismissed).toHaveLength(1);
      expect(dismissed[0].id).toBe(regularUser.id);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(`${getUrl(alert.id)}/dismiss`)
        .expect(401);
    });

    it('will return a 404 response if the alert ID is invalid', async () => {
      await request(server)
        .post(`${getUrl('nopers')}/dismiss`)
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the alert does not exist', async () => {
      await request(server)
        .post(`${getUrl('377f2e43-a157-472a-b4bb-695ec1ac9486')}/dismiss`)
        .set(...authHeader)
        .expect(404);
    });
  });
});
