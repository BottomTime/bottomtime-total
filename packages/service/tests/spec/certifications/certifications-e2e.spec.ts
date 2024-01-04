import { HttpServer, INestApplication } from '@nestjs/common';
import {
  CertificationDocument,
  CertificationModel,
  UserData,
  UserModel,
} from '../../../src/schemas';
import { createAuthHeader, createTestApp } from '../../utils';
import CertificationTestData from '../../fixtures/certifications.json';
import request from 'supertest';
import { ProfileVisibility, UserRole } from '@bottomtime/api';

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

describe('Certifications End-to-End', () => {
  let app: INestApplication;
  let server: HttpServer;
  let certifications: CertificationDocument[];
  let regularAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    certifications = CertificationTestData.map(
      (cert) => new CertificationModel(cert),
    );
    regularAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    await UserModel.insertMany([new UserModel(RegularUserData)]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching certifications', () => {
    beforeEach(async () => {
      await CertificationModel.insertMany(certifications);
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
      await CertificationModel.insertMany([certifications[0]]);
    });

    it('will return a certification by ID', async () => {
      const { body } = await request(server)
        .get(`/api/certifications/${certifications[0]._id}`)
        .set(...regularAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .get(`/api/certifications/${certifications[0]._id}`)
        .expect(401);
    });

    it('will return a 404 response if the certification does not exist', async () => {
      await request(server)
        .get('/api/certifications/does-not-exist')
        .set(...regularAuthHeader)
        .expect(404);
    });
  });
});
