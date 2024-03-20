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
import { createTestApp, createTestUser } from '../../utils';
import { createTestDiveSite } from '../../utils/create-test-dive-site';
import { parseDiveSiteReviewJSON } from '../../utils/create-test-dive-site-review';

const DiveSiteId = '49f82168-bf4b-4b73-84f9-078d2e7c6153';
const CreatorTestData: Partial<UserEntity> = {
  id: '9dcf5f2e-db68-4061-aba4-6a3d6dc088bb',
  username: 'testy_mctestface',
  usernameLowered: 'testy_mctestface',
  email: 'testy@testing.com',
  emailLowered: 'testy@testing.com',
  memberSince: new Date('2024-03-20T13:12:03.449Z'),
  name: 'Testy McTestface',
  location: "People's Democratic Republic of Testing",
  avatar: 'https://testy.com/avatar.jpg',
};

function getUrl(siteId: string = DiveSiteId, reviewId?: string) {
  return `/api/diveSites/${siteId}/reviews${reviewId ? `/${reviewId}` : ''}`;
}

describe('Dive Site Reviews End-to-End Tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Users: Repository<UserEntity>;
  let Sites: Repository<DiveSiteEntity>;
  let Reviews: Repository<DiveSiteReviewEntity>;

  let user: UserEntity;
  let diveSite: DiveSiteEntity;
  let reviewData: DiveSiteReviewEntity[];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);
    Reviews = dataSource.getRepository(DiveSiteReviewEntity);

    user = createTestUser(CreatorTestData);
    diveSite = createTestDiveSite(user, {
      id: DiveSiteId,
    });
    reviewData = ReviewTestData.map((data) =>
      parseDiveSiteReviewJSON(data, user, diveSite),
    );
  });

  beforeEach(async () => {
    await Users.save(user);
    await Sites.save(diveSite);
    await Reviews.save(reviewData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing reviews', () => {});

  describe('when retrieving a single review', () => {
    it('will return a review when it is requested', async () => {
      const { body } = await request(server)
        .get(getUrl(DiveSiteId, reviewData[5].id))
        .expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 if the dive site cannot be found', async () => {});

    it('will return a 404 if the review cannot be found', async () => {});
  });

  describe('when creating a review', () => {});

  describe('when updating a review', () => {});

  describe('when deleting a review', () => {});
});
