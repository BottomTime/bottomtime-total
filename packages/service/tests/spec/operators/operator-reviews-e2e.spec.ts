import {
  AccountTier,
  CreateOrUpdateOperatorReviewDTO,
  ListOperatorReviewsParams,
  LogBookSharing,
  OperatorReviewSortBy,
  SortOrder,
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
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { OperatorFactory } from '../../../src/operators';
import { OperatorReviewController } from '../../../src/operators/operator-review.controller';
import { OperatorReviewsController } from '../../../src/operators/operator-reviews.controller';
import { OperatorsService } from '../../../src/operators/operators.service';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestReviews from '../../fixtures/operator-reviews.json';
import TestCreators from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestOperator,
  createTestUser,
  parseOperatorReviewJSON,
  parseUserJSON,
} from '../../utils';

const TestOperator: OperatorEntity = {
  id: 'f6fc189e-126e-49ac-95aa-c2ffd9a03140',
  active: true,
  averageRating: 3.8,
  createdAt: new Date('2022-06-20T11:45:21Z'),
  updatedAt: new Date('2024-07-29T11:45:21Z'),
  deletedAt: null,
  name: "Diver's Den",
  slug: 'divers-den',
  verificationStatus: VerificationStatus.Rejected,
  verificationMessage: 'Nope',
  description: `Welcome to Tobermory, the Scuba Diving Capital of Canada!
Discover the world below the waves of the Fathom Five National Marine Park, home to more than 20 shipwrecks.
Immerse yourself in the captivating history of century old ships and catch a glimpse of their haunting beauty.
Whether or not you are a certified scuba diver, you can explore this hidden world and have the experience of a lifetime.`,
  address: '3 Bay St, Tobermory, ON N0H 2R0, Canada',
  phone: '+1 519-596-2363',
  email: 'info@diversden.ca',
  website: 'https://diversden.ca',
  gps: {
    type: 'Point',
    coordinates: [-81.66554, 45.25484],
  },
  facebook: 'diversdentobermory',
  instagram: 'diversden',
  logo: 'https://diversden.ca/wp-content/uploads/2021/06/divers-den-logo.png',
  banner:
    'https://diversden.ca/wp-content/uploads/2021/06/divers-den-banner.jpg',
  tiktok: '@diversden',
  twitter: 'diversden',
  youtube: 'diversden',
};

function getUrl(reviewId?: string, operatorKey?: string): string {
  let url = `/api/operators/${operatorKey ?? TestOperator.slug}/reviews`;
  if (reviewId) url = `${url}/${reviewId}`;
  return url;
}

describe('Operator Reviews E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;
  let Operators: Repository<OperatorEntity>;
  let Reviews: Repository<OperatorReviewEntity>;
  let Users: Repository<UserEntity>;

  let owner: UserEntity;
  let otherOwner: UserEntity;
  let admin: UserEntity;
  let operator: OperatorEntity;
  let otherOperator: OperatorEntity;
  let testCreators: UserEntity[];
  let testReviews: OperatorReviewEntity[];
  let creatorAuthHeaders: [string, string][];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    Operators = dataSource.getRepository(OperatorEntity);
    Reviews = dataSource.getRepository(OperatorReviewEntity);
    Users = dataSource.getRepository(UserEntity);

    owner = createTestUser({
      accountTier: AccountTier.Basic,
      id: '54ca5e54-de92-4e15-a523-4087c52b40eb',
      username: 'testuser',
      memberSince: new Date('2021-06-10T03:00:00Z'),
      logBookSharing: LogBookSharing.Public,
      avatar: 'https://example.com/avatar.png',
      location: 'Toronto, ON, Canada',
      name: 'Test User',
    });
    admin = createTestUser({ role: UserRole.Admin });
    operator = {
      ...TestOperator,
      owner,
    };

    otherOwner = createTestUser();
    otherOperator = createTestOperator(otherOwner);

    testCreators = TestCreators.slice(0, 8).map(parseUserJSON);
    creatorAuthHeaders = await Promise.all(
      testCreators.map((user) => createAuthHeader(user.id)),
    );
    adminAuthHeader = await createAuthHeader(admin.id);

    testReviews = TestReviews.map((review, index) =>
      parseOperatorReviewJSON(
        review,
        index % 5 === 0 ? otherOperator : operator,
        testCreators[index % testCreators.length],
      ),
    );

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          OperatorEntity,
          OperatorDiveSiteEntity,
          OperatorReviewEntity,
        ]),
        UsersModule,
        DiveSitesModule,
      ],
      providers: [OperatorsService, OperatorFactory],
      controllers: [OperatorReviewsController, OperatorReviewController],
    });
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await Users.save([owner, otherOwner, admin, ...testCreators]);
    await Operators.save([operator, otherOperator]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when retrieving a single operator review', () => {
    it('will return the review if it exists', async () => {
      const review = testReviews[7];
      await Reviews.save(review);
      const { body } = await request(server).get(getUrl(review.id)).expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the review does not exist', async () => {
      await request(server)
        .get(getUrl('9f87a189-517f-479e-946d-8a5c07ec743c'))
        .expect(404);
    });

    it('will return a 404 response if the review is associated with another operator', async () => {
      const review = testReviews[0];
      await Reviews.save(review);
      await request(server).get(getUrl(review.id)).expect(404);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      const review = testReviews[0];
      await Reviews.save(review);
      await request(server)
        .get(getUrl(review.id, 'not-a-real-operator'))
        .expect(404);
    });
  });

  describe('when creating a new operator review', () => {
    it('will submit a new review for an operator', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 3.3,
        comments: 'This is a test review',
      };
      const { body } = await request(server)
        .post(getUrl())
        .set(...creatorAuthHeaders[2])
        .send(options)
        .expect(201);

      expect(body.id).toHaveLength(36);
      expect(body.createdAt).toBeCloseTo(Date.now(), -3);
      expect(body.comments).toBe(options.comments);
      expect(body.rating).toBe(options.rating);
      expect(body.creator.username).toBe(testCreators[2].username);

      const saved = await Reviews.findOneByOrFail({
        id: body.id,
        creator: { id: testCreators[2].id },
        operator: { id: operator.id },
      });
      expect(saved.comments).toBe(options.comments);
      expect(saved.rating).toBe(options.rating);
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .post(getUrl())
        .set(...creatorAuthHeaders[2])
        .expect(400);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...creatorAuthHeaders[2])
        .send({ rating: 'good', comments: 77 })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 3.3,
        comments: 'This is a test review',
      };
      await request(server).post(getUrl()).send(options).expect(401);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 3.3,
        comments: 'This is a test review',
      };
      await request(server)
        .post(getUrl(undefined, 'not-a-real-operator'))
        .set(...creatorAuthHeaders[1])
        .send(options)
        .expect(404);
    });
  });

  describe('when listing reviews for an operator', () => {
    it('will return a list of reviews for an operator', async () => {
      await Reviews.save(testReviews);
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will perform a more complex search for reviews', async () => {
      const query: ListOperatorReviewsParams = {
        limit: 4,
        sortBy: OperatorReviewSortBy.Age,
        sortOrder: SortOrder.Ascending,
        query: 'Demonstro',
      };
      await Reviews.save(testReviews);
      const { body } = await request(server)
        .get(getUrl())
        .query(query)
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return an empty result set if the creator specified in the query string does not exist', async () => {
      const query: ListOperatorReviewsParams = {
        creator: 'not-a-real-user',
      };
      await Reviews.save(testReviews);
      const { body } = await request(server)
        .get(getUrl())
        .query(query)
        .expect(200);
      expect(body).toEqual({ data: [], totalCount: 0 });
    });

    it('will return a 400 response if the query string is invalid', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({ sortBy: 'likes', query: 77, limit: -1, skip: 'sure' })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server)
        .get(getUrl(undefined, 'not-a-real-operator'))
        .expect(404);
    });
  });

  describe('when updating an operator review', () => {
    let review: OperatorReviewEntity;
    let creator: UserEntity;
    let authHeader: [string, string];

    beforeEach(async () => {
      creator = testCreators[6];
      authHeader = creatorAuthHeaders[6];
      review = {
        comments: 'This review is lame. It needs an update.',
        createdAt: new Date('2025-01-03T09:53:08-05:00'),
        updatedAt: new Date('2025-01-03T09:53:08-05:00'),
        creator,
        id: '87750e9b-935e-4c53-b20f-13172dd89c4e',
        operator,
        logEntry: null,
        rating: 2.99,
      };

      await Reviews.save(review);
    });

    it('will save changes to an opeator review', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.1,
        comments: 'Updated comments.',
      };

      const { body } = await request(server)
        .put(getUrl(review.id))
        .set(...authHeader)
        .send(options)
        .expect(200);
      expect(body.comments).toBe(options.comments);
      expect(body.rating).toBe(options.rating);
      expect(body.updatedAt).toBeCloseTo(Date.now(), -3);

      const saved = await Reviews.findOneByOrFail({ id: review.id });
      expect(saved.comments).toBe(options.comments);
      expect(saved.rating).toBe(options.rating);
      expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will allow an admin to save changes to an opeator review', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.1,
        comments: 'Updated comments.',
      };

      const { body } = await request(server)
        .put(getUrl(review.id))
        .set(...adminAuthHeader)
        .send(options)
        .expect(200);
      expect(body.comments).toBe(options.comments);
      expect(body.rating).toBe(options.rating);
      expect(body.updatedAt).toBeCloseTo(Date.now(), -3);

      const saved = await Reviews.findOneByOrFail({ id: review.id });
      expect(saved.comments).toBe(options.comments);
      expect(saved.rating).toBe(options.rating);
      expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .put(getUrl(review.id))
        .set(...authHeader)
        .expect(400);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl(review.id))
        .set(...authHeader)
        .send({ rating: 8.2, comments: true })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.1,
        comments: 'Updated comments.',
      };
      await request(server).put(getUrl(review.id)).send(options).expect(401);
    });

    it('will return a 403 response if the user is not authoirzed to update the review', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.1,
        comments: 'Updated comments.',
      };
      await request(server)
        .put(getUrl(review.id))
        .set(...creatorAuthHeaders[3])
        .send(options)
        .expect(403);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.1,
        comments: 'Updated comments.',
      };
      await request(server)
        .put(getUrl(review.id, 'no-such-operator'))
        .set(...adminAuthHeader)
        .send(options)
        .expect(404);
    });

    it('will return a 404 response if the review does not exist', async () => {
      const options: CreateOrUpdateOperatorReviewDTO = {
        rating: 4.1,
        comments: 'Updated comments.',
      };
      await request(server)
        .put(getUrl('54bee0c3-08d0-48ee-95b8-35ceec901555'))
        .set(...adminAuthHeader)
        .send(options)
        .expect(404);
    });
  });

  describe('when deleting an operator review', () => {
    let review: OperatorReviewEntity;

    beforeEach(async () => {
      review = testReviews[3];
      await Reviews.save(review);
    });

    it('will delete an operator review', async () => {
      const { body } = await request(server)
        .delete(getUrl(review.id))
        .set(...creatorAuthHeaders[3])
        .expect(200);

      expect(body).toEqual({
        succeeded: true,
      });

      await expect(Reviews.existsBy({ id: review.id })).resolves.toBe(false);
    });

    it('will allow an admin to delete an operator review', async () => {
      const { body } = await request(server)
        .delete(getUrl(review.id))
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toEqual({
        succeeded: true,
      });

      await expect(Reviews.existsBy({ id: review.id })).resolves.toBe(false);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(review.id)).expect(401);
    });

    it('will return a 403 response if the user is not authoirzed to delete the review', async () => {
      await request(server)
        .delete(getUrl(review.id))
        .set(...creatorAuthHeaders[6])
        .expect(403);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server)
        .delete(getUrl(review.id, 'no-such-operator'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the review does not exist', async () => {
      await request(server)
        .delete(getUrl('54bee0c3-08d0-48ee-95b8-35ceec901555'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
