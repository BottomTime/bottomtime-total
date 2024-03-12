import {
  DepthUnit,
  DiveSitesSortBy,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import { DiveSiteEntity, UserEntity } from '../../../src/data';
import {
  CreateDiveSiteOptions,
  DiveSitesService,
} from '../../../src/diveSites';
import { dataSource } from '../../data-source';
import DiveSiteTestData from '../../fixtures/dive-sites.json';
import { createTestUser } from '../../utils';
import { parseDiveSiteJSON } from '../../utils/create-test-dive-site';

jest.mock('uuid');

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
};

describe('Dive Site Service', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;

  let service: DiveSitesService;
  let regularUser: UserEntity;
  let otherUser: UserEntity;
  let diveSiteData: DiveSiteEntity[];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);

    regularUser = createTestUser(RegularUserData);
    otherUser = createTestUser();
    service = new DiveSitesService(DiveSites);

    regularUser = createTestUser(RegularUserData);

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
      const options: CreateDiveSiteOptions = {
        creator: RegularUserId,
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
      expect(site.id).toHaveLength(36);
      expect(site.createdOn.valueOf()).toBeCloseTo(Date.now(), -2);

      expect(site.toJSON()).toEqual({
        ...site.toJSON(),
        creator: {
          userId: RegularUserId,
          username: RegularUserData.username,
          memberSince: RegularUserData.memberSince,
        },
        name: options.name,
        location: options.location,
        description: options.description,
        depth: options.depth,
        freeToDive: options.freeToDive,
        directions: options.directions,
        shoreAccess: options.shoreAccess,
        gps: options.gps,
      });

      const savedSite = await DiveSites.findOneByOrFail({ id: site.id });
      expect(savedSite).toMatchSnapshot();
    });

    it('will create a new dive site with minimal information', async () => {
      const options: CreateDiveSiteOptions = {
        creator: RegularUserId,
        name: 'Test Site',
        location: 'San Diego, CA',
      };
      const site = await service.createDiveSite(options);
      expect(site.id).toHaveLength(36);
      expect(site.createdOn.valueOf()).toBeCloseTo(Date.now(), -2);

      expect(site.toJSON()).toEqual({
        ...site.toJSON(),
        creator: {
          userId: RegularUserId,
          username: RegularUserData.username,
          memberSince: RegularUserData.memberSince,
        },
        name: options.name,
        location: options.location,
      });

      const savedSite = await DiveSites.findOneByOrFail({ id: site.id });
      expect(savedSite).toMatchSnapshot();
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

        const sites = results.sites.map((site) => site.toJSON());

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

      const sites = results.sites.map((site) => site.toJSON());

      expect(results.totalCount).toEqual(200);
      expect(results.sites).toHaveLength(8);
      expect(sites).toMatchSnapshot();
    });

    it.skip('will perform text-based searches', async () => {
      const results = await service.searchDiveSites({
        query: 'inexperienced lauderdale',
        skip: 0,
        limit: 50,
        radius: 50,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      const sites = results.sites.map((site) => site.toJSON());
      expect(results.totalCount).toEqual(2);
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

      const sites = results.sites.map((site) => site.toJSON());
      expect(results.totalCount).toEqual(6);
      expect(sites).toMatchSnapshot();
    });

    [
      { name: 'freeToDive', value: true, expectedCount: 98 },
      { name: 'freeToDive', value: false, expectedCount: 102 },
      { name: 'shoreAccess', value: true, expectedCount: 84 },
      { name: 'shoreAccess', value: false, expectedCount: 116 },
    ].forEach((testCase) => {
      it(`will filter results when ${testCase.name} is ${testCase.value}`, async () => {
        const results = await service.searchDiveSites({
          [testCase.name]: testCase.value,
          skip: 0,
          limit: 8,
          radius: 50,
          sortBy: DiveSitesSortBy.Name,
          sortOrder: SortOrder.Ascending,
        });

        const sites = results.sites.map((site) => site.toJSON());
        expect(results.totalCount).toEqual(testCase.expectedCount);
        expect(sites).toMatchSnapshot();
      });
    });

    [
      { name: 'short', distance: 20, expectedCount: 1 },
      { name: 'medium', distance: 150, expectedCount: 2 },
      { name: 'long', distance: 500, expectedCount: 5 },
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

        const sites = results.sites.map((site) => site.toJSON());
        expect(results.totalCount).toEqual(testCase.expectedCount);
        expect(sites).toMatchSnapshot();
      });
    });

    it('will filter results by rating', async () => {
      const results = await service.searchDiveSites({
        rating: { min: 3.1, max: 3.5 },
        radius: 50,
        skip: 0,
        limit: 5,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      const sites = results.sites.map((site) => site.toJSON());
      expect(results.totalCount).toBe(20);
      expect(sites).toMatchSnapshot();
    });

    it('will filter results by difficulty', async () => {
      const results = await service.searchDiveSites({
        difficulty: { min: 2.2, max: 2.7 },
        radius: 50,
        skip: 0,
        limit: 5,
        sortBy: DiveSitesSortBy.Rating,
        sortOrder: SortOrder.Descending,
      });

      const sites = results.sites.map((site) => site.toJSON());
      expect(results.totalCount).toBe(28);
      expect(sites).toMatchSnapshot();
    });
  });
});
