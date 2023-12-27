import {
  CreateOrUpdateTankParamsDTO,
  ProfileVisibility,
  TankMaterial,
  UserRole,
} from '@bottomtime/api';
import {
  TankDocument,
  TankModel,
  UserData,
  UserModel,
} from '../../../src/schemas';
import { INestApplication } from '@nestjs/common';
import { createAuthHeader, createTestApp } from '../../utils';
import request from 'supertest';
import TestTankData from '../../fixtures/pre-defined-tanks.json';
import { faker } from '@faker-js/faker';

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

  describe('when listing user-defined tanks', () => {
    let tankData: TankDocument[];

    beforeAll(() => {
      tankData = TestTankData.map((tank, index) => {
        const document = new TankModel(tank);
        if (index % 2 === 0) {
          document.user = index % 4 === 0 ? AdminUserId : RegularUserId;
        }
        return document;
      });
    });

    beforeEach(async () => {
      await TankModel.insertMany(tankData);
    });

    it('will list user-defined tanks', async () => {
      const response = await request(server)
        .get(tankUrl(RegularUserData.username))
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will list both system and user-defined tanks', async () => {
      const response = await request(server)
        .get(tankUrl(RegularUserData.username))
        .set(...regularAuthHeader)
        .query({ includeSystem: true })
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will allow admins to list all user-defined tanks', async () => {
      const response = await request(server)
        .get(tankUrl(RegularUserData.username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return a 401 response if user is not logged in', async () => {
      await request(server).get(tankUrl(RegularUserData.username)).expect(401);
    });

    it('will return a 403 response if user is not an administrator and does not own the requested tank profile', async () => {
      await request(server)
        .get(tankUrl(AdminUserData.username))
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
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      const response = await request(server)
        .get(tankUrl(RegularUserData.username, tankData._id))
        .set(...regularAuthHeader)
        .expect(200);

      expect(response.body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not logged in', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .get(tankUrl(RegularUserData.username, tankData._id))
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and does not own the requested tank profile', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = AdminUserId;
      await tankData.save();

      await request(server)
        .get(tankUrl(AdminUserData.username, tankData._id))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .get(tankUrl('Not.A.User', tankData._id))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the tank does not exist', async () => {
      await request(server)
        .get(tankUrl(RegularUserData.username, faker.datatype.uuid()))
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
        .post(tankUrl(RegularUserData.username))
        .set(...regularAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await TankModel.findById(body.id);
      expect(saved).not.toBeNull();
      expect(saved?.toJSON()).toEqual({
        ...options,
        __v: 0,
        _id: body.id,
        user: RegularUserId,
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
        .post(tankUrl(RegularUserData.username))
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await TankModel.findById(body.id);
      expect(saved).not.toBeNull();
      expect(saved?.toJSON()).toEqual({
        ...options,
        __v: 0,
        _id: body.id,
        user: RegularUserId,
      });
    });

    it('will return a 400 response if the user has exceeded their tank limit', async () => {
      const tankData = TestTankData.slice(0, 10).map(
        (tank) =>
          new TankModel({
            ...tank,
            user: RegularUserId,
          }),
      );
      await TankModel.insertMany(tankData);

      await request(server)
        .post(tankUrl(RegularUserData.username))
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
        .post(tankUrl(RegularUserData.username))
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
        .post(tankUrl(RegularUserData.username))
        .set(...regularAuthHeader)
        .send({})
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      await request(server)
        .post(tankUrl(RegularUserData.username))
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
        .post(tankUrl(AdminUserData.username))
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
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Steel,
        name: 'Updated Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const { body } = await request(server)
        .put(tankUrl(RegularUserData.username, tankData._id))
        .set(...regularAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBe(tankData._id);
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await TankModel.findById(body.id);
      expect(saved).not.toBeNull();
      expect(saved?.toJSON()).toEqual({
        ...options,
        __v: 0,
        _id: body.id,
        user: RegularUserId,
      });
    });

    it('will allow admins to update a tank profile for another user', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Steel,
        name: 'Updated Awesome Tank',
        volume: 20.3,
        workingPressure: 99.9,
      };

      const { body } = await request(server)
        .put(tankUrl(RegularUserData.username, tankData._id))
        .set(...adminAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBe(tankData._id);
      expect(body).toEqual({
        ...options,
        id: body.id,
        isSystem: false,
      });

      const saved = await TankModel.findById(body.id);
      expect(saved).not.toBeNull();
      expect(saved?.toJSON()).toEqual({
        ...options,
        __v: 0,
        _id: body.id,
        user: RegularUserId,
      });
    });

    it('will return a 400 response if the tank parameters are invalid', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .put(tankUrl(RegularUserData.username, tankData._id))
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
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .put(tankUrl(RegularUserData.username, tankData._id))
        .set(...regularAuthHeader)
        .send({})
        .expect(400);
    });

    it('will return a 401 response if the user is not logged in', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .put(tankUrl(RegularUserData.username, tankData._id))
        .send({
          material: TankMaterial.Steel,
          name: 'My Tank',
          volume: 14.5,
          workingPressure: 219,
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and attempts to update a tank profile for another user', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = AdminUserId;
      await tankData.save();

      await request(server)
        .put(tankUrl(AdminUserData.username, tankData._id))
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
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .put(tankUrl('Not.A.User', tankData._id))
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
        .put(tankUrl(RegularUserData.username, faker.datatype.uuid()))
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
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .delete(tankUrl(RegularUserData.username, tankData._id))
        .set(...regularAuthHeader)
        .expect(204);

      const saved = await TankModel.findById(tankData._id);
      expect(saved).toBeNull();
    });

    it('will allow admins to delete a tank profile for another user', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .delete(tankUrl(RegularUserData.username, tankData._id))
        .set(...adminAuthHeader)
        .expect(204);

      const saved = await TankModel.findById(tankData._id);
      expect(saved).toBeNull();
    });

    it('will return a 401 response if the user is not logged in', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .delete(tankUrl(RegularUserData.username, tankData._id))
        .expect(401);
    });

    it('will return a 403 response if the user is not an administrator and attempts to delete a tank profile for another user', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = AdminUserId;
      await tankData.save();

      await request(server)
        .delete(tankUrl(AdminUserData.username, tankData._id))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      const tankData = new TankModel(TestTankData[0]);
      tankData.user = RegularUserId;
      await tankData.save();

      await request(server)
        .delete(tankUrl('Not.A.User', tankData._id))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the tank does not exist', async () => {
      await request(server)
        .delete(tankUrl(RegularUserData.username, faker.datatype.uuid()))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
