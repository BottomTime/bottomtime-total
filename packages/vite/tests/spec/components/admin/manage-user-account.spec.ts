import { UserDTO } from '@bottomtime/api';

import { ApiClient, ApiClientKey, User } from '@/client';
import ManageUserAccount from '@/components/admin/manage-user-account.vue';
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

import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);
dayjs.extend(utc);

describe('Manage User Account component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let userData: UserDTO;
  let opts: ComponentMountingOptions<typeof ManageUserAccount>;

  beforeAll(() => {
    router = createRouter();
    client = new ApiClient();

    jest.useFakeTimers({
      now: new Date('2024-02-14T16:27:57.383Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  beforeEach(() => {
    pinia = createPinia();
    userData = { ...BasicUser };
    opts = {
      props: { user: userData },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will display timestamps with fuzzy dates', () => {
    const wrapper = mount(ManageUserAccount, opts);
    expect(
      wrapper.get('[data-testid="account-timestamps"]').html(),
    ).toMatchSnapshot();
  });

  it('will display timestamps with exact dates', async () => {
    const wrapper = mount(ManageUserAccount, opts);
    await wrapper.get('[data-testid="toggle-fuzzy-timestamps"]').setValue(true);
    await flushPromises();
    expect(
      wrapper.get('[data-testid="account-timestamps"]').html(),
    ).toMatchSnapshot();
  });

  it('will allow an admin to suspend an account', async () => {});
});
