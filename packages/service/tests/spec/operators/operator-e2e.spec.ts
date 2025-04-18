import {
  CreateOrUpdateOperatorDTO,
  LogBookSharing,
  OperatorDTO,
  UserRole,
  VerificationStatus,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { OperatorFactory } from '../../../src/operators';
import { OperatorsController } from '../../../src/operators/operators.controller';
import { OperatorsService } from '../../../src/operators/operators.service';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestData from '../../fixtures/operators.json';
import Owners from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestOperator,
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
  memberSince: new Date('2024-07-31T13:00:45Z'),
  username: 'Jane.Other',
  usernameLowered: 'jane.other',
  avatar: 'https://example.com/avatar.png',
  location: 'Vancouver, BC',
  logBookSharing: LogBookSharing.Public,
  name: 'Jane Other',
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

describe('Operators E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Operators: Repository<OperatorEntity>;
  let Users: Repository<UserEntity>;
  let regularUser: UserEntity;
  let otherUser: UserEntity;
  let adminUser: UserEntity;
  let regularUserAuthHeader: [string, string];
  let otherUserAuthHeader: [string, string];
  let adminUserAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          OperatorEntity,
          OperatorDiveSiteEntity,
          OperatorReviewEntity,
          OperatorTeamMemberEntity,
          UserEntity,
        ]),
        UsersModule,
        DiveSitesModule,
      ],
      providers: [OperatorsService, OperatorFactory],
      controllers: [OperatorsController],
    });
    server = app.getHttpServer();

    regularUserAuthHeader = await createAuthHeader(RegularUserId);
    otherUserAuthHeader = await createAuthHeader(OtherUserId);
    adminUserAuthHeader = await createAuthHeader(AdminUserId);

    Operators = dataSource.getRepository(OperatorEntity);
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
    let testData: OperatorEntity[];

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
      expect(body.totalCount).toBe(testData.filter((op) => op.active).length);
      expect(body.data).toHaveLength(50);
      expect(body.data[0]).toMatchSnapshot();
      expect(body.data.map((op: OperatorDTO) => op.name)).toMatchSnapshot();
    });

    it('will perform a more complex search with query parameters', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({
          query: 'Pioneer',
          location: '18.16,-75.88',
          radius: 100,
          skip: 0,
          limit: 10,
        })
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return an empty result set if no operators match the search criteria', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({ query: 'will not match' })
        .expect(200);
      expect(body).toEqual({
        data: [],
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
      const options: CreateOrUpdateOperatorDTO = {
        active: true,
        name: 'Groundhog Divers',
        description: 'A sweet dive shop!',
        address: '111 Street St, Toronto, ON',
        slug: 'groundhog-divers',
        socials: {},
      };
      const { body } = await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send(options)
        .expect(201);

      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.slug).toBe('groundhog-divers');
      expect(body.verificationStatus).toBe(VerificationStatus.Unverified);
      expect(body.verificationMessage).toBeUndefined();
      expect(new Date(body.createdAt).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.createdAt).toEqual(new Date(body.createdAt));
      expect(saved.updatedAt).toEqual(new Date(body.updatedAt));
      expect(saved.name).toBe(options.name);
      expect(saved.verificationStatus).toBe(VerificationStatus.Unverified);
      expect(saved.verificationMessage).toBeNull();
    });

    it('will create a new dive operator with all options', async () => {
      const options: CreateOrUpdateOperatorDTO = {
        active: false,
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
          youtube: 'groundhogdivers',
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
      expect(body.verificationStatus).toBe(VerificationStatus.Unverified);
      expect(body.verificationMessage).toBeUndefined();
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
      expect(saved.youtube).toEqual(options.socials!.youtube);
      expect(saved.website).toBe(options.website);
      expect(saved.slug).toBe(options.slug);
      expect(saved.verificationStatus).toBe(VerificationStatus.Unverified);
      expect(saved.verificationMessage).toBeNull();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send({
          active: 'sure',
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
      const existing = new OperatorEntity();
      existing.active = true;
      existing.id = '898ae1ca-87ae-4d4b-8803-01aaaf1dceec';
      existing.name = 'Other Operator';
      existing.slug = 'groundhog-divers';
      existing.description = 'A new dive shop';
      existing.address = '123 Street St.';
      existing.owner = regularUser;
      await Operators.save(existing);

      await request(server)
        .post(getUrl())
        .set(...regularUserAuthHeader)
        .send({
          active: true,
          name: 'Groundhog Divers',
          slug: existing.slug,
          description: 'Updaded description',
          address: existing.address,
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

    it('will not return verification message to anonymous users', async () => {
      const owner = parseUserJSON(Owners[0]);
      const operator = createTestOperator(owner, {
        verificationMessage: 'This is a test message',
      });
      await Users.save(owner);
      await Operators.save(operator);

      const { body } = await request(server)
        .get(getUrl(operator.slug))
        .expect(200);
      expect(body.verificationMessage).toBeUndefined();
    });

    it('will not return verification message to users who do not own the operator', async () => {
      const owner = parseUserJSON(Owners[0]);
      const operator = createTestOperator(owner, {
        verificationMessage: 'Another test message!',
      });
      await Users.save(owner);
      await Operators.save(operator);

      const { body } = await request(server)
        .get(getUrl(operator.slug))
        .set(...otherUserAuthHeader)
        .expect(200);
      expect(body.verificationMessage).toBeUndefined();
    });

    it('will return the verification message to operator owners', async () => {
      const operator = createTestOperator(regularUser, {
        verificationMessage: 'Another sweet message!',
      });
      await Users.save(regularUser);
      await Operators.save(operator);

      const { body } = await request(server)
        .get(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .expect(200);
      expect(body.verificationMessage).toBe(operator.verificationMessage);
    });

    it('will return the verification message to admin users', async () => {
      const operator = createTestOperator(regularUser, {
        verificationMessage: 'Ok! One more message!',
      });
      await Users.save(regularUser);
      await Operators.save(operator);

      const { body } = await request(server)
        .get(getUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .expect(200);
      expect(body.verificationMessage).toBe(operator.verificationMessage);
    });

    it('will return a 404 response if the operator key cannot be found', async () => {
      await request(server).get(getUrl('not-a-real-operator')).expect(404);
    });
  });

  describe('when updating a dive operator', () => {
    let operator: OperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Users.save(regularUser);
      await Operators.save(operator);
    });

    it('will allow a user to update an existing dive operator', async () => {
      const options: CreateOrUpdateOperatorDTO = {
        active: false,
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
          youtube: 'groundhogdivers',
        },
        slug: 'groundhogdivers',
        website: 'https://groundhogdivers.ca',
      };

      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send(options)
        .expect(200);

      expect(body.active).toBe(false);
      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.email).toBe(options.email);
      expect(body.gps).toEqual(options.gps);
      expect(body.phone).toBe(options.phone);
      expect(body.socials).toEqual(options.socials);
      expect(body.website).toBe(options.website);
      expect(body.slug).toBe(options.slug);
      expect(body.verificationStatus).toBe(operator.verificationStatus);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.active).toBe(false);
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
      expect(saved.youtube).toEqual(options.socials!.youtube);
      expect(saved.website).toBe(options.website);
      expect(saved.slug).toBe(options.slug);
      expect(saved.verificationStatus).toBe(operator.verificationStatus);
    });

    it('will allow an admin to update an existing dive operator', async () => {
      const options: CreateOrUpdateOperatorDTO = {
        active: false,
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
          youtube: 'groundhogdivers',
        },
        slug: 'groundhogdivers',
        website: 'https://groundhogdivers.ca',
      };

      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .send(options)
        .expect(200);

      expect(body.active).toBe(false);
      expect(body.id).toHaveLength(36);
      expect(body.name).toBe(options.name);
      expect(body.description).toBe(options.description);
      expect(body.email).toBe(options.email);
      expect(body.gps).toEqual(options.gps);
      expect(body.phone).toBe(options.phone);
      expect(body.socials).toEqual(options.socials);
      expect(body.website).toBe(options.website);
      expect(body.slug).toBe(options.slug);
      expect(body.verificationStatus).toBe(operator.verificationStatus);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Operators.findOneByOrFail({ id: body.id });
      expect(saved.active).toBe(false);
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
      expect(saved.youtube).toEqual(options.socials!.youtube);
      expect(saved.website).toBe(options.website);
      expect(saved.slug).toBe(options.slug);
      expect(saved.verificationStatus).toBe(operator.verificationStatus);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({
          active: true,
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
      const existing = new OperatorEntity();
      existing.id = '898ae1ca-87ae-4d4b-8803-01aaaf1dceec';
      existing.name = 'Other Operator';
      existing.slug = 'taken-slug';
      existing.owner = regularUser;
      await Operators.save(existing);

      await request(server)
        .put(getUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({
          active: true,
          name: 'Groundhog Divers',
          slug: 'taken-slug',
          description: 'New description',
          address: '666 Funtime Lane',
        })
        .expect(409);
    });
  });

  describe('when deleting a dive operator', () => {
    let operator: OperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Users.save(regularUser);
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
    let operator: OperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Operators.save(operator);
    });

    it('will allow the operator owner to transfer ownership', async () => {
      const { body } = await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...regularUserAuthHeader)
        .send({ newOwner: otherUser.username })
        .expect(200);

      const saved = await Operators.findOneOrFail({
        where: { id: operator.id },
        relations: ['owner'],
      });
      expect(saved.owner!.id).toBe(otherUser.id);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
      expect({
        ...body,
        updatedAt: new Date(0),
      }).toMatchSnapshot();
    });

    it('will allow an admin to transfer ownership', async () => {
      const { body } = await request(server)
        .post(getTransferUrl(operator.slug))
        .set(...adminUserAuthHeader)
        .send({ newOwner: otherUser.username })
        .expect(200);

      const saved = await Operators.findOneOrFail({
        where: { id: operator.id },
        relations: ['owner'],
      });
      expect(saved.owner!.id).toBe(otherUser.id);
      expect(new Date(body.updatedAt).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
      expect({
        ...body,
        updatedAt: new Date(0),
      }).toMatchSnapshot();
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

  describe('when requesting verification for a dive operator', () => {
    let operator: OperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Users.save(regularUser);
      await Operators.save(operator);
    });

    it('will allow operator owners to request verification', async () => {
      const operator = parseOperatorJSON(TestData[0], regularUser);
      await Operators.save(operator);

      await request(server)
        .post(`${getUrl(operator.slug)}/requestVerification`)
        .set(...regularUserAuthHeader)
        .expect(204);

      const saved = await Operators.findOneByOrFail({ id: operator.id });
      expect(saved.verificationStatus).toBe(VerificationStatus.Pending);
    });

    it('will allow admins to request verification', async () => {
      await request(server)
        .post(`${getUrl(operator.slug)}/requestVerification`)
        .set(...adminUserAuthHeader)
        .expect(204);

      const saved = await Operators.findOneByOrFail({ id: operator.id });
      expect(saved.verificationStatus).toBe(VerificationStatus.Pending);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(`${getUrl(operator.slug)}/requestVerification`)
        .expect(401);
    });

    it('will return a 403 response if the user is not the operator owner', async () => {
      await request(server)
        .post(`${getUrl(operator.slug)}/requestVerification`)
        .set(...otherUserAuthHeader)
        .expect(403);
    });

    it('will return a 404 response when the operator key cannot be found', async () => {
      await request(server)
        .post(`${getUrl('not-a-real-operator')}/requestVerification`)
        .set(...adminUserAuthHeader)
        .expect(404);
    });
  });

  describe('when verifying/unverifying a dive operator', () => {
    let operator: OperatorEntity;

    beforeEach(async () => {
      operator = parseOperatorJSON(TestData[0], regularUser);
      await Operators.save(operator);
    });

    [false, true].forEach((verified) => {
      it(`will ${
        verified ? 'verify' : 'unverify'
      } a dive operator`, async () => {
        const message = 'Omg! A message!!';

        operator.verificationStatus = VerificationStatus.Pending;
        await Operators.save(operator);

        await request(server)
          .post(getVerifyUrl(operator.slug))
          .set(...adminUserAuthHeader)
          .send({
            verified,
            message,
          })
          .expect(204);

        const saved = await Operators.findOneByOrFail({ id: operator.id });
        expect(saved.verificationStatus).toBe(
          verified ? VerificationStatus.Verified : VerificationStatus.Rejected,
        );
        expect(saved.verificationMessage).toBe(message);
      });

      it(`will update message if the dive operator is already ${
        verified ? 'verified' : 'unverified'
      }`, async () => {
        const message = 'Updated message!';

        operator.verificationStatus = verified
          ? VerificationStatus.Verified
          : VerificationStatus.Rejected;
        await Operators.save(operator);

        await request(server)
          .post(getVerifyUrl(operator.slug))
          .set(...adminUserAuthHeader)
          .send({
            verified,
            message,
          })
          .expect(204);

        const saved = await Operators.findOneByOrFail({ id: operator.id });
        expect(saved.verificationStatus).toBe(
          verified ? VerificationStatus.Verified : VerificationStatus.Rejected,
        );
        expect(saved.verificationMessage).toBe(message);
      });

      it(`will clear message if necessary when status is ${
        verified ? 'verified' : 'unverified'
      }`, async () => {
        operator.verificationStatus = verified
          ? VerificationStatus.Verified
          : VerificationStatus.Rejected;
        await Operators.save(operator);

        await request(server)
          .post(getVerifyUrl(operator.slug))
          .set(...adminUserAuthHeader)
          .send({
            verified,
          })
          .expect(204);

        const saved = await Operators.findOneByOrFail({ id: operator.id });
        expect(saved.verificationStatus).toBe(
          verified ? VerificationStatus.Verified : VerificationStatus.Rejected,
        );
        expect(saved.verificationMessage).toBeNull();
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
