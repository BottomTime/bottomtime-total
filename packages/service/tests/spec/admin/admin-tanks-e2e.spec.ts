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

import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { TankEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TankTestData from '../../fixtures/pre-defined-tanks.json';
import { createAuthHeader, createTestApp } from '../../utils';

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
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  pressureUnit: PressureUnit.Bar,
  profileVisibility: ProfileVisibility.Private,
};

function tanksUrl(tankId?: string): string {
  return tankId ? `/api/admin/tanks/${tankId}` : '/api/admin/tanks';
}

describe('Tanks End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let Users: Repository<UserEntity>;
  let Tanks: Repository<TankEntity>;
  let tankData: Omit<TankEntity, 'user'>[];

  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];
  let regularUser: UserEntity;
  let adminUser: UserEntity;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);

    regularUser = new UserEntity();
    adminUser = new UserEntity();

    Object.assign(regularUser, RegularUserData);
    Object.assign(adminUser, AdminUserData);

    Users = dataSource.getRepository(UserEntity);
    Tanks = dataSource.getRepository(TankEntity);

    tankData = TankTestData.map((data) => {
      const tank = new TankEntity();
      Object.assign(tank, data);
      return tank;
    });
  });

  beforeEach(async () => {
    await Promise.all([Users.save(regularUser), Users.save(adminUser)]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing tanks', () => {
    it('will list system tanks', async () => {
      await Tanks.createQueryBuilder()
        .insert()
        .into(TankEntity)
        .values(tankData.slice(0, 15))
        .execute();

      const response = await request(server)
        .get(tanksUrl())
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return 401 if the user is not authenticated', async () => {
      await request(server).get(tanksUrl()).expect(401);
    });
  });

  describe('when retrieving a single tank', () => {
    it('will retrieve a tank by its ID', async () => {
      const tank = tankData[0];
      await Tanks.save(tank);

      const response = await request(server)
        .get(tanksUrl(tank.id))
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return a 401 error if the user is not authenticated', async () => {
      const tank = tankData[0];
      await Tanks.save(tank);
      await request(server).get(tanksUrl(tank.id)).expect(401);
    });

    it('will return 404 if the tank cannot be found', async () => {
      await request(server)
        .get(tanksUrl(tankData[7].id))
        .set(...regularAuthHeader)
        .expect(404);
    });
  });

  describe('when creating a new tank', () => {
    it('will create a new tank and return it', async () => {
      const options = {
        material: TankMaterial.Steel,
        name: 'My Tank',
        volume: 14.5,
        workingPressure: 219,
      };
      const { body } = await request(server)
        .post(tanksUrl())
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: true,
      });

      const tank = await Tanks.findOneBy({ id: body.id });
      expect(tank).not.toBeNull();
    });

    it('will return 400 if the request body is invalid', async () => {
      const { body: invalidResponse } = await request(server)
        .post(tanksUrl())
        .set(...adminAuthHeader)
        .send({
          material: 'unobtainium',
          name: '',
          volume: 4000,
          workingPressure: -80,
        })
        .expect(400);

      const { body: missingBodyResponse } = await request(server)
        .post(tanksUrl())
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(invalidResponse.details).toMatchSnapshot();
      expect(missingBodyResponse.details).toMatchSnapshot();
    });

    it('will return 401 if the user is not authenticated', async () => {
      await request(server)
        .post(tanksUrl())
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(401);
    });

    it('will return 403 if the user is not an administrator', async () => {
      await request(server)
        .post(tanksUrl())
        .set(...regularAuthHeader)
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(403);
    });
  });

  describe('when updating an existing tank', () => {
    let tankId: string;
    let tankUrl: string;
    let update: CreateOrUpdateTankParamsDTO;

    beforeEach(async () => {
      const tank = tankData[0];
      await Tanks.save(tank);
      tankUrl = tanksUrl(tank.id);
      tankId = tank.id;
      update = {
        material: TankMaterial.Steel,
        name: 'Updated Tank',
        volume: 13.22,
        workingPressure: 140.5,
      };
    });

    it('will update the tank as requested', async () => {
      const { body } = await request(server)
        .put(tankUrl)
        .set(...adminAuthHeader)
        .send(update)
        .expect(200);

      expect(body).toEqual({
        ...update,
        id: tankId,
        isSystem: true,
      });

      const tank = await Tanks.findOneBy({ id: tankId });
      expect(tank).not.toBeNull();
      expect(tank?.material).toBe(update.material);
      expect(tank?.name).toBe(update.name);
      expect(tank?.volume).toBe(update.volume);
      expect(tank?.workingPressure).toBe(update.workingPressure);
    });

    it('will return a 400 response if the update parameters are invalid', async () => {
      const { body: invalidResponse } = await request(server)
        .put(tankUrl)
        .set(...adminAuthHeader)
        .send({
          material: 'unobtainium',
          name: '',
          volume: 4000,
          workingPressure: -80,
        })
        .expect(400);

      const { body: missingBodyResponse } = await request(server)
        .put(tankUrl)
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(invalidResponse.details).toMatchSnapshot();
      expect(missingBodyResponse.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).put(tankUrl).send(update).expect(401);
    });

    it('will return a 403 response if the user is not an administrator', async () => {
      await request(server)
        .put(tankUrl)
        .set(...regularAuthHeader)
        .send(update)
        .expect(403);
    });

    it('will return a 404 response if the indicated tank ID does not exist', async () => {
      await request(server)
        .put(tanksUrl(TankTestData[4].id))
        .set(...adminAuthHeader)
        .send(update)
        .expect(404);
    });
  });

  describe('when deleting a tank', () => {
    let tankId: string;
    let tankUrl: string;

    beforeEach(async () => {
      const tank = tankData[0];
      await Tanks.save(tank);
      tankId = tank.id;
      tankUrl = tanksUrl(tankId);
    });

    it('will delete the indicated tank', async () => {
      await request(server)
        .delete(tankUrl)
        .set(...adminAuthHeader)
        .expect(204);

      const tank = await Tanks.findOneBy({ id: tankId });
      expect(tank).toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(tankUrl).expect(401);
    });

    it('will return a 403 response if the user is not an administrator', async () => {
      await request(server)
        .delete(tankUrl)
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the indicated tank ID does not exist', async () => {
      await request(server)
        .delete(tanksUrl(TankTestData[4].id))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
