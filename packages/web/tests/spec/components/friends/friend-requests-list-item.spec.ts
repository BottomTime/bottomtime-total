import {
  AccountTier,
  FriendRequestDTO,
  FriendRequestDirection,
  LogBookSharing,
} from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import FriendRequestsListItem from '../../../../src/components/friends/friend-requests-list-item.vue';
import IncomingFriendRequestItem from '../../../../src/components/friends/incoming-friend-request-item.vue';
import OutgoingFriendRequestItem from '../../../../src/components/friends/outgoing-friend-request-item.vue';

const TestRequestItem: FriendRequestDTO = {
  created: new Date('2024-04-23T12:25:09.653Z').valueOf(),
  expires: new Date('2024-04-30T12:25:09.653Z').valueOf(),
  direction: FriendRequestDirection.Incoming,
  friendId: 'c0175aac-fe45-4a53-a3f7-41eb0f0f52b6',
  friend: {
    userId: 'c0175aac-fe45-4a53-a3f7-41eb0f0f52b6',
    accountTier: AccountTier.Basic,
    memberSince: new Date('2022-02-18T12:25:09.653Z').valueOf(),
    username: 'testuser',
    logBookSharing: LogBookSharing.FriendsOnly,
    avatar: 'https://example.com/avatar.jpg',
    location: 'Testville, USA',
    name: 'Test User',
  },
};

describe('Friend requests list item', () => {
  let request: FriendRequestDTO;

  beforeEach(() => {
    request = { ...TestRequestItem };
  });

  it('will render an incoming item', () => {
    request.direction = FriendRequestDirection.Incoming;
    const wrapper = mount(FriendRequestsListItem, {
      props: { request },
    });

    expect(wrapper.findComponent(IncomingFriendRequestItem).isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(OutgoingFriendRequestItem).exists()).toBe(
      false,
    );
  });

  it('will render an outgoing item', () => {
    request.direction = FriendRequestDirection.Outgoing;
    const wrapper = mount(FriendRequestsListItem, {
      props: { request },
    });

    expect(wrapper.findComponent(OutgoingFriendRequestItem).isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(IncomingFriendRequestItem).exists()).toBe(
      false,
    );
  });

  ['accept', 'decline', 'dismiss', 'select'].forEach((event) => {
    it(`will echo a "${event}" event from an incoming request item`, () => {
      request.direction = FriendRequestDirection.Incoming;
      const wrapper = mount(FriendRequestsListItem, {
        props: { request },
      });

      const item = wrapper.findComponent(IncomingFriendRequestItem);
      item.vm.$emit(event, request);

      expect(wrapper.emitted(event)).toEqual([[request]]);
    });
  });

  ['cancel', 'dismiss', 'select'].forEach((event) => {
    it(`will echo a "${event}" event from an outgoing request item`, () => {
      request.direction = FriendRequestDirection.Outgoing;
      const wrapper = mount(FriendRequestsListItem, {
        props: { request },
      });

      const item = wrapper.findComponent(OutgoingFriendRequestItem);
      item.vm.$emit(event, request);

      expect(wrapper.emitted(event)).toEqual([[request]]);
    });
  });
});
