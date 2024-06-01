import {
  CreateOrUpdateDiveSiteDTO,
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WaterType,
  WeightUnit,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import { DiveSiteEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestDiveSiteData from '../../fixtures/dive-sites.json';
import TestDiveSiteCreatorData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';
import { parseDiveSiteJSON } from '../../utils/create-test-dive-site';

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

function requestUrl(siteId?: string): string {
  return `/api/diveSites${siteId ? `/${siteId}` : ''}`;
}

describe('Dive Sites End-to-End Tests', () => {
  let Sites: Repository<DiveSiteEntity>;
  let Users: Repository<UserEntity>;

  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);

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
    let creators: UserEntity[];
    let sites: DiveSiteEntity[];

    beforeAll(() => {
      creators = TestDiveSiteCreatorData.map((creator) =>
        parseUserJSON(creator),
      );
      sites = TestDiveSiteData.map((site, index) =>
        parseDiveSiteJSON(site, creators[index % 4]),
      );
    });

    beforeEach(async () => {
      await Users.save(creators);
      await Sites.save(sites);
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
          waterType: WaterType.Salt,
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
          waterType: 'brackish',
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
    let site: DiveSiteEntity;
    let creator: UserEntity;

    beforeAll(() => {
      creator = parseUserJSON(TestDiveSiteCreatorData[0]);
      site = parseDiveSiteJSON(TestDiveSiteData[0], creator);
    });

    beforeEach(async () => {
      await Users.save(creator);
      await Sites.save(site);
    });

    it('will return the dive site', async () => {
      const { body } = await request(server)
        .get(requestUrl(site.id))
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .get(requestUrl('88f7f288-cbfe-4879-a6b9-cbc26dddcee1'))
        .expect(404);
    });
  });

  describe('when creating a dive site', () => {
    const siteId = '53648128-8269-4f9a-91c6-7c88dfb74b3d';

    let creator: UserEntity;
    let createOptions: CreateOrUpdateDiveSiteDTO;
    let authHeader: [string, string];

    beforeAll(async () => {
      creator = parseUserJSON(TestDiveSiteCreatorData[4]);
      authHeader = await createAuthHeader(creator.id);
    });

    beforeEach(async () => {
      await Users.save(creator);
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
        waterType: WaterType.Fresh,
      };

      jest.spyOn(uuid, 'v4').mockReturnValue(siteId);
    });

    it('will create the new site and return the result', async () => {
      const { body } = await request(server)
        .post(requestUrl())
        .set(...authHeader)
        .send(createOptions)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body.creator.userId).toEqual(creator.id);
      expect(new Date(body.createdOn).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.name).toBe(createOptions.name);
      expect(body.location).toBe(createOptions.location);
      expect(body.description).toBe(createOptions.description);
      expect(body.depth).toEqual(createOptions.depth);
      expect(body.gps).toEqual(createOptions.gps);
      expect(body.directions).toBe(createOptions.directions);
      expect(body.freeToDive).toBe(createOptions.freeToDive);
      expect(body.shoreAccess).toBe(createOptions.shoreAccess);
      expect(body.waterType).toBe(createOptions.waterType);

      const savedSite = await Sites.findOneOrFail({
        relations: ['creator'],
        where: { id: siteId },
      });
      expect(savedSite.creator.id).toBe(creator.id);
      expect(savedSite.name).toBe(createOptions.name);
      expect(savedSite.location).toBe(createOptions.location);
      expect(savedSite.description).toBe(createOptions.description);
      expect(savedSite.depth).toBe(createOptions.depth!.depth);
      expect(savedSite.depthUnit).toBe(createOptions.depth!.unit);
      expect(savedSite.gps).toEqual({
        type: 'Point',
        coordinates: [createOptions.gps!.lon, createOptions.gps!.lat],
      });
      expect(savedSite.directions).toBe(createOptions.directions);
      expect(savedSite.freeToDive).toBe(createOptions.freeToDive);
      expect(savedSite.shoreAccess).toBe(createOptions.shoreAccess);
      expect(savedSite.createdOn.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(savedSite.waterType).toBe(createOptions.waterType);
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
          waterType: 'brackish',
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
    let site: DiveSiteEntity;
    let creator: UserEntity;
    let admin: UserEntity;
    let creatorAuthHeader: [string, string];
    let adminAuthHeader: [string, string];
    let updateOptions: CreateOrUpdateDiveSiteDTO;

    beforeAll(async () => {
      creator = parseUserJSON(TestDiveSiteCreatorData[7]);
      site = parseDiveSiteJSON(TestDiveSiteData[0], creator);
      admin = createTestUser(AdminUserData);

      creatorAuthHeader = await createAuthHeader(creator.id);
      adminAuthHeader = await createAuthHeader(admin.id);
    });

    beforeEach(async () => {
      await Users.save([creator, admin]);
      await Sites.save(site);

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
        waterType: WaterType.Fresh,
      };
    });

    it('will post updates to the site and return the result', async () => {
      const { body } = await request(server)
        .put(requestUrl(site.id))
        .set(...creatorAuthHeader)
        .send(updateOptions)
        .expect(200);

      expect(body.depth).toEqual(updateOptions.depth);
      expect(body.gps).toEqual(updateOptions.gps);
      expect(body.description).toBe(updateOptions.description);
      expect(body.directions).toBe(updateOptions.directions);
      expect(body.freeToDive).toBe(updateOptions.freeToDive);
      expect(body.shoreAccess).toBe(updateOptions.shoreAccess);
      expect(body.waterType).toBe(updateOptions.waterType);
      expect(new Date(body.updatedOn).valueOf()).toBeCloseTo(
        Date.now().valueOf(),
        -3,
      );

      const updated = await Sites.findOneByOrFail({ id: site.id });
      expect(updated.depth).toBe(updateOptions.depth!.depth);
      expect(updated.depthUnit).toBe(updateOptions.depth!.unit);
      expect(updated.gps).toEqual({
        type: 'Point',
        coordinates: [updateOptions.gps!.lon, updateOptions.gps!.lat],
      });
      expect(updated.description).toBe(updateOptions.description);
      expect(updated.directions).toBe(updateOptions.directions);
      expect(updated.freeToDive).toBe(updateOptions.freeToDive);
      expect(updated.shoreAccess).toBe(updateOptions.shoreAccess);
      expect(updated.waterType).toBe(updateOptions.waterType);
      expect(updated.updatedOn?.valueOf()).toBeCloseTo(
        Date.now().valueOf(),
        -3,
      );
    });

    it('will allow admins to update sites they did not create', async () => {
      const { body } = await request(server)
        .put(requestUrl(site.id))
        .set(...creatorAuthHeader)
        .send(updateOptions)
        .expect(200);

      expect(body.depth).toEqual(updateOptions.depth);
      expect(body.gps).toEqual(updateOptions.gps);
      expect(body.description).toBe(updateOptions.description);
      expect(body.directions).toBe(updateOptions.directions);
      expect(body.freeToDive).toBe(updateOptions.freeToDive);
      expect(body.shoreAccess).toBe(updateOptions.shoreAccess);
      expect(body.waterType).toBe(updateOptions.waterType);
      expect(new Date(body.updatedOn).valueOf()).toBeCloseTo(
        Date.now().valueOf(),
        -3,
      );

      const updated = await Sites.findOneByOrFail({ id: site.id });
      expect(updated.depth).toBe(updateOptions.depth!.depth);
      expect(updated.depthUnit).toBe(updateOptions.depth!.unit);
      expect(updated.gps).toEqual({
        type: 'Point',
        coordinates: [updateOptions.gps!.lon, updateOptions.gps!.lat],
      });
      expect(updated.description).toBe(updateOptions.description);
      expect(updated.directions).toBe(updateOptions.directions);
      expect(updated.freeToDive).toBe(updateOptions.freeToDive);
      expect(updated.shoreAccess).toBe(updateOptions.shoreAccess);
      expect(updated.waterType).toBe(updateOptions.waterType);
      expect(updated.updatedOn?.valueOf()).toBeCloseTo(
        Date.now().valueOf(),
        -3,
      );
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(requestUrl(site.id))
        .set(...creatorAuthHeader)
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
        .put(requestUrl(site.id))
        .set(...creatorAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server)
        .put(requestUrl(site.id))
        .send(updateOptions)
        .expect(401);
    });

    it('will return a 403 response if the user is not the creator', async () => {
      const otherUser = parseUserJSON(TestDiveSiteCreatorData[3]);
      await Users.save(otherUser);
      const otherAuthHeader = await createAuthHeader(otherUser.id);

      await request(server)
        .put(requestUrl(site.id))
        .set(...otherAuthHeader)
        .send(updateOptions)
        .expect(403);
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .put(requestUrl('62f9e8ed-f9df-4f31-9915-62e8e4970448'))
        .set(...adminAuthHeader)
        .send(updateOptions)
        .expect(404);
    });
  });

  describe('when deleting a dive site', () => {
    let site: DiveSiteEntity;
    let creator: UserEntity;
    let admin: UserEntity;
    let creatorAuthHeader: [string, string];
    let adminAuthHeader: [string, string];

    beforeAll(async () => {
      creator = parseUserJSON(TestDiveSiteCreatorData[7]);
      site = parseDiveSiteJSON(TestDiveSiteData[0], creator);
      admin = createTestUser(AdminUserData);

      creatorAuthHeader = await createAuthHeader(creator.id);
      adminAuthHeader = await createAuthHeader(admin.id);
    });

    beforeEach(async () => {
      await Users.save([creator, admin]);
      await Sites.save(site);
    });

    it('will delete the site and return a 204 response', async () => {
      await request(server)
        .delete(requestUrl(site.id))
        .set(...creatorAuthHeader)
        .expect(204);

      const deletedSite = await Sites.findOneBy({ id: site.id });
      expect(deletedSite).toBeNull();
    });

    it('will allow admins to delete sites they did not create', async () => {
      await request(server)
        .delete(requestUrl(site.id))
        .set(...adminAuthHeader)
        .expect(204);

      const deletedSite = await Sites.findOneBy({ id: site.id });
      expect(deletedSite).toBeNull();
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server).delete(requestUrl(site.id)).expect(401);
    });

    it('will return a 403 response if the user is not the creator', async () => {
      const otherUser = parseUserJSON(TestDiveSiteCreatorData[3]);
      await Users.save(otherUser);
      const otherAuthHeader = await createAuthHeader(otherUser.id);

      await request(server)
        .delete(requestUrl(site.id))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .delete(requestUrl('cdf94930-2a4b-4822-9870-103264f721f0'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
