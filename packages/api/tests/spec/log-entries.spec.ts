import mockFetch from 'fetch-mock-jest';

import {
  ApiList,
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  DiveSiteDTO,
  ExposureSuit,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntryDTO,
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
import DiveSiteTestData from '../fixtures/dive-sites-search-results.json';
import LogEntryTestData from '../fixtures/log-entries-search-results.json';
import { BasicUser } from '../fixtures/users';

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
});
