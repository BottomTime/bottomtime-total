import { faker } from '@faker-js/faker';

import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteReviewEventListener } from '../../../src/diveSites/dive-site-review.listener';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils';
import { createTestDiveSite } from '../../utils/create-test-dive-site';
import { createTestDiveSiteReview } from '../../utils/create-test-dive-site-review';

describe('Dive Site Reviews Event Listeners', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let Reviews: Repository<DiveSiteReviewEntity>;
  let listener: DiveSiteReviewEventListener;

  let user: UserEntity;

  beforeAll(() => {
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    Reviews = dataSource.getRepository(DiveSiteReviewEntity);
    Users = dataSource.getRepository(UserEntity);

    listener = new DiveSiteReviewEventListener(DiveSites);
  });

  beforeEach(async () => {
    user = createTestUser();
    await Users.save(user);
  });

  it('will aggregate ratings and update dive site when a review is created/updated', async () => {
    const siteData = createTestDiveSite(user);
    await DiveSites.save(siteData);

    const reviewData = [
      createTestDiveSiteReview(user, siteData, {
        rating: 4.63,
        difficulty: 2.88,
      }),
      createTestDiveSiteReview(user, siteData, {
        rating: 2.73,
        difficulty: 4.13,
      }),
      createTestDiveSiteReview(user, siteData, {
        rating: 3.89,
        difficulty: 1.11,
      }),
      createTestDiveSiteReview(user, siteData, {
        rating: 1.59,
        difficulty: 2.68,
      }),
    ];
    await Reviews.save(reviewData);

    await listener.handleReviewSavedEvent({
      siteId: siteData.id,
      reviewId: reviewData[3].id,
      rating: reviewData[3].rating,
      difficulty: reviewData[3].difficulty,
    });

    const updatedSite = await DiveSites.findOneOrFail({
      where: { id: siteData.id },
      select: ['averageRating', 'averageDifficulty'],
    });
    expect(updatedSite.averageRating).toBeCloseTo(3.21);
    expect(updatedSite.averageDifficulty).toBeCloseTo(2.7);
  });

  it('will aggregate ratings and update dive site when a review is deleted', async () => {
    const siteData = createTestDiveSite(user);
    await DiveSites.save(siteData);

    const reviewData = [
      createTestDiveSiteReview(user, siteData, {
        rating: 4.63,
        difficulty: 2.88,
      }),
      createTestDiveSiteReview(user, siteData, {
        rating: 2.73,
        difficulty: 4.13,
      }),
      createTestDiveSiteReview(user, siteData, {
        rating: 1.59,
        difficulty: 2.68,
      }),
    ];
    await Reviews.save(reviewData);

    await listener.handleReviewDeletedEvent({
      siteId: siteData.id,
      reviewId: faker.string.uuid(),
    });

    const updatedSite = await DiveSites.findOneOrFail({
      where: { id: siteData.id },
      select: ['averageRating', 'averageDifficulty'],
    });
    expect(updatedSite.averageRating).toBeCloseTo(2.98);
    expect(updatedSite.averageDifficulty).toBeCloseTo(3.23);
  });

  it('will write nulls to averageDifficulty if no values exist in the reviews', async () => {
    const siteData = createTestDiveSite(user);
    await DiveSites.save(siteData);

    const reviewData = new Array<DiveSiteReviewEntity>(5);
    for (let i = 0; i < reviewData.length; i++) {
      reviewData[i] = createTestDiveSiteReview(user, siteData);
      reviewData[i].difficulty = null;
    }
    await Reviews.save(reviewData);

    await listener.handleReviewSavedEvent({
      siteId: siteData.id,
      reviewId: reviewData[4].id,
      rating: reviewData[4].rating,
      difficulty: null,
    });

    const updatedSite = await DiveSites.findOneOrFail({
      where: { id: siteData.id },
      select: ['id', 'averageDifficulty'],
    });
    expect(updatedSite.averageDifficulty).toBeNull();
  });

  it('will write nulls if the dive site has no reviews', async () => {
    const siteData = createTestDiveSite(user);
    await DiveSites.save(siteData);

    await listener.handleReviewDeletedEvent({
      siteId: siteData.id,
      reviewId: faker.string.uuid(),
    });

    const updatedSite = await DiveSites.findOneOrFail({
      where: { id: siteData.id },
      select: ['id', 'averageRating', 'averageDifficulty'],
    });
    expect(updatedSite.averageRating).toBeNull();
    expect(updatedSite.averageDifficulty).toBeNull();
  });
});
