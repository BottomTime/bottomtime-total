import axios, { AxiosInstance } from 'axios';
import nock, { Scope } from 'nock';

import {
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseDTO,
  ListLogEntriesResponseSchema,
  LogEntryDTO,
  LogEntrySortBy,
  PressureUnit,
  SearchDiveSitesResponseDTO,
  SearchDiveSitesResponseSchema,
  SortOrder,
  TankMaterial,
} from '../../src';
import { LogEntriesApiClient } from '../../src/client/log-entries';
import DiveSiteTestData from '../fixtures/dive-sites-search-results.json';
import LogEntryTestData from '../fixtures/log-entries-search-results.json';
import { createScope } from '../fixtures/nock';
import { BasicUser } from '../fixtures/users';

describe('Log entries API client', () => {
  let axiosInstance: AxiosInstance;
  let client: LogEntriesApiClient;
  let logEntryData: ListLogEntriesResponseDTO;
  let diveSiteData: SearchDiveSitesResponseDTO;
  let scope: Scope;

  beforeAll(() => {
    axiosInstance = axios.create();
    client = new LogEntriesApiClient(axiosInstance);
    logEntryData = ListLogEntriesResponseSchema.parse(LogEntryTestData);
    diveSiteData = SearchDiveSitesResponseSchema.parse(DiveSiteTestData);
    scope = createScope();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('will return a list of log entries', async () => {
    const username = 'greg';
    const params: ListLogEntriesParamsDTO = {
      query: 'sam',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-12-31'),
      limit: 800,
      skip: 20,
      sortBy: LogEntrySortBy.EntryTime,
      sortOrder: SortOrder.Ascending,
    };
    scope
      .get(`/api/users/${username}/logbook`)
      .query(JSON.parse(JSON.stringify(params)))
      .reply(200, logEntryData);

    const result = await client.listLogEntries(username, params);

    expect(scope.isDone()).toBe(true);
    expect(result.totalCount).toBe(logEntryData.totalCount);

    result.logEntries.forEach((entry, index) => {
      expect(entry.toJSON()).toEqual(logEntryData.logEntries[index]);
    });
  });

  it('will retrieve a single log entry', async () => {
    const entryData = logEntryData.logEntries[0];
    scope
      .get(`/api/users/${entryData.creator.username}/logbook/${entryData.id}`)
      .reply(200, entryData);

    const entry = await client.getLogEntry(
      entryData.creator.username,
      entryData.id,
    );

    expect(scope.isDone()).toBe(true);
    expect(entry.toJSON()).toEqual(entryData);
  });

  it('will create a new log entry without a dive site', async () => {
    const options: CreateOrUpdateLogEntryParamsDTO = {
      duration: 50.5,
      entryTime: {
        date: '2024-04-30T20:48:16',
        timezone: 'Pacific/Pohnpei',
      },
      bottomTime: 50.2,
      logNumber: 555,
      maxDepth: { depth: 95.3, unit: DepthUnit.Feet },
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
      creator: BasicUser.profile,
      id: '62389e6e-0332-4288-9d87-9bd94ba830da',
    };
    scope
      .post(`/api/users/${BasicUser.username}/logbook`, options)
      .reply(201, expected);

    const entry = await client.createLogEntry(BasicUser.username, options);

    expect(scope.isDone()).toBe(true);
    expect(entry.toJSON()).toEqual(expected);
  });

  it('will return the next available log number', async () => {
    const username = 'greg';
    const logNumber = 77;
    scope
      .get(`/api/users/${username}/logbook/nextLogEntryNumber`)
      .reply(200, { logNumber });

    const result = await client.getNextAvailableLogNumber(username);

    expect(scope.isDone()).toBe(true);
    expect(result).toBe(logNumber);
  });

  it('will parse a DTO and wrap it in a LogEntry object', () => {
    const data = logEntryData.logEntries[0];
    const entry = client.wrapDTO(data);
    expect(entry.toJSON()).toEqual(data);
  });

  it('will request most recently logged dive sites', async () => {
    const username = 'carl';
    scope
      .get(`/api/users/${username}/logbook/recentDiveSites`)
      .query({ count: 15 })
      .reply(200, diveSiteData.sites.slice(0, 8));

    const result = await client.getMostRecentDiveSites(username, 15);

    expect(scope.isDone()).toBe(true);
    expect(result.length).toBe(8);
    expect(result.map((site) => ({ id: site.id, name: site.name }))).toEqual(
      diveSiteData.sites
        .slice(0, 8)
        .map((site) => ({ id: site.id, name: site.name })),
    );
  });
});
