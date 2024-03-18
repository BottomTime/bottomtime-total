import {
  CreateOrUpdateTankParamsDTO,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TankMaterial,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { TankEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestTankData from '../../fixtures/pre-defined-tanks.json';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';

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
  profileVisibility: ProfileVisibility.Private,
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
  profileVisibility: ProfileVisibility.Private,
};

function tankUrl(username: string, tankId?: string): string {
  return tankId
    ? `/api/users/${username}/tanks/${tankId}`
    : `/api/users/${username}/tanks`;
}

describe('User-defined Tank Profiles End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];

  let adminUser: UserEntity;
  let regularUser: UserEntity;

  let Tanks: Repository<TankEntity>;
  let Users: Repository<UserEntity>;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);

    Tanks = dataSource.getRepository(TankEntity);
    Users = dataSource.getRepository(UserEntity);

    adminUser = createTestUser(AdminUserData);
    regularUser = createTestUser(RegularUserData);
  });

  beforeEach(async () => {
    await Promise.all([Users.save(adminUser), Users.save(regularUser)]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing user-defined tanks', () => {
    let tanks: TankEntity[];

    beforeAll(() => {
      tanks = TestTankData.map((tank, index) => {
        const data = new TankEntity();
        Object.assign(data, tank);
        if (index % 2 === 0) {
          data.user = index % 4 === 0 ? adminUser : regularUser;
        }
        return data;
      });
    });

    beforeEach(async () => {
      await Tanks.save(tanks);
    });

    it('will list user-defined tanks', async () => {
      const response = await request(server)
        .get(tankUrl(regularUser.username))
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will list both system and user-defined tanks', async () => {
      const response = await request(server)
        .get(tankUrl(regularUser.username))
        .set(...regularAuthHeader)
        .query({ includeSystem: true })
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will allow admins to list all user-defined tanks', async () => {
      const response = await request(server)
        .get(tankUrl(regularUser.username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return a 401 response if user is not logged in', async () => {
      await request(server).get(tankUrl(regularUser.username)).expect(401);
    });

    it('will return a 403 response if user is not an administrator and does not own the requested tank profile', async () => {
      await request(server)
        .get(tankUrl(adminUser.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(tankUrl('Not.A.User'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when retrieving a single user-defined tank', () => {
    it('will retrieve a single user-defined tank', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      const { body: response } = await request(server)
        .get(tankUrl(regularUser.username, tankData.id))
        .set(...regularAuthHeader)
        .expect(200);

      expect(response).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not logged in', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .get(tankUrl(regularUser.username, tankData.id))
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and does not own the requested tank profile', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = adminUser;
      await Tanks.save(tankData);

      await request(server)
        .get(tankUrl(adminUser.username, tankData.id))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .get(tankUrl('Not.A.User', tankData.id))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the tank does not exist', async () => {
      await request(server)
        .get(tankUrl(regularUser.username, faker.datatype.uuid()))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when creating a new user-defined tank', () => {
    it('will create a new user-defined tank', async () => {
      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const { body } = await request(server)
        .post(tankUrl(regularUser.username))
        .set(...regularAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await Tanks.findOneBy({ id: body.id });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        ...options,
        id: body.id,
      });
    });

    it('will allow admins to create a new user-defined tank for another user', async () => {
      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Steel,
        name: 'New Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const { body } = await request(server)
        .post(tankUrl(regularUser.username))
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await Tanks.findOneBy({ id: body.id });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        ...options,
        id: body.id,
      });
    });

    it('will return a 400 response if the user has exceeded their tank limit', async () => {
      const tankData = TestTankData.slice(0, 10).map((tank) => {
        const entity = new TankEntity();
        Object.assign(entity, tank);
        entity.user = regularUser;
        return entity;
      });
      await Tanks.save(tankData);

      await request(server)
        .post(tankUrl(regularUser.username))
        .set(...regularAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(400);
    });

    it('will return a 400 response if the tank parameters are invalid', async () => {
      await request(server)
        .post(tankUrl(regularUser.username))
        .set(...regularAuthHeader)
        .send({
          material: 'unobtainium',
          name: '',
          volume: 4000,
          workingPressure: -80,
        })
        .expect(400);
    });

    it('will return a 400 response if the tank parameters are missing', async () => {
      await request(server)
        .post(tankUrl(regularUser.username))
        .set(...regularAuthHeader)
        .send({})
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server)
        .post(tankUrl(regularUser.username))
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and attempts to create a tank profile for another user', async () => {
      await request(server)
        .post(tankUrl(adminUser.username))
        .set(...regularAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .post(tankUrl('Not.A.User'))
        .set(...adminAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(404);
    });
  });

  describe('when updating an existing user-defined tank', () => {
    it('will update the tank profile', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Steel,
        name: 'Updated Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const { body } = await request(server)
        .put(tankUrl(regularUser.username, tankData.id))
        .set(...regularAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBe(tankData.id);
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await Tanks.findOneBy({ id: body.id });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        ...options,
        id: body.id,
      });
    });

    it('will allow admins to update a tank profile for another user', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Steel,
        name: 'Updated Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const { body } = await request(server)
        .put(tankUrl(regularUser.username, tankData.id))
        .set(...adminAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBe(tankData.id);
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await Tanks.findOneBy({ id: body.id });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        ...options,
        id: body.id,
      });
    });

    it('will return a 400 response if the tank parameters are invalid', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .put(tankUrl(regularUser.username, tankData.id))
        .set(...regularAuthHeader)
        .send({
          material: 'unobtainium',
          name: '',
          volume: 4000,
          workingPressure: -80,
        })
        .expect(400);
    });

    it('will return a 400 response if the tank parameters are missing', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .put(tankUrl(regularUser.username, tankData.id))
        .set(...regularAuthHeader)
        .send({})
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .put(tankUrl(regularUser.username, tankData.id))
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and attempts to update a tank profile for another user', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = adminUser;
      await Tanks.save(tankData);

      await request(server)
        .put(tankUrl(adminUser.username, tankData.id))
        .set(...regularAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .put(tankUrl('Not.A.User', tankData.id))
        .set(...adminAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(404);
    });

    it('will return a 404 response if the tank does not exist', async () => {
      await request(server)
        .put(tankUrl(regularUser.username, faker.datatype.uuid()))
        .set(...adminAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(404);
    });
  });

  describe('when deleting an existing user-defined tank', () => {
    it('will delete the tank profile', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .delete(tankUrl(regularUser.username, tankData.id))
        .set(...regularAuthHeader)
        .expect(204);

      const saved = await Tanks.findOneBy({ id: tankData.id });
      expect(saved).toBeNull();
    });

    it('will allow admins to delete a tank profile for another user', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .delete(tankUrl(regularUser.username, tankData.id))
        .set(...adminAuthHeader)
        .expect(204);

      const saved = await Tanks.findOneBy({ id: tankData.id });
      expect(saved).toBeNull();
    });

    it('will return a 401 response if the user is not logged in', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .delete(tankUrl(regularUser.username, tankData.id))
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and attempts to delete a tank profile for another user', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = adminUser;
      await Tanks.save(tankData);

      await request(server)
        .delete(tankUrl(adminUser.username, tankData.id))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      const tankData = new TankEntity();
      Object.assign(tankData, TestTankData[0]);
      tankData.user = regularUser;
      await Tanks.save(tankData);

      await request(server)
        .delete(tankUrl('Not.A.User', tankData.id))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the tank does not exist', async () => {
      await request(server)
        .delete(tankUrl(regularUser.username, faker.datatype.uuid()))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
