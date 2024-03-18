import { UserDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClient, ApiClientKey } from '../../../../src/client';
import ManageAccount from '../../../../src/components/users/manage-account.vue';
import ManagePassword from '../../../../src/components/users/manage-password.vue';
import UsernameAndEmail from '../../../../src/components/users/username-and-email.vue';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Manage Account component', () => {
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
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    userData = {
      ...BasicUser,
      lastLogin: new Date('2024-02-16T14:36:09.000Z'),
      lastPasswordChange: new Date('2023-12-10T19:20:44.000Z'),
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
        },
      },
    };
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
});
