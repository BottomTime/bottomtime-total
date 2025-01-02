import {
  AccountTier,
  CreateOrUpdateOperatorReviewDTO,
  ListOperatorReviewsParams,
  LogBookSharing,
  OperatorReviewSortBy,
  SortOrder,
  VerificationStatus,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import {
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '../../../src/data';
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
  let operator: OperatorEntity;
  let otherOperator: OperatorEntity;
  let testCreators: UserEntity[];
  let testReviews: OperatorReviewEntity[];
  let creatorAuthTokens: [string, string][];

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
    operator = {
      ...TestOperator,
      owner,
    };

    otherOwner = createTestUser();
    otherOperator = createTestOperator(otherOwner);

    testCreators = TestCreators.slice(0, 8).map(parseUserJSON);
    creatorAuthTokens = await Promise.all(
      testCreators.map((user) => createAuthHeader(user.id)),
    );

    testReviews = TestReviews.map((review, index) =>
      parseOperatorReviewJSON(
        review,
        index % 5 === 0 ? otherOperator : operator,
        testCreators[index % testCreators.length],
      ),
    );

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([OperatorEntity, OperatorReviewEntity]),
        UsersModule,
      ],
      providers: [OperatorsService],
      controllers: [OperatorReviewsController, OperatorReviewController],
    });
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await Users.save([owner, otherOwner, ...testCreators]);
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
        .set(...creatorAuthTokens[2])
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
        .set(...creatorAuthTokens[2])
        .expect(400);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...creatorAuthTokens[2])
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
        .set(...creatorAuthTokens[1])
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

  describe('when updating an operator review', () => {});

  describe('when deleting an operator review', () => {});
});
