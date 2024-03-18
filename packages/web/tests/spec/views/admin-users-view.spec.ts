import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClient, ApiClientKey } from '../../../src/client';
import ManageUser from '../../../src/components/admin/manage-user.vue';
import UsersList from '../../../src/components/admin/users-list.vue';
import { useCurrentUser } from '../../../src/store';
import AdminUsersView from '../../../src/views/admin-users-view.vue';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Account View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof AdminUsersView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/admin/users/:username',
        name: 'admin-user',
        component: ManageUser,
      },
    ]);
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will display the login form if user is not authenticated', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    const wrapper = mount(AdminUsersView, opts);
    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it('will display a forbidden message if the user is not an admin', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    const wrapper = mount(AdminUsersView, opts);
    expect(
      wrapper.get('[data-testid="require-auth-unauthorized"]').isVisible(),
    ).toBe(true);
  });

  it('will display the users list to admins', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = AdminUser;
    const wrapper = mount(AdminUsersView, opts);
    expect(wrapper.getComponent(UsersList).isVisible()).toBe(true);
  });
});
