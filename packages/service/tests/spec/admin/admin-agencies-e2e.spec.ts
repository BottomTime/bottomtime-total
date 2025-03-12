import { CreateOrUpdateAgencyDTO, UserRole } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAgenciesController } from 'src/admin/admin-agencies.controller';
import { AgenciesService, AgencyFactory } from 'src/certifications';
import { AgencyEntity, UserEntity } from 'src/data';
import request from 'supertest';
import { dataSource } from 'tests/data-source';
import { TestAgencies } from 'tests/fixtures/agencies';
import { createAuthHeader, createTestApp, createTestUser } from 'tests/utils';
import { Repository } from 'typeorm';

describe('Admin Agencies E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Agencies: Repository<AgencyEntity>;
  let Users: Repository<UserEntity>;

  let user: UserEntity;
  let admin: UserEntity;

  let userAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  function getUrl(agencyId?: string): string {
    const url = '/api/admin/agencies';
    return agencyId ? `${url}/${agencyId}` : url;
  }

  beforeAll(async () => {
    app = await createTestApp({
      imports: [TypeOrmModule.forFeature([AgencyEntity])],
      providers: [AgenciesService, AgencyFactory],
      controllers: [AdminAgenciesController],
    });
    server = app.getHttpServer();

    Agencies = dataSource.getRepository(AgencyEntity);
    Users = dataSource.getRepository(UserEntity);

    user = createTestUser();
    admin = createTestUser({ role: UserRole.Admin });

    [userAuthHeader, adminAuthHeader] = await Promise.all([
      createAuthHeader(user.id),
      createAuthHeader(admin.id),
    ]);
  });

  beforeEach(async () => {
    await Users.save([user, admin]);
    await Agencies.save(TestAgencies);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when creating an agency', () => {
    const options: CreateOrUpdateAgencyDTO = {
      logo: 'https://www.agency.com/logo.png',
      name: 'MTA',
      longName: 'Mah Test Agency',
      website: 'https://www.agency.com',
    };

    it('will create a new agency', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);
      expect(body).toMatchObject(options);
      expect(body.id).toBeDefined();

      const saved = await Agencies.findOneByOrFail({ id: body.id });
      expect(saved).toEqual({
        ...options,
        id: body.id,
        ordinal: expect.any(Number),
      });
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send({
          name: 'NOPE!',
          longName: 17,
          logo: true,
          website: 'not a url',
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the request is not authenticated', async () => {
      await request(server).post(getUrl()).send(options).expect(401);
    });

    it('will return a 403 response if the requesting user does not have admin privileges', async () => {
      await request(server)
        .post(getUrl())
        .set(...userAuthHeader)
        .send(options)
        .expect(403);
    });

    it('will return a 409 response if an agency with the same name already exists', async () => {
      await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send({
          ...options,
          name: TestAgencies[0].name.toLowerCase(),
        })
        .expect(409);
    });
  });

  describe('when updating an agency', () => {
    const update: CreateOrUpdateAgencyDTO = {
      logo: 'https://www.agency.com/updated.png',
      name: 'UA',
      longName: 'Updated Agency',
      website: 'https://www.agency.com',
    };

    it('will update an existing agency', async () => {
      const { body } = await request(server)
        .put(getUrl(TestAgencies[1].id))
        .set(...adminAuthHeader)
        .send(update)
        .expect(200);
      expect(body).toEqual({
        ...update,
        id: TestAgencies[1].id,
      });

      const saved = await Agencies.findOneByOrFail({ id: TestAgencies[1].id });
      expect(saved).toEqual({
        ...update,
        id: TestAgencies[1].id,
        ordinal: TestAgencies[1].ordinal,
      });
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .put(getUrl(TestAgencies[1].id))
        .set(...adminAuthHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl(TestAgencies[1].id))
        .set(...adminAuthHeader)
        .send({
          name: 'NOPE!',
          longName: 17,
          logo: true,
          website: 'not a url',
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the request is not authenticated', async () => {
      await request(server)
        .put(getUrl(TestAgencies[1].id))
        .send(update)
        .expect(401);
    });

    it('will return a 403 response if the requesting user does not have admin privileges', async () => {
      await request(server)
        .put(getUrl(TestAgencies[1].id))
        .set(...userAuthHeader)
        .send(update)
        .expect(403);
    });

    it('will return a 404 response if the specified agency could not be found', async () => {
      await request(server)
        .put(getUrl('87b239d9-a92d-46cd-9868-b2a519eb02e0'))
        .set(...adminAuthHeader)
        .send(update)
        .expect(404);
      await request(server)
        .put(getUrl('nope'))
        .set(...adminAuthHeader)
        .send(update)
        .expect(404);
    });

    it('will return a 409 response if an agency with the same name already exists', async () => {
      await request(server)
        .put(getUrl(TestAgencies[1].id))
        .set(...adminAuthHeader)
        .send({
          ...update,
          name: TestAgencies[0].name.toLowerCase(),
        })
        .expect(409);
    });
  });

  describe('when deleting an agency', () => {
    it('will delete an existing agency', async () => {
      await request(server)
        .delete(getUrl(TestAgencies[1].id))
        .set(...adminAuthHeader)
        .expect(204);
      await expect(
        Agencies.findOneBy({ id: TestAgencies[1].id }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the request is not authenticated', async () => {
      await request(server).delete(getUrl(TestAgencies[1].id)).expect(401);
    });

    it('will return a 403 response if the requesting user does not have admin privileges', async () => {
      await request(server)
        .delete(getUrl(TestAgencies[1].id))
        .set(...userAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the specified agency could not be found', async () => {
      await request(server)
        .delete(getUrl('eabd4ed2-64d2-4536-b12f-89ed799399b0'))
        .set(...adminAuthHeader)
        .expect(404);
      await request(server)
        .delete(getUrl('nope'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
