import {
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateOperatorReviewDTO,
  UserRole,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { LogEntriesService, LogEntryFactory } from '../../../src/logEntries';
import { LogEntryReviewsController } from '../../../src/logEntries/log-entry-reviews.controller';
import { OperatorsModule } from '../../../src/operators';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  createAuthHeader,
  createTestApp,
  createTestDiveSite,
  createTestLogEntry,
  createTestOperator,
  createTestUser,
} from '../../utils';

const Username = 'jack.mcdiverface';
const EntryId = '27c5fabf-6453-4f50-8c40-49b5f76b838a';

function getOperatorUrl(entryId?: string, username?: string): string {
  return `/api/users/${username || Username}/logbook/${
    entryId || EntryId
  }/reviewOperator`;
}

function getDiveSiteUrl(entryId?: string, username?: string): string {
  return `/api/users/${username || Username}/logbook/${
    entryId || EntryId
  }/reviewSite`;
}

describe('Log entry reviews E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let LogEntries: Repository<LogEntryEntity>;
  let OperatorReviews: Repository<OperatorReviewEntity>;
  let DiveSiteReviews: Repository<DiveSiteReviewEntity>;

  let users: UserEntity[];
  let admin: UserEntity;
  let operator: OperatorEntity;
  let logEntry: LogEntryEntity;
  let diveSite: DiveSiteEntity;

  let authHeader: [string, string];
  let otherAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          LogEntryEntity,
          LogEntryAirEntity,
          LogEntrySampleEntity,
          OperatorReviewEntity,
        ]),
        UsersModule,
        DiveSitesModule,
        OperatorsModule,
      ],
      providers: [LogEntriesService, LogEntryFactory],
      controllers: [LogEntryReviewsController],
    });
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    LogEntries = dataSource.getRepository(LogEntryEntity);
    OperatorReviews = dataSource.getRepository(OperatorReviewEntity);
    DiveSiteReviews = dataSource.getRepository(DiveSiteReviewEntity);

    users = Array.from({ length: 8 }, () => createTestUser());
    admin = createTestUser({ role: UserRole.Admin });
    operator = createTestOperator(users[1]);
    diveSite = createTestDiveSite(users[3]);
    logEntry = createTestLogEntry(users[0], { id: EntryId });

    logEntry.site = diveSite;
    logEntry.operator = operator;
    users[0].username = Username;
    users[0].usernameLowered = Username.toLowerCase();

    [authHeader, otherAuthHeader, adminAuthHeader] = await Promise.all([
      createAuthHeader(users[0].id),
      createAuthHeader(users[1].id),
      createAuthHeader(admin.id),
    ]);
  });

  beforeEach(async () => {
    await Users.save([...users, admin]);
    await Operators.save(operator);
    await DiveSites.save(diveSite);
    await LogEntries.save(logEntry);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when retrieving a review for an operator', () => {
    let review: OperatorReviewEntity;

    beforeAll(() => {
      review = {
        comments: 'W00T',
        createdAt: new Date(),
        creator: users[0],
        id: 'edce5581-bce3-4f09-914c-78d23028be07',
        logEntry,
        operator,
        rating: 3.213,
        updatedAt: new Date(),
      };
    });

    beforeEach(async () => {
      await OperatorReviews.save(review);
    });

    it('will retrieve the review if it exists', async () => {
      const { body } = await request(server)
        .get(getOperatorUrl())
        .set(...authHeader)
        .expect(200);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdAt).toBeCloseTo(review.createdAt.valueOf(), -3);
      expect(body.creator.username).toBe(Username);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getOperatorUrl()).expect(401);
    });

    it('will return a 403 response if the user is not the log entry owner', async () => {
      await request(server)
        .get(getOperatorUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the username is not found', async () => {
      await request(server)
        .get(getOperatorUrl(EntryId, 'not-a-user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry is not found', async () => {
      await request(server)
        .get(getOperatorUrl('15f46f35-0e22-4f19-a24a-feaf6be20b9d'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not have an operator', async () => {
      await LogEntries.update(logEntry.id, { operator: null });
      await request(server)
        .get(getOperatorUrl())
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the review does not exist', async () => {
      await OperatorReviews.delete(review.id);
      await request(server)
        .get(getOperatorUrl())
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when reviewing operator', () => {
    it('will submit a review for the operator', async () => {
      const review: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.11,
        comments: 'Great operator!',
      };
      const { body } = await request(server)
        .put(getOperatorUrl())
        .set(...authHeader)
        .send(review)
        .expect(200);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdAt).toBeCloseTo(Date.now(), -3);
      expect(body.creator.username).toBe(Username);

      const saved = await OperatorReviews.findOneByOrFail({
        creator: { id: users[0].id },
        logEntry: { id: logEntry.id },
        operator: { id: operator.id },
      });
      expect(saved.comments).toBe(review.comments);
      expect(saved.rating).toBe(review.rating);
      expect(saved.createdAt.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will allow an admin to submit a review for the operator', async () => {
      const review: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.11,
        comments: 'Great operator!',
      };
      const { body } = await request(server)
        .put(getOperatorUrl())
        .set(...adminAuthHeader)
        .send(review)
        .expect(200);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdAt).toBeCloseTo(Date.now(), -3);
      expect(body.creator.username).toBe(Username);

      const saved = await OperatorReviews.findOneByOrFail({
        creator: { id: users[0].id },
        logEntry: { id: logEntry.id },
        operator: { id: operator.id },
      });
      expect(saved.comments).toBe(review.comments);
      expect(saved.rating).toBe(review.rating);
      expect(saved.createdAt.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will update an existing review for the operator', async () => {
      const existingEntity: OperatorReviewEntity = {
        id: 'd0c1c2bc-c5e9-4b66-9a02-b5a19d50bb88',
        creator: users[0],
        comments: 'Old review',
        rating: 1.111,
        createdAt: new Date(),
        logEntry,
        operator,
        updatedAt: new Date(),
      };
      await OperatorReviews.save(existingEntity);

      const review: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.11,
        comments: 'Great operator!',
      };
      const { body } = await request(server)
        .put(getOperatorUrl())
        .set(...authHeader)
        .send(review)
        .expect(200);
      expect(body.id).toBe(existingEntity.id);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdAt).toBeCloseTo(Date.now(), -3);
      expect(body.creator.username).toBe(Username);

      const saved = await OperatorReviews.findOneByOrFail({
        creator: { id: users[0].id },
        logEntry: { id: logEntry.id },
        operator: { id: operator.id },
      });
      expect(saved.id).toBe(existingEntity.id);
      expect(saved.comments).toBe(review.comments);
      expect(saved.rating).toBe(review.rating);
      expect(saved.createdAt.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .put(getOperatorUrl())
        .set(...authHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getOperatorUrl())
        .set(...authHeader)
        .send({ rating: 6.66, comments: false })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getOperatorUrl())
        .send({ rating: 2.22 })
        .expect(401);
    });

    it('will return a 403 response if the user is not the log entry owner', async () => {
      await request(server)
        .put(getOperatorUrl())
        .set(...otherAuthHeader)
        .send({ rating: 2.22 })
        .expect(403);
    });

    it('will return a 404 response if the username is not found', async () => {
      await request(server)
        .put(getOperatorUrl(EntryId, 'not-a-user'))
        .set(...adminAuthHeader)
        .send({ rating: 2.22 })
        .expect(404);
    });

    it('will return a 404 response if the log entry is not found', async () => {
      await request(server)
        .put(getOperatorUrl('15f46f35-0e22-4f19-a24a-feaf6be20b9d'))
        .set(...adminAuthHeader)
        .send({ rating: 2.22 })
        .expect(404);
    });

    it('will return a 405 response if the log entry does not have an operator', async () => {
      await LogEntries.update(logEntry.id, { operator: null });
      await request(server)
        .put(getOperatorUrl())
        .set(...authHeader)
        .send({ rating: 2.22 })
        .expect(405);
    });
  });

  describe('when deleting an operator review', () => {
    let review: OperatorReviewEntity;

    beforeAll(() => {
      review = {
        comments: 'W00T',
        createdAt: new Date(),
        creator: users[0],
        id: 'edce5581-bce3-4f09-914c-78d23028be07',
        logEntry,
        operator,
        rating: 3.213,
        updatedAt: new Date(),
      };
    });

    beforeEach(async () => {
      await OperatorReviews.save(review);
    });

    it('will delete the review if it exists', async () => {
      await request(server)
        .delete(getOperatorUrl())
        .set(...authHeader)
        .expect(204);

      const saved = await OperatorReviews.findOneBy({ id: review.id });
      expect(saved).toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getOperatorUrl()).expect(401);
    });

    it('will return a 403 response if the user is not the log entry owner', async () => {
      await request(server)
        .delete(getOperatorUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the username is not found', async () => {
      await request(server)
        .delete(getOperatorUrl(EntryId, 'not-a-user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry is not found', async () => {
      await request(server)
        .delete(getOperatorUrl('15f46f35-0e22-4f19-a24a-feaf6be20b9d'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not have an operator', async () => {
      await LogEntries.update(logEntry.id, { operator: null });
      await request(server)
        .delete(getOperatorUrl())
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the review does not exist', async () => {
      await OperatorReviews.delete(review.id);
      await request(server)
        .delete(getOperatorUrl())
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when retrieving a review for a dive site', () => {
    let review: DiveSiteReviewEntity;

    beforeAll(() => {
      review = {
        comments: 'W00T',
        createdOn: new Date(),
        creator: users[0],
        id: 'edce5581-bce3-4f09-914c-78d23028be07',
        logEntry,
        site: diveSite,
        rating: 3.213,
        difficulty: 1.18,
        updatedOn: new Date(),
      };
    });

    beforeEach(async () => {
      await DiveSiteReviews.save(review);
    });

    it('will retrieve the review if it exists', async () => {
      const { body } = await request(server)
        .get(getDiveSiteUrl())
        .set(...authHeader)
        .expect(200);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.difficulty).toBe(review.difficulty);
      expect(body.createdOn).toBe(review.createdOn?.valueOf());
      expect(body.creator.username).toBe(Username);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getDiveSiteUrl()).expect(401);
    });

    it('will return a 403 response if the user is not the log entry owner', async () => {
      await request(server)
        .get(getDiveSiteUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the username is not found', async () => {
      await request(server)
        .get(getDiveSiteUrl(EntryId, 'not-a-user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry is not found', async () => {
      await request(server)
        .get(getDiveSiteUrl('15f46f35-0e22-4f19-a24a-feaf6be20b9d'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not have an operator', async () => {
      await LogEntries.update(logEntry.id, { site: null });
      await request(server)
        .get(getDiveSiteUrl())
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the review does not exist', async () => {
      await DiveSiteReviews.delete(review.id);
      await request(server)
        .get(getDiveSiteUrl())
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when reviewing dive site', () => {
    it('will submit a review for the site', async () => {
      const review: CreateOrUpdateDiveSiteReviewDTO = {
        rating: 4.11,
        difficulty: 3.33,
        comments: 'Great operator!',
      };
      const { body } = await request(server)
        .put(getDiveSiteUrl())
        .set(...authHeader)
        .send(review)
        .expect(200);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdOn).toBeCloseTo(Date.now(), -3);
      expect(body.creator.username).toBe(Username);

      const saved = await DiveSiteReviews.findOneByOrFail({
        creator: { id: users[0].id },
        logEntry: { id: logEntry.id },
        site: { id: diveSite.id },
      });
      expect(saved.comments).toBe(review.comments);
      expect(saved.rating).toBe(review.rating);
      expect(saved.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will allow an admin to submit a review for the site', async () => {
      const review: CreateOrUpdateDiveSiteReviewDTO = {
        rating: 4.11,
        difficulty: 3.33,
        comments: 'Great operator!',
      };
      const { body } = await request(server)
        .put(getDiveSiteUrl())
        .set(...adminAuthHeader)
        .send(review)
        .expect(200);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdOn).toBeCloseTo(Date.now(), -3);
      expect(body.creator.username).toBe(Username);

      const saved = await DiveSiteReviews.findOneByOrFail({
        creator: { id: users[0].id },
        logEntry: { id: logEntry.id },
        site: { id: diveSite.id },
      });
      expect(saved.comments).toBe(review.comments);
      expect(saved.rating).toBe(review.rating);
      expect(saved.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will update an existing review for the dive site', async () => {
      const existingEntity: DiveSiteReviewEntity = {
        id: 'd0c1c2bc-c5e9-4b66-9a02-b5a19d50bb88',
        creator: users[0],
        comments: 'Old review',
        rating: 1.111,
        difficulty: 2.22,
        createdOn: new Date(),
        logEntry,
        site: diveSite,
        updatedOn: new Date(),
      };
      await DiveSiteReviews.save(existingEntity);

      const review: CreateOrUpdateDiveSiteReviewDTO = {
        rating: 4.11,
        difficulty: 3.33,
        comments: 'Great operator!',
      };
      const { body } = await request(server)
        .put(getDiveSiteUrl())
        .set(...authHeader)
        .send(review)
        .expect(200);
      expect(body.id).toBe(existingEntity.id);
      expect(body.comments).toBe(review.comments);
      expect(body.rating).toBe(review.rating);
      expect(body.createdOn).toBeCloseTo(Date.now(), -3);
      expect(body.creator.username).toBe(Username);

      const saved = await DiveSiteReviews.findOneByOrFail({
        creator: { id: users[0].id },
        logEntry: { id: logEntry.id },
        site: { id: diveSite.id },
      });
      expect(saved.id).toBe(existingEntity.id);
      expect(saved.comments).toBe(review.comments);
      expect(saved.rating).toBe(review.rating);
      expect(saved.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .put(getDiveSiteUrl())
        .set(...authHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getDiveSiteUrl())
        .set(...authHeader)
        .send({ rating: 6.66, difficulty: 'easy', comments: false })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getDiveSiteUrl())
        .send({ rating: 2.22 })
        .expect(401);
    });

    it('will return a 403 response if the user is not the log entry owner', async () => {
      await request(server)
        .put(getDiveSiteUrl())
        .set(...otherAuthHeader)
        .send({ rating: 2.22 })
        .expect(403);
    });

    it('will return a 404 response if the username is not found', async () => {
      await request(server)
        .put(getDiveSiteUrl(EntryId, 'not-a-user'))
        .set(...adminAuthHeader)
        .send({ rating: 2.22 })
        .expect(404);
    });

    it('will return a 404 response if the log entry is not found', async () => {
      await request(server)
        .put(getDiveSiteUrl('15f46f35-0e22-4f19-a24a-feaf6be20b9d'))
        .set(...adminAuthHeader)
        .send({ rating: 2.22 })
        .expect(404);
    });

    it('will return a 405 response if the log entry does not have an operator', async () => {
      await LogEntries.update(logEntry.id, { site: null });
      await request(server)
        .put(getDiveSiteUrl())
        .set(...authHeader)
        .send({ rating: 2.22 })
        .expect(405);
    });
  });

  describe('when deleting dive site review', () => {
    let review: DiveSiteReviewEntity;

    beforeAll(() => {
      review = {
        comments: 'W00T',
        createdOn: new Date(),
        creator: users[0],
        id: 'edce5581-bce3-4f09-914c-78d23028be07',
        logEntry,
        site: diveSite,
        rating: 3.213,
        difficulty: 1.18,
        updatedOn: new Date(),
      };
    });

    beforeEach(async () => {
      await DiveSiteReviews.save(review);
    });

    it('will delete the review if it exists', async () => {
      await request(server)
        .delete(getDiveSiteUrl())
        .set(...authHeader)
        .expect(204);

      const saved = await DiveSiteReviews.findOneBy({ id: review.id });
      expect(saved).toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getDiveSiteUrl()).expect(401);
    });

    it('will return a 403 response if the user is not the log entry owner', async () => {
      await request(server)
        .delete(getDiveSiteUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the username is not found', async () => {
      await request(server)
        .delete(getDiveSiteUrl(EntryId, 'not-a-user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry is not found', async () => {
      await request(server)
        .delete(getDiveSiteUrl('15f46f35-0e22-4f19-a24a-feaf6be20b9d'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not have an operator', async () => {
      await LogEntries.update(logEntry.id, { site: null });
      await request(server)
        .delete(getDiveSiteUrl())
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the review does not exist', async () => {
      await DiveSiteReviews.delete(review.id);
      await request(server)
        .delete(getDiveSiteUrl())
        .set(...authHeader)
        .expect(404);
    });
  });
});
