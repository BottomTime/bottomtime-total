import { HttpServer, INestApplication } from '@nestjs/common';
import {
  CertificationDocument,
  CertificationModel,
  UserData,
  UserModel,
} from '../../../src/schemas';
import { createAuthHeader, createTestApp } from '../../utils';
import CertificationTestData from '../../fixtures/certifications.json';
import { ProfileVisibility, UserRole } from '@bottomtime/api';
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

const BaseUrl = '/api/admin/certifications';
function requestUrl(certificationId?: string): string {
  return certificationId ? `${BaseUrl}/${certificationId}` : BaseUrl;
}

describe('Certifications End-to-End', () => {
  let app: INestApplication;
  let server: HttpServer;
  let certifications: CertificationDocument[];
  let regularAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    certifications = CertificationTestData.map(
      (cert) => new CertificationModel(cert),
    );
    regularAuthHeader = await createAuthHeader(RegularUserId);
    adminAuthHeader = await createAuthHeader(AdminUserId);
  });

  beforeEach(async () => {
    await UserModel.insertMany([
      new UserModel(AdminUserData),
      new UserModel(RegularUserData),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching certifications', () => {
    beforeEach(async () => {
      await CertificationModel.insertMany(certifications);
    });

    it('will perform a search for certifications', async () => {
      const { body } = await request(server)
        .get(requestUrl())
        .query({
          agency: 'SSI',
          skip: 10,
          limit: 10,
        })
        .set(...adminAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 400 response if the query parameters are invalid', async () => {
      await request(server)
        .get(requestUrl())
        .query({
          skip: -1,
          limit: 10000,
        })
        .set(...adminAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(requestUrl()).expect(401);
    });

    it('will return a 403 response if user is not an admin', async () => {
      await request(server)
        .get(requestUrl())
        .set(...regularAuthHeader)
        .expect(403);
    });
  });

  describe('when getting a certification', () => {
    beforeEach(async () => {
      await CertificationModel.insertMany([certifications[0]]);
    });

    it('will return a certification by id', async () => {
      const { body } = await request(server)
        .get(requestUrl(certifications[0]._id))
        .set(...adminAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(requestUrl(certifications[0]._id)).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .get(requestUrl(certifications[0]._id))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 if the certification is not found', async () => {
      await request(server)
        .get(requestUrl('does-not-exist'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when creating a certification', () => {
    const createData = {
      agency: 'BSAC',
      course: 'Intro to Underwater Stuff',
    };

    it('will create a new certification', async () => {
      const { body } = await request(server)
        .post(requestUrl())
        .set(...adminAuthHeader)
        .send(createData)
        .expect(201);
      expect(body).toMatchSnapshot();

      const result = await CertificationModel.findById(body.id);
      expect(result?.toJSON()).toEqual({
        __v: 0,
        _id: body.id,
        ...createData,
      });
    });

    it('will return a 400 response if the certification data is invalid', async () => {
      await request(server)
        .post(requestUrl())
        .set(...adminAuthHeader)
        .send({
          agency: 18,
          course: '',
        })
        .expect(400);
    });

    it('will return a 400 response if the certificate data is missing', async () => {
      await request(server)
        .post(requestUrl())
        .set(...adminAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).post(requestUrl()).send(createData).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .post(requestUrl())
        .send(createData)
        .set(...regularAuthHeader)
        .expect(403);
    });
  });

  describe('when updating a certification', () => {
    const updateData = {
      agency: 'BSAC',
      course: 'Advanced Reef Identification',
    };
    let updateUrl: string;

    beforeAll(() => {
      updateUrl = requestUrl(certifications[7]._id);
    });

    beforeEach(async () => {
      await CertificationModel.insertMany([certifications[7]]);
    });

    it('will update the indicated certification', async () => {
      const { body } = await request(server)
        .put(updateUrl)
        .set(...adminAuthHeader)
        .send(updateData)
        .expect(200);

      expect(body).toMatchSnapshot();

      const result = await CertificationModel.findById(certifications[7]._id);
      expect(result?.toJSON()).toEqual({
        __v: 0,
        _id: certifications[7]._id,
        ...updateData,
      });
    });

    it('will return a 400 response if the certification data is invalid', async () => {
      await request(server)
        .put(updateUrl)
        .set(...adminAuthHeader)
        .send({
          agency: 37,
          invalid: true,
        })
        .expect(400);
    });

    it('will return a 400 response if the certification data is missing', async () => {
      await request(server)
        .put(updateUrl)
        .set(...adminAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).put(updateUrl).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .put(updateUrl)
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the certification is not found', async () => {
      await request(server)
        .put(requestUrl('does-not-exist'))
        .set(...adminAuthHeader)
        .send(updateData)
        .expect(404);
    });
  });

  describe('when deleting a certification', () => {
    let deleteUrl: string;

    beforeAll(() => {
      deleteUrl = requestUrl(certifications[17]._id);
    });

    beforeEach(async () => {
      await CertificationModel.insertMany([certifications[17]]);
    });

    it('will delete the indicated certification', async () => {
      await request(server)
        .delete(deleteUrl)
        .set(...adminAuthHeader)
        .expect(204);

      const result = await CertificationModel.findById(certifications[17]._id);
      expect(result).toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(deleteUrl).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .delete(deleteUrl)
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the certirfication does not exist', async () => {
      await request(server)
        .delete(requestUrl('does-not-exist'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
