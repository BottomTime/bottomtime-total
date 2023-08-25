import { Collection } from 'mongodb';
import { faker } from '@faker-js/faker';
import { Mock } from 'moq.ts';
import * as uuid from 'uuid';

import {
  Collections,
  DiveSiteDocument,
  DiveSiteSchema,
  UserDocument,
  UserSchema,
} from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import {
  DefaultDiveSite,
  DefaultDiveSiteManager,
  DiveSiteData,
  DiveSiteManager,
  DiveSitesSortBy,
  SearchDiveSitesOptions,
} from '../../../src/diveSites';
import { fakeDiveSite } from '../../fixtures/fake-dive-site';
import { fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { Profile, User } from '../../../src/users';
import { ValidationError } from '../../../src/errors';
import { SortOrder } from '../../../src/constants';

import DiveSiteCreators from '../../fixtures/dive-site-creators.json';
import DiveSites from '../../fixtures/dive-sites.json';

const log = createTestLogger('default-dive-site-manager');
jest.mock('uuid');

describe('Default Dive Site Manager', () => {
  let Sites: Collection<DiveSiteDocument>;
  let Users: Collection<UserDocument>;
  let Creator: User;

  beforeAll(() => {
    const db = mongoClient.db();
    Sites = db.collection(Collections.DiveSites);
    Users = db.collection(Collections.Users);
    const profile = new Mock<Profile>()
      .setup((p) => p.name)
      .returns('Jacky Michaelson')
      .object();
    Creator = new Mock<User>()
      .setup((u) => u.id)
      .returns('379b88ad-d679-41ee-aa3e-af21deeb5568')
      .setup((u) => u.username)
      .returns('Jacky47')
      .setup((u) => u.profile)
      .returns(profile)
      .object();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Will retrieve a dive site from the database', async () => {
    const creatorData = fakeUser();
    const siteData = fakeDiveSite({ creator: creatorData._id });
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    const expected = new DefaultDiveSite(mongoClient, log, siteData);
    await Promise.all([
      Users.insertOne(creatorData),
      Sites.insertOne(siteData),
    ]);

    const actual = await manager.getDiveSite(siteData._id);

    expect(actual).toEqual(expected);
  });

  it('Will return undefined when retrieving a dive site that does not exist', async () => {
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    await expect(
      manager.getDiveSite(faker.datatype.uuid()),
    ).resolves.toBeUndefined();
  });

  it('Will create a new dive stie with minimal options', async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-07-20T11:47:36.692Z'),
    });
    jest
      .spyOn(uuid, 'v4')
      .mockReturnValue('51a4b91e-eef0-40d9-b353-1feb666f3c1f');

    const options: DiveSiteData = {
      name: "Smuggler's Plane",
      location: 'Somewhere in the Bahamas',
    };
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    const site = await manager.createDiveSite(options, Creator);
    jest.runAllTimers();

    expect(site).toMatchSnapshot();
  });

  it('Will create a new dive site with all options set', async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-07-20T11:47:36.692Z'),
    });
    jest
      .spyOn(uuid, 'v4')
      .mockReturnValue('51a4b91e-eef0-40d9-b353-1feb666f3c1f');

    const options: DiveSiteData = {
      name: 'Chac Mool Cenote',
      description: 'A sweet cavern dive near Playa del Carmen',
      location: 'Play del Carmen, Mexico',
      directions:
        'Take highway 307 West from Playa del Carmen til ya get there.',
      gps: {
        lat: 20.513109539132362,
        lon: -87.24704767409908,
      },
      freeToDive: false,
      shoreAccess: true,
    };
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    const site = await manager.createDiveSite(options, Creator);
    jest.runAllTimers();

    expect(site).toMatchSnapshot();
  });

  it('Will throw a ValidationError when attempting to create a dive site with invalid options', async () => {
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    await expect(
      manager.createDiveSite(
        {
          name: '',
          location: 'Somewhere',
          gps: {
            lat: -9000,
            lon: 8080,
          },
        },
        Creator,
      ),
    ).rejects.toThrowError(ValidationError);
  });

  describe('Searching dive sites', () => {
    let diveSiteCreators: UserDocument[];
    let diveSites: DiveSiteDocument[];
    let manager: DiveSiteManager;

    beforeAll(() => {
      manager = new DefaultDiveSiteManager(mongoClient, log);
      diveSiteCreators = DiveSiteCreators.map((creator) =>
        UserSchema.parse(creator),
      );
      diveSites = DiveSites.map((site) => DiveSiteSchema.parse(site));
    });

    beforeEach(async () => {
      await Promise.all([
        Users.insertMany(diveSiteCreators),
        Sites.insertMany(diveSites),
      ]);
    });

    it('Will search based on a query string', async () => {
      const sites = await manager.searchDiveSites({
        query: 'celebrated spain pariatur',
        limit: 5,
      });
      expect(sites).toMatchSnapshot();
    });

    [true, false].forEach((shoreAccess) => {
      it(`Will filter based on shore access: ${shoreAccess}`, async () => {
        const sites = await manager.searchDiveSites({
          shoreAccess,
        });
        expect(sites.length).toBeGreaterThan(0);
        for (const site of sites) {
          expect(site.shoreAccess).toBe(shoreAccess);
        }
      });
    });

    [true, false].forEach((freeToDive) => {
      it(`Will filter based on "free to dive": ${freeToDive}`, async () => {
        const sites = await manager.searchDiveSites({
          freeToDive,
        });
        expect(sites.length).toBeGreaterThan(0);
        for (const site of sites) {
          expect(site.freeToDive).toBe(freeToDive);
        }
      });
    });

    [undefined, 10, 50, 500].forEach((radius) => {
      it(`Will filter by location with radius: ${radius}`, async () => {
        const sites = await manager.searchDiveSites({
          location: { lon: -76.4, lat: 39.0 },
          radius,
        });
        expect(sites).toMatchSnapshot();
      });
    });

    it('Will filter based on rating range', async () => {
      const sites = await manager.searchDiveSites({
        rating: {
          min: 4.5,
          max: 4.9,
        },
        limit: 6,
      });
      expect(sites).toMatchSnapshot();
    });

    it('Will filter based on difficulty range', async () => {
      const sites = await manager.searchDiveSites({
        difficulty: {
          min: 1.5,
          max: 1.8,
        },
        limit: 6,
      });
      expect(sites).toMatchSnapshot();
    });

    it('Will filter by creator', async () => {
      const sites = await manager.searchDiveSites({
        creator: diveSiteCreators[0].username.toUpperCase(),
      });
      expect(sites.length).toBeGreaterThan(0);
      for (const site of sites) {
        await expect(site.getCreator()).resolves.toEqual({
          avatar: diveSiteCreators[0].profile!.avatar,
          displayName: diveSiteCreators[0].profile!.name,
          id: diveSiteCreators[0]._id,
          username: diveSiteCreators[0].username,
          memberSince: diveSiteCreators[0].memberSince,
        });
      }
    });

    it('Will return no results if creator cannot be found', async () => {
      const sites = await manager.searchDiveSites({
        creator: 'no-such-user',
      });
      expect(sites).toHaveLength(0);
    });

    it('Will allow pagination', async () => {
      const sites = await manager.searchDiveSites({
        skip: 12,
        limit: 6,
      });
      expect(sites).toMatchSnapshot();
    });

    [
      { sortBy: DiveSitesSortBy.Name, sortOrder: SortOrder.Ascending },
      { sortBy: DiveSitesSortBy.Name, sortOrder: SortOrder.Descending },
      { sortBy: DiveSitesSortBy.Rating, sortOrder: SortOrder.Ascending },
      { sortBy: DiveSitesSortBy.Rating, sortOrder: SortOrder.Descending },
    ].forEach((testCase) => {
      it(`Will sort results by ${testCase.sortBy} in ${testCase.sortOrder} order`, async () => {
        const sites = await manager.searchDiveSites({
          sortBy: testCase.sortBy,
          sortOrder: testCase.sortOrder,
          limit: 5,
        });
        expect(sites).toMatchSnapshot();
      });
    });

    const validationTests: { name: string; options: SearchDiveSitesOptions }[] =
      [
        {
          name: 'Query is too long',
          options: { query: faker.lorem.sentences(6) },
        },

        {
          name: 'Latitude is less than -90',
          options: {
            location: {
              lat: -90.1,
              lon: 80,
            },
          },
        },
        {
          name: 'Latitude is greater than 90',
          options: {
            location: {
              lat: 90.1,
              lon: 80,
            },
          },
        },
        {
          name: 'Longitude is less than -180',
          options: {
            location: {
              lat: 14,
              lon: -180.1,
            },
          },
        },
        {
          name: 'Longitude is greater than 180',
          options: {
            location: {
              lat: 14,
              lon: 180.1,
            },
          },
        },

        {
          name: 'Search radius is 0',
          options: {
            radius: 0,
          },
        },
        {
          name: 'Search radius is greater than 500km',
          options: {
            radius: 501,
          },
        },

        {
          name: 'Rating min is less than 1',
          options: {
            rating: {
              min: 0.5,
              max: 5,
            },
          },
        },
        {
          name: 'Rating min is greater than 5',
          options: {
            rating: {
              min: 5.5,
              max: 5,
            },
          },
        },
        {
          name: 'Rating max is less than min',
          options: {
            rating: {
              min: 2.5,
              max: 2.4,
            },
          },
        },
        {
          name: 'Rating max is grearter than 5',
          options: {
            rating: {
              min: 2.5,
              max: 5.4,
            },
          },
        },

        {
          name: 'Difficulty min is less than 1',
          options: {
            difficulty: {
              min: 0.5,
              max: 5,
            },
          },
        },
        {
          name: 'Difficulty min is greater than 5',
          options: {
            difficulty: {
              min: 5.5,
              max: 5,
            },
          },
        },
        {
          name: 'Difficulty max is less than min',
          options: {
            difficulty: {
              min: 2.5,
              max: 2.4,
            },
          },
        },
        {
          name: 'Difficulty max is grearter than 5',
          options: {
            difficulty: {
              min: 2.5,
              max: 5.4,
            },
          },
        },

        {
          name: 'Creator is not a valid username',
          options: {
            creator: 'Lol! Invalid',
          },
        },

        {
          name: 'Skip is negative',
          options: {
            skip: -1,
          },
        },
        {
          name: 'Skip is not an integer',
          options: {
            skip: 12.2,
          },
        },
        {
          name: 'Limit is less than 1',
          options: {
            limit: 0,
          },
        },
        {
          name: 'Limit is greater than 500',
          options: {
            limit: 501,
          },
        },
        {
          name: 'Limit is not an integer',
          options: {
            limit: 50.8,
          },
        },
      ];

    validationTests.forEach((testCase) => {
      it(`Will throw an exception on invalid search options: ${testCase.name}`, async () => {
        await expect(
          manager.searchDiveSites(testCase.options),
        ).rejects.toThrowError(ValidationError);
      });
    });
  });
});
