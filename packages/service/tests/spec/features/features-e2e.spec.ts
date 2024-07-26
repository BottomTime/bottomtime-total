import { CreateOrUpdateFeatureDTO, UserRole } from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { FeatureEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';

const TestData: FeatureEntity[] = [
  {
    id: '3db66852-686e-4212-920f-f1475e7e0e58',
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'awesome_feature',
    name: 'Latest Awesome Thing',
    description: 'This is a test feature',
    enabled: true,
  },
  {
    id: 'fe52ca62-235a-445c-91fb-e37798e67180',
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'secret_feature',
    name: 'Top Secret Feature',
    description: 'Shhh! No one is supposed to know about this',
    enabled: false,
  },
  {
    id: '879ef106-98cf-48b0-922f-a7dd4ee43945',
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'old_feature',
    name: 'Old and Busted',
    description: 'This is a test feature',
    enabled: false,
  },
];

function getUrl(key?: string): string {
  return `/api/features${key ? `/${key}` : ''}`;
}

describe('Features E2E tests', () => {
  let app: INestApplication;
  let server: unknown;

  let Features: Repository<FeatureEntity>;
  let Users: Repository<UserEntity>;

  let regularUser: UserEntity;
  let adminUser: UserEntity;

  let regularUserAuth: [string, string];
  let adminUserAuth: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    Features = dataSource.getRepository(FeatureEntity);
    Users = dataSource.getRepository(UserEntity);

    regularUser = createTestUser({ role: UserRole.User });
    adminUser = createTestUser({ role: UserRole.Admin });

    [regularUserAuth, adminUserAuth] = await Promise.all([
      createAuthHeader(regularUser.id),
      createAuthHeader(adminUser.id),
    ]);
  });

  beforeEach(async () => {
    await Promise.all([
      Features.save(TestData),
      Users.save([regularUser, adminUser]),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing flags', () => {
    it('will return all flags', async () => {
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return an empty array if no flags are found', async () => {
      await Features.delete({});
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body).toEqual([]);
    });
  });

  describe('when checking the existence of a flag', () => {
    it('will return a 200 response if the flag exists', async () => {
      await request(server).head(getUrl(TestData[0].key)).expect(200);
    });

    it('will return a 404 response if the flag does not exist', async () => {
      await request(server).head(getUrl('not_a_flag')).expect(404);
    });
  });

  describe('when retrieving a single flag', () => {
    it('will return the flag if it exists', async () => {
      const { body } = await request(server)
        .get(getUrl(TestData[2].key))
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the flag does not exist', async () => {
      await request(server).get(getUrl('not_a_flag')).expect(404);
    });
  });

  describe('when creating or updating a feature flag', () => {
    it('will create a new feature flag and return a 201 response', async () => {
      const key = 'feature_x';
      const options: CreateOrUpdateFeatureDTO = {
        name: 'Feature X',
        description: 'This is a feature to test the create API',
        enabled: true,
      };

      const { body } = await request(server)
        .put(getUrl(key))
        .set(...adminUserAuth)
        .send(options)
        .expect(201);

      expect(body.key).toBe(key);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.enabled).toBe(options.enabled);
      expect(new Date(body.createdAt).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Features.findOneByOrFail({ key });
      expect(saved.key).toBe(key);
      expect(saved.name).toBe(options.name);
      expect(saved.description).toBe(options.description);
      expect(saved.enabled).toBe(options.enabled);
    });

    it('will update an existing feature flag and return a 200 response', async () => {
      const key = TestData[0].key;
      const options: CreateOrUpdateFeatureDTO = {
        name: 'A Different Name',
        description: 'A different description for an existing feature',
        enabled: false,
      };

      const { body } = await request(server)
        .put(getUrl(key))
        .set(...adminUserAuth)
        .send(options)
        .expect(200);

      expect(body.key).toBe(key);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.enabled).toBe(options.enabled);
      expect(new Date(body.createdAt)).toEqual(TestData[0].createdAt);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Features.findOneByOrFail({ key });
      expect(saved.id).toBe(TestData[0].id);
      expect(saved.key).toBe(key);
      expect(saved.name).toBe(options.name);
      expect(saved.description).toBe(options.description);
      expect(saved.enabled).toBe(options.enabled);
    });

    it('will return a 400 response if the key is invalid', async () => {
      const options: CreateOrUpdateFeatureDTO = {
        name: 'A Different Name',
        description: 'A different description for an existing feature',
        enabled: false,
      };

      await request(server)
        .put(getUrl('invalid-key!'))
        .set(...adminUserAuth)
        .send(options)
        .expect(400);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .put(getUrl('feature_x'))
        .set(...adminUserAuth)
        .send({
          description: 43,
          enabled: 'yes, please',
        })
        .expect(400);
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .put(getUrl('feature_x'))
        .set(...adminUserAuth)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      const options: CreateOrUpdateFeatureDTO = {
        name: 'A Different Name',
        description: 'A different description for an existing feature',
        enabled: false,
      };

      await request(server).put(getUrl('feature_x')).send(options).expect(401);
    });

    it('will return a 403 response if the user is not an administrator', async () => {
      const options: CreateOrUpdateFeatureDTO = {
        name: 'A Different Name',
        description: 'A different description for an existing feature',
        enabled: false,
      };

      await request(server)
        .put(getUrl('feature_x'))
        .set(...regularUserAuth)
        .send(options)
        .expect(403);
    });
  });

  describe('when deleting a feature flag', () => {
    it('will delete the feature flag and return a 204 response', async () => {
      const key = TestData[0].key;
      await request(server)
        .delete(getUrl(key))
        .set(...adminUserAuth)
        .expect(204);
      await expect(Features.findOneBy({ key })).resolves.toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(TestData[1].key)).expect(401);
    });

    it('will return a 403 response if the user is not an administrator', async () => {
      await request(server)
        .delete(getUrl(TestData[1].key))
        .set(...regularUserAuth)
        .expect(403);
    });

    it('will return a 404 response if the feature flag does not exist', async () => {
      await request(server)
        .delete(getUrl('no_such_flag'))
        .set(...adminUserAuth)
        .expect(404);
    });
  });

  describe('when toggling a feature flag', () => {
    [false, true].forEach((enabled) => {
      it(`will toggle the feature flag to ${enabled} and return a 204 response`, async () => {
        const { body } = await request(server)
          .post(getUrl(`${TestData[enabled ? 1 : 0].key}/toggle`))
          .set(...adminUserAuth)
          .expect(200);

        expect(body).toEqual({ enabled });

        const saved = await Features.findOneByOrFail({
          key: TestData[enabled ? 1 : 0].key,
        });
        expect(saved.enabled).toBe(enabled);
      });

      it(`will allow a user to explicitly set the enabled state to ${enabled}`, async () => {
        const { body } = await request(server)
          .post(getUrl(`${TestData[enabled ? 1 : 0].key}/toggle`))
          .set(...adminUserAuth)
          .send({ enabled })
          .expect(200);

        expect(body).toEqual({ enabled });

        const saved = await Features.findOneByOrFail({
          key: TestData[enabled ? 1 : 0].key,
        });
        expect(saved.enabled).toBe(enabled);
      });

      it(`will be a no-op if when toggling a feature to ${enabled} when it is already in that state`, async () => {
        const { body } = await request(server)
          .post(getUrl(`${TestData[enabled ? 0 : 1].key}/toggle`))
          .set(...adminUserAuth)
          .send({ enabled })
          .expect(200);

        expect(body).toEqual({ enabled });

        const saved = await Features.findOneByOrFail({
          key: TestData[enabled ? 0 : 1].key,
        });
        expect(saved.enabled).toBe(enabled);
      });
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .post(getUrl(`${TestData[0].key}/toggle`))
        .set(...adminUserAuth)
        .send({ enabled: 'yes, please' })
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl(`${TestData[0].key}/toggle`))
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator', async () => {
      await request(server)
        .post(getUrl(`${TestData[0].key}/toggle`))
        .set(...regularUserAuth)
        .expect(403);
    });

    it('will return a 404 response if the feature flag does not exist', async () => {
      await request(server)
        .post(getUrl('no_such_flag/toggle'))
        .set(...adminUserAuth)
        .expect(404);
    });
  });
});
