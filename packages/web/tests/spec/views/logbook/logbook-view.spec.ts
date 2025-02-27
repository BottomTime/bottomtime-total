import {
  AccountTier,
  ApiClient,
  ApiList,
  Fetcher,
  ListLogEntriesResponseSchema,
  LogBookSharing,
  LogEntryDTO,
  LogEntrySortBy,
  ProfileDTO,
  SortOrder,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { FeaturesServiceKey } from 'src/featrues';
import { ConfigCatClientMock } from 'tests/config-cat-client-mock';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import LogbookEntriesListItem from '../../../../src/components/logbook/logbook-entries-list-item.vue';
import LogbookEntriesList from '../../../../src/components/logbook/logbook-entries-list.vue';
import LogbookSearch from '../../../../src/components/logbook/logbook-search.vue';
import { useCurrentUser } from '../../../../src/store';
import LogbookView from '../../../../src/views/logbook/logbook-view.vue';
import '../../../dayjs';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import LogEntryTestData from '../../../fixtures/log-entries.json';
import { AdminUser, BasicUser } from '../../../fixtures/users';
import StarRatingStub from '../../../stubs/star-rating-stub.vue';

const ProfileData: ProfileDTO = {
  accountTier: AccountTier.Basic,
  logBookSharing: LogBookSharing.Public,
  memberSince: new Date('2021-01-01T00:00:00.000Z').valueOf(),
  userId: '5550f3c1-c6e3-415d-9760-578fb5e9306b',
  username: 'testy_mcgee',
  name: 'Testy McGee',
};

describe('Logbook view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let features: ConfigCatClientMock;
  let router: Router;
  let entryData: ApiList<LogEntryDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof LogbookView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/logbook/:username',
        component: LogbookView,
      },
    ]);
    features = new ConfigCatClientMock({});

    entryData = ListLogEntriesResponseSchema.parse(LogEntryTestData);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    await router.push(`/logbook/${ProfileData.username}`);

    currentUser.user = BasicUser;

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: features,
        },
        stubs: {
          teleport: true,
          StarRating: StarRatingStub,
        },
      },
    };

    jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockResolvedValue({ ...ProfileData });
    listSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue(entryData);
  });

  it('will render correctly after querying for entries', async () => {
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const items = wrapper.findAllComponents(LogbookEntriesListItem);
    expect(items).toHaveLength(entryData.data.length);
    items.forEach((item, i) => {
      expect(item.props('entry').id).toBe(entryData.data[i].id);
    });
    expect(listSpy).toHaveBeenCalledWith(ProfileData.username, { skip: 0 });
  });

  it('will render correctly given a search query', async () => {
    const endDate = new Date('2025-05-02T16:32:07.300Z').valueOf();
    const startDate = new Date('2023-05-02T16:32:07.300Z').valueOf();
    await router.push({
      path: '/logbook/testy_mcgee',
      query: {
        startDate,
        endDate,
        skip: 10,
        limit: 100,
        query: 'yolo',
        sortBy: LogEntrySortBy.EntryTime,
        sortOrder: SortOrder.Ascending,
      },
    });

    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const items = wrapper.findAllComponents(LogbookEntriesListItem);
    expect(items).toHaveLength(entryData.data.length);
    items.forEach((item, i) => {
      expect(item.props('entry').id).toBe(entryData.data[i].id);
    });
    expect(listSpy).toHaveBeenCalledWith(ProfileData.username, {
      endDate,
      limit: 100,
      query: 'yolo',
      skip: 0,
      sortBy: 'entryTime',
      sortOrder: 'asc',
      startDate,
    });
  });

  it('will render using default search params if query string is invalid', async () => {
    await router.push('/logbook/testy_mcgee?startDate=yesterday');

    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const items = wrapper.findAllComponents(LogbookEntriesListItem);
    expect(items).toHaveLength(entryData.data.length);
    items.forEach((item, i) => {
      expect(item.props('entry').id).toBe(entryData.data[i].id);
    });
    expect(listSpy).toHaveBeenCalledWith(ProfileData.username, {});
  });

  it('will render a "not found" message if the logbook does not exist', async () => {
    jest
      .spyOn(client.userProfiles, 'getProfile')
      .mockRejectedValue(createHttpError(404));
    listSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
  });

  it('will render a "forbidden" message if the logbook is private', async () => {
    listSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockRejectedValue(createHttpError(403));
    jest.spyOn(client.userProfiles, 'getProfile').mockResolvedValue({
      ...ProfileData,
      logBookSharing: LogBookSharing.Private,
    });
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="private-logbook"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
  });

  it('will render a "friend request" message if the logbook is friends-only and the users are not currently friends', async () => {
    listSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockRejectedValue(createHttpError(403));
    jest.spyOn(client.userProfiles, 'getProfile').mockResolvedValue({
      ...ProfileData,
      logBookSharing: LogBookSharing.FriendsOnly,
    });

    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    expect(
      wrapper.get('[data-testid="friends-only-logbook"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
  });

  it('will render a login form if the user is not logged in and the logbook is friends-only', async () => {
    currentUser.user = null;
    listSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockRejectedValue(createHttpError(403));
    jest.spyOn(client.userProfiles, 'getProfile').mockResolvedValue({
      ...ProfileData,
      logBookSharing: LogBookSharing.FriendsOnly,
    });
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.findComponent(LogbookEntriesList).exists()).toBe(false);
  });

  it('will render a read-only list of log entries for authenticated users', async () => {
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const list = wrapper.findComponent(LogbookEntriesList);
    expect(list.isVisible()).toBe(true);

    const items = list.findAllComponents(LogbookEntriesListItem);
    expect(items.length).toBe(entryData.data.length);

    expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(false);
  });

  it('will render a read-only list of log entries for anonymous users', async () => {
    currentUser.user = null;
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const list = wrapper.findComponent(LogbookEntriesList);
    expect(list.isVisible()).toBe(true);

    const items = list.findAllComponents(LogbookEntriesListItem);
    expect(items.length).toBe(entryData.data.length);

    expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(false);
  });

  it('will render in edit mode if user owns the logbook', async () => {
    await router.push(`/logbook/${BasicUser.username}`);
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const list = wrapper.findComponent(LogbookEntriesList);
    expect(list.isVisible()).toBe(true);

    const items = list.findAllComponents(LogbookEntriesListItem);
    expect(items.length).toBe(entryData.data.length);

    expect(wrapper.find('[data-testid="create-entry"]').isVisible()).toBe(true);
  });

  it('will render in edit mode if user is an admin', async () => {
    currentUser.user = AdminUser;
    await router.push(`/logbook/${ProfileData.username}`);
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const list = wrapper.findComponent(LogbookEntriesList);
    expect(list.isVisible()).toBe(true);

    const items = list.findAllComponents(LogbookEntriesListItem);
    expect(items.length).toBe(entryData.data.length);

    expect(wrapper.find('[data-testid="create-entry"]').isVisible()).toBe(true);
  });

  it('will change sort order when dropdown is used', async () => {
    const startDate = new Date('2024-05-08T18:53:58.388Z').valueOf();
    await router.push({
      path: '/logbook/testy_mcgee',
      query: { startDate },
    });
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    await wrapper.find('#sort-order').setValue('entryTime-asc');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({
      sortBy: 'entryTime',
      sortOrder: 'asc',
      startDate: startDate.toString(),
    });
  });

  it('will load more results when Load More button is clicked', async () => {
    const endDate = new Date('2024-05-08T19:29:31.551Z').valueOf();
    listSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue({
        data: entryData.data.slice(0, 10),
        totalCount: 200,
      });
    await router.push({
      path: `/logbook/${ProfileData.username}`,
      query: {
        endDate,
        sortBy: LogEntrySortBy.EntryTime,
        sortOrder: SortOrder.Ascending,
      },
    });

    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const loadMoreSpy = jest
      .spyOn(client.logEntries, 'listLogEntries')
      .mockResolvedValue({
        data: entryData.data.slice(10, 20),
        totalCount: 200,
      });
    await wrapper.find('[data-testid="logbook-load-more"]').trigger('click');
    await flushPromises();

    expect(loadMoreSpy).toHaveBeenCalledWith(ProfileData.username, {
      endDate: new Date('2024-05-08T19:29:31.551Z').valueOf(),
      sortBy: LogEntrySortBy.EntryTime,
      sortOrder: SortOrder.Ascending,
      skip: 10,
    });

    const items = wrapper.findAllComponents(LogbookEntriesListItem);
    expect(items).toHaveLength(20);

    items.forEach((item, index) => {
      expect(
        item
          .find(`[data-testid="select-${entryData.data[index].id}"]`)
          .isVisible(),
      ).toBe(true);
    });
  });

  it('will reload with a new query string when a search is performed', async () => {
    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    const search = wrapper.findComponent(LogbookSearch);

    search.vm.$emit('search', {
      startDate: new Date('2024-05-08T19:29:31.551Z'),
      endDate: new Date('2025-05-08T19:29:31.551Z'),
      query: 'yolo',
    });
    await flushPromises();

    expect(router.currentRoute.value.query).toEqual({
      startDate: new Date('2024-05-08T19:29:31.551Z').valueOf().toString(),
      endDate: new Date('2025-05-08T19:29:31.551Z').valueOf().toString(),
      query: 'yolo',
    });
  });

  it('will preview a selected log entry in the drawer panel', async () => {
    const entry = entryData.data[0];
    const spy = jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockResolvedValue(entry);

    const wrapper = mount(LogbookView, opts);
    await flushPromises();

    await wrapper.find(`[data-testid="select-${entry.id}"]`).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(ProfileData.username, entry.id);

    expect(wrapper.find('[data-testid="drawer-panel"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="entry-logNumber"]').text()).toBe(
      `#${entry.logNumber}`,
    );

    await wrapper.find('[data-testid="drawer-close"]').trigger('click');
    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
  });
});
