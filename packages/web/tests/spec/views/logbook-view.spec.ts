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
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import LogbookView from '../../../src/views/logbook-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import LogEntryTestData from '../../fixtures/log-entries.json';
import { BasicUser } from '../../fixtures/users';

jest.mock('../../../src/initial-state');

describe('Logbook view', () => {
  let client: ApiClient;
  let router: Router;
  let entryData: ListLogEntriesResponseDTO;

  let pinia: Pinia;
  let location: MockLocation;
  let initialState: AppInitialState;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof LogbookView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/logbook/:username',
        component: LogbookView,
      },
    ]);

    entryData = ListLogEntriesResponseSchema.parse(LogEntryTestData);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    location = new MockLocation();

    await router.push(`/logbook/${BasicUser.username}`);

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
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  describe('when server-side rendering', () => {
    it('will prefetch logbook data', async () => {
      const spy = jest
        .spyOn(client.logEntries, 'listLogEntries')
        .mockResolvedValue({
          logEntries: entryData.logEntries.map(
            (entry) => new LogEntry(client.axios, entry),
          ),
          totalCount: entryData.totalCount,
        });
      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      const list = wrapper.querySelector('[data-testid="logbook-list"]');
      expect(list).not.toBeNull();

      expect(list?.querySelectorAll('li').length).toBe(
        entryData.logEntries.length + 1,
      );

      expect(spy).toHaveBeenLastCalledWith(BasicUser.username, { skip: 0 });
    });

    it('will prefetch logbook data after parsing the query string', async () => {
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

      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      expect(
        wrapper.querySelector('[data-testid="logbook-list"]'),
      ).not.toBeNull();

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

      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      expect(
        wrapper.querySelector('[data-testid="logbook-list"]'),
      ).not.toBeNull();

      expect(spy).toHaveBeenLastCalledWith('testy_mcgee', {});
    });

    it('will render the login form if the user is not logged in and the logbook is not public', async () => {
      currentUser.user = null;
      jest.spyOn(client.logEntries, 'listLogEntries').mockRejectedValue(
        createAxiosError({
          method: 'GET',
          path: '/logbook/testy_mcgee',
          status: 401,
          message: 'Unauthorized',
        }),
      );

      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      expect(
        wrapper.querySelector('[data-testid="login-form"]'),
      ).not.toBeNull();
      expect(wrapper.querySelector('[data-testid="logbook-list"]')).toBeNull();
    });

    it('will render a "not found" message if the target user does not exist', async () => {});

    it('will render a "not found" message if the target logbook is not shared with the current user', async () => {});
  });
});
