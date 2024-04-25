import {
  ApiClient,
  FriendRequestDirection,
  SearchProfilesResponseDTO,
  SearchUsersResponseSchema,
} from '@bottomtime/api';
import { FriendRequest } from '@bottomtime/api/src/client/friend-request';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import SearchFriendsForm from '../../../../src/components/friends/search-friends-form.vue';
import SearchFriendsListItem from '../../../../src/components/friends/search-friends-list-item.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import UserTestData from '../../../fixtures/user-search-results.json';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);

const LoadMoreButton = '[data-testid="search-friends-load-more"]';
const SearchBox = '[data-testid="search-users"]';

describe('Search friends form component', () => {
  let client: ApiClient;
  let router: Router;
  let searchData: SearchProfilesResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof SearchFriendsForm>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();

    const userData = SearchUsersResponseSchema.parse(UserTestData);
    searchData = {
      users: userData.users.map((user) => user.profile),
      totalCount: userData.totalCount,
    };
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will display a helpful prompt before a search is performed', () => {
    const wrapper = mount(SearchFriendsForm, opts);
    expect(
      wrapper.find('[data-testid="begin-search-message"]').isVisible(),
    ).toBe(true);
  });

  it('will emit "close" event if user presses Esc key', async () => {
    const wrapper = mount(SearchFriendsForm, opts);
    await wrapper.find(SearchBox).trigger('keyup.esc');
    expect(wrapper.emitted('close')).toEqual([[]]);
  });

  it('will perform a search when the user types in the search box and presses enter', async () => {
    const wrapper = mount(SearchFriendsForm, opts);
    const spy = jest.spyOn(client.users, 'searchProfiles').mockResolvedValue({
      users: searchData.users.slice(0, 50),
      totalCount: searchData.totalCount,
    });

    const searchBox = wrapper.get(SearchBox);
    await searchBox.setValue('test');
    await searchBox.trigger('keyup.enter');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      query: 'test',
      filterFriends: true,
      limit: 50,
    });

    const items = wrapper.findAllComponents(SearchFriendsListItem);
    expect(items).toHaveLength(50);
  });

  it('will perform a search when the user types in the search box and clicks the search button', async () => {
    const wrapper = mount(SearchFriendsForm, opts);
    const spy = jest.spyOn(client.users, 'searchProfiles').mockResolvedValue({
      users: searchData.users.slice(0, 50),
      totalCount: searchData.totalCount,
    });

    await wrapper.find(SearchBox).setValue('test');
    await wrapper.find('[data-testid="search-users-right"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      query: 'test',
      filterFriends: true,
      limit: 50,
    });

    const items = wrapper.findAllComponents(SearchFriendsListItem);
    expect(items).toHaveLength(50);
  });

  it('will request more results when the user clicks the Load More button', async () => {
    const wrapper = mount(SearchFriendsForm, opts);
    const spy = jest
      .spyOn(client.users, 'searchProfiles')
      .mockResolvedValueOnce({
        users: searchData.users.slice(0, 50),
        totalCount: searchData.totalCount,
      });

    const searchBox = wrapper.get(SearchBox);
    await searchBox.setValue('test');
    await searchBox.trigger('keyup.enter');
    await flushPromises();

    spy.mockResolvedValueOnce({
      users: searchData.users.slice(50, 100),
      totalCount: searchData.totalCount,
    });

    await wrapper.get(LoadMoreButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      query: 'test',
      filterFriends: true,
      limit: 50,
      skip: 50,
    });

    const items = wrapper.findAllComponents(SearchFriendsListItem);
    expect(items).toHaveLength(100);

    items.forEach((item, index) => {
      expect(item.text()).toContain(searchData.users[index].username);
    });
  });

  it('will emit a "send-request" event when the user clicks the Send Request button', async () => {
    const wrapper = mount(SearchFriendsForm, opts);
    const friendo = searchData.users[2];
    const friendRequest = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      {
        created: dayjs().toDate(),
        expires: dayjs().add(14, 'days').toDate(),
        direction: FriendRequestDirection.Outgoing,
        friend: {
          id: friendo.userId,
          username: friendo.username,
          memberSince: friendo.memberSince,
        },
        friendId: friendo.userId,
      },
    );

    jest.spyOn(client.users, 'searchProfiles').mockResolvedValueOnce({
      users: searchData.users.slice(0, 50),
      totalCount: searchData.totalCount,
    });
    const spy = jest
      .spyOn(client.friends, 'createFriendRequest')
      .mockResolvedValue(friendRequest);

    const searchBox = wrapper.get(SearchBox);
    await searchBox.setValue('test');
    await searchBox.trigger('keyup.enter');
    await flushPromises();

    await wrapper
      .find(`[data-testid="send-request-${searchData.users[2].username}"]`)
      .trigger('click');

    expect(spy).toHaveBeenCalledWith(
      currentUser.user?.username,
      searchData.users[2].username,
    );

    expect(wrapper.emitted('request-sent')).toEqual([[friendRequest.toJSON()]]);
  });
});
