import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import 'tests/dayjs';

import SearchFriendsListItem from '../../../../src/components/friends/search-friends-list-item.vue';
import {
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

describe('Search friends list item component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof SearchFriendsListItem>;

  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2024-07-12T00:00:00Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
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
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render correctly for full profile', () => {
    const wrapper = mount(SearchFriendsListItem, {
      ...opts,
      props: { user: UserWithFullProfile.profile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for partial profile', () => {
    const wrapper = mount(SearchFriendsListItem, {
      ...opts,
      props: { user: UserWithEmptyProfile.profile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will send a "send-request" event when the Send Request button is clicked', async () => {
    const wrapper = mount(SearchFriendsListItem, {
      ...opts,
      props: { user: UserWithEmptyProfile.profile },
    });

    await wrapper
      .get(`[data-testid="send-request-${UserWithEmptyProfile.username}"]`)
      .trigger('click');
    expect(wrapper.emitted('send-request')).toEqual([
      [UserWithEmptyProfile.profile],
    ]);
  });
});
