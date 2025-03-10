import mockFetch from 'fetch-mock-jest';

import {
  ApiList,
  BuddyType,
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntrySignatureDTO,
  CreateOrUpdateOperatorReviewDTO,
  DepthUnit,
  DiveSiteDTO,
  ExposureSuit,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntryDTO,
  LogEntrySignatureDTO,
  LogEntrySortBy,
  PressureUnit,
  SearchDiveSitesResponseSchema,
  SortOrder,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '../../src';
import { Fetcher } from '../../src/client/fetcher';
import { LogEntriesApiClient } from '../../src/client/log-entries';
import { TestAgencies } from '../fixtures/agencies';
import DiveSiteTestData from '../fixtures/dive-sites-search-results.json';
import LogEntryTestData from '../fixtures/log-entries-search-results.json';
import { TestSignatures } from '../fixtures/log-entry-signatures';
import { BasicUser, UserWithEmptyProfile } from '../fixtures/users';

const timestamp = new Date('2024-04-30T20:48:16.436Z');
const PartialTestData: LogEntryDTO = {
  id: 'bf1d4299-0c0b-47d4-bde1-d51f3573139b',
  createdAt: new Date('2024-07-23T12:09:55Z').valueOf(),
  timing: {
    entryTime: timestamp.valueOf(),
    timezone: 'Pacific/Pohnpei',
    duration: 45.5,
  },
  creator: BasicUser.profile,
};
const FullTestData: LogEntryDTO = {
  ...PartialTestData,
  conditions: {
    airTemperature: 80,
    surfaceTemperature: 78,
    bottomTemperature: 72,
    temperatureUnit: TemperatureUnit.Fahrenheit,
    chop: 2,
    current: 3,
    weather: 'Sunny',
    visibility: 4,
  },
  createdAt: new Date('2024-07-23T12:09:55Z').valueOf(),
  updatedAt: new Date('2024-07-23T12:09:55Z').valueOf(),
  site: {
    id: 'f0c5b4d4-2d1d-4b5d-8e7d-9b7a4d4b8f1d',
    name: 'The Wreck of the RMS Titanic',
    location: 'Atlantic Ocean',
  },
  timing: {
    ...PartialTestData.timing,
    bottomTime: 40.2,
  },
  logNumber: 444,
  depths: {
    averageDepth: 55.3,
    maxDepth: 92.3,
    depthUnit: DepthUnit.Feet,
  },
  equipment: {
    weight: 10,
    weightUnit: WeightUnit.Pounds,
    weightCorrectness: WeightCorrectness.Good,
    trimCorrectness: TrimCorrectness.Good,
    exposureSuit: ExposureSuit.Wetsuit5mm,
    hood: true,
    gloves: true,
    boots: true,
    camera: true,
    torch: true,
    scooter: true,
  },
  notes: 'Sick shipwreck!',
  air: [
    {
      name: 'lean photographer',
      material: TankMaterial.Aluminum,
      workingPressure: 300,
      volume: 4,
      count: 1,
      startPressure: 227.7898846170865,
      endPressure: 69.807624156354,
      pressureUnit: PressureUnit.Bar,
      o2Percent: 27.6,
    },
  ],
  tags: ['wreck', 'deep', 'cold'],
};

const RecentDiveOperators = [
  {
    active: true,
    createdAt: 1739204161841,
    description:
      'Dan’s was purchased by Matt Mandziuk who has had a big set of shoes to fill as Dan backs out slowly into retirement. We have enjoyed the new concepts Matt continues to bring to the store, as well as fresh and fun ideas. There are always many new and exciting changes with Matt at the helm. While most things have remained the same, the main goals have been to get things running more efficiently and to make the sport more accessible to everyone involved. One of the most successful changes within the brand was offering in-store financing, renovating the layout of the store, as well as the addition of a number of great new dive trips and charters. Our goal as a shop is to keep expanding, growing and improving at every turn.\nMatt’s vision for the Dan’s brand has also expanded into the creation of Divers Edge – our technical dive training arm. With a solid and proven foundation of recreational diving, the Divers Edge brand aims to further technical diving and exploration with some exciting new projects and trips specific to technical divers.\n\n2024 is going to be our 50th anniversary of Dan’s Dive Shop. To hit the Forty year mark in any business is a huge achievement – let alone the dive business – is no easy task. We couldn’t have done it without you – our customers and students. It’s been a great ride full of learning, improvement, more learning and lots of bubbles!\n\nThank you for your continued support of the DDS brand and we look forward to adding more to our history!\n\nSee you in the water,\nThe DDS family.',
    email: 'admin@dansdiveshop.ca',
    gps: {
      lat: 43.1708282,
      lon: -79.2268426,
    },
    id: '0194f0a5-7131-7bb9-95d2-a7f833eff151',
    name: "Dan's Dive Shop",
    owner: {
      accountTier: 200,
      userId: 'cb12fb5b-f1b3-499f-a6ae-dfb467d3d2d1',
      username: 'Chris',
      memberSince: 1713361114242,
      logBookSharing: 'private',
      avatar: '/api/users/Chris/avatar',
      location: 'Cambridge, ON',
      name: 'Chris Carleton',
    },
    socials: {
      facebook: 'dansdiveshop',
      instagram: 'dansdiveshop',
      tiktok: 'dansdiveshop',
      twitter: 'dansdiveshop',
      youtube: 'dansdiveshop',
    },
    updatedAt: 1739206823938,
    address: '329 Welland Ave, St. Catharines, ON L2R 2R2, Canada',
    logo: '/api/operators/dans-dive-shop/logo',
    phone: '(800) 268-3267',
    slug: 'dans-dive-shop',
    verificationStatus: 'unverified',
    website: 'https://dansdiveshop.ca/',
  },
];

const RecentDiveSites = [
  {
    id: 'af6294af-89e4-49ea-80af-967de0f336cd',
    creator: {
      accountTier: 0,
      userId: '179bebf1-cc41-48cf-88aa-0f886c01e74f',
      username: 'Ford_Kris',
      memberSince: 1550661767372,
      logBookSharing: 'private',
      avatar:
        'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1189.jpg',
      location: 'Cheyenne, VT, NR',
      name: 'Ford Kris',
    },
    createdOn: 1678720808407,
    name: 'agreeable, private eardrum',
    location: 'Maximilliaborough, WA, PS',
    directions:
      'Civitas trans nobis conventus compello aro. Carcer villa vulariter apparatus benevolentia. Tergeo tabula terminatio tres magni atavus adicio certus.',
    freeToDive: false,
    shoreAccess: true,
    averageRating: 4.4,
    averageDifficulty: 1.3,
  },
  {
    id: '2358f771-1bda-4792-895a-15ab916ab569',
    creator: {
      accountTier: 0,
      userId: 'bc1d6cad-6189-4f44-a9f1-0f095b6cd0ff',
      username: 'Kaelyn.Muller80',
      memberSince: 1421637069831,
      logBookSharing: 'private',
      avatar:
        'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1158.jpg',
      location: 'Henderson, NE, CG',
      name: 'Kaelyn Muller',
    },
    createdOn: 1589163161228,
    name: 'authentic, key crate',
    depth: {
      depth: 104.7,
      unit: 'ft',
    },
    location: 'Fort Morton, NH, KG',
    directions:
      'Cometes tempora officiis commodi taceo somnus audeo odit ars cupiditate. Teres attonbitus amplitudo autus titulus ventus. Vicissitudo suggero tamquam tunc sopor adficio capitulus.',
    gps: {
      lon: 111.4163,
      lat: -61.5161,
    },
    freeToDive: false,
    shoreAccess: false,
    averageRating: 2,
    averageDifficulty: 4.9,
  },
];

describe('Log entries API client', () => {
  let fetcher: Fetcher;
  let client: LogEntriesApiClient;
  let logEntryData: ApiList<LogEntryDTO>;
  let diveSiteData: ApiList<DiveSiteDTO>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new LogEntriesApiClient(fetcher);
    logEntryData = ListLogEntriesResponseSchema.parse(LogEntryTestData);
    diveSiteData = SearchDiveSitesResponseSchema.parse(DiveSiteTestData);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return a list of log entries', async () => {
    const username = 'greg';
    const params: ListLogEntriesParamsDTO = {
      query: 'sam',
      startDate: new Date('2021-01-01').valueOf(),
      endDate: new Date('2021-12-31').valueOf(),
      limit: 800,
      skip: 20,
      sortBy: LogEntrySortBy.EntryTime,
      sortOrder: SortOrder.Ascending,
    };
    mockFetch.get(
      {
        url: `/api/users/${username}/logbook`,
        query: {
          ...params,
          startDate: new Date(params.startDate!).valueOf(),
          endDate: new Date(params.endDate!).valueOf(),
          skip: params.skip,
          limit: params.limit,
        },
      },
      {
        status: 200,
        body: logEntryData,
      },
    );

    const result = await client.listLogEntries(username, params);

    expect(result.totalCount).toBe(logEntryData.totalCount);

    result.data.forEach((entry, index) => {
      expect(entry).toEqual(logEntryData.data[index]);
    });
  });

  it('will retrieve a single log entry', async () => {
    const entryData = logEntryData.data[0];
    mockFetch.get(
      {
        url: `/api/users/${entryData.creator.username}/logbook/${entryData.id}`,
      },
      {
        status: 200,
        body: entryData,
      },
    );

    const entry = await client.getLogEntry(
      entryData.creator.username,
      entryData.id,
    );

    expect(mockFetch.done()).toBe(true);
    expect(entry).toEqual(entryData);
  });

  it('will create a new log entry without a dive site', async () => {
    const options: CreateOrUpdateLogEntryParamsDTO = {
      timing: {
        duration: 50.5,
        entryTime: new Date('2024-04-30T20:48:16').valueOf(),
        timezone: 'Pacific/Pohnpei',
        bottomTime: 50.2,
      },
      logNumber: 555,
      depths: {
        maxDepth: 95.3,
        depthUnit: DepthUnit.Feet,
      },
      notes: 'Awesome dive!',
      air: [
        {
          count: 1,
          endPressure: 500,
          material: TankMaterial.Aluminum,
          name: 'AL80',
          pressureUnit: PressureUnit.PSI,
          startPressure: 3000,
          volume: 11.1,
          workingPressure: 207,
          o2Percent: 32,
        },
      ],
    };
    const expected: LogEntryDTO = {
      ...options,
      site: undefined,
      operator: undefined,
      creator: BasicUser.profile,
      createdAt: new Date('2024-04-30T20:48:16').valueOf(),
      id: '62389e6e-0332-4288-9d87-9bd94ba830da',
    };
    mockFetch.post(`/api/users/${BasicUser.username}/logbook`, {
      status: 201,
      body: expected,
    });

    const entry = await client.createLogEntry(BasicUser.username, options);

    expect(mockFetch.done()).toBe(true);
    expect(entry).toEqual(expected);
  });

  it('will return the next available log number', async () => {
    const username = 'greg';
    const logNumber = 77;
    mockFetch.get(`/api/users/${username}/logbook/nextLogEntryNumber`, {
      status: 200,
      body: { logNumber },
    });

    const result = await client.getNextAvailableLogNumber(username);

    expect(mockFetch.done()).toBe(true);
    expect(result).toBe(logNumber);
  });

  it('will request most recently logged dive sites', async () => {
    const username = 'carl';
    mockFetch.get(
      {
        url: `/api/users/${username}/logbook/recentDiveSites?count=15`,
        // query: { count: 15 },
      },
      {
        status: 200,
        body: diveSiteData.data.slice(0, 8),
      },
    );

    const result = await client.getMostRecentDiveSites(username, 15);

    expect(mockFetch.done()).toBe(true);
    expect(result.length).toBe(8);
    expect(result.map((site) => ({ id: site.id, name: site.name }))).toEqual(
      diveSiteData.data
        .slice(0, 8)
        .map((site) => ({ id: site.id, name: site.name })),
    );
  });

  it('will update an existing log entry', async () => {
    const options: CreateOrUpdateLogEntryParamsDTO = {
      timing: {
        duration: 50.5,
        entryTime: new Date('2024-04-30T20:48:16').valueOf(),
        timezone: 'Pacific/Pohnpei',
        bottomTime: 50.2,
      },
      conditions: { ...FullTestData.conditions },
      logNumber: 555,
      depths: {
        ...FullTestData.depths,
        maxDepth: 95.3,
        depthUnit: DepthUnit.Feet,
      },
      notes: 'Awesome dive!',
      equipment: {
        ...FullTestData.equipment,
        weight: 5.2,
        weightUnit: WeightUnit.Pounds,
      },
      air: [
        {
          name: 'robust spokesman',
          material: TankMaterial.Steel,
          workingPressure: 207,
          volume: 4,
          count: 1,
          startPressure: 213.0432935175486,
          endPressure: 62.67623910983093,
          pressureUnit: PressureUnit.Bar,
          o2Percent: 21.6,
        },
      ],
      tags: FullTestData.tags,
      site: FullTestData.site!.id,
    };

    mockFetch.put(
      {
        url: `/api/users/${FullTestData.creator.username}/logbook/${FullTestData.id}`,
        body: options,
      },
      {
        status: 200,
        body: FullTestData,
      },
    );

    await client.updateLogEntry(
      FullTestData.creator.username,
      FullTestData.id,
      options,
    );
    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a log entry', async () => {
    const username = 'greg';
    const entryId = '83edf350-d0c3-4fd4-a2d3-03018aff6f46';
    mockFetch.delete(`/api/users/${username}/logbook/${entryId}`, 204);

    await client.deleteLogEntry(username, entryId);

    expect(mockFetch.done()).toBe(true);
  });

  it('will retrieve operator review', async () => {
    const username = 'Chris';
    const entryId = 'efafd448-a61a-4d4a-bc14-3be4ffb93d72';
    mockFetch.get(`/api/users/${username}/logbook/${entryId}/reviewOperator`, {
      status: 200,
      body: {
        createdAt: 1739560608679,
        creator: {
          accountTier: 200,
          logBookSharing: 'private',
          memberSince: 1713361114242,
          userId: 'cb12fb5b-f1b3-499f-a6ae-dfb467d3d2d1',
          username: 'Chris',
          avatar: '/api/users/Chris/avatar',
          name: 'Chris Carleton',
          location: 'Cambridge, ON',
        },
        comments: 'Sick dive shop, great staff!',
        id: '019505e4-63a7-7888-91a3-854ea65487a2',
        rating: 4.1,
        updatedAt: 1739560608679,
      },
    });

    const result = await client.getOperatorReview(username, entryId);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will review operator', async () => {
    const username = 'Chris';
    const entryId = 'efafd448-a61a-4d4a-bc14-3be4ffb93d72';
    const review: CreateOrUpdateOperatorReviewDTO = {
      rating: 4.1,
      comments: 'Sick dive shop, great staff!',
    };
    mockFetch.put(
      {
        url: `/api/users/${username}/logbook/${entryId}/reviewOperator`,
        body: review,
      },
      {
        status: 200,
        body: {
          createdAt: 1739560608679,
          creator: {
            accountTier: 200,
            logBookSharing: 'private',
            memberSince: 1713361114242,
            userId: 'cb12fb5b-f1b3-499f-a6ae-dfb467d3d2d1',
            username: 'Chris',
            avatar: '/api/users/Chris/avatar',
            name: 'Chris Carleton',
            location: 'Cambridge, ON',
          },
          comments: 'Sick dive shop, great staff!',
          id: '019505e4-63a7-7888-91a3-854ea65487a2',
          rating: 4.1,
          updatedAt: 1739560608679,
        },
      },
    );

    const result = await client.reviewOperator(username, entryId, review);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will retrieve dive site review', async () => {
    const username = 'Chris';
    const entryId = 'efafd448-a61a-4d4a-bc14-3be4ffb93d72';
    mockFetch.get(`/api/users/${username}/logbook/${entryId}/reviewSite`, {
      status: 200,
      body: {
        id: '019505d0-9631-799c-951f-04f0bb2f2c13',
        creator: {
          accountTier: 200,
          memberSince: 1713361114242,
          userId: 'cb12fb5b-f1b3-499f-a6ae-dfb467d3d2d1',
          username: 'Chris',
          logBookSharing: 'private',
          name: 'Chris Carleton',
          avatar: '/api/users/Chris/avatar',
          location: 'Cambridge, ON',
        },
        createdOn: 1739559310897,
        updatedOn: 1739559310897,
        rating: 4.7,
        difficulty: 0.9,
        comments: 'I love diving here. Warm water and good vis.',
      },
    });

    const result = await client.getSiteReview(username, entryId);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will review dive site', async () => {
    const username = 'Chris';
    const entryId = 'efafd448-a61a-4d4a-bc14-3be4ffb93d72';
    const review: CreateOrUpdateDiveSiteReviewDTO = {
      rating: 3.8,
      difficulty: 2.2,
      comments: 'Updated review!',
    };
    mockFetch.put(
      {
        url: `/api/users/${username}/logbook/${entryId}/reviewSite`,
        body: review,
      },
      {
        status: 200,
        body: {
          id: '019505d0-9631-799c-951f-04f0bb2f2c13',
          creator: {
            accountTier: 200,
            memberSince: 1713361114242,
            userId: 'cb12fb5b-f1b3-499f-a6ae-dfb467d3d2d1',
            username: 'Chris',
            logBookSharing: 'private',
            name: 'Chris Carleton',
            avatar: '/api/users/Chris/avatar',
            location: 'Cambridge, ON',
          },
          createdOn: 1739559310897,
          updatedOn: 1739559310897,
          ...review,
        },
      },
    );

    const result = await client.reviewSite(username, entryId, review);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will list most recent dive sites', async () => {
    const username = 'Chris';
    mockFetch.get(`/api/users/${username}/logbook/recentDiveSites`, {
      status: 200,
      body: RecentDiveSites,
    });

    const results = await client.getMostRecentDiveSites(username);

    expect(mockFetch.done()).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it('will list most recent operators', async () => {
    const username = 'Chris';
    mockFetch.get(`/api/users/${username}/logbook/recentOperators`, {
      status: 200,
      body: RecentDiveOperators,
    });

    const results = await client.getMostRecentDiveOperators(username);

    expect(mockFetch.done()).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it('will retrieve log entry data samples', async () => {
    const username = 'Chris';
    const entryId = '83023e93-1293-4dcd-a101-938b2832020b';
    mockFetch.get(`/api/users/${username}/logbook/${entryId}/samples`, {
      status: 200,
      body: [
        {
          offset: 1000,
          depth: 50,
          gps: { lat: 43.1708282, lng: -79.2268426 },
        },
        {
          offset: 2000,
          depth: 56,
          gps: { lat: 43.1708282, lng: -79.2268426 },
        },
      ],
    });

    const results = await client.loadLogEntrySampleData(username, entryId);

    expect(mockFetch.done()).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it('will list signatures for a log entry', async () => {
    const username = 'Joanna.33';
    const entryId = '76a63fb5-a3cd-4ef3-ba91-6dc03fe9a581';
    const expected = {
      data: TestSignatures,
      totalCount: TestSignatures.length,
    };
    mockFetch.get(`/api/users/${username}/logbook/${entryId}/signatures`, {
      status: 200,
      body: expected,
    });

    const actual = await client.listLogEntrySignatures(username, entryId);

    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will sign a log entry', async () => {
    const username = 'Joanna.33';
    const entryId = '76a63fb5-a3cd-4ef3-ba91-6dc03fe9a581';
    const options: CreateOrUpdateLogEntrySignatureDTO = {
      buddyType: BuddyType.Divemaster,
      agency: TestAgencies[1].id,
      certificationNumber: '1111111',
    };
    const expected: LogEntrySignatureDTO = {
      buddy: UserWithEmptyProfile.profile,
      type: BuddyType.Divemaster,
      id: 'e736b50a-7774-47f3-8b07-50260a8a4602',
      signedOn: new Date().valueOf(),
      agency: TestAgencies[1],
      certificationNumber: '1111111',
    };
    mockFetch.put(
      {
        url: ``,
        body: options,
      },
      {
        status: 200,
        body: expected,
      },
    );

    const actual = await client.signLogEntry(
      username,
      entryId,
      UserWithEmptyProfile.username,
      options,
    );

    expect(actual).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a log entry signature', async () => {
    const username = 'Joanna.33';
    const entryId = '76a63fb5-a3cd-4ef3-ba91-6dc03fe9a581';
    mockFetch.delete(
      `/api/users/${username}/logbook/${entryId}/signatures/${UserWithEmptyProfile.username}`,
      201,
    );

    await client.deleteLogEntrySignature(
      username,
      entryId,
      UserWithEmptyProfile.username,
    );

    expect(mockFetch.done()).toBe(true);
  });
});
