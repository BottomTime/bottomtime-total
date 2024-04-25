import { mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import SearchFriendsListItem from '../../../../src/components/friends/search-friends-list-item.vue';
import {
  UserWithEmptyProfile,
  UserWithFullProfile,
} from '../../../fixtures/users';

dayjs.extend(relativeTime);

describe('Search friends list item component', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2024-07-12T00:00:00Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render correctly for full profile', () => {
    const wrapper = mount(SearchFriendsListItem, {
      props: { user: UserWithFullProfile.profile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for partial profile', () => {
    const wrapper = mount(SearchFriendsListItem, {
      props: { user: UserWithEmptyProfile.profile },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will send a "send-request" event when the Send Request button is clicked', async () => {
    const wrapper = mount(SearchFriendsListItem, {
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
