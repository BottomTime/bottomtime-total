import {
  ComponentMountingOptions,
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
import { ApiClient, ApiClientKey, User } from '../../../../src/client';
import UsersList from '../../../../src/components/admin/users-list.vue';
import { Config } from '../../../../src/config';
import { createRouter } from '../../../fixtures/create-router';
import SearchResults from '../../../fixtures/user-search-results.json';

dayjs.extend(relativeTime);

const UsersListElement = '[data-testid="users-list"]';

describe('Users List component', () => {
  let client: ApiClient;
  let router: Router;
  let searchResults: AdminSearchUsersResponseDTO;

  let pinia: Pinia;
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
    window.__INITIAL_STATE__ = {
      currentUser: null,
      adminUsersList: searchResults,
    };
    pinia = createPinia();
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

  it('will render list of users on the client side', async () => {
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
  });

  it('will indicate when there are no users to show', async () => {
    searchResults.users = [];
    const wrapper = mount(UsersList, { global });
    expect(
      wrapper.find('[data-testid="users-list-no-users"]').isVisible(),
    ).toBe(true);
  });

  it.todo('will allow the admin to filter results');

  it.todo('will allow the admin to load more results');

  it.todo('will indicate when there are no more results to load');

  it.todo(
    'allow the admin to click a user from the list and open the drawer to view the user details',
  );
});
