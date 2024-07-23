import {
  ApiClient,
  Fetcher,
  ListLogEntriesResponseDTO,
  ListLogEntriesResponseSchema,
  LogBookSharing,
  LogEntry,
  LogEntrySortBy,
  ProfileDTO,
  SortOrder,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import LogbookEntriesListItem from '../../../src/components/logbook/logbook-entries-list-item.vue';
import LogbookEntriesList from '../../../src/components/logbook/logbook-entries-list.vue';
import LogbookSearch from '../../../src/components/logbook/logbook-search.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import {
  ListEntriesState,
  useCurrentUser,
  useLogEntries,
  useProfiles,
} from '../../../src/store';
import LogbookView from '../../../src/views/logbook-view.vue';
import { createHttpError } from '../../fixtures/create-http-error';
import { createRouter } from '../../fixtures/create-router';
import LogEntryTestData from '../../fixtures/log-entries.json';
import { AdminUser, BasicUser } from '../../fixtures/users';

const ProfileData: ProfileDTO = {
  logBookSharing: LogBookSharing.Public,
  memberSince: new Date('2021-01-01T00:00:00.000Z'),
  userId: '5550f3c1-c6e3-415d-9760-578fb5e9306b',
  username: 'testy_mcgee',
  name: 'Testy McGee',
};

describe('Logbook view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let entryData: ListLogEntriesResponseDTO;

  let pinia: Pinia;
  let location: MockLocation;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let logEntries: ReturnType<typeof useLogEntries>;
  let profiles: ReturnType<typeof useProfiles>;
  let opts: ComponentMountingOptions<typeof LogbookView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
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
    logEntries = useLogEntries(pinia);
    profiles = useProfiles(pinia);
    location = new MockLocation();

    await router.push(`/logbook/${ProfileData.username}`);

    currentUser.user = BasicUser;
    profiles.currentProfile = ProfileData;
    logEntries.results = entryData;

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
      jest.spyOn(client.users, 'getProfile').mockResolvedValue(ProfileData);
      const spy = jest
        .spyOn(client.logEntries, 'listLogEntries')
        .mockResolvedValue({
          logEntries: entryData.logEntries.map(
            (entry) => new LogEntry(fetcher, entry),
          ),
          totalCount: entryData.totalCount,
        });
      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      const list = wrapper.querySelector('[data-testid="logbook-list"]');
      expect(list).not.toBeNull();

      // expect(list?.querySelectorAll('li').length).toBe(
      //   entryData.logEntries.length + 1,
      // );

      expect(spy).toHaveBeenLastCalledWith(ProfileData.username, { skip: 0 });
    });

    it('will prefetch logbook data after parsing the query string', async () => {
      jest.spyOn(client.users, 'getProfile').mockResolvedValue(ProfileData);
      const spy = jest
        .spyOn(client.logEntries, 'listLogEntries')
        .mockResolvedValue({
          logEntries: entryData.logEntries.map(
            (entry) => new LogEntry(fetcher, entry),
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
      jest.spyOn(client.users, 'getProfile').mockResolvedValue(ProfileData);
      const spy = jest
        .spyOn(client.logEntries, 'listLogEntries')
        .mockResolvedValue({
          logEntries: entryData.logEntries.map(
            (entry) => new LogEntry(fetcher, entry),
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

    it('will render the login form if the user is not logged in and the logbook is friends-only', async () => {
      currentUser.user = null;
      jest.spyOn(client.users, 'getProfile').mockResolvedValue({
        ...ProfileData,
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      jest.spyOn(client.logEntries, 'listLogEntries').mockRejectedValue(
        createHttpError({
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

    it('will render a "not found" message if the target user does not exist', async () => {
      jest.spyOn(client.users, 'getProfile').mockRejectedValue(
        createHttpError({
          method: 'GET',
          path: '/users/testy_mcgee',
          status: 404,
          message: 'Not Found',
        }),
      );
      jest.spyOn(client.logEntries, 'listLogEntries').mockRejectedValue(
        createHttpError({
          method: 'GET',
          path: '/logbook/testy_mcgee',
          status: 404,
          message: 'Not Found',
        }),
      );

      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      expect(
        wrapper.querySelector('[data-testid="not-found-message"]'),
      ).not.toBeNull();
      expect(wrapper.querySelector('[data-testid="logbook-list"]')).toBeNull();
    });

    it('will render a "request friend" message if the target logbook is not shared with the current user', async () => {
      jest.spyOn(client.users, 'getProfile').mockResolvedValue({
        ...ProfileData,
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      jest.spyOn(client.logEntries, 'listLogEntries').mockRejectedValue(
        createHttpError({
          method: 'GET',
          path: '/logbook/testy_mcgee',
          status: 403,
          message: 'Forbidden',
        }),
      );

      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      expect(
        wrapper.querySelector('[data-testid="friends-only-logbook"]'),
      ).not.toBeNull();
      expect(wrapper.querySelector('[data-testid="logbook-list"]')).toBeNull();
    });

    it('will render a "forbidden" message if the target logbook is private', async () => {
      jest.spyOn(client.users, 'getProfile').mockResolvedValue({
        ...ProfileData,
        logBookSharing: LogBookSharing.Private,
      });
      jest.spyOn(client.logEntries, 'listLogEntries').mockRejectedValue(
        createHttpError({
          method: 'GET',
          path: '/logbook/testy_mcgee',
          status: 403,
          message: 'Forbidden',
        }),
      );

      const wrapper = document.createElement('div');
      wrapper.innerHTML = await renderToString(LogbookView, {
        global: opts.global,
      });

      expect(
        wrapper.querySelector('[data-testid="private-logbook"]'),
      ).not.toBeNull();
      expect(wrapper.querySelector('[data-testid="logbook-list"]')).toBeNull();
    });
  });

  describe('when client-side rendering', () => {
    it('will render a "not found" message if the logbook does not exist', () => {
      logEntries.results = {
        logEntries: [],
        totalCount: 0,
      };
      logEntries.listEntriesState = ListEntriesState.NotFound;
      profiles.currentProfile = null;
      const wrapper = mount(LogbookView, opts);

      expect(
        wrapper.find('[data-testid="not-found-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
    });

    it('will render a "forbidden" message if the logbook is private', () => {
      logEntries.results = {
        logEntries: [],
        totalCount: 0,
      };
      logEntries.listEntriesState = ListEntriesState.Forbidden;
      profiles.currentProfile = {
        ...ProfileData,
        logBookSharing: LogBookSharing.Private,
      };
      const wrapper = mount(LogbookView, opts);

      expect(wrapper.find('[data-testid="private-logbook"]').isVisible()).toBe(
        true,
      );
      expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
    });

    it('will render a "friend request" message if the logbook is friends-only', () => {
      logEntries.results = {
        logEntries: [],
        totalCount: 0,
      };
      logEntries.listEntriesState = ListEntriesState.Forbidden;
      profiles.currentProfile = {
        ...ProfileData,
        logBookSharing: LogBookSharing.FriendsOnly,
      };
      const wrapper = mount(LogbookView, opts);

      expect(
        wrapper.find('[data-testid="friends-only-logbook"]').isVisible(),
      ).toBe(true);
      expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
    });

    it('will render a login form if the user is not logged in and the logbook is friends-only', () => {
      currentUser.user = null;
      logEntries.results = {
        logEntries: [],
        totalCount: 0,
      };
      logEntries.listEntriesState = ListEntriesState.Forbidden;
      profiles.currentProfile = {
        ...ProfileData,
        logBookSharing: LogBookSharing.FriendsOnly,
      };
      const wrapper = mount(LogbookView, opts);

      expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
      expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
    });

    it('will render a read-only list of log entries for authenticated users', () => {
      const wrapper = mount(LogbookView, opts);

      const list = wrapper.findComponent(LogbookEntriesList);
      expect(list.isVisible()).toBe(true);

      const items = list.findAllComponents(LogbookEntriesListItem);
      expect(items.length).toBe(entryData.logEntries.length);

      expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(false);
    });

    it('will render a read-only list of log entries for anonymous users', () => {
      currentUser.user = null;
      const wrapper = mount(LogbookView, opts);

      const list = wrapper.findComponent(LogbookEntriesList);
      expect(list.isVisible()).toBe(true);

      const items = list.findAllComponents(LogbookEntriesListItem);
      expect(items.length).toBe(entryData.logEntries.length);

      expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(false);
    });

    it('will render in edit mode if user owns the logbook', async () => {
      await router.push(`/logbook/${BasicUser.username}`);
      const wrapper = mount(LogbookView, opts);

      const list = wrapper.findComponent(LogbookEntriesList);
      expect(list.isVisible()).toBe(true);

      const items = list.findAllComponents(LogbookEntriesListItem);
      expect(items.length).toBe(entryData.logEntries.length);

      expect(wrapper.find('[data-testid="create-entry"]').isVisible()).toBe(
        true,
      );
    });

    it('will render in edit mode if user is an admin', async () => {
      currentUser.user = AdminUser;
      await router.push(`/logbook/${ProfileData.username}`);
      const wrapper = mount(LogbookView, opts);

      const list = wrapper.findComponent(LogbookEntriesList);
      expect(list.isVisible()).toBe(true);

      const items = list.findAllComponents(LogbookEntriesListItem);
      expect(items.length).toBe(entryData.logEntries.length);

      expect(wrapper.find('[data-testid="create-entry"]').isVisible()).toBe(
        true,
      );
    });

    it('will change sort order when dropdown is used', async () => {
      await router.push(
        '/logbook/testy_mcgee?startDate=2024-05-08T18%3A53%3A58.388Z',
      );
      const wrapper = mount(LogbookView, opts);
      await wrapper.find('#sort-order').setValue('entryTime-asc');
      expect(location.search).toBe(
        '?startDate=2024-05-08T18%3A53%3A58.388Z&sortBy=entryTime&sortOrder=asc',
      );
    });

    it('will load more results when Load More button is clicked', async () => {
      logEntries.results = {
        logEntries: entryData.logEntries.slice(0, 10),
        totalCount: 200,
      };
      await router.push(
        `/logbook/${ProfileData.username}?endDate=2024-05-08T19%3A29%3A31.551Z&sortBy=entryTime&sortOrder=asc`,
      );
      const loadMoreSpy = jest
        .spyOn(client.logEntries, 'listLogEntries')
        .mockResolvedValue({
          logEntries: entryData.logEntries
            .slice(10, 20)
            .map((e) => new LogEntry(fetcher, e)),
          totalCount: 200,
        });

      const wrapper = mount(LogbookView, opts);
      await wrapper.find('[data-testid="logbook-load-more"]').trigger('click');
      await flushPromises();

      expect(loadMoreSpy).toHaveBeenCalledWith(ProfileData.username, {
        endDate: new Date('2024-05-08T19:29:31.551Z'),
        sortBy: LogEntrySortBy.EntryTime,
        sortOrder: SortOrder.Ascending,
        skip: 10,
      });

      const items = wrapper.findAllComponents(LogbookEntriesListItem);
      expect(items).toHaveLength(20);

      items.forEach((item, index) => {
        expect(
          item
            .find(`[data-testid="select-${entryData.logEntries[index].id}"]`)
            .isVisible(),
        ).toBe(true);
      });
    });
  });

  it('will reload with a new query string when a search is performed', async () => {
    const wrapper = mount(LogbookView, opts);
    const search = wrapper.findComponent(LogbookSearch);

    search.vm.$emit('search', {
      startDate: new Date('2024-05-08T19:29:31.551Z'),
      endDate: new Date('2025-05-08T19:29:31.551Z'),
      query: 'yolo',
    });
    await flushPromises();

    expect(location.search).toBe(
      '?query=yolo&startDate=2024-05-08T19%3A29%3A31.551Z&endDate=2025-05-08T19%3A29%3A31.551Z',
    );
  });

  it('will preview a selected log entry in the drawer panel', async () => {
    const entry = new LogEntry(fetcher, entryData.logEntries[0]);
    const spy = jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockResolvedValue(entry);

    const wrapper = mount(LogbookView, opts);
    await wrapper.find(`[data-testid="select-${entry.id}"]`).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(ProfileData.username, entry.id);

    expect(wrapper.find('[data-testid="drawer-panel"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="entry-logNumber"]').text()).toBe(
      entry.logNumber?.toString(),
    );

    await wrapper.find('[data-testid="drawer-close"]').trigger('click');
    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
  });
});
