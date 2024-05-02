import {
  ApiClient,
  ListLogEntriesResponseDTO,
  ListLogEntriesResponseSchema,
  LogEntry,
  LogEntrySortBy,
  SortOrder,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { AppInitialState, useInitialState } from '../../../src/initial-state';
import { useCurrentUser } from '../../../src/store';
import LogbookView from '../../../src/views/logbook-view.vue';
import { createRouter } from '../../fixtures/create-router';
import LogEntryTestData from '../../fixtures/log-entries.json';
import { BasicUser } from '../../fixtures/users';

jest.mock('../../../src/initial-state');

describe('Logbook view', () => {
  let client: ApiClient;
  let router: Router;
  let entryData: ListLogEntriesResponseDTO;

  let pinia: Pinia;
  let initialState: AppInitialState;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof LogbookView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/logbook',
        component: LogbookView,
      },
      {
        path: '/logbook/:username',
        component: LogbookView,
      },
    ]);

    entryData = ListLogEntriesResponseSchema.parse(LogEntryTestData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    currentUser.user = BasicUser;
    initialState = {
      currentUser: BasicUser,
    };

    jest.mocked(useInitialState).mockImplementation(() => initialState);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will prefetch logbook data on the server side for the current user', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue({
        logEntries: entryData.logEntries.map(
          (entry) => new LogEntry(client.axios, entry),
        ),
        totalCount: entryData.totalCount,
      });
    await router.push('/logbook');
    await renderToString(LogbookView, { global: opts.global });

    // TODO: Check HTML
    expect(spy).toHaveBeenCalledWith(BasicUser.username, { skip: 0 });
  });

  it('will prefetch logbook data on the server side for a specific user', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue({
        logEntries: entryData.logEntries.map(
          (entry) => new LogEntry(client.axios, entry),
        ),
        totalCount: entryData.totalCount,
      });
    await router.push('/logbook/testuser');
    await renderToString(LogbookView, { global: opts.global });

    // TODO: Check HTML
    expect(spy).toHaveBeenLastCalledWith('testuser', { skip: 0 });
  });

  it('will prefetch logbook data on the server side after parsing the query string', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue({
        logEntries: entryData.logEntries.map(
          (entry) => new LogEntry(client.axios, entry),
        ),
        totalCount: entryData.totalCount,
      });
    await router.push(
      '/logbook/testy_mcgee?startDate=2023-05-02T16:32:07.300Z&endDate=2025-05-02T16:32:07.300Z&skip=10&limit=100&query=yolo&sortBy=entryTime&sortOrder=asc',
    );

    await renderToString(LogbookView, { global: opts.global });

    // TODO: Check HTML
    expect(spy).toHaveBeenLastCalledWith('testy_mcgee', {
      startDate: new Date('2023-05-02T16:32:07.300Z'),
      endDate: new Date('2025-05-02T16:32:07.300Z'),
      skip: 0,
      limit: 100,
      query: 'yolo',
      sortBy: LogEntrySortBy.EntryTime,
      sortOrder: SortOrder.Ascending,
    });
  });

  it('will prefetch logbook data using default search if query string is invalid', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue({
        logEntries: entryData.logEntries.map(
          (entry) => new LogEntry(client.axios, entry),
        ),
        totalCount: entryData.totalCount,
      });
    await router.push('/logbook/testy_mcgee?startDate=yesterday');

    await renderToString(LogbookView, { global: opts.global });

    // TODO: Check HTML
    expect(spy).toHaveBeenLastCalledWith('testy_mcgee', {});
  });

  it('will render the login form if the user is not logged in and is requesting the default route', async () => {});
});
