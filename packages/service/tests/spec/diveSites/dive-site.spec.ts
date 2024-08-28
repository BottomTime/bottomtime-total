import {
  AccountTier,
  DepthUnit,
  DiveSiteReviewsSortBy,
  LogBookSharing,
  SortOrder,
  UserRole,
  WaterType,
} from '@bottomtime/api';

import { HttpException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../../src/data';
import { CreateDiveSiteReviewOptions, DiveSite } from '../../../src/diveSites';
import { DiveSiteReview } from '../../../src/diveSites/dive-site-review';
import { dataSource } from '../../data-source';
import ReviewTestData from '../../fixtures/dive-site-reviews.json';
import { createTestDiveSite } from '../../utils/create-test-dive-site';
import {
  createTestDiveSiteReview,
  parseDiveSiteReviewJSON,
} from '../../utils/create-test-dive-site-review';
import { createTestUser } from '../../utils/create-test-user';

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  accountTier: AccountTier.Basic,
  emailVerified: false,
  isLockedOut: false,
  logBookSharing: LogBookSharing.Public,
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  avatar: 'https://example.com/avatar.png',
  location: 'San Diego, CA',
  name: 'Joe Regular',
};

const DiveSiteData: Partial<DiveSiteEntity> = {
  id: '85f18003-fff8-4b54-8b58-d751ea613d79',
  createdOn: new Date('2024-01-08T13:33:52.364Z'),
  location: 'Cozumel, Mexico',
  name: 'Palancar Horseshoe',
  depth: 80,
  depthUnit: DepthUnit.Feet,
  description: 'This site is amazing',
  directions: 'Fly to Cozumel and then take a boat out there.',
  freeToDive: true,
  shoreAccess: false,
  waterType: WaterType.Fresh,
  gps: {
    type: 'Point',
    coordinates: [-86.933333, 20.433333],
  },
  averageDifficulty: 2.5,
  averageRating: 3.8,
};

describe('Dive Site Class', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let Reviews: Repository<DiveSiteReviewEntity>;

  let diveSiteData: DiveSiteEntity;
  let site: DiveSite;
  let regularUser: UserEntity;
  let emitter: EventEmitter2;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    Reviews = dataSource.getRepository(DiveSiteReviewEntity);
    regularUser = createTestUser(RegularUserData);
  });

  beforeEach(() => {
    emitter = new EventEmitter2();
    diveSiteData = new DiveSiteEntity();
    Object.assign(diveSiteData, DiveSiteData);
    diveSiteData.creator = regularUser;
    site = new DiveSite(Users, DiveSites, Reviews, emitter, diveSiteData);
  });

  it('will return properties correctly', () => {
    expect(site.id).toEqual(DiveSiteData.id);
    expect(site.createdOn).toEqual(DiveSiteData.createdOn);
    expect(site.updatedOn).toBeUndefined();
    expect(site.creator).toEqual({
      accountTier: RegularUserData.accountTier,
      userId: RegularUserId,
      username: RegularUserData.username,
      memberSince: RegularUserData.memberSince,
      logBookSharing: RegularUserData.logBookSharing,
      name: RegularUserData.name,
      avatar: RegularUserData.avatar,
      location: RegularUserData.location,
    });
    expect(site.averageRating).toEqual(DiveSiteData.averageRating);
    expect(site.averageDifficulty).toEqual(DiveSiteData.averageDifficulty);
    expect(site.depth).toEqual({
      depth: DiveSiteData.depth,
      unit: DiveSiteData.depthUnit,
    });
    expect(site.description).toEqual(DiveSiteData.description);
    expect(site.directions).toEqual(DiveSiteData.directions);
    expect(site.freeToDive).toEqual(DiveSiteData.freeToDive);
    expect(site.gps).toEqual({
      lat: DiveSiteData.gps!.coordinates[1],
      lon: DiveSiteData.gps!.coordinates[0],
    });
    expect(site.location).toEqual(DiveSiteData.location);
    expect(site.name).toEqual(DiveSiteData.name);
    expect(site.shoreAccess).toEqual(DiveSiteData.shoreAccess);
    expect(site.waterType).toEqual(DiveSiteData.waterType);
  });

  it('will return undefined for missing properties', () => {
    const data = new DiveSiteEntity();
    data.id = '8a1e4390-c0ae-48de-a76e-37e1a6093232';
    data.creator = regularUser;
    data.name = 'Dive Site';
    data.location = 'Imaginary Place';
    const site = new DiveSite(Users, DiveSites, Reviews, emitter, data);

    expect(site.updatedOn).toBeUndefined();
    expect(site.description).toBeUndefined();
    expect(site.depth).toBeUndefined();
    expect(site.directions).toBeUndefined();
    expect(site.gps).toBeUndefined();
    expect(site.freeToDive).toBeUndefined();
    expect(site.shoreAccess).toBeUndefined();
    expect(site.averageDifficulty).toBeUndefined();
    expect(site.averageRating).toBeUndefined();
    expect(site.waterType).toBeUndefined();
  });

  it('will update properties', () => {
    const newDescription = 'This is a new description';
    site.description = newDescription;
    expect(site.description).toEqual(newDescription);

    const newDirections = 'These are new directions';
    site.directions = newDirections;
    expect(site.directions).toEqual(newDirections);

    const newFreeToDive = false;
    site.freeToDive = newFreeToDive;
    expect(site.freeToDive).toEqual(newFreeToDive);

    const newShoreAccess = true;
    site.shoreAccess = newShoreAccess;
    expect(site.shoreAccess).toEqual(newShoreAccess);

    const newWaterType = WaterType.Salt;
    site.waterType = newWaterType;
    expect(site.waterType).toEqual(newWaterType);

    const newGps = {
      lat: 20.433333,
      lon: -86.933333,
    };
    site.gps = newGps;
    expect(site.gps).toEqual(newGps);

    const newDepth = {
      depth: 80,
      unit: DepthUnit.Feet,
    };
    site.depth = newDepth;
    expect(site.depth).toEqual(newDepth);

    const newLocation = 'Cozumel, Mexico';
    site.location = newLocation;
    expect(site.location).toEqual(newLocation);

    const newName = 'Palancar Horseshoe';
    site.name = newName;
    expect(site.name).toEqual(newName);
  });

  it('will save changes to an existing dive site', async () => {
    await Users.save(regularUser);
    await DiveSites.save(diveSiteData);

    site.depth = {
      depth: 24.3,
      unit: DepthUnit.Meters,
    };
    site.description = 'This is a new description';
    site.directions = 'These are new directions';
    site.location = 'Cozumel, Mexico (West Side)';
    site.name = 'Palancar Reef';
    site.freeToDive = false;
    site.waterType = WaterType.Mixed;

    await site.save();

    const savedSite = await DiveSites.findOneOrFail({
      relations: ['creator'],
      where: { id: DiveSiteData.id },
    });

    expect(savedSite.depth).toEqual(24.3);
    expect(savedSite.depthUnit).toEqual(DepthUnit.Meters);
    expect(savedSite.description).toEqual('This is a new description');
    expect(savedSite.directions).toEqual('These are new directions');
    expect(savedSite.location).toEqual('Cozumel, Mexico (West Side)');
    expect(savedSite.freeToDive).toEqual(false);
    expect(savedSite.name).toEqual('Palancar Reef');
    expect(savedSite.waterType).toEqual(WaterType.Mixed);
  });

  it('will delete a dive site', async () => {
    await Users.save(regularUser);
    await DiveSites.save(diveSiteData);
    await expect(site.delete()).resolves.toBe(true);
    await expect(DiveSites.existsBy({ id: site.id })).resolves.toBe(false);
  });

  it('will delete reviews associated with a dive site when the site is deleted', async () => {
    await Users.save(regularUser);
    await DiveSites.save(diveSiteData);

    const reviewData = [
      createTestDiveSiteReview(regularUser, diveSiteData),
      createTestDiveSiteReview(regularUser, diveSiteData),
      createTestDiveSiteReview(regularUser, diveSiteData),
    ];
    await Reviews.save(reviewData);

    await expect(site.delete()).resolves.toBe(true);
    await expect(DiveSites.existsBy({ id: site.id })).resolves.toBe(false);
    await expect(
      Reviews.findBy({ site: { id: site.id } }),
    ).resolves.toHaveLength(0);
  });

  it('will return false if delete is called against a dive site that does not exist in the database', async () => {
    await expect(site.delete()).resolves.toBe(false);
  });

  it('will render dive site data as JSON', () => {
    expect(site.toJSON()).toMatchSnapshot();
  });

  describe('Reviews', () => {
    let reviewData: DiveSiteReviewEntity[];

    beforeAll(() => {
      reviewData = ReviewTestData.map((review) =>
        parseDiveSiteReviewJSON(review, regularUser, diveSiteData),
      );
    });

    beforeEach(async () => {
      await Users.save(regularUser);
      await DiveSites.save(diveSiteData);
      await Reviews.save(reviewData);
    });

    it('will retrieve a single review', async () => {
      const review = await site.getReview(reviewData[0].id);
      const expected = new DiveSiteReview(
        Reviews,
        emitter,
        reviewData[0],
      ).toJSON();
      expect(review).toBeDefined();
      expect(review?.toJSON()).toEqual(expected);
    });

    it('will return undefined if a non-existent review is requested', async () => {
      await expect(
        site.getReview('3855463c-fd1d-4539-ad45-20ecf4fe568b'),
      ).resolves.toBeUndefined();
    });

    it('will return undefined if a review is requested that is not associated with the current dive site', async () => {
      const siteData = createTestDiveSite(regularUser);
      const review = createTestDiveSiteReview(regularUser, siteData);
      await DiveSites.save(siteData);
      await Reviews.save(review);
      await expect(site.getReview(review.id)).resolves.toBeUndefined();
    });

    it('will create a new dive site review with all options', async () => {
      const options: CreateDiveSiteReviewOptions = {
        title: 'OMG! Diving!!',
        comments: 'This is a great dive site!',
        rating: 4.5,
        difficulty: 3.2,
        creatorId: regularUser.id,
      };
      const review = await site.createReview(options);
      expect(review.comments).toEqual(options.comments);
      expect(review.creator).toEqual({
        accountTier: regularUser.accountTier,
        userId: regularUser.id,
        username: regularUser.username,
        memberSince: regularUser.memberSince,
        logBookSharing: regularUser.logBookSharing,
        name: regularUser.name,
        avatar: regularUser.avatar,
        location: regularUser.location,
      });
      expect(review.difficulty).toEqual(options.difficulty);
      expect(review.rating).toEqual(options.rating);
      expect(review.title).toEqual(options.title);
      expect(review.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);

      const savedReview = await Reviews.findOneOrFail({
        where: { id: review.id },
        relations: ['creator', 'site'],
      });

      expect(savedReview.comments).toEqual(options.comments);
      expect(savedReview.creator.id).toEqual(regularUser.id);
      expect(savedReview.difficulty).toEqual(options.difficulty);
      expect(savedReview.site.id).toEqual(site.id);
      expect(savedReview.rating).toEqual(options.rating);
      expect(savedReview.title).toEqual(options.title);
      expect(savedReview.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    it('will create a new review with minimal options', async () => {
      const options: CreateDiveSiteReviewOptions = {
        title: 'OMG! Diving!!',
        rating: 4.5,
        creatorId: regularUser.id,
      };
      const review = await site.createReview(options);
      expect(review.comments).toBeUndefined();
      expect(review.creator).toEqual({
        accountTier: regularUser.accountTier,
        userId: regularUser.id,
        username: regularUser.username,
        logBookSharing: regularUser.logBookSharing,
        memberSince: regularUser.memberSince,
        name: regularUser.name,
        avatar: regularUser.avatar,
        location: regularUser.location,
      });
      expect(review.difficulty).toBeUndefined();
      expect(review.rating).toEqual(options.rating);
      expect(review.title).toEqual(options.title);
      expect(review.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);

      const savedReview = await Reviews.findOneOrFail({
        where: { id: review.id },
        relations: ['creator', 'site'],
      });

      expect(savedReview.comments).toBeNull();
      expect(savedReview.creator.id).toEqual(regularUser.id);
      expect(savedReview.difficulty).toBeNull();
      expect(savedReview.site.id).toEqual(site.id);
      expect(savedReview.rating).toEqual(options.rating);
      expect(savedReview.title).toEqual(options.title);
      expect(savedReview.createdOn?.valueOf()).toBeCloseTo(Date.now(), -3);
    });

    [
      { sortBy: DiveSiteReviewsSortBy.Rating, sortOrder: SortOrder.Ascending },
      { sortBy: DiveSiteReviewsSortBy.Rating, sortOrder: SortOrder.Descending },
      {
        sortBy: DiveSiteReviewsSortBy.CreatedOn,
        sortOrder: SortOrder.Ascending,
      },
      {
        sortBy: DiveSiteReviewsSortBy.CreatedOn,
        sortOrder: SortOrder.Descending,
      },
    ].forEach(({ sortBy, sortOrder }) => {
      it(`will list reviews sorted by ${sortBy} in ${sortOrder} order`, async () => {
        const results = await site.listReviews({
          sortBy,
          sortOrder,
          skip: 0,
          limit: 10,
        });

        expect(results.totalCount).toBe(100);

        const reviews = results.reviews.map((r) => ({
          title: r.title,
          rating: r.rating,
          createdOn: r.createdOn,
        }));
        expect(reviews).toMatchSnapshot();
      });
    });

    it('will list reviews with pagination', async () => {
      const results = await site.listReviews({
        sortBy: DiveSiteReviewsSortBy.Rating,
        sortOrder: SortOrder.Descending,
        skip: 20,
        limit: 28,
      });

      expect(results.totalCount).toBe(100);
      expect(results.reviews).toHaveLength(28);
      expect(
        results.reviews.map((review) => ({
          title: review.title,
          rating: review.rating,
        })),
      ).toMatchSnapshot();
    });

    it('will throw an error if user attempts to review the same site twice within 48 hours.', async () => {
      await site.createReview({
        title: 'OMG! Diving!!',
        rating: 4.5,
        creatorId: regularUser.id,
      });
      await expect(
        site.createReview({
          title: 'OMG! Another review!!',
          rating: 4.5,
          creatorId: regularUser.id,
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});
