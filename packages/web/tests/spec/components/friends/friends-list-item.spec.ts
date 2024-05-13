import { FriendDTO, LogBookSharing } from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import FriendsListItem from '../../../../src/components/friends/friends-list-item.vue';

dayjs.extend(relativeTime);

const FullTestFriendData: FriendDTO = {
  id: '80fd5b82-e90d-4417-a8a5-51d8311e91a7',
  memberSince: new Date('2021-01-01T00:00:00Z'),
  friendsSince: new Date('2024-02-21T00:00:00Z'),
  logBookSharing: LogBookSharing.FriendsOnly,
  username: 'bob32',
  avatar: 'https://example.com/avatar.jpg',
  location: 'San Francisco, CA',
  name: 'Bob the Diver',
};

const PartialTestFriendData: FriendDTO = {
  id: '80fd5b82-e90d-4417-a8a5-51d8311e91a7',
  memberSince: new Date('2021-01-01T00:00:00Z'),
  friendsSince: new Date('2024-02-21T00:00:00Z'),
  logBookSharing: LogBookSharing.Public,
  username: 'bob32',
};

const SelectLink = `[data-testid="select-friend-${FullTestFriendData.username}"]`;
const UnfriendButton = `[data-testid="unfriend-${FullTestFriendData.username}"]`;

describe('Friends list item component', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2024-04-25T12:00:00Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render correctly with full friend data', () => {
    const wrapper = mount(FriendsListItem, {
      props: { friend: FullTestFriendData },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly with partial friend data', () => {
    const wrapper = mount(FriendsListItem, {
      props: { friend: PartialTestFriendData },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit "select" event if username is clicked on', async () => {
    const wrapper = mount(FriendsListItem, {
      props: { friend: FullTestFriendData },
    });

    await wrapper.get(SelectLink).trigger('click');
    expect(wrapper.emitted('select')).toEqual([[FullTestFriendData]]);
  });

  it('will emit "unfriend" event if Unfriend button is clicked', async () => {
    const wrapper = mount(FriendsListItem, {
      props: { friend: FullTestFriendData },
    });

    await wrapper.get(UnfriendButton).trigger('click');
    expect(wrapper.emitted('unfriend')).toEqual([[FullTestFriendData]]);
  });
});
