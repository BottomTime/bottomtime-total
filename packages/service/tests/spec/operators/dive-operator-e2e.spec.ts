import {
  CreateOrUpdateDiveOperatorDTO,
  LogBookSharing,
  UserRole,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { DiveOperatorEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestData from '../../fixtures/operators.json';
import Owners from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseOperatorJSON,
  parseUserJSON,
} from '../../utils';

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  role: UserRole.User,
  memberSince: new Date(),
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  avatar: 'https://example.com/avatar.png',
  location: 'Seattle, WA',
  logBookSharing: LogBookSharing.FriendsOnly,
  name: 'Joe Regular',
};

const OtherUserId = 'ca5f6ec9-b9a5-4e9a-8a34-9c27a44d94f8';
const OtherUserData: Partial<UserEntity> = {
  id: OtherUserId,
  role: UserRole.User,
};

const AdminUserId = '8e8027d0-4b04-405c-9a3d-d2e135bb4020';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  role: UserRole.Admin,
};

function getUrl(key?: string): string {
  return `/api/operators${key ? `/${key}` : ''}`;
}

function getTransferUrl(key: string): string {
  return `${getUrl(key)}/transfer`;
}

function getVerifyUrl(key: string): string {
  return `${getUrl(key)}/verify`;
}

describe('Dive Operators E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Operators: Repository<DiveOperatorEntity>;
  let Users: Repository<UserEntity>;
  let regularUser: UserEntity;
  let otherUser: UserEntity;
  let adminUser: UserEntity;
  let regularUserAuthHeader: [string, string];
  let otherUserAuthHeader: [string, string];
  let adminUserAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    regularUserAuthHeader = await createAuthHeader(RegularUserId);
    otherUserAuthHeader = await createAuthHeader(OtherUserId);
    adminUserAuthHeader = await createAuthHeader(AdminUserId);

    Operators = dataSource.getRepository(DiveOperatorEntity);
    Users = dataSource.getRepository(UserEntity);
  });

  beforeEach(async () => {
    regularUser = createTestUser(RegularUserData);
    otherUser = createTestUser(OtherUserData);
    adminUser = createTestUser(AdminUserData);
    await Users.save([regularUser, otherUser, adminUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching dive operators', () => {
    let owners: UserEntity[];
    let testData: DiveOperatorEntity[];

    beforeAll(() => {
      owners = Owners.slice(0, 80).map((o) => parseUserJSON(o));
      testData = TestData.map((op, index) =>
        parseOperatorJSON(op, owners[index % owners.length]),
      );
    });

    beforeEach(async () => {
      await Users.save(owners);
      await Operators.save(testData);
    });

    it('will perform a basic search with default parameters', async () => {
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body.totalCount).toBe(testData.length);
      expect(body.operators).toHaveLength(50);
      expect(body.operators[0]).toMatchSnapshot();
      expect(body.operators.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a more complex search with query parameters', async () => {
      const { body } = await request(server).get(getUrl()).query({
        query: 'Wafer',
        location: '-14.7605,54.6887',
        radius: 450,
        skip: 0,
        limit: 10,
      });
      expect(body).toMatchSnapshot();
    });

    it('will return an empty result set if no operators match the search criteria', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({ query: 'will not match' })
        .expect(200);
      expect(body).toEqual({
        operators: [],
        totalCount: 0,
      });
    });

    it('will return a 400 response if the query string is invalid', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({
          query: 33,
          location: 'north of my house',
          radius: '14km',
          skip: -1,
          limit: 80000,
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });
  });

  describe('when creating a new dive operator', () => {
    it('will create a new dive operator with minimal options', async () => {
      const options: CreateOrUpdateDiveOperatorDTO = {
        name: 'Groundhog Divers',
      };
      const { body } = await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.slug).toBe('groundhog-divers');
      expect(body.verified).toBe(false);
      expect(new Date(body.createdAt).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.createdAt).toEqual(new Date(body.createdAt));
      expect(saved.updatedAt).toEqual(new Date(body.updatedAt));
      expect(saved.name).toBe(options.name);
      expect(saved.verified).toBe(false);
    });

    it('will create a new dive operator with all options', async () => {
      const options: CreateOrUpdateDiveOperatorDTO = {
        name: 'Groundhog Divers',
        address: '123 Main St',
        description: 'We dive deep',
        email: 'info@groundhogdivers.ca',
        gps: {
          lat: 33.1234,
          lon: -122.4567,
        },
        phone: '555-555-5555',
        socials: {
          facebook: 'groundhogdivers',
          instagram: 'groundhogdivers',
          twitter: 'groundhogdivers',
          tiktok: '@groundhogdivers',
        },
        slug: 'groundhogdivers',
        website: 'https://groundhogdivers.ca',
      };

      const { body } = await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.email).toBe(options.email);
      expect(body.gps).toEqual(options.gps);
      expect(body.phone).toBe(options.phone);
      expect(body.socials).toEqual(options.socials);
      expect(body.website).toBe(options.website);
      expect(body.slug).toBe(options.slug);
      expect(body.verified).toBe(false);
      expect(new Date(body.createdAt).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.createdAt).toEqual(new Date(body.createdAt));
      expect(saved.updatedAt).toEqual(new Date(body.updatedAt));
      expect(saved.name).toBe(options.name);
      expect(saved.description).toBe(options.description);
      expect(saved.email).toBe(options.email);
      expect(saved.gps).toEqual({
        type: 'Point',
        coordinates: [options.gps!.lon, options.gps!.lat],
      });
      expect(saved.phone).toBe(options.phone);
      expect(saved.facebook).toEqual(options.socials!.facebook);
      expect(saved.instagram).toEqual(options.socials!.instagram);
      expect(saved.twitter).toEqual(options.socials!.twitter);
      expect(saved.tiktok).toEqual(options.socials!.tiktok);
      expect(saved.website).toBe(options.website);
      expect(saved.slug).toBe(options.slug);
      expect(saved.verified).toBe(false);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send({
          name: 33,
          description: false,
          address: 44,
          phone: true,
          email: 'not an email',
          website: 'not a url',
          gps: {
            lat: 'north',
            lon: 'east',
          },
          socials: {
            facebook: 33,
            instagram: false,
            twitter: 44,
            tiktok: true,
          },
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl())
        .send({
          name: 'Groundhog Divers',
        })
        .expect(401);
    });

    it('will return a 409 response if the slug is already in use', async () => {
      const existing = new DiveOperatorEntity();
      existing.id = '898ae1ca-87ae-4d4b-8803-01aaaf1dceec';
      existing.name = 'Other Operator';
      existing.slug = 'groundhog-divers';
      existing.owner = regularUser;
      await Operators.save(existing);

      await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send({
          name: 'Groundhog Divers',
        })
        .expect(409);
    });
  });

  describe('when retrieving a single dive operator', () => {
    it('will retrieve the indicated dive operator', async () => {
      const owner = parseUserJSON(Owners[0]);
      const operator = parseOperatorJSON(TestData[0], owner);
      await Users.save(owner);
      await Operators.save(operator);

      const { body } = await request(server)
        .get(getUrl(operator.slug.toUpperCase()))
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the operator key cannot be found', async () => {
      await request(server).get(getUrl('not-a-real-operator')).expect(404);
    });
  });

  describe('when updating a dive operator', () => {
    let operator: DiveOperatorEntity;

    beforeAll(() => {
      operator = parseOperatorJSON(TestData[0], regularUser);
    });

    beforeEach(async () => {
      await Operators.save(operator);
    });

    it('will allow a user to update an existing dive operator', async () => {
      const options: CreateOrUpdateDiveOperatorDTO = {
        name: 'Groundhog Divers',
        address: '123 Main St',
        description: 'We dive deep',
        email: 'info@groundhogdivers.ca',
        gps: {
          lat: 33.1234,
          lon: -122.4567,
        },
        phone: '555-555-5555',
        socials: {
          facebook: 'groundhogdivers',
          instagram: 'groundhogdivers',
          twitter: 'groundhogdivers',
          tiktok: '@groundhogdivers',
        },
        slug: 'groundhogdivers',
        website: 'https://groundhogdivers.ca',
      };

      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.email).toBe(options.email);
      expect(body.gps).toEqual(options.gps);
      expect(body.phone).toBe(options.phone);
      expect(body.socials).toEqual(options.socials);
      expect(body.website).toBe(options.website);
      expect(body.slug).toBe(options.slug);
      expect(body.verified).toBe(false);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.updatedAt).toEqual(new Date(body.updatedAt));
      expect(saved.name).toBe(options.name);
      expect(saved.description).toBe(options.description);
      expect(saved.email).toBe(options.email);
      expect(saved.gps).toEqual({
        type: 'Point',
        coordinates: [options.gps!.lon, options.gps!.lat],
      });
      expect(saved.phone).toBe(options.phone);
      expect(saved.facebook).toEqual(options.socials!.facebook);
      expect(saved.instagram).toEqual(options.socials!.instagram);
      expect(saved.twitter).toEqual(options.socials!.twitter);
      expect(saved.tiktok).toEqual(options.socials!.tiktok);
      expect(saved.website).toBe(options.website);
      expect(saved.slug).toBe(options.slug);
      expect(saved.verified).toBe(false);
    });

    it('will allow an admin to update an existing dive operator', async () => {
      const options: CreateOrUpdateDiveOperatorDTO = {
        name: 'Groundhog Divers',
        address: '123 Main St',
        description: 'We dive deep',
        email: 'info@groundhogdivers.ca',
        gps: {
          lat: 33.1234,
          lon: -122.4567,
        },
        phone: '555-555-5555',
        socials: {
          facebook: 'groundhogdivers',
          instagram: 'groundhogdivers',
          twitter: 'groundhogdivers',
          tiktok: '@groundhogdivers',
        },
        slug: 'groundhogdivers',
        website: 'https://groundhogdivers.ca',
      };

      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.email).toBe(options.email);
      expect(body.gps).toEqual(options.gps);
      expect(body.phone).toBe(options.phone);
      expect(body.socials).toEqual(options.socials);
      expect(body.website).toBe(options.website);
      expect(body.slug).toBe(options.slug);
      expect(body.verified).toBe(false);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.updatedAt).toEqual(new Date(body.updatedAt));
      expect(saved.name).toBe(options.name);
      expect(saved.description).toBe(options.description);
      expect(saved.email).toBe(options.email);
      expect(saved.gps).toEqual({
        type: 'Point',
        coordinates: [options.gps!.lon, options.gps!.lat],
      });
      expect(saved.phone).toBe(options.phone);
      expect(saved.facebook).toEqual(options.socials!.facebook);
      expect(saved.instagram).toEqual(options.socials!.instagram);
      expect(saved.twitter).toEqual(options.socials!.twitter);
      expect(saved.tiktok).toEqual(options.socials!.tiktok);
      expect(saved.website).toBe(options.website);
      expect(saved.slug).toBe(options.slug);
      expect(saved.verified).toBe(false);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({
          name: 33,
          description: false,
          address: 44,
          phone: true,
          email: 'not an email',
          website: 'not a url',
          gps: {
            lat: 'north',
            lon: 'east',
          },
          socials: {
            facebook: 33,
            instagram: false,
            twitter: 44,
            tiktok: true,
          },
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      const operator = parseOperatorJSON(TestData[0], regularUser);
      await Operators.save(operator);

      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getUrl(operator.slug))
        .send({
          name: 'Groundhog Divers',
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not the operator owner or an admin', async () => {
      await request(server)
        .put(getUrl(operator.slug))
        .set(...otherUserAuthHeader)
        .send({
          name: 'Groundhog Divers',
        })
        .expect(403);
    });

    it('will return a 404 response if the operator key cannot be found', async () => {
      await request(server)
        .put(getUrl('not-a-real-operator'))
        .set(...adminUserAuthHeader)
        .send({
          name: 'Groundhog Divers',
        })
        .expect(404);
    });

    it('will return 409 response if the new slug is already in use', async () => {
      const existing = new DiveOperatorEntity();
      existing.id = '898ae1ca-87ae-4d4b-8803-01aaaf1dceec';
      existing.name = 'Other Operator';
      existing.slug = 'taken-slug';
      existing.owner = regularUser;
      await Operators.save(existing);

      await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({
          name: 'Groundhog Divers',
          slug: 'taken-slug',
        })
        .expect(409);
    });
  });

  describe('when deleting a dive operator', () => {
    let operator: DiveOperatorEntity;

    beforeAll(() => {
      operator = parseOperatorJSON(TestData[0], regularUser);
    });

    beforeEach(async () => {
      await Operators.save(operator);
    });

    it('will allow the operator owner to delete the operator', async () => {
      await request(server)
        .delete(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .expect(204);

      await expect(Operators.existsBy({ id: operator.id })).resolves.toBe(
        false,
      );
    });

    it('will allow an admin to delete an operator', async () => {
      await request(server)
        .delete(getUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .expect(204);

      await expect(Operators.existsBy({ id: operator.id })).resolves.toBe(
        false,
      );
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(operator.slug)).expect(401);
      await expect(Operators.existsBy({ id: operator.id })).resolves.toBe(true);
    });

    it('will return a 403 response if the user is not the operator owner or an admin', async () => {
      await request(server)
        .delete(getUrl(operator.slug))
        .set(...otherUserAuthHeader)
        .expect(403);
      await expect(Operators.existsBy({ id: operator.id })).resolves.toBe(true);
    });

    it('will return a 404 response if the operator key cannot be found', async () => {
      await request(server)
        .delete(getUrl('not-a-real-operator'))
        .set(...adminUserAuthHeader)
        .expect(404);
    });
  });

  describe('when transferring ownership of a dive operator', () => {
    let operator: DiveOperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Operators.save(operator);
    });

    it('will allow the operator owner to transfer ownership', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({ newOwner: otherUser.username })
        .expect(204);

      const saved = await Operators.findOneOrFail({
        where: { id: operator.id },
        relations: ['owner'],
      });
      expect(saved.owner!.id).toBe(otherUser.id);
    });

    it('will allow an admin to transfer ownership', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .send({ newOwner: otherUser.username })
        .expect(204);

      const saved = await Operators.findOneOrFail({
        where: { id: operator.id },
        relations: ['owner'],
      });
      expect(saved.owner!.id).toBe(otherUser.id);
    });

    it('will return a 400 response if the new owner is not a user', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({ newOwner: 'DefinitelyNotAUser' })
        .expect(400);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({ newOwner: 33 })
        .expect(400);
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .send({ newOwner: otherUser.username })
        .expect(401);
    });

    it('will return a 403 response if the user is not the operator owner or an admin', async () => {
      await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...otherUserAuthHeader)
        .send({ newOwner: otherUser.username })
        .expect(403);
    });

    it('will return a 404 response if the operator key cannot be found', async () => {
      await request(server)
        .post(getTransferUrl('not-a-real-operator'))
        .set(...adminUserAuthHeader)
        .send({ newOwner: otherUser.username })
        .expect(404);
    });
  });

  describe('when verifying/unverifying a dive operator', () => {
    let operator: DiveOperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Operators.save(operator);
    });

    [false, true].forEach((verified) => {
      it(`will ${
        verified ? 'verify' : 'unverify'
      } a dive operator`, async () => {
        operator.verified = !verified;
        await Operators.save(operator);

        await request(server)
          .post(getVerifyUrl(operator.slug))
          .set(...adminUserAuthHeader)
          .send({
            verified,
          })
          .expect(204);

        const saved = await Operators.findOneByOrFail({ id: operator.id });
        expect(saved.verified).toBe(verified);
      });

      it(`will perform a no-op if the dive operator is already ${
        verified ? 'verified' : 'unverified'
      }`, async () => {
        operator.verified = verified;
        await Operators.save(operator);

        await request(server)
          .post(getVerifyUrl(operator.slug))
          .set(...adminUserAuthHeader)
          .send({
            verified,
          })
          .expect(204);

        const saved = await Operators.findOneByOrFail({ id: operator.id });
        expect(saved.verified).toBe(verified);
      });
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .post(getVerifyUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .send({
          verified: 'sure',
        })
        .expect(400);
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .post(getVerifyUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .expect(400);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getVerifyUrl(operator.slug))
        .send({
          verified: true,
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not an admin', async () => {
      await request(server)
        .post(getVerifyUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({
          verified: true,
        })
        .expect(403);
    });

    it('will return a 404 response if the operator key cannot be found', async () => {
      await request(server)
        .post(getVerifyUrl('not-a-real-operator'))
        .set(...adminUserAuthHeader)
        .send({
          verified: true,
        })
        .expect(404);
    });
  });
});
