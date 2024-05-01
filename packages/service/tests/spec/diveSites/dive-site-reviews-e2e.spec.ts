import {
  DiveSiteReviewDTO,
  DiveSiteReviewsSortBy,
  LogBookSharing,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../../src/data';
import { dataSource } from '../../data-source';
import ReviewTestData from '../../fixtures/dive-site-reviews.json';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';
import { createTestDiveSite } from '../../utils/create-test-dive-site';
import {
  createTestDiveSiteReview,
  parseDiveSiteReviewJSON,
} from '../../utils/create-test-dive-site-review';

const DiveSiteId = '49f82168-bf4b-4b73-84f9-078d2e7c6153';
const CreatorTestData: Partial<UserEntity> = {
  id: '9dcf5f2e-db68-4061-aba4-6a3d6dc088bb',
  username: 'testy_mctestface',
  usernameLowered: 'testy_mctestface',
  email: 'testy@testing.com',
  emailLowered: 'testy@testing.com',
  memberSince: new Date('2024-03-20T13:12:03.449Z'),
  logBookSharing: LogBookSharing.FriendsOnly,
  name: 'Testy McTestface',
  location: "People's Democratic Republic of Testing",
  avatar: 'https://testy.com/avatar.jpg',
};

const AdminUserData: Partial<UserEntity> = {
  id: '562c2abb-e2f5-4745-925b-c9bc936f8972',
  username: 'andy_admin',
  usernameLowered: 'andy_admin',
  email: 'admin@admin.com',
  emailLowered: 'admin@admin.com',
  memberSince: new Date('2024-03-20T13:12:03.449Z'),
  name: 'Andy Admin',
  location: 'Adminland',
  avatar: 'https://admin.com/avatar.jpg',
  role: UserRole.Admin,
};

function getUrl(reviewId?: string, siteId?: string) {
  let url = `/api/diveSites/${siteId || DiveSiteId}/reviews`;

  if (reviewId) {
    url = `${url}/${reviewId}`;
  }

  return url;
}

describe('Dive Site Reviews End-to-End Tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Users: Repository<UserEntity>;
  let Sites: Repository<DiveSiteEntity>;
  let Reviews: Repository<DiveSiteReviewEntity>;

  let user: UserEntity;
  let admin: UserEntity;
  let diveSite: DiveSiteEntity;
  let reviewData: DiveSiteReviewEntity[];
  let authHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);
    Reviews = dataSource.getRepository(DiveSiteReviewEntity);

    user = createTestUser(CreatorTestData);
    admin = createTestUser(AdminUserData);
    diveSite = createTestDiveSite(user, {
      id: DiveSiteId,
    });
    reviewData = ReviewTestData.map((data) =>
      parseDiveSiteReviewJSON(data, user, diveSite),
    );

    authHeader = await createAuthHeader(user.id);
    adminAuthHeader = await createAuthHeader(admin.id);
  });

  beforeEach(async () => {
    await Users.save([user, admin]);
    await Sites.save(diveSite);
    await Reviews.save(reviewData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing reviews', () => {
    it('will query for a list of reviews and return the results', async () => {
      const { body: results } = await request(server).get(getUrl()).expect(200);
      expect(results.totalCount).toBe(reviewData.length);
      expect(results.reviews).toHaveLength(50);
      expect(
        results.reviews.map((review: DiveSiteReviewDTO) => review.title),
      ).toMatchSnapshot();
    });

    it('will query for a list of reviews given query string options', async () => {
      const { body: results } = await request(server)
        .get(getUrl())
        .query({
          limit: 5,
          skip: 5,
          sortBy: DiveSiteReviewsSortBy.CreatedOn,
          sortOrder: SortOrder.Descending,
        })
        .expect(200);
      expect(results.totalCount).toBe(reviewData.length);
      expect(results.reviews).toHaveLength(5);
      expect(
        results.reviews.map((review: DiveSiteReviewDTO) => review.title),
      ).toMatchSnapshot();
    });

    it('will return a 400 response if the query string options are invalid', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({
          limit: false,
          skip: -5,
          sortBy: 'chillFactor',
          sortOrder: 'up',
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .get(getUrl(undefined, '49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .expect(404);
    });
  });

  describe('when retrieving a single review', () => {
    it('will return a review when it is requested', async () => {
      const { body } = await request(server)
        .get(getUrl(reviewData[5].id))
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 if the dive site cannot be found', async () => {
      await request(server)
        .get(getUrl(reviewData[7].id, '49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .expect(404);
    });

    it('will return a 404 if the review cannot be found', async () => {
      await request(server)
        .get(getUrl('49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .expect(404);
    });
  });

  describe('when creating a review', () => {
    it('will create a new review and return the result', async () => {
      const newReview = {
        title: 'A Pretty Good Dive Site',
        rating: 4.8,
        difficulty: 1.5,
        comments: 'This is a great dive site!',
      };

      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send(newReview)
        .expect(201);

      expect(new Date(body.createdOn).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.creator).toEqual({
        userId: user.id,
        username: user.username,
        memberSince: user.memberSince.toISOString(),
        logBookSharing: user.logBookSharing,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
      });
      expect(body.difficulty).toBe(newReview.difficulty);
      expect(body.title).toBe(newReview.title);
      expect(body.rating).toBe(newReview.rating);
      expect(body.comments).toBe(newReview.comments);

      const review = await Reviews.findOneOrFail({
        relations: ['creator', 'site'],
        where: { id: body.id },
      });
      expect(review.comments).toBe(newReview.comments);
      expect(review.difficulty).toBe(newReview.difficulty);
      expect(review.title).toBe(newReview.title);
      expect(review.rating).toBe(newReview.rating);
      expect(review.creator.id).toBe(user.id);
      expect(review.site.id).toBe(diveSite.id);
    });

    it('will return a 400 response if the the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          rating: 'great',
          difficulty: -3,
          comments: true,
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl())
        .send({
          title: 'A Pretty Good Dive Site',
          rating: 4.8,
          difficulty: 1.5,
          comments: 'This is a great dive site!',
        })
        .expect(401);
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .post(getUrl(undefined, '49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .set(...authHeader)
        .send({
          title: 'A Pretty Good Dive Site',
          rating: 4.8,
          difficulty: 1.5,
          comments: 'This is a great dive site!',
        })
        .expect(404);
    });

    it('will return a 429 response if the user has already reviewed the site in the last 48 hours', async () => {
      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          title: 'A Pretty Good Dive Site',
          rating: 4.8,
          difficulty: 1.5,
          comments: 'This is a great dive site!',
        })
        .expect(201);

      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(429);
    });
  });

  describe('when updating a review', () => {
    it('will update an existing review and return the updated data', async () => {
      const { body } = await request(server)
        .put(getUrl(reviewData[5].id))
        .set(...authHeader)
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(200);

      expect(new Date(body.updatedOn).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.creator).toEqual({
        userId: user.id,
        username: user.username,
        memberSince: user.memberSince.toISOString(),
        logBookSharing: user.logBookSharing,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
      });
      expect(body.difficulty).toBe(1.5);
      expect(body.title).toBe('Changed My Mind');
      expect(body.rating).toBe(3.8);
      expect(body.comments).toBe('This site is just ok.');

      const review = await Reviews.findOneOrFail({
        relations: ['creator', 'site'],
        where: { id: body.id },
      });
      expect(review.comments).toBe('This site is just ok.');
      expect(review.difficulty).toBe(1.5);
      expect(review.title).toBe('Changed My Mind');
      expect(review.rating).toBe(3.8);
      expect(review.creator.id).toBe(user.id);
      expect(review.site.id).toBe(diveSite.id);
    });

    it('will allow admins to update any review', async () => {
      const { body } = await request(server)
        .put(getUrl(reviewData[5].id))
        .set(...adminAuthHeader)
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(200);

      expect(new Date(body.updatedOn).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.creator).toEqual({
        userId: user.id,
        username: user.username,
        memberSince: user.memberSince.toISOString(),
        logBookSharing: user.logBookSharing,
        name: user.name,
        avatar: user.avatar,
        location: user.location,
      });
      expect(body.difficulty).toBe(1.5);
      expect(body.title).toBe('Changed My Mind');
      expect(body.rating).toBe(3.8);
      expect(body.comments).toBe('This site is just ok.');

      const review = await Reviews.findOneOrFail({
        relations: ['creator', 'site'],
        where: { id: body.id },
      });
      expect(review.comments).toBe('This site is just ok.');
      expect(review.difficulty).toBe(1.5);
      expect(review.title).toBe('Changed My Mind');
      expect(review.rating).toBe(3.8);
      expect(review.creator.id).toBe(user.id);
      expect(review.site.id).toBe(diveSite.id);
    });

    it('will return a 400 response if the the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl(reviewData[5].id))
        .set(...authHeader)
        .send({
          rating: 'great',
          difficulty: -3,
          comments: true,
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getUrl(reviewData[5].id))
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not the creator of the review', async () => {
      const review = createTestDiveSiteReview(admin, diveSite);
      await Reviews.save(review);

      await request(server)
        .put(getUrl(review.id))
        .set(...authHeader)
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(403);
    });

    it('will return a 404 response if the dive site cannot be found', async () => {
      await request(server)
        .put(getUrl(reviewData[5].id, '49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .set(...authHeader)
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(404);
    });

    it('will return a 404 response if the review cannot be found', async () => {
      await request(server)
        .put(getUrl('49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .set(...authHeader)
        .send({
          title: 'Changed My Mind',
          rating: 3.8,
          difficulty: 1.5,
          comments: 'This site is just ok.',
        })
        .expect(404);
    });
  });

  describe('when deleting a review', () => {
    it('will delete a review and return a 204 response', async () => {
      const { body } = await request(server)
        .delete(getUrl(reviewData[11].id))
        .set(...authHeader)
        .expect(200);

      expect(body).toEqual({ succeeded: true });

      await expect(
        Reviews.findOneBy({ id: reviewData[11].id }),
      ).resolves.toBeNull();
    });

    it('will indicate non-success if the review does not exist', async () => {
      const { body } = await request(server)
        .delete(getUrl('49f82168-bf4b-4b73-84f9-078d2e7c6154'))
        .set(...authHeader)
        .expect(200);

      expect(body).toEqual({ succeeded: false });
    });

    it('will allow admins to delete any review', async () => {
      await request(server)
        .delete(getUrl(reviewData[11].id))
        .set(...adminAuthHeader)
        .expect(200);

      await expect(
        Reviews.findOneBy({ id: reviewData[11].id }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(reviewData[5].id)).expect(401);
    });

    it('will return a 403 response if the user is not the creator of the review', async () => {
      const review = createTestDiveSiteReview(admin, diveSite);
      await Reviews.save(review);

      await request(server)
        .delete(getUrl(review.id))
        .set(...authHeader)
        .expect(403);

      await Reviews.findOneByOrFail({ id: review.id });
    });

    it('will return a 404 error if the dive site cannot be found', async () => {
      await request(server)
        .delete(
          getUrl(reviewData[5].id, '49f82168-bf4b-4b73-84f9-078d2e7c6154'),
        )
        .set(...authHeader)
        .expect(404);
    });
  });
});
