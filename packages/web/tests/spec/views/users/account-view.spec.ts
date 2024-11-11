import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import ManageAccount from '../../../../src/components/users/manage-account.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { useCurrentUser } from '../../../../src/store';
import AccountView from '../../../../src/views/users/account-view.vue';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Account View', () => {
  let client: ApiClient;
  let router: Router;
  let features: ConfigCatClientMock;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof AccountView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
    features = new ConfigCatClientMock({});
  });

  beforeEach(() => {
    pinia = createPinia();
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
  });

  it('will display the login form if user is not authenticated', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    const wrapper = mount(AccountView, opts);
    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it('will allow the user to manage their account', () => {
    const newUsername = 'new-username';
    const newEmail = 'new-email@gmail.org';

    const currentUser = useCurrentUser(pinia);
    currentUser.user = {
      ...BasicUser,
      emailVerified: true,
      hasPassword: false,
    };
    const wrapper = mount(AccountView, opts);
    const manageAccount = wrapper.getComponent(ManageAccount);
    expect(manageAccount.get('[data-testid="username-value"]').text()).toBe(
      currentUser.user.username,
    );
    expect(
      wrapper.find('[data-testid="require-auth-anonymous"]').exists(),
    ).toBe(false);

    manageAccount.vm.$emit('change-username', newUsername);
    manageAccount.vm.$emit('change-email', newEmail);
    manageAccount.vm.$emit('change-password');

    expect(currentUser.user.username).toBe(newUsername);
    expect(currentUser.user.email).toBe(newEmail);
    expect(currentUser.user.emailVerified).toBe(false);
    expect(currentUser.user.hasPassword).toBe(true);
    expect(currentUser.user.lastPasswordChange?.valueOf()).toBeCloseTo(
      Date.now(),
      -3,
    );
  });
});
