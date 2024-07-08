import { Fetcher, UserDTO, UserRole } from '@bottomtime/api';
import { ApiClient, User } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import ManageUser from '../../../src/components/admin/manage-user.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useAdmin, useCurrentUser } from '../../../src/store';
import AdminUserView from '../../../src/views/admin-user-view.vue';
import { createRouter } from '../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Account View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let admin: ReturnType<typeof useAdmin>;
  let opts: ComponentMountingOptions<typeof AdminUserView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
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
    currentUser = useCurrentUser(pinia);
    admin = useAdmin(pinia);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: new MockLocation(),
        },
      },
    };
  });

  it('will query for the target user on SSR', async () => {
    currentUser.user = AdminUser;
    const spy = jest
      .spyOn(client.users, 'getUser')
      .mockResolvedValue(new User(fetcher, BasicUser));
    await router.push(`/admin/users/${BasicUser.username}`);

    const rendered = await renderToString(AdminUserView, {
      global: opts.global,
    });

    expect(spy).toBeCalledWith(BasicUser.username);
    expect(rendered).toContain(BasicUser.username);
  });

  it('will display the login form if the user is not athenticated', () => {
    currentUser.user = null;
    const wrapper = mount(AdminUserView, opts);
    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(ManageUser).exists()).toBe(false);
  });

  it('will display a forbidden message if the user is not an admin', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminUserView, opts);
    expect(
      wrapper.get('[data-testid="require-auth-unauthorized"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(ManageUser).exists()).toBe(false);
  });

  it('will display a not found message if the target user does not exist', () => {
    currentUser.user = AdminUser;
    const wrapper = mount(AdminUserView, opts);
    expect(wrapper.get('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(ManageUser).exists()).toBe(false);
  });

  it("will allow an admin to manage the target user's account", () => {
    const newUsername = 'joe123';
    const newEmail = 'eviljoe@yahoo.com';
    currentUser.user = AdminUser;
    admin.currentUser = {
      ...BasicUser,
      emailVerified: true,
      hasPassword: false,
      isLockedOut: false,
      profile: { ...BasicUser.profile },
      settings: { ...BasicUser.settings },
    };
    const userId = BasicUser.id;
    const wrapper = mount(AdminUserView, opts);

    expect(wrapper.get('[data-testid="breadcrumbs"]').html()).toMatchSnapshot();
    const manageUser = wrapper.getComponent(ManageUser);
    expect(manageUser.get('[data-testid="username-value"]').text()).toBe(
      BasicUser.username,
    );

    manageUser.vm.$emit('account-lock-toggled', userId);
    manageUser.vm.$emit('password-reset', userId);
    manageUser.vm.$emit('role-changed', userId, UserRole.Admin);
    manageUser.vm.$emit('save-profile', userId, UserWithFullProfile.profile);
    manageUser.vm.$emit('save-settings', userId, UserWithFullProfile.settings);
    manageUser.vm.$emit('username-changed', userId, newUsername);
    manageUser.vm.$emit('email-changed', userId, newEmail);

    const updated: UserDTO = manageUser.vm.$props.user;
    expect(updated.username).toBe(newUsername);
    expect(updated.email).toBe(newEmail);
    expect(updated.emailVerified).toBe(false);
    expect(updated.hasPassword).toBe(true);
    expect(updated.lastPasswordChange?.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(updated.isLockedOut).toBe(true);
    expect(updated.role).toBe(UserRole.Admin);
    expect(updated.profile).toEqual(UserWithFullProfile.profile);
    expect(updated.settings).toEqual(UserWithFullProfile.settings);
  });
});
