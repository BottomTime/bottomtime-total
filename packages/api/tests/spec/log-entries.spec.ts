import axios, { AxiosInstance } from 'axios';
import nock, { Scope } from 'nock';

import {
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseDTO,
  ListLogEntriesResponseSchema,
  LogEntrySortBy,
  SortOrder,
} from '../../src';
import { LogEntriesApiClient } from '../../src/client/log-entries';
import LogEntryTestData from '../fixtures/log-entries-search-results.json';
import { createScope } from '../fixtures/nock';

describe('Log entries API client', () => {
  let axiosInstance: AxiosInstance;
  let client: LogEntriesApiClient;
  let logEntryData: ListLogEntriesResponseDTO;
  let scope: Scope;

  beforeAll(() => {
    axiosInstance = axios.create();
    client = new LogEntriesApiClient(axiosInstance);
    logEntryData = ListLogEntriesResponseSchema.parse(LogEntryTestData);
    scope = createScope();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('will return a list of log entries with no parameters', async () => {
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

  it('will parse a DTO and wrap it in a LogEntry object', () => {
    const data = logEntryData.logEntries[0];
    const entry = client.wrapDTO(data);
    expect(entry.toJSON()).toEqual(data);
  });
});
