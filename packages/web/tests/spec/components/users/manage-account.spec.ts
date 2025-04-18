import { ApiClient, Fetcher, UserDTO } from '@bottomtime/api';

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
import ManageAccount from '../../../../src/components/users/manage-account.vue';
import ManagePassword from '../../../../src/components/users/manage-password.vue';
import UsernameAndEmail from '../../../../src/components/users/username-and-email.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Manage Account component', () => {
  let features: ConfigCatClientMock;
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let userData: UserDTO;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ManageAccount>;

  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2024-02-16T16:56:39.939Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
    features = new ConfigCatClientMock({});
  });

  beforeEach(() => {
    pinia = createPinia();
    userData = {
      ...BasicUser,
      lastLogin: new Date('2024-02-16T14:36:09.000Z').valueOf(),
      lastPasswordChange: new Date('2023-12-10T19:20:44.000Z').valueOf(),
      profile: { ...BasicUser.profile },
      settings: { ...BasicUser.settings },
    };
    opts = {
      props: {
        user: userData,
      },
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
    jest.spyOn(client.memberships, 'listMemberships').mockResolvedValue([]);
  });

  it('will render timestamps correctly', () => {
    const wrapper = mount(ManageAccount, opts);
    expect(
      wrapper.get('[data-testid="account-timestamps"]').text(),
    ).toMatchSnapshot();
  });

  it('will propagate events when username or email are modified', () => {
    const newUsername = 'jake311';
    const newEmail = 'jakensteins_monster@email.com';
    const wrapper = mount(ManageAccount, opts);
    const usernameAndEmail = wrapper.getComponent(UsernameAndEmail);

    usernameAndEmail.vm.$emit('change-username', newUsername);
    usernameAndEmail.vm.$emit('change-email', newEmail);

    expect(wrapper.emitted('change-username')).toEqual([[newUsername]]);
    expect(wrapper.emitted('change-email')).toEqual([[newEmail]]);
  });

  it('will propagate events when password is modified', () => {
    const wrapper = mount(ManageAccount, opts);
    const managePassword = wrapper.getComponent(ManagePassword);
    managePassword.vm.$emit('change-password');
    expect(wrapper.emitted('change-password')).toBeDefined();
  });

  it('will load the OAuth connections when the component is mounted', async () => {
    jest
      .spyOn(client.auth, 'getOAuthProviders')
      .mockResolvedValue(new Set(['github']));

    const wrapper = mount(ManageAccount, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="link-google"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="link-discord"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="unlink-github"]').isVisible()).toBe(
      true,
    );
  });

  it('will allow users to unlink an OAuth account', async () => {
    jest
      .spyOn(client.auth, 'getOAuthProviders')
      .mockResolvedValue(new Set(['github']));
    const unlinkSpy = jest
      .spyOn(client.auth, 'unlinkOAuthProvider')
      .mockResolvedValue();

    const wrapper = mount(ManageAccount, opts);
    await flushPromises();

    await wrapper.get('[data-testid="unlink-github"]').trigger('click');
    await flushPromises();

    expect(unlinkSpy).toHaveBeenCalledWith(BasicUser.username, 'github');
    expect(wrapper.find('[data-testid="unlink-github"]').exists()).toBe(false);
  });
});
