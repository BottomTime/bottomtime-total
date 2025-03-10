import {
  ApiClient,
  ApiList,
  FriendDTO,
  FriendsSortBy,
  ListFriendsResposneSchema,
  SortOrder,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import { createRouter } from 'tests/fixtures/create-router';
import { Router } from 'vue-router';

import FriendsListItem from '../../../../src/components/friends/friends-list-item.vue';
import FriendsList from '../../../../src/components/friends/friends-list.vue';
import FriendTestData from '../../../fixtures/friends.json';

dayjs.extend(relativeTime);

const FriendsCount = '[data-testid="friends-count"]';
const FriendsListPanel = '[data-testid="friends-list"]';
const LoadMoreButton = '[data-testid="friends-load-more"]';
const LoadMoreMessage = '[data-testid="friends-loading-more"]';
const NoFriendsMessage = '[data-testid="no-friends"]';
const SortOrderDropdown = '[data-testid="sort-order"]';

describe('Friends list component', () => {
  let client: ApiClient;
  let router: Router;
  let friendData: ApiList<FriendDTO>;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof FriendsList>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
    pinia = createPinia();
    friendData = ListFriendsResposneSchema.parse(FriendTestData);

    opts = {
      global: {
        plugins: [router, pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render an empty list', () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: {
          data: [],
          totalCount: 0,
        },
      },
    });

    expect(wrapper.get(FriendsCount).text()).toBe('Showing 0 of 0 friends');
    expect(wrapper.get(NoFriendsMessage).isVisible()).toBe(true);
    expect(wrapper.find(FriendsListPanel).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.find(LoadMoreMessage).exists()).toBe(false);
  });

  it('will render a partial list', () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: {
          data: friendData.data.slice(0, 12),
          totalCount: friendData.totalCount,
        },
      },
    });

    expect(wrapper.get(FriendsCount).text()).toBe('Showing 12 of 59 friends');
    expect(wrapper.find(NoFriendsMessage).exists()).toBe(false);
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);
    expect(wrapper.find(LoadMoreMessage).exists()).toBe(false);

    const list = wrapper.findAllComponents(FriendsListItem);
    expect(list.length).toBe(12);

    list.forEach((item, index) => {
      expect(item.text()).toContain(friendData.data[index].username);
    });
  });

  it('will render a full list', () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: friendData,
      },
    });

    expect(wrapper.get(FriendsCount).text()).toBe('Showing 59 of 59 friends');
    expect(wrapper.find(NoFriendsMessage).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.find(LoadMoreMessage).exists()).toBe(false);

    const list = wrapper.findAllComponents(FriendsListItem);
    expect(list.length).toBe(friendData.data.length);

    list.forEach((item, index) => {
      expect(item.text()).toContain(friendData.data[index].username);
    });
  });

  it('will emit "load-more" event if Load More button is clicked', async () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: {
          data: friendData.data.slice(0, 12),
          totalCount: friendData.totalCount,
        },
      },
    });

    await wrapper.get(LoadMoreButton).trigger('click');

    expect(wrapper.emitted('load-more')).toEqual([[]]);
  });

  it('will render a loading message when loading more friends', () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: {
          data: friendData.data.slice(0, 12),
          totalCount: friendData.totalCount,
        },
        isLoadingMore: true,
      },
    });

    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.get(LoadMoreMessage).isVisible()).toBe(true);
  });

  ['select', 'unfriend'].forEach((event) => {
    it(`will bubble up a "${event}" event when a list item raises it`, async () => {
      const wrapper = mount(FriendsList, {
        ...opts,
        props: {
          friends: friendData,
        },
      });

      await wrapper
        .findComponent(FriendsListItem)
        .vm.$emit(event, friendData.data[0]);

      expect(wrapper.emitted(event)).toEqual([[friendData.data[0]]]);
    });
  });

  [
    { sortBy: FriendsSortBy.Username, sortOrder: SortOrder.Ascending },
    { sortBy: FriendsSortBy.Username, sortOrder: SortOrder.Descending },
    { sortBy: FriendsSortBy.FriendsSince, sortOrder: SortOrder.Ascending },
    { sortBy: FriendsSortBy.FriendsSince, sortOrder: SortOrder.Descending },
  ].forEach(({ sortBy, sortOrder }) => {
    it(`will initialize sort order dropdown sorted by ${sortBy} and ordered by ${sortOrder}`, () => {
      const wrapper = mount(FriendsList, {
        ...opts,
        props: {
          friends: friendData,
          sortBy,
          sortOrder,
        },
      });

      const dropdown = wrapper.get<HTMLSelectElement>(SortOrderDropdown);
      expect(dropdown.element.value).toBe(`${sortBy}-${sortOrder}`);
    });
  });

  it('will default sort order to username ascending if not provided', () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: friendData,
      },
    });

    const dropdown = wrapper.get<HTMLSelectElement>(SortOrderDropdown);
    expect(dropdown.element.value).toBe(
      `${FriendsSortBy.Username}-${SortOrder.Ascending}`,
    );
  });

  it('will emit "change-sort-order" event if sort order is changed', async () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: friendData,
      },
    });

    const dropdown = wrapper.get<HTMLSelectElement>(SortOrderDropdown);
    await dropdown.setValue(
      `${FriendsSortBy.FriendsSince}-${SortOrder.Descending}`,
    );

    expect(wrapper.emitted('change-sort-order')).toEqual([
      [FriendsSortBy.FriendsSince, SortOrder.Descending],
    ]);
  });

  it('will emit "add-friend" event when Add Friend button is clicked', async () => {
    const wrapper = mount(FriendsList, {
      ...opts,
      props: {
        friends: friendData,
      },
    });
    await wrapper.get('[data-testid="add-friend"]').trigger('click');
    expect(wrapper.emitted('add-friend')).toEqual([[]]);
  });
});
