import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import 'tests/dayjs';

import UsersListItem from '../../../../src/components/admin/users-list-item.vue';
import {
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

describe('Admin User List Item component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof UsersListItem>;

  beforeAll(() => {
    client = new ApiClient();
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
    jest.useFakeTimers({
      now: new Date('2024-02-15T16:59:08.962Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render correctly for user with full profile', () => {
    const wrapper = mount(UsersListItem, {
      ...opts,
      props: { user: UserWithFullProfile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for user with minimal profile', () => {
    const wrapper = mount(UsersListItem, {
      ...opts,
      props: { user: UserWithEmptyProfile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit an event when the username is clicked', async () => {
    const wrapper = mount(UsersListItem, {
      ...opts,
      props: { user: UserWithFullProfile },
    });
    await wrapper
      .find(`[data-testid="userslist-link-${UserWithFullProfile.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('user-click')).toEqual([[UserWithFullProfile]]);
  });
});
