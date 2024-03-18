import { UserRole } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { CertificationEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import CertificationTestData from '../../fixtures/certifications.json';
import { createAuthHeader, createTestApp } from '../../utils';

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
};

describe('Certifications End-to-End', () => {
  let Users: Repository<UserEntity>;
  let Certifications: Repository<CertificationEntity>;

  let app: INestApplication;
  let server: HttpServer;
  let certData: CertificationEntity[];
  let regularAuthHeader: [string, string];
  let regularUser: UserEntity;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Certifications = dataSource.getRepository(CertificationEntity);

    app = await createTestApp();
    server = app.getHttpServer();
    certData = CertificationTestData.map((data) => {
      const cert = new CertificationEntity();
      Object.assign(cert, data);
      return cert;
    });
    regularAuthHeader = await createAuthHeader(RegularUserId);

    regularUser = new UserEntity();
    Object.assign(regularUser, RegularUserData);
  });

  beforeEach(async () => {
    await Users.save(regularUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching certifications', () => {
    beforeEach(async () => {
      await Certifications.createQueryBuilder()
        .insert()
        .into(CertificationEntity)
        .values(certData)
        .execute();
    });

    it('will list all certifications by default', async () => {
      const { body } = await request(server)
        .get('/api/certifications')
        .set(...regularAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will perform a text-based search', async () => {
      const { body } = await request(server)
        .get('/api/certifications')
        .query({
          query: 'advanced',
        })
        .set(...regularAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will filter by agency', async () => {
      const { body } = await request(server)
        .get('/api/certifications')
        .query({
          agency: 'SSI',
        })
        .set(...regularAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will allow pagination', async () => {
      const { body } = await request(server)
        .get('/api/certifications')
        .query({
          skip: 10,
          limit: 5,
        })
        .set(...regularAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 400 if the query string parameters are invalid', async () => {
      await request(server)
        .get('/api/certifications')
        .query({
          skip: -1,
          limit: 8000,
        })
        .set(...regularAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get('/api/certifications').expect(401);
    });
  });

  describe('when getting a certification', () => {
    beforeEach(async () => {
      await Certifications.save(certData[0]);
    });

    it('will return a certification by ID', async () => {
      const { body } = await request(server)
        .get(`/api/certifications/${certData[0].id}`)
        .set(...regularAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .get(`/api/certifications/${certData[0].id}`)
        .expect(401);
    });

    it('will return a 404 response if the certification does not exist', async () => {
      await request(server)
        .get('/api/certifications/184ee397-3ee4-4a3d-a790-0b8fede230e2')
        .set(...regularAuthHeader)
        .expect(404);
    });
  });
});
