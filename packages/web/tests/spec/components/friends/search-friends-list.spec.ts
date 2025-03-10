import {
  ApiClient,
  ApiList,
  ProfileDTO,
  SearchUsersResponseSchema,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import 'tests/dayjs';

import SearchFriendsListItem from '../../../../src/components/friends/search-friends-list-item.vue';
import SearchFriendsList from '../../../../src/components/friends/search-friends-list.vue';
import UsersTestData from '../../../fixtures/user-search-results.json';

const CountsMessage = '[data-testid="search-friends-counts"]';
const FriendsList = '[data-testid="search-friends-list"]';
const LoadMoreButton = '[data-testid="search-friends-load-more"]';
const NoFriendsMessage = '[data-testid="search-friends-no-results"]';
const LoadingMoreMessage = '[data-testid="search-friends-loading-more"]';

describe('Search friends list component', () => {
  let client: ApiClient;
  let searchData: ApiList<ProfileDTO>;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof SearchFriendsList>;

  beforeAll(() => {
    const userData = SearchUsersResponseSchema.parse(UsersTestData);
    client = new ApiClient();
    searchData = {
      data: userData.data.map((user) => user.profile),
      totalCount: userData.totalCount,
    };
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render loading spinner if "isLoading" is true', () => {
    const wrapper = mount(SearchFriendsList, {
      ...opts,
      props: { isLoading: true, users: { data: [], totalCount: 0 } },
    });
    expect(
      wrapper.find('[data-testid="search-friends-loading"]').isVisible(),
    ).toBe(true);
    expect(wrapper.find(FriendsList).exists()).toBe(false);
  });

  it('will render correctly with empty list', () => {
    const wrapper = mount(SearchFriendsList, {
      ...opts,
      props: { users: { data: [], totalCount: 0 } },
    });
    expect(
      wrapper.find('[data-testid="search-friends-loading"]').exists(),
    ).toBe(false);
    expect(wrapper.find(FriendsList).exists()).toBe(false);
    expect(wrapper.find(NoFriendsMessage).isVisible()).toBe(true);
  });

  it('will render correcty for partial list', () => {
    const wrapper = mount(SearchFriendsList, {
      ...opts,
      props: {
        users: {
          data: searchData.data.slice(0, 50),
          totalCount: searchData.totalCount,
        },
      },
    });
    expect(
      wrapper.find('[data-testid="search-friends-loading"]').exists(),
    ).toBe(false);
    expect(wrapper.find(LoadMoreButton).isVisible()).toBe(true);
    expect(wrapper.find(LoadingMoreMessage).exists()).toBe(false);
    expect(wrapper.find(CountsMessage).text()).toBe('Showing 50 of 503 users');

    const items = wrapper.findAllComponents(SearchFriendsListItem);
    expect(items).toHaveLength(50);

    items.forEach((item, index) => {
      expect(item.text()).toContain(searchData.data[index].username);
    });
  });

  it('will render correctly for full list', () => {
    const wrapper = mount(SearchFriendsList, {
      ...opts,
      props: {
        users: {
          data: searchData.data,
          totalCount: searchData.data.length,
        },
      },
    });
    expect(
      wrapper.find('[data-testid="search-friends-loading"]').exists(),
    ).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.find(CountsMessage).text()).toBe('Showing 100 of 100 users');

    const items = wrapper.findAllComponents(SearchFriendsListItem);
    expect(items).toHaveLength(100);

    items.forEach((item, index) => {
      expect(item.text()).toContain(searchData.data[index].username);
    });
  });

  it('will show loading spinner while loading more results', () => {
    const wrapper = mount(SearchFriendsList, {
      ...opts,
      props: {
        isLoadingMore: true,
        users: {
          data: searchData.data.slice(0, 50),
          totalCount: searchData.totalCount,
        },
      },
    });

    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.find(LoadingMoreMessage).isVisible()).toBe(true);
  });

  it('will re-emit "send-request" events from the list items', () => {
    const wrapper = mount(SearchFriendsList, {
      ...opts,
      props: { users: searchData },
    });

    const item = wrapper.findComponent(SearchFriendsListItem);
    item.vm.$emit('send-request', searchData.data[0]);

    expect(wrapper.emitted('send-request')).toEqual([[searchData.data[0]]]);
  });
});
