import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import { CertificationEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import CertificationTestData from '../../fixtures/certifications.json';
import { createAuthHeader, createTestApp } from '../../utils';

jest.mock('uuid');

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
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
  depthUnit: DepthUnit.Meters,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
};

const BaseUrl = '/api/admin/certifications';
function requestUrl(certificationId?: string): string {
  return certificationId ? `${BaseUrl}/${certificationId}` : BaseUrl;
}

describe('Certifications End-to-End', () => {
  let app: INestApplication;
  let server: HttpServer;
  let Users: Repository<UserEntity>;
  let Certifications: Repository<CertificationEntity>;

  let certData: CertificationEntity[];
  let regularAuthHeader: [string, string];
  let adminAuthHeader: [string, string];
  let regularUser: UserEntity;
  let adminUser: UserEntity;

  beforeAll(async () => {
    certData = CertificationTestData.map((data) => {
      const cert = new CertificationEntity();
      Object.assign(cert, data);
      return cert;
    });

    Users = dataSource.getRepository(UserEntity);
    Certifications = dataSource.getRepository(CertificationEntity);

    [app, regularAuthHeader, adminAuthHeader] = await Promise.all([
      createTestApp(),
      createAuthHeader(RegularUserId),
      createAuthHeader(AdminUserId),
    ]);

    server = app.getHttpServer();
  });

  beforeEach(async () => {
    regularUser = new UserEntity();
    Object.assign(regularUser, RegularUserData);

    adminUser = new UserEntity();
    Object.assign(adminUser, AdminUserData);

    await Promise.all([Users.save(regularUser), Users.save(adminUser)]);
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
      expect(body.certifications.length).toBe(10);
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
      await Certifications.createQueryBuilder()
        .insert()
        .into(CertificationEntity)
        .values(certData)
        .execute();
    });

    it('will return a certification by id', async () => {
      const { body } = await request(server)
        .get(requestUrl(certData[0].id))
        .set(...adminAuthHeader)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(requestUrl(certData[0].id)).expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .get(requestUrl(certData[0].id))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 if the certification id is invalid', async () => {
      await request(server)
        .get(requestUrl('nope'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 if the certification is not found', async () => {
      await request(server)
        .get(requestUrl('666e07ba-1716-4726-ba33-ab23baf74cd9'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when creating a certification', () => {
    const createData = {
      agency: 'BSAC',
      course: 'Intro to Underwater Stuff',
    };

    beforeEach(() => {
      jest
        .spyOn(uuid, 'v4')
        .mockReturnValue('b24ae74c-0802-47bb-9eab-a88574bb78df');
    });

    it('will create a new certification', async () => {
      const { body } = await request(server)
        .post(requestUrl())
        .set(...adminAuthHeader)
        .send(createData)
        .expect(201);
      expect(body).toMatchSnapshot();

      const result = await Certifications.findOneBy({ id: body.id });
      expect(result).toEqual({
        id: body.id,
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
      updateUrl = requestUrl(certData[7].id);
    });

    beforeEach(async () => {
      await Certifications.save(certData[7]);
    });

    it('will update the indicated certification', async () => {
      const { body } = await request(server)
        .put(updateUrl)
        .set(...adminAuthHeader)
        .send(updateData)
        .expect(200);

      expect(body).toMatchSnapshot();

      const result = await Certifications.findOneBy({ id: certData[7].id });
      expect(result).toEqual({
        id: certData[7].id,
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

    it('will return a 404 response if the certification id is invalid', async () => {
      await request(server)
        .put(requestUrl('nope'))
        .set(...adminAuthHeader)
        .send(updateData)
        .expect(404);
    });

    it('will return a 404 response if the certification is not found', async () => {
      await request(server)
        .put(requestUrl('666e07ba-1716-4726-ba33-ab23baf74cd9'))
        .set(...adminAuthHeader)
        .send(updateData)
        .expect(404);
    });
  });

  describe('when deleting a certification', () => {
    let deleteUrl: string;

    beforeAll(() => {
      deleteUrl = requestUrl(certData[17].id);
    });

    beforeEach(async () => {
      await Certifications.save(certData[17]);
    });

    it('will delete the indicated certification', async () => {
      await request(server)
        .delete(deleteUrl)
        .set(...adminAuthHeader)
        .expect(204);

      const result = await Certifications.findOneBy({ id: certData[17].id });
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

    it('will return a 404 response if the certification id is invalid', async () => {
      await request(server)
        .delete(requestUrl('nope'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the certirfication does not exist', async () => {
      await request(server)
        .delete(requestUrl('666e07ba-1716-4726-ba33-ab23baf74cd9'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
