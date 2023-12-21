import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createAuthHeader, createTestApp } from '../../utils';
import { TankModel, UserData, UserModel } from '../../../src/schemas';
import {
  CreateOrUpdateTankParamsDTO,
  ProfileVisibility,
  TankMaterial,
  UserRole,
} from '@bottomtime/api';
import TankTestData from '../../fixtures/pre-defined-tanks.json';

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

describe('Tanks End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    const adminUser = new UserModel(AdminUserData);
    const regularUser = new UserModel(RegularUserData);
    await UserModel.insertMany([adminUser, regularUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing tanks', () => {
    it('will list system tanks', async () => {
      const tankData = TankTestData.slice(0, 15).map(
        (tank) => new TankModel(tank),
      );
      await TankModel.insertMany(tankData);

      const response = await request(server)
        .get('/api/tanks')
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return 401 if the user is not authenticated', async () => {
      await request(server).get('/api/tanks').expect(401);
    });
  });

  describe('when retrieving a single tank', () => {
    it('will retrieve a tank by its ID', async () => {
      const tankData = new TankModel(TankTestData[0]);
      await tankData.save();

      const response = await request(server)
        .get(`/api/tanks/${tankData._id}`)
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return a 401 error if the user is not authenticated', async () => {
      const tankData = new TankModel(TankTestData[0]);
      await tankData.save();
      await request(server).get(`/api/tanks/${tankData._id}`).expect(401);
    });

    it('will return 404 if the tank cannot be found', async () => {
      await request(server)
        .get(`/api/tanks/${TankTestData[7]._id}}`)
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
        .post('/api/tanks')
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: true,
      });

      const tank = await TankModel.findById(body.id);
      expect(tank).not.toBeNull();
    });

    it('will return 400 if the request body is invalid', async () => {
      const { body: invalidResponse } = await request(server)
        .post('/api/tanks')
        .set(...adminAuthHeader)
        .send({
          material: 'unobtainium',
          name: '',
          volume: 4000,
          workingPressure: -80,
        })
        .expect(400);

      const { body: missingBodyResponse } = await request(server)
        .post('/api/tanks')
        .set(...adminAuthHeader)
        .send({})
        .expect(400);

      expect(invalidResponse.details).toMatchSnapshot();
      expect(missingBodyResponse.details).toMatchSnapshot();
    });

    it('will return 401 if the user is not authenticated', async () => {
      await request(server)
        .post('/api/tanks')
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
        .post('/api/tanks')
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
      const tankData = new TankModel(TankTestData[0]);
      await tankData.save();
      tankId = TankTestData[0]._id;
      tankUrl = `/api/tanks/${tankId}`;
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

      const tank = await TankModel.findById(tankId);
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
        .put(`/api/tanks/${TankTestData[4]._id}`)
        .set(...adminAuthHeader)
        .send(update)
        .expect(404);
    });
  });

  describe('when deleting a tank', () => {
    let tankId: string;
    let tankUrl: string;

    beforeEach(async () => {
      const tankData = new TankModel(TankTestData[0]);
      await tankData.save();
      tankId = TankTestData[0]._id;
      tankUrl = `/api/tanks/${tankId}`;
    });

    it('will delete the indicated tank', async () => {
      await request(server)
        .delete(tankUrl)
        .set(...adminAuthHeader)
        .expect(204);

      const tank = await TankModel.findById(tankId);
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
        .delete(`/api/tanks/${TankTestData[4]._id}`)
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
