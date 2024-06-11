import {
  ApiClient,
  SortOrder,
  User,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import {
  AdminSearchUsersResponseDTO,
  UserSchema,
} from '../../../../../api/src';
import { ApiClientKey } from '../../../../src/api-client';
import ManageUser from '../../../../src/components/admin/manage-user.vue';
import UsersListItem from '../../../../src/components/admin/users-list-item.vue';
import UsersList from '../../../../src/components/admin/users-list.vue';
import { useAdmin } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import SearchResults from '../../../fixtures/user-search-results.json';

dayjs.extend(relativeTime);

const UsersListElement = '[data-testid="users-list"]';

const SearchInput = '[data-testid="search-users"]';
const RoleSelect = '[data-testid="role"]';
const AccountStatusSelect = '[data-testid="account-status"]';
const SortOrderSelect = '[data-testid="sort-order"]';
const Refresh = '[data-testid="refresh"]';
const LoadMore = '[data-testid="users-list-load-more"]';

describe('Users List component', () => {
  let client: ApiClient;
  let router: Router;
  let searchResults: AdminSearchUsersResponseDTO;

  let pinia: Pinia;
  let adminStore: ReturnType<typeof useAdmin>;
  let global: ComponentMountingOptions<typeof UsersList>['global'];

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    searchResults = {
      users: SearchResults.users.slice(0, 10).map((u) => UserSchema.parse(u)),
      totalCount: SearchResults.totalCount,
    };
    pinia = createPinia();
    adminStore = useAdmin(pinia);

    adminStore.users = searchResults;

    global = {
      plugins: [pinia, router],
      provide: {
        [ApiClientKey as symbol]: client,
      },
    };
  });

  it('will query for and render a list of users on the server side', async () => {
    const results = {
      users: SearchResults.users
        .slice(0, 10)
        .map((u) => new User(client.axios, UserSchema.parse(u))),
      totalCount: SearchResults.totalCount,
    };
    jest.spyOn(client.users, 'searchUsers').mockResolvedValue(results);

    const rendered = await renderToString(UsersList, { global });
    expect(rendered).toContain(results.users[0].username);
  });

  it('will render list of users on the client side', () => {
    const results = {
      users: SearchResults.users
        .slice(0, 10)
        .map((u) => new User(client.axios, UserSchema.parse(u))),
      totalCount: SearchResults.totalCount,
    };
    jest.spyOn(client.users, 'searchUsers').mockResolvedValue(results);

    const wrapper = mount(UsersList, { global });

    const list = wrapper.get(UsersListElement);
    expect(list.isVisible()).toBe(true);

    const loadMore = wrapper.get(LoadMore);
    expect(loadMore.isVisible()).toBe(true);
    expect(loadMore.text()).toContain('Load more results');
  });

  it('will indicate when there are no users to show', () => {
    searchResults.users = [];
    const wrapper = mount(UsersList, { global });
    expect(
      wrapper.find('[data-testid="users-list-no-users"]').isVisible(),
    ).toBe(true);
  });

  it('will allow the admin to filter results', async () => {
    const refreshResults = {
      users: SearchResults.users
        .slice(20, 5)
        .map((u) => new User(client.axios, UserSchema.parse(u))),
      totalCount: 5,
    };
    const wrapper = mount(UsersList, { global });
    const spy = jest
      .spyOn(client.users, 'searchUsers')
      .mockResolvedValue(refreshResults);

    await wrapper.find(SearchInput).setValue('test');
    await wrapper.find(RoleSelect).setValue(UserRole.User);
    await wrapper.find(AccountStatusSelect).setValue('suspended');
    await wrapper.find(Refresh).trigger('click');
    await flushPromises();

    expect(spy).toBeCalledWith({
      limit: 50,
      query: 'test',
      role: UserRole.User,
      skip: 0,
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Ascending,
    });
    const results = await wrapper.findAllComponents(UsersListItem);
    expect(results).toHaveLength(refreshResults.users.length);
    results.forEach((result, index) => {
      expect(result.text()).toContain(refreshResults.users[index].username);
    });
  });

  it('will allow the admin to sort the results', async () => {
    const refreshResults = {
      users: SearchResults.users
        .slice(20, 5)
        .map((u) => new User(client.axios, UserSchema.parse(u))),
      totalCount: 5,
    };
    const wrapper = mount(UsersList, { global });
    const spy = jest
      .spyOn(client.users, 'searchUsers')
      .mockResolvedValue(refreshResults);

    await wrapper.get(SortOrderSelect).setValue('memberSince-desc');
    await flushPromises();

    expect(spy).toBeCalledWith({
      limit: 50,
      skip: 0,
      sortBy: UsersSortBy.MemberSince,
      sortOrder: SortOrder.Descending,
    });
    const results = await wrapper.findAllComponents(UsersListItem);
    expect(results).toHaveLength(refreshResults.users.length);
    results.forEach((result, index) => {
      expect(result.text()).toContain(refreshResults.users[index].username);
    });
  });

  it('will allow the admin to load more results', async () => {
    const refreshResults = {
      users: SearchResults.users
        .slice(20, 5)
        .map((u) => new User(client.axios, UserSchema.parse(u))),
      totalCount: 5,
    };
    const wrapper = mount(UsersList, { global });
    const spy = jest
      .spyOn(client.users, 'searchUsers')
      .mockResolvedValue(refreshResults);

    await wrapper.get(LoadMore).trigger('click');
    await flushPromises();

    expect(spy).toBeCalledWith({
      limit: 50,
      skip: searchResults.users.length,
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Ascending,
    });
    const results = await wrapper.findAllComponents(UsersListItem);
    expect(results).toHaveLength(
      refreshResults.users.length + searchResults.users.length,
    );
    results.slice(searchResults.users.length).forEach((result, index) => {
      expect(result.text()).toContain(refreshResults.users[index].username);
    });
  });

  it('will indicate when there are no more results to load', async () => {
    const refreshResults = {
      users: [],
      totalCount: searchResults.totalCount,
    };
    const wrapper = mount(UsersList, { global });
    jest.spyOn(client.users, 'searchUsers').mockResolvedValue(refreshResults);

    await wrapper.get(LoadMore).trigger('click');
    await flushPromises();

    expect(wrapper.findAllComponents(UsersListItem)).toHaveLength(
      searchResults.users.length,
    );

    const loadMore = wrapper.get(LoadMore);
    expect(loadMore.text()).toContain('No more results');
    expect(loadMore.attributes('disabled')).toBeDefined();
  });

  it('will allow an admin to manage a user by clicking them in the list', async () => {
    const wrapper = mount(UsersList, { global });
    await wrapper
      .get(`[data-testid="userslist-link-${searchResults.users[0].id}"]`)
      .trigger('click');

    expect(wrapper.find('[data-testid="drawer-title"]').text()).toContain(
      searchResults.users[0].username,
    );
  });

  it('will propogate events when user accounts are modified', async () => {
    const wrapper = mount(UsersList, { global });
    const userId = searchResults.users[0].id;
    const newUsername = 'm_gladstone';
    const newEmail = 'mgstone23@gmail.org';
    const newProfile = { name: 'Matty Gladstone', location: 'Las Vegas, NV' };
    const newSettings = { ...searchResults.users[8].settings };

    await wrapper
      .get(`[data-testid="userslist-link-${userId}"]`)
      .trigger('click');
    await flushPromises();

    const manageUser = wrapper.findComponent(ManageUser);
    manageUser.vm.$emit('account-lock-toggled', userId);
    manageUser.vm.$emit('password-reset', userId);
    manageUser.vm.$emit('role-changed', userId, UserRole.Admin);
    manageUser.vm.$emit('save-profile', userId, newProfile);
    manageUser.vm.$emit('save-settings', userId, newSettings);
    manageUser.vm.$emit('username-changed', userId, newUsername);
    manageUser.vm.$emit('email-changed', userId, newEmail);
    await flushPromises();

    const firstItemText = wrapper
      .find('[data-testid="users-list"] > li')
      .text();
    expect(firstItemText).toContain(newUsername);
    expect(firstItemText).toContain(newProfile.name);
    expect(firstItemText).toContain(newEmail);
    expect(firstItemText).toContain(UserRole.Admin);
    expect(firstItemText).toContain('suspended');
    expect(firstItemText).toContain(newProfile.name);
  });
});
