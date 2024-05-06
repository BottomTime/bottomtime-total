import {
  ListLogEntriesResponseDTO,
  ListLogEntriesResponseSchema,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import LogbookEntriesListItem from '../../../../src/components/logbook/logbook-entries-list-item.vue';
import LogbookEntriesList from '../../../../src/components/logbook/logbook-entries-list.vue';
import { useCurrentUser } from '../../../../src/store';
import TestData from '../../../fixtures/log-entries.json';

const EntriesCount = '[data-testid="entries-count"]';
const EmptyListMessage = '[data-testid="empty-logbook-message"]';
const LogbookList = '[data-testid="logbook-list"]';
const LoadMoreButton = '[data-testid="logbook-load-more"]';

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

  it('will show a loading spinner when loading more results', () => {});

  it('will render items with checkboxes if the list is in edit mode', () => {});

  it('will bubble up select events from list items', () => {
    opts.props = {
      entries: entryData,
    };
    const wrapper = mount(LogbookEntriesList, opts);
    const item = wrapper.getComponent(LogbookEntriesListItem);
    item.vm.$emit('select', entryData.logEntries[0]);

    expect(wrapper.emitted('select')).toEqual([[entryData.logEntries[0]]]);
  });
});
