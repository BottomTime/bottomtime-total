import {
  ApiClient,
  Fetcher,
  SortOrder,
  User,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
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
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let searchResults: AdminSearchUsersResponseDTO;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof UsersList>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    searchResults = {
      users: SearchResults.users.slice(0, 10).map((u) => UserSchema.parse(u)),
      totalCount: SearchResults.totalCount,
    };

    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    };
  });

  it('will render list of users on the client side', async () => {
    const results = {
      users: SearchResults.users
        .slice(0, 10)
        .map((u) => new User(fetcher, UserSchema.parse(u))),
      totalCount: SearchResults.totalCount,
    };
    jest.spyOn(client.users, 'searchUsers').mockResolvedValue(results);

    const wrapper = mount(UsersList, opts);
    await flushPromises();

    const list = wrapper.get(UsersListElement);
    expect(list.isVisible()).toBe(true);

    const items = wrapper.findAllComponents(UsersListItem);
    expect(items).toHaveLength(results.users.length);

    const loadMore = wrapper.get(LoadMore);
    expect(loadMore.isVisible()).toBe(true);
    expect(loadMore.text()).toContain('Load more results');
  });

  it('will indicate when there are no users to show', async () => {
    jest.spyOn(client.users, 'searchUsers').mockResolvedValue({
      users: [],
      totalCount: 0,
    });
    const wrapper = mount(UsersList, opts);
    await flushPromises();

    expect(
      wrapper.find('[data-testid="users-list-no-users"]').isVisible(),
    ).toBe(true);
  });

  it('will allow the admin to filter results', async () => {
    const refreshResults = {
      users: SearchResults.users
        .slice(20, 25)
        .map((u) => new User(fetcher, UserSchema.parse(u))),
      totalCount: 5,
    };
    jest.spyOn(client.users, 'searchUsers').mockResolvedValueOnce({
      users: [],
      totalCount: 0,
    });
    const wrapper = mount(UsersList, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.users, 'searchUsers')
      .mockResolvedValueOnce(refreshResults);

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
        .slice(20, 25)
        .map((u) => new User(fetcher, UserSchema.parse(u))),
      totalCount: 50,
    };
    jest.spyOn(client.users, 'searchUsers').mockResolvedValueOnce({
      users: SearchResults.users
        .slice(15, 20)
        .map((u) => new User(fetcher, UserSchema.parse(u))),
      totalCount: 50,
    });
    const wrapper = mount(UsersList, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.users, 'searchUsers')
      .mockResolvedValueOnce(refreshResults);

    await wrapper.get(SortOrderSelect).setValue('memberSince-desc');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
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
        .slice(15, 30)
        .map((u) => new User(fetcher, UserSchema.parse(u))),
      totalCount: 50,
    };

    jest.spyOn(client.users, 'searchUsers').mockResolvedValueOnce({
      users: SearchResults.users
        .slice(0, 15)
        .map((u) => new User(fetcher, UserSchema.parse(u))),
      totalCount: 50,
    });
    const wrapper = mount(UsersList, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.users, 'searchUsers')
      .mockResolvedValueOnce(refreshResults);

    await wrapper.get(LoadMore).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      limit: 50,
      skip: 15,
      sortBy: UsersSortBy.Username,
      sortOrder: SortOrder.Ascending,
    });

    const results = await wrapper.findAllComponents(UsersListItem);
    expect(results).toHaveLength(30);
    results.forEach((result, index) => {
      expect(result.text()).toContain(SearchResults.users[index].username);
    });
  });

  it('will allow an admin to manage a user by clicking them in the list', async () => {
    jest.spyOn(client.users, 'searchUsers').mockResolvedValue({
      users: SearchResults.users.map(
        (u) => new User(fetcher, UserSchema.parse(u)),
      ),
      totalCount: SearchResults.totalCount,
    });
    const wrapper = mount(UsersList, opts);
    await flushPromises();

    await wrapper
      .get(`[data-testid="userslist-link-${searchResults.users[0].id}"]`)
      .trigger('click');

    expect(wrapper.find('[data-testid="drawer-title"]').text()).toContain(
      searchResults.users[0].username,
    );
  });

  it('will propogate events when user accounts are modified', async () => {
    const userId = searchResults.users[0].id;
    const newUsername = 'm_gladstone';
    const newEmail = 'mgstone23@gmail.org';
    const newProfile = { name: 'Matty Gladstone', location: 'Las Vegas, NV' };
    const newSettings = { ...searchResults.users[8].settings };

    jest.spyOn(client.users, 'searchUsers').mockResolvedValue({
      users: SearchResults.users.map(
        (u) => new User(fetcher, UserSchema.parse(u)),
      ),
      totalCount: SearchResults.totalCount,
    });
    const wrapper = mount(UsersList, opts);
    await flushPromises();

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
