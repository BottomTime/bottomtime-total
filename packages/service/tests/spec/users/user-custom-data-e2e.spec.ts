import { UserRole } from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Server } from 'http';
import request from 'supertest';
import { Repository } from 'typeorm';

import { UserEntity, UserJsonDataEntity } from '../../../src/data';
import { UsersModule } from '../../../src/users';
import { UserCustomDataController } from '../../../src/users/user-custom-data.controller';
import { UserCustomDataService } from '../../../src/users/user-custom-data.service';
import { dataSource } from '../../data-source';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';

const TestUsers: Partial<UserEntity>[] = [
  {
    id: 'd412ed9f-5e94-4a25-ab8e-f49f02b41cc1',
    username: 'DonkeyKong33',
    usernameLowered: 'donkeykong33',
  },
  {
    id: 'cb49edc8-be04-47dc-aefd-fc15642efbe1',
    username: 'AndyAdmin',
    usernameLowered: 'andyadmin',
    role: UserRole.Admin,
  },
  {
    id: '67cb7b6f-d0d9-4ae3-8f8a-c64ec27f69f6',
    username: 'SallyStaff',
    usernameLowered: 'sallystaff',
  },
];

const TestKeys = ['frontEndSettings', 'voodo', 'rando'];
const TestData = [
  {
    acceptedCookies: true,
    preferences: {
      theme: 'dark',
      language: 'en',
    },
  },
  {
    favouritePizza: 'pepperoni',
    favouriteNumber: 42,
    bestFloofs: ['Suzy'],
  },
  {
    age: 23,
    hasRebreather: true,
    favouriteGas: 'oxygen',
  },
];

function getUrl(key?: string, username?: string) {
  let url = `/api/users/${username || TestUsers[0].username}/customData`;
  if (key) url = `${url}/${key}`;
  return url;
}

describe('User custom data E2E tests', () => {
  let app: INestApplication;
  let server: Server;

  let Users: Repository<UserEntity>;
  let JsonData: Repository<UserJsonDataEntity>;

  let user: UserEntity;
  let adminUser: UserEntity;
  let otherUser: UserEntity;
  let dataEntries: UserJsonDataEntity[];

  let authToken: [string, string];
  let adminAuthToken: [string, string];
  let otherAuthToken: [string, string];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    JsonData = dataSource.getRepository(UserJsonDataEntity);

    user = createTestUser(TestUsers[0]);
    adminUser = createTestUser(TestUsers[1]);
    otherUser = createTestUser(TestUsers[2]);

    authToken = await createAuthHeader(user.id);
    adminAuthToken = await createAuthHeader(adminUser.id);
    otherAuthToken = await createAuthHeader(otherUser.id);

    app = await createTestApp({
      imports: [TypeOrmModule.forFeature([UserJsonDataEntity]), UsersModule],
      providers: [UserCustomDataService],
      controllers: [UserCustomDataController],
    });
    server = app.getHttpServer();
    await app.init();
  });

  beforeEach(async () => {
    dataEntries = [
      {
        id: '6c6dc554-b6c1-4545-8033-4fdd1552b8a7',
        user,
        key: TestKeys[0],
        value: JSON.stringify(TestData[0]),
      },
      {
        id: '85cea415-6056-47e4-96a3-fef4bbe5e525',
        user,
        key: TestKeys[1],
        value: JSON.stringify(TestData[1]),
      },
      {
        id: '4cfe4e83-72fd-4264-8ce5-e6f4d0a66f9f',
        user,
        key: TestKeys[2],
        value: JSON.stringify(TestData[2]),
      },
    ];

    await Users.save([user, adminUser, otherUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing keys', () => {
    it('will return an array of keys', async () => {
      await JsonData.save(dataEntries);
      const { body } = await request(server)
        .get(getUrl())
        .set(...authToken)
        .expect(200);
      expect(body).toEqual(TestKeys.sort((a, b) => a.localeCompare(b)));
    });

    it('will allow an admin to list keys for another user', async () => {
      await JsonData.save(dataEntries);
      const { body } = await request(server)
        .get(getUrl())
        .set(...adminAuthToken)
        .expect(200);
      expect(body).toEqual(TestKeys.sort((a, b) => a.localeCompare(b)));
    });

    it('will return an empty array if there are no keys assigned to the user', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...authToken)
        .expect(200);
      expect(body).toEqual([]);
    });

    it('will return a 401 if the user is not authenticated', async () => {
      await JsonData.save(dataEntries);
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 if the user is not authorized', async () => {
      await JsonData.save(dataEntries);
      await request(server)
        .get(getUrl())
        .set(...otherAuthToken)
        .expect(403);
    });

    it('will return a 404 if the user does not exist', async () => {
      await JsonData.save(dataEntries);
      await request(server)
        .get(getUrl(undefined, 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });
  });

  describe('when retrieving a single item', () => {
    it('will retrieve an item', async () => {
      await JsonData.save(dataEntries);
      const { body } = await request(server)
        .get(getUrl(TestKeys[1]))
        .set(...authToken)
        .expect(200);
      expect(body).toEqual(TestData[1]);
    });

    it("will allow an admin to retrieve a user's item", async () => {
      await JsonData.save(dataEntries);
      const { body } = await request(server)
        .get(getUrl(TestKeys[1]))
        .set(...adminAuthToken)
        .expect(200);
      expect(body).toEqual(TestData[1]);
    });

    it('will return a 401 if the user is not authenticated', async () => {
      await JsonData.save(dataEntries);
      await request(server).get(getUrl(TestKeys[1])).expect(401);
    });

    it('will return a 403 if the user is not authorized', async () => {
      await JsonData.save(dataEntries);
      await request(server)
        .get(getUrl(TestKeys[1]))
        .set(...otherAuthToken)
        .expect(403);
    });

    it('will return a 404 if the user does not exist', async () => {
      await JsonData.save(dataEntries);
      await request(server)
        .get(getUrl(TestKeys[1], 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 if the key does not exist', async () => {
      await request(server)
        .get(getUrl('no_such_key'))
        .set(...adminAuthToken)
        .expect(404);
    });
  });

  describe('when setting an item', () => {
    it('will set a new item', async () => {
      const key = 'newData';
      const newData = {
        favouritePizza: 'pepperoni',
        favouriteNumber: 42,
        bestFloofs: ['Suzy'],
      };
      const { body } = await request(server)
        .put(getUrl(key))
        .set(...authToken)
        .send(newData)
        .expect(200);

      const item = await JsonData.findOneByOrFail({
        key,
        user: { id: user.id },
      });
      expect(JSON.parse(item?.value)).toEqual(newData);
      expect(body).toEqual(newData);
    });

    it('will update an existing item', async () => {
      const key = TestKeys[1];
      const newData = {
        lastUpdated: '2021-09-01T12:00:00Z',
        owner: 'jim',
      };
      await JsonData.save(dataEntries);
      const { body } = await request(server)
        .put(getUrl(key))
        .set(...authToken)
        .send(newData)
        .expect(200);

      const item = await JsonData.findOneByOrFail({
        key,
        user: { id: user.id },
      });
      expect(JSON.parse(item.value)).toEqual(newData);
      expect(body).toEqual(newData);
    });

    it('will allow an admin to set an item for another user', async () => {
      const key = 'newData';
      const newData = {
        favouritePizza: 'pepperoni',
        favouriteNumber: 42,
        bestFloofs: ['Suzy'],
      };
      const { body } = await request(server)
        .put(getUrl(key))
        .set(...adminAuthToken)
        .send(newData)
        .expect(200);

      const item = await JsonData.findOneByOrFail({
        key,
        user: { id: user.id },
      });
      expect(JSON.parse(item?.value)).toEqual(newData);
      expect(body).toEqual(newData);
    });

    it('will allow an admin to update an item for another user', async () => {
      const key = TestKeys[1];
      const newData = {
        lastUpdated: '2021-09-01T12:00:00Z',
        owner: 'jim',
      };
      await JsonData.save(dataEntries);
      const { body } = await request(server)
        .put(getUrl(key))
        .set(...authToken)
        .send(newData)
        .expect(200);

      const item = await JsonData.findOneByOrFail({
        key,
        user: { id: user.id },
      });
      expect(JSON.parse(item.value)).toEqual(newData);
      expect(body).toEqual(newData);
    });

    it('will return a 401 if the user is not authenticated', async () => {
      const key = 'newData';
      const newData = {
        favouritePizza: 'pepperoni',
        favouriteNumber: 42,
        bestFloofs: ['Suzy'],
      };
      await request(server).put(getUrl(key)).send(newData).expect(401);
    });

    it('will return a 403 if the user is not authorized', async () => {
      const key = 'newData';
      const newData = {
        favouritePizza: 'pepperoni',
        favouriteNumber: 42,
        bestFloofs: ['Suzy'],
      };
      await request(server)
        .put(getUrl(key))
        .set(...otherAuthToken)
        .send(newData)
        .expect(403);
    });

    it('will return a 404 if the user does not exist', async () => {
      const key = 'newData';
      const newData = {
        favouritePizza: 'pepperoni',
        favouriteNumber: 42,
        bestFloofs: ['Suzy'],
      };
      await request(server)
        .put(getUrl(key, 'no_such_user'))
        .set(...adminAuthToken)
        .send(newData)
        .expect(404);
    });
  });

  describe('when deleting an item', () => {
    beforeEach(async () => {
      await JsonData.save(dataEntries);
    });

    it('will delete an item', async () => {
      await request(server)
        .delete(getUrl(TestKeys[1]))
        .set(...authToken)
        .expect(204);

      await expect(
        JsonData.findOneBy({
          key: TestKeys[1],
          user: { id: user.id },
        }),
      ).resolves.toBeNull();
    });

    it('will allow an admin to delete an item for another user', async () => {
      await request(server)
        .delete(getUrl(TestKeys[1]))
        .set(...adminAuthToken)
        .expect(204);

      await expect(
        JsonData.findOneBy({
          key: TestKeys[1],
          user: { id: user.id },
        }),
      ).resolves.toBeNull();
    });

    it('will return a 401 if the user is not authenticated', async () => {
      await request(server).delete(getUrl(TestKeys[1])).expect(401);
    });

    it('will return a 403 if the user is not authorized', async () => {
      await request(server)
        .delete(getUrl(TestKeys[1]))
        .set(...otherAuthToken)
        .expect(403);
    });

    it('will return a 404 if the user does not exist', async () => {
      await request(server)
        .delete(getUrl(TestKeys[1], 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 if the key does not exist', async () => {
      await request(server)
        .delete(getUrl('no_such_key'))
        .set(...adminAuthToken)
        .expect(404);
    });
  });
});
