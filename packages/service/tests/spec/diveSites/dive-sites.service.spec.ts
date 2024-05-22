import {
  DepthUnit,
  DiveSitesSortBy,
  LogBookSharing,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import { DiveSiteEntity, UserEntity } from '../../../src/data';
import {
  CreateDiveSiteOptions,
  DiveSiteFactory,
  DiveSitesService,
} from '../../../src/diveSites';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import DiveSiteTestData from '../../fixtures/dive-sites.json';
import { createTestUser } from '../../utils';
import { createDiveSiteFactory } from '../../utils/create-dive-site-factory';
import { parseDiveSiteJSON } from '../../utils/create-test-dive-site';

jest.mock('uuid');

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  logBookSharing: LogBookSharing.FriendsOnly,
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  name: 'Joe Regular',
  location: 'San Diego, CA',
  avatar: 'https://example.com/avatar.jpg',
};

const OtherUserData: Partial<UserEntity> = {
  id: '5a4699d8-48c4-4410-9886-b74b8b85cac2',
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  username: 'Other.User',
  logBookSharing: LogBookSharing.Public,
  usernameLowered: 'other.user',
  role: UserRole.User,
  name: 'Other User',
  location: 'Toronto, ON',
  avatar: 'https://example.com/other-avatar.jpg',
};

describe('Dive Site Service', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let siteFactory: DiveSiteFactory;

  let service: DiveSitesService;
  let regularUser: UserEntity;
  let otherUser: UserEntity;
  let diveSiteData: DiveSiteEntity[];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    siteFactory = createDiveSiteFactory();

    regularUser = createTestUser(RegularUserData);
    otherUser = createTestUser(OtherUserData);
    service = new DiveSitesService(DiveSites, siteFactory);

    diveSiteData = DiveSiteTestData.map((data, index) =>
      parseDiveSiteJSON(data, index % 2 === 0 ? regularUser : otherUser),
    );
  });

  beforeEach(async () => {
    await Users.save([regularUser, otherUser]);
  });

  describe('when retrieving a dive site', () => {
    let diveSite: DiveSiteEntity;

    beforeEach(async () => {
      diveSite = diveSiteData[6];
      await DiveSites.save(diveSite);
    });

    it('will return the requested dive site', async () => {
      const site = await service.getDiveSite(diveSite.id);
      expect(site).toMatchSnapshot();
    });

    it('will return undefined if the dive site does not exist', async () => {
      const site = await service.getDiveSite(
        '00000000-0000-0000-0000-000000000000',
      );
      expect(site).toBeUndefined();
    });
  });

  describe('when creating a new dive site', () => {
    const GeneratedId = '00000000-0000-0000-0000-000000000000';
    const Now = new Date('2024-01-08T13:33:52.364Z');

    beforeAll(() => {
      jest.useFakeTimers({
        doNotFake: ['nextTick', 'setImmediate'],
        now: Now,
      });
    });

    beforeEach(() => {
      jest.spyOn(uuid, 'v4').mockReturnValue(GeneratedId);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('will create a new site and save it to the database', async () => {
      const creator = new User(Users, regularUser);
      const options: CreateDiveSiteOptions = {
        creator,
        name: 'Test Site',
        location: 'San Diego, CA',
        description: 'This is a test site.',
        depth: { depth: 40, unit: DepthUnit.Feet },
        freeToDive: true,
        directions: 'Go to San Diego and then go to the beach.',
        shoreAccess: true,
        gps: {
          lat: 32.7157,
          lon: -117.1611,
        },
      };
      const site = await service.createDiveSite(options);
      expect(site.createdOn.valueOf()).toBeCloseTo(Date.now(), -2);

      expect(site.creator.userId).toEqual(RegularUserId);
      expect(site.toJSON()).toEqual({
        ...site.toJSON(),
        creator: site.creator,
        name: options.name,
        location: options.location,
        description: options.description,
        depth: options.depth,
        freeToDive: options.freeToDive,
        directions: options.directions,
        shoreAccess: options.shoreAccess,
        gps: options.gps,
      });

      const savedSite = await DiveSites.findOneOrFail({
        relations: ['creator'],
        where: { id: site.id },
      });
      expect(savedSite.id).toEqual(GeneratedId);
      expect(savedSite.creator.id).toEqual(RegularUserId);
      expect(savedSite.name).toEqual(options.name);
      expect(savedSite.location).toEqual(options.location);
      expect(savedSite.description).toEqual(options.description);
      expect(savedSite.depth).toEqual(options.depth!.depth);
      expect(savedSite.depthUnit).toEqual(options.depth!.unit);
      expect(savedSite.freeToDive).toEqual(options.freeToDive);
      expect(savedSite.directions).toEqual(options.directions);
      expect(savedSite.shoreAccess).toEqual(options.shoreAccess);
      expect(savedSite.gps).toEqual({
        type: 'Point',
        coordinates: [options.gps!.lon, options.gps!.lat],
      });
    });

    it('will create a new dive site with minimal information', async () => {
      const creator = new User(Users, regularUser);
      const options: CreateDiveSiteOptions = {
        creator,
        name: 'Test Site',
        location: 'San Diego, CA',
      };
      const site = await service.createDiveSite(options);
      expect(site.id).toHaveLength(36);
      expect(site.createdOn.valueOf()).toBeCloseTo(Date.now(), -2);

      expect(site.creator.userId).toEqual(RegularUserId);
      expect(site.toJSON()).toEqual({
        ...site.toJSON(),
        creator: site.creator,
        name: options.name,
        location: options.location,
      });

      const savedSite = await DiveSites.findOneOrFail({
        relations: ['creator'],
        where: { id: site.id },
      });
      expect(savedSite.id).toBe(GeneratedId);
      expect(savedSite.creator.id).toBe(RegularUserId);
      expect(savedSite.name).toBe(options.name);
      expect(savedSite.location).toBe(options.location);

      expect(savedSite.description).toBeNull();
      expect(savedSite.depth).toBeNull();
      expect(savedSite.depthUnit).toBeNull();
      expect(savedSite.freeToDive).toBeNull();
      expect(savedSite.directions).toBeNull();
      expect(savedSite.shoreAccess).toBeNull();
      expect(savedSite.gps).toBeNull();
    });
  });

  describe('when searching dive sites', () => {
    beforeEach(async () => {
      await DiveSites.save(diveSiteData);
    });

    [
      { sortBy: DiveSitesSortBy.Name, sortOrder: SortOrder.Ascending },
      { sortBy: DiveSitesSortBy.Name, sortOrder: SortOrder.Descending },
      { sortBy: DiveSitesSortBy.Rating, sortOrder: SortOrder.Ascending },
      { sortBy: DiveSitesSortBy.Rating, sortOrder: SortOrder.Descending },
    ].forEach((testCase) => {
      it(`Will sort by ${testCase.sortBy} in ${testCase.sortOrder} order`, async () => {
        const results = await service.searchDiveSites({
          radius: 50,
          sortBy: testCase.sortBy,
          sortOrder: testCase.sortOrder,
          skip: 0,
          limit: 5,
        });

        const sites = results.sites.map((site) => ({
          name: site.name,
          rating: site.averageRating,
        }));

        expect(results.totalCount).toEqual(200);
        expect(results.sites).toHaveLength(5);
        expect(sites).toMatchSnapshot();
      });
    });

    it('will allow pagination of results', async () => {
      const results = await service.searchDiveSites({
        radius: 50,
        sortBy: DiveSitesSortBy.Name,
        sortOrder: SortOrder.Ascending,
        skip: 80,
        limit: 8,
      });

      const sites = results.sites.map((site) => site.name);

      expect(results.totalCount).toEqual(200);
      expect(results.sites).toHaveLength(8);
      expect(sites).toMatchSnapshot();
    });

    it('will perform text-based searches', async () => {
      const results = await service.searchDiveSites({
        query: 'lake dolore',
        skip: 0,
        limit: 50,
        radius: 50,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      const sites = results.sites.map((site) => site.toJSON());
      expect(results.totalCount).toEqual(10);
      expect(sites).toMatchSnapshot();
    });

    it('will filter results by creator', async () => {
      const results = await service.searchDiveSites({
        creator: otherUser.id,
        skip: 0,
        limit: 10,
        radius: 50,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      expect(results.totalCount).toEqual(100);
      results.sites.forEach((site) => {
        expect(site.creator.userId).toEqual(otherUser.id);
      });
    });

    [
      { name: 'freeToDive', value: true, expectedCount: 89 },
      { name: 'freeToDive', value: false, expectedCount: 59 },
      { name: 'shoreAccess', value: true, expectedCount: 78 },
      { name: 'shoreAccess', value: false, expectedCount: 78 },
    ].forEach((testCase) => {
      it(`will filter results when ${testCase.name} is ${testCase.value}`, async () => {
        const results = await service.searchDiveSites({
          [testCase.name]: testCase.value,
          skip: 0,
          limit: 30,
          radius: 50,
          sortBy: DiveSitesSortBy.Name,
          sortOrder: SortOrder.Ascending,
        });

        expect(results.totalCount).toEqual(testCase.expectedCount);
        results.sites.forEach((site) => {
          if (testCase.name === 'freeToDive') {
            expect(site.freeToDive).toBe(testCase.value);
          } else {
            expect(site.shoreAccess).toBe(testCase.value);
          }
        });
      });
    });

    [
      { name: 'short', distance: 20, expectedCount: 1 },
      { name: 'medium', distance: 200, expectedCount: 1 },
      { name: 'long', distance: 900, expectedCount: 2 },
    ].forEach((testCase) => {
      it(`will filter results by distance using ${testCase.name} distance`, async () => {
        const results = await service.searchDiveSites({
          location: {
            lon: DiveSiteTestData[30].gps.coordinates[0],
            lat: DiveSiteTestData[30].gps.coordinates[1],
          },
          radius: testCase.distance,
          skip: 0,
          limit: 50,
          sortBy: DiveSitesSortBy.Rating,
          sortOrder: SortOrder.Descending,
        });

        const sites = results.sites.map((site) => site.gps);
        expect(results.totalCount).toEqual(testCase.expectedCount);
        expect(sites).toMatchSnapshot();
      });
    });

    it('will filter results by rating', async () => {
      const results = await service.searchDiveSites({
        rating: { min: 3.1, max: 3.5 },
        radius: 50,
        skip: 0,
        limit: 100,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      expect(results.totalCount).toBe(23);
      results.sites.forEach((site) => {
        expect(site.averageRating).toBeGreaterThanOrEqual(3.1);
        expect(site.averageRating).toBeLessThanOrEqual(3.5);
      });
    });

    it('will filter results by difficulty', async () => {
      const results = await service.searchDiveSites({
        difficulty: { min: 2.2, max: 2.7 },
        radius: 50,
        skip: 0,
        limit: 100,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      expect(results.totalCount).toBe(18);
      results.sites.forEach((site) => {
        expect(site.averageDifficulty).toBeGreaterThanOrEqual(2.2);
        expect(site.averageDifficulty).toBeLessThanOrEqual(2.7);
      });
    });
  });
});
