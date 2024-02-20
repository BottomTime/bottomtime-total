import {
  CreateOrUpdateDiveSiteDTO,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import * as uuid from 'uuid';

import {
  DiveSiteDocument,
  DiveSiteModel,
  UserData,
  UserDocument,
  UserModel,
} from '../../../src/schemas';
import TestDiveSiteCreatorData from '../../fixtures/dive-site-creators.json';
import TestDiveSiteData from '../../fixtures/dive-sites.json';
import { createAuthHeader, createTestApp } from '../../utils';

jest.mock('uuid');

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
    depthUnit: DepthUnit.Meters,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.Private,
  },
};

function requestUrl(siteId?: string): string {
  return `/api/diveSites${siteId ? `/${siteId}` : ''}`;
}

describe('Dive Sites End-to-End Tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching dive sites', () => {
    const EmptyResultSet = {
      sites: [],
      totalCount: 0,
    };
    let sites: DiveSiteDocument[];
    let creators: UserDocument[];

    beforeAll(() => {
      sites = TestDiveSiteData.map((site) => new DiveSiteModel(site));
      creators = TestDiveSiteCreatorData.map(
        (creator) => new UserModel(creator),
      );
    });

    beforeEach(async () => {
      await Promise.all([
        DiveSiteModel.insertMany(sites),
        UserModel.insertMany(creators),
      ]);
    });

    it('will list results from a basic search', async () => {
      const { body } = await request(server)
        .get(requestUrl())
        .query({ limit: 6 })
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return the results from a filtered search', async () => {
      const { body } = await request(server)
        .get(requestUrl())
        .query({
          shoreAccess: true,
          freeToDive: true,
          creator: creators[0].username,
        })
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return an empty array if the search does not match any results', async () => {
      const { body } = await request(server)
        .get(requestUrl())
        .query({
          query: 'hogwarts',
        })
        .expect(200);

      expect(body).toEqual(EmptyResultSet);
    });

    it('will return an empty array if the username in the creator parameter does not match any user account', async () => {
      const { body } = await request(server)
        .get(requestUrl())
        .query({ creator: 'nonexistent' })
        .expect(200);

      expect(body).toEqual(EmptyResultSet);
    });

    it('will return a 400 response if the query parameters are invalid', async () => {
      const { body } = await request(server)
        .get(requestUrl())
        .query({
          query: 'a'.repeat(201),
          location: 'north of Jacksonville',
          radius: '30 miles',
          freeToDive: 'sure',
          shoreAccess: 13,
          rating: 6,
          difficulty: 0.5,
          creator: true,
          sortBy: 'depth',
          sortOrder: 'up',
          skip: -1,
          limit: 80000,
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });
  });

  describe('when getting a dive site', () => {
    let site: DiveSiteDocument;
    let creator: UserDocument;

    beforeEach(async () => {
      site = new DiveSiteModel(TestDiveSiteData[0]);
      creator = new UserModel(TestDiveSiteCreatorData[7]);
      await Promise.all([
        DiveSiteModel.insertMany([site]),
        UserModel.insertMany([creator]),
      ]);
    });

    it('will return the dive site', async () => {
      const { body } = await request(server)
        .get(requestUrl(site._id))
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server).get(requestUrl('nonexistent')).expect(404);
    });
  });

  describe('when creating a dive site', () => {
    const siteId = '53648128-8269-4F9A-91C6-7C88DFB74B3D';
    const now = new Date('2024-01-10T16:48:14.408Z');
    let authHeader: [string, string];
    let creator: UserDocument;
    let createOptions: CreateOrUpdateDiveSiteDTO;

    beforeAll(async () => {
      creator = new UserModel(TestDiveSiteCreatorData[4]);
      authHeader = await createAuthHeader(creator._id);
    });

    beforeEach(async () => {
      await UserModel.insertMany([creator]);
      createOptions = {
        name: 'Test Dive Site',
        location: 'In the Florida Keys',
        description: 'Kinda tropical. Has fish.',
        depth: {
          depth: 70,
          unit: DepthUnit.Feet,
        },
        gps: {
          lat: 30.0865,
          lon: -80.4473,
        },
        directions: 'Just drive there.',
        freeToDive: true,
        shoreAccess: true,
      };

      jest.useFakeTimers({
        now,
        doNotFake: ['nextTick', 'setImmediate'],
      });

      jest.spyOn(uuid, 'v4').mockReturnValue(siteId);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('will create the new site and return the result', async () => {
      const { body } = await request(server)
        .post(requestUrl())
        .set(...authHeader)
        .send(createOptions)
        .expect(201);

      expect(body).toMatchSnapshot();

      const savedSite = await DiveSiteModel.findById(siteId);
      expect(savedSite).not.toBeNull();
      expect(savedSite?.toJSON()).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(requestUrl())
        .set(...authHeader)
        .send({
          location: true,
          description: 77,
          depth: {
            depth: -70,
            unit: DepthUnit.Feet,
          },
          gps: {
            lat: 300.0865,
          },
          directions: 'Just drive there.',
          freeToDive: 'yup',
          shoreAccess: -1,
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .post(requestUrl())
        .set(...authHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server).post(requestUrl()).send(createOptions).expect(401);
    });
  });

  describe('when updating a dive site', () => {
    const now = new Date('2024-01-10T16:48:14.408Z');
    let site: DiveSiteDocument;
    let creator: UserDocument;
    let admin: UserDocument;
    let authHeader: [string, string];
    let adminAuthHeader: [string, string];
    let updateOptions: CreateOrUpdateDiveSiteDTO;

    beforeEach(async () => {
      site = new DiveSiteModel(TestDiveSiteData[0]);
      creator = new UserModel(TestDiveSiteCreatorData[7]);
      admin = new UserModel(AdminUserData);
      await Promise.all([
        DiveSiteModel.insertMany([site]),
        UserModel.insertMany([creator, admin]),
      ]);
      authHeader = await createAuthHeader(creator._id);
      adminAuthHeader = await createAuthHeader(admin._id);
      updateOptions = {
        name: 'Test Dive Site',
        location: 'In the Florida Keys',
        description: 'Kinda tropical. Has fish.',
        depth: {
          depth: 70,
          unit: DepthUnit.Feet,
        },
        gps: {
          lat: 30.0865,
          lon: -80.4473,
        },
        directions: 'Just drive there.',
        freeToDive: true,
        shoreAccess: true,
      };

      jest.useFakeTimers({
        now,
        doNotFake: ['nextTick', 'setImmediate'],
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('will post updates to the site and return the result', async () => {
      const { body } = await request(server)
        .put(requestUrl(site._id))
        .set(...authHeader)
        .send(updateOptions)
        .expect(200);

      expect(body).toMatchSnapshot();

      const updatedSite = await DiveSiteModel.findById(site._id);
      expect(updatedSite).not.toBeNull();
      expect(updatedSite?.toJSON()).toMatchSnapshot();
    });

    it('will allow admins to update sites they did not create', async () => {
      const { body } = await request(server)
        .put(requestUrl(site._id))
        .set(...authHeader)
        .send(updateOptions)
        .expect(200);

      expect(body).toMatchSnapshot();

      const updatedSite = await DiveSiteModel.findById(site._id);
      expect(updatedSite).not.toBeNull();
      expect(updatedSite?.toJSON()).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(requestUrl(site._id))
        .set(...authHeader)
        .send({
          location: true,
          description: 77,
          depth: {
            depth: -70,
            unit: DepthUnit.Feet,
          },
          gps: {
            lat: 300.0865,
          },
          directions: 'Just drive there.',
          freeToDive: 'yup',
          shoreAccess: -1,
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .put(requestUrl(site._id))
        .set(...authHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server)
        .put(requestUrl(site._id))
        .send(updateOptions)
        .expect(401);
    });

    it('will return a 403 response if the user is not the creator', async () => {
      const otherUser = new UserModel(TestDiveSiteCreatorData[3]);
      await UserModel.insertMany([otherUser]);
      const otherAuthHeader = await createAuthHeader(otherUser._id);

      await request(server)
        .put(requestUrl(site._id))
        .set(...otherAuthHeader)
        .send(updateOptions)
        .expect(403);
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .put(requestUrl('nonexistent'))
        .set(...adminAuthHeader)
        .send(updateOptions)
        .expect(404);
    });
  });

  describe('when deleting a dive site', () => {
    let site: DiveSiteDocument;
    let creator: UserDocument;
    let admin: UserDocument;
    let authHeader: [string, string];
    let adminAuthHeader: [string, string];

    beforeEach(async () => {
      site = new DiveSiteModel(TestDiveSiteData[0]);
      creator = new UserModel(TestDiveSiteCreatorData[7]);
      admin = new UserModel(AdminUserData);
      await Promise.all([
        DiveSiteModel.insertMany([site]),
        UserModel.insertMany([creator, admin]),
      ]);
      authHeader = await createAuthHeader(creator._id);
      adminAuthHeader = await createAuthHeader(admin._id);
    });

    it('will delete the site and return a 204 response', async () => {
      await request(server)
        .delete(requestUrl(site._id))
        .set(...authHeader)
        .expect(204);

      const deletedSite = await DiveSiteModel.findById(site._id);
      expect(deletedSite).toBeNull();
    });

    it('will allow admins to delete sites they did not create', async () => {
      await request(server)
        .delete(requestUrl(site._id))
        .set(...adminAuthHeader)
        .expect(204);

      const deletedSite = await DiveSiteModel.findById(site._id);
      expect(deletedSite).toBeNull();
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server).delete(requestUrl(site._id)).expect(401);
    });

    it('will return a 403 response if the user is not the creator', async () => {
      const otherUser = new UserModel(TestDiveSiteCreatorData[3]);
      await UserModel.insertMany([otherUser]);
      const otherAuthHeader = await createAuthHeader(otherUser._id);

      await request(server)
        .delete(requestUrl(site._id))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .delete(requestUrl('nonexistent'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
