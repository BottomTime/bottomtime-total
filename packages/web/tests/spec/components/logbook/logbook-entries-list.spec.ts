import {
  ListLogEntriesResponseDTO,
  ListLogEntriesResponseSchema,
  LogEntrySortBy,
  SortOrder,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import FormCheckbox from '../../../../src/components/common/form-checkbox.vue';
import LogbookEntriesListItem from '../../../../src/components/logbook/logbook-entries-list-item.vue';
import LogbookEntriesList from '../../../../src/components/logbook/logbook-entries-list.vue';
import { useCurrentUser } from '../../../../src/store';
import TestData from '../../../fixtures/log-entries.json';
import { BasicUser } from '../../../fixtures/users';

const EntriesCount = '[data-testid="entries-count"]';
const EmptyListMessage = '[data-testid="empty-logbook-message"]';
const LogbookList = '[data-testid="logbook-list"]';
const LoadMoreButton = '[data-testid="logbook-load-more"]';
const SortOrderSelect = '[data-testid="entries-sort-order"]';

describe('LogbookEntriesList component', () => {
  let entryData: ListLogEntriesResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof LogbookEntriesList>;

  beforeAll(() => {
    entryData = ListLogEntriesResponseSchema.parse(TestData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render correctly with an empty list', () => {
    opts.props = {
      entries: {
        logEntries: [],
        totalCount: 0,
      },
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.get(EntriesCount).text()).toBe('Showing 0 of 0 entries');
    expect(wrapper.find(EmptyListMessage).isVisible()).toBe(true);
    expect(wrapper.find(LogbookList).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  it('will render correctly with a partial list', () => {
    opts.props = {
      entries: entryData,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.get(EntriesCount).text()).toBe('Showing 50 of 200 entries');
    expect(wrapper.find(EmptyListMessage).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(LogbookEntriesListItem);

    expect(items).toHaveLength(50);
    items.forEach((item, index) => {
      expect(
        item
          .find(`[data-testid="select-${entryData.logEntries[index].id}"]`)
          .isVisible(),
      ).toBe(true);
    });
  });

  it('will render correctly with a full list', () => {
    opts.props = {
      entries: {
        logEntries: entryData.logEntries,
        totalCount: entryData.logEntries.length,
      },
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.get(EntriesCount).text()).toBe('Showing 50 of 50 entries');
    expect(wrapper.find(EmptyListMessage).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);

    const items = wrapper.findAllComponents(LogbookEntriesListItem);

    expect(items).toHaveLength(50);
    items.forEach((item, index) => {
      expect(
        item
          .find(`[data-testid="select-${entryData.logEntries[index].id}"]`)
          .isVisible(),
      ).toBe(true);
    });
  });

  it('will emit "load-more" event when the load more button is clicked', () => {
    opts.props = {
      entries: entryData,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    wrapper.get(LoadMoreButton).trigger('click');
    expect(wrapper.emitted('load-more')).toEqual([[]]);
  });

  it('will show a loading spinner when loading more results', () => {
    opts.props = {
      entries: entryData,
      isLoadingMore: true,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(
      wrapper.find('[data-testid="entries-loading-more"]').isVisible(),
    ).toBe(true);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  it('will render items with checkboxes if the list is in edit mode', () => {
    opts.props = {
      entries: entryData,
      editMode: true,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    const items = wrapper.findAllComponents(LogbookEntriesListItem);

    items.forEach((item) => {
      expect(item.findComponent(FormCheckbox).isVisible()).toBe(true);
    });
  });

  it('will not render checkboxes if the list is not in edit mode', () => {
    opts.props = {
      entries: entryData,
      editMode: false,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.findComponent(FormCheckbox).exists()).toBe(false);
  });

  it('will bubble up select events from list items', () => {
    opts.props = {
      entries: entryData,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    const item = wrapper.getComponent(LogbookEntriesListItem);
    item.vm.$emit('select', entryData.logEntries[0]);

    expect(wrapper.emitted('select')).toEqual([[entryData.logEntries[0]]]);
  });

  it('will show Create Entry and Import Entry buttons if the user is logged in and the list is in edit mode', () => {
    currentUser.user = BasicUser;
    opts.props = {
      entries: entryData,
      editMode: true,
    };
    const wrapper = mount(LogbookEntriesList, opts);

    const addEntry = wrapper.get<HTMLAnchorElement>(
      '[data-testid="create-entry"]',
    );
    expect(addEntry.isVisible()).toBe(true);
    expect(addEntry.element.href).toBe(
      `http://localhost/logbook/${BasicUser.username}/new`,
    );

    const importEntries = wrapper.get<HTMLAnchorElement>(
      '[data-testid="import-entries"]',
    );
    expect(importEntries.isVisible()).toBe(true);
    expect(importEntries.element.href).toBe(
      `http://localhost/importLogs/${BasicUser.username}`,
    );
  });

  it('will hide Add Entry and Import Entries buttons if the user is not authenticated', () => {
    currentUser.user = null;
    opts.props = {
      entries: entryData,
      editMode: true,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="import-entries"]').exists()).toBe(false);
  });

  it('will hide Add Entry and Import Entries buttons if the list is not in edit mode', () => {
    currentUser.user = BasicUser;
    opts.props = {
      entries: entryData,
      editMode: false,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.find('[data-testid="create-entry"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="import-entries"]').exists()).toBe(false);
  });

  it('will emit event when sort order is changed', async () => {
    const expected = `${LogEntrySortBy.EntryTime}-${SortOrder.Ascending}`;
    opts.props = {
      entries: entryData,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    await wrapper.get(SortOrderSelect).setValue(expected);

    expect(wrapper.emitted('sort-order-changed')).toEqual([
      [LogEntrySortBy.EntryTime, SortOrder.Ascending],
    ]);
  });

  it('will allow the sort order to be set in the props', () => {
    const expected = `${LogEntrySortBy.EntryTime}-${SortOrder.Ascending}`;
    opts.props = {
      entries: entryData,
      sortBy: LogEntrySortBy.EntryTime,
      sortOrder: SortOrder.Ascending,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    expect(wrapper.get<HTMLSelectElement>(SortOrderSelect).element.value).toBe(
      expected,
    );
  });
});
