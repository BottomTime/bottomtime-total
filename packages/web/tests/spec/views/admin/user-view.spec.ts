import { Fetcher, UserDTO, UserRole } from '@bottomtime/api';
import { ApiClient } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ManageUser from '../../../../src/components/admin/manage-user.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { useCurrentUser } from '../../../../src/store';
import AdminUserView from '../../../../src/views/admin/user-view.vue';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Account View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let features: ConfigCatClientMock;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof AdminUserView>;
  let getSpy: jest.SpyInstance;

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
    features = new ConfigCatClientMock();
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    features.flags[NotificationsFeature.key] = true;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: features,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    getSpy = jest
      .spyOn(client.userAccounts, 'getUser')
      .mockResolvedValue(BasicUser);
    await router.push(`/admin/users/${BasicUser.username}`);
  });

  it('will retrieve the target user on load', async () => {
    currentUser.user = AdminUser;

    const wrapper = mount(AdminUserView, opts);
    await flushPromises();

    expect(getSpy).toHaveBeenCalledWith(BasicUser.username);
    expect(wrapper.getComponent(ManageUser).props('user')).toEqual(BasicUser);
  });

  it('will display the login form if the user is not athenticated', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminUserView, opts);
    await flushPromises();

    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(ManageUser).exists()).toBe(false);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('will display a forbidden message if the user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminUserView, opts);
    await flushPromises();

    expect(
      wrapper.get('[data-testid="require-auth-unauthorized"]').isVisible(),
    ).toBe(true);
    expect(wrapper.findComponent(ManageUser).exists()).toBe(false);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('will display a not found message if the target user does not exist', async () => {
    currentUser.user = AdminUser;
    getSpy = jest
      .spyOn(client.userAccounts, 'getUser')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(AdminUserView, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(ManageUser).exists()).toBe(false);
    expect(getSpy).toHaveBeenCalledWith(BasicUser.username);
  });

  it("will allow an admin to manage the target user's account", async () => {
    const newUsername = 'joe123';
    const newEmail = 'eviljoe@yahoo.com';
    currentUser.user = AdminUser;
    getSpy = jest.spyOn(client.userAccounts, 'getUser').mockResolvedValue({
      ...BasicUser,
      emailVerified: true,
      hasPassword: false,
      isLockedOut: false,
      profile: { ...BasicUser.profile },
      settings: { ...BasicUser.settings },
    });
    const userId = BasicUser.id;
    const wrapper = mount(AdminUserView, opts);
    await flushPromises();

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
