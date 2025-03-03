import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '@bottomtime/service/src/data';

import { Repository } from 'typeorm';

import { Aggregator } from '../../src/aggregator';
import { dataSource, postgresClient } from '../data-source';
import { TestEntities, createTestReviews } from '../utils';
import { TestLogger } from '../utils/test-logger';

describe('Review aggregator class', () => {
  let aggregator: Aggregator;
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let Sites: Repository<DiveSiteEntity>;
  let OperatorReviews: Repository<OperatorReviewEntity>;
  let SiteReviews: Repository<DiveSiteReviewEntity>;

  let testData: TestEntities;
  let ids: { diveSiteIds: string[]; operatorIds: string[] };

  beforeAll(() => {
    aggregator = new Aggregator(postgresClient, TestLogger);
    Operators = dataSource.getRepository(OperatorEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);
    OperatorReviews = dataSource.getRepository(OperatorReviewEntity);
    SiteReviews = dataSource.getRepository(DiveSiteReviewEntity);
    Users = dataSource.getRepository(UserEntity);

    testData = createTestReviews();
    ids = {
      diveSiteIds: testData.sites.map((site) => site.id),
      operatorIds: testData.operators.map((operator) => operator.id),
    };
  });

  beforeEach(async () => {
    await Users.save(testData.users);
    await Promise.all([
      Operators.save(testData.operators),
      Sites.save(testData.sites),
    ]);
    await Promise.all([
      OperatorReviews.save(testData.operatorReviews),
      SiteReviews.save(testData.siteReviews),
    ]);
  });

  it('will calculate some averages for submitted reviews', async () => {
    const expectedDiveSiteAverages = testData.siteReviews.reduce<
      Record<
        string,
        {
          rating: number;
          difficulty: number;
          ratingCount: number;
          difficultyCount: number;
        }
      >
    >((acc, siteReview) => {
      if (!acc[siteReview.site.id]) {
        acc[siteReview.site.id] = {
          rating: 0,
          difficulty: 0,
          ratingCount: 0,
          difficultyCount: 0,
        };
      }

      if (siteReview.rating) {
        acc[siteReview.site.id].rating += siteReview.rating;
        acc[siteReview.site.id].ratingCount++;
      }

      if (siteReview.difficulty) {
        acc[siteReview.site.id].difficulty += siteReview.difficulty;
        acc[siteReview.site.id].difficultyCount++;
      }

      return acc;
    }, {});
    Object.values(expectedDiveSiteAverages).forEach((averages) => {
      averages.rating /= averages.ratingCount;
      averages.difficulty /= averages.difficultyCount;
    });

    const expectedOperatorAverages = testData.operatorReviews.reduce<
      Record<string, { rating: number; ratingCount: number }>
    >((acc, operatorReview) => {
      if (!acc[operatorReview.operator.id]) {
        acc[operatorReview.operator.id] = { rating: 0, ratingCount: 0 };
      }

      if (operatorReview.rating) {
        acc[operatorReview.operator.id].rating += operatorReview.rating;
        acc[operatorReview.operator.id].ratingCount++;
      }

      return acc;
    }, {});
    Object.values(expectedOperatorAverages).forEach((averages) => {
      averages.rating /= averages.ratingCount;
    });

    await aggregator.aggregate(ids);

    const siteResults = await Sites.find({});
    siteResults.forEach((site) => {
      expect(site.averageRating).toBeCloseTo(
        expectedDiveSiteAverages[site.id].rating,
        4,
      );
      expect(site.averageDifficulty).toBeCloseTo(
        expectedDiveSiteAverages[site.id].difficulty,
        4,
      );
    });

    const operatorResults = await Operators.find({});
    operatorResults.forEach((operator) => {
      expect(operator.averageRating).toBeCloseTo(
        expectedOperatorAverages[operator.id].rating,
        4,
      );
    });
  });

  it('will not calculate aggregates for sites or operators with no reviews', async () => {
    await Promise.all([SiteReviews.delete({}), OperatorReviews.delete({})]);

    await aggregator.aggregate(ids);

    const siteResults = await Sites.find({});
    siteResults.forEach((site) => {
      expect(site.averageRating).toBeNull();
      expect(site.averageDifficulty).toBeNull();
    });

    const operatorResults = await Operators.find({});
    operatorResults.forEach((operator) => {
      expect(operator.averageRating).toBeNull();
    });
  });

  it('will not calculate aggregates for sites or operators when their ids are not provided', async () => {
    await aggregator.aggregate({
      diveSiteIds: [ids.diveSiteIds[0]],
      operatorIds: [ids.operatorIds[0]],
    });

    const siteResults = await Sites.find({});
    siteResults.forEach((site) => {
      if (site.id === ids.diveSiteIds[0]) {
        expect(site.averageRating).not.toBeNull();
        expect(site.averageDifficulty).not.toBeNull();
      } else {
        expect(site.averageRating).toBeNull();
        expect(site.averageDifficulty).toBeNull();
      }
    });

    const operatorResults = await Operators.find({});
    operatorResults.forEach((operator) => {
      if (operator.id === ids.operatorIds[0]) {
        expect(operator.averageRating).not.toBeNull();
      } else {
        expect(operator.averageRating).toBeNull();
      }
    });
  });

  it('will not calculate aggregates for sites or operators when their ids are not provided', async () => {
    await aggregator.aggregate({ diveSiteIds: [], operatorIds: [] });

    const siteResults = await Sites.find({});
    siteResults.forEach((site) => {
      expect(site.averageRating).toBeNull();
      expect(site.averageDifficulty).toBeNull();
    });

    const operatorResults = await Operators.find({});
    operatorResults.forEach((operator) => {
      expect(operator.averageRating).toBeNull();
    });
  });
});
