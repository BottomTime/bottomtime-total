import {
  FriendRequestDTO,
  FriendRequestDirection,
  LogBookSharing,
} from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import OutgoingFriendRequestItem from '../../../../src/components/friends/outgoing-friend-request-item.vue';

const TestRequestItem: FriendRequestDTO = {
  created: new Date('2024-04-23T12:25:09.653Z').valueOf(),
  expires: new Date('2024-04-30T12:25:09.653Z').valueOf(),
  direction: FriendRequestDirection.Outgoing,
  friendId: 'c0175aac-fe45-4a53-a3f7-41eb0f0f52b6',
  friend: {
    id: 'c0175aac-fe45-4a53-a3f7-41eb0f0f52b6',
    memberSince: new Date('2022-02-18T12:25:09.653Z').valueOf(),
    username: 'testuser',
    logBookSharing: LogBookSharing.Public,
    avatar: 'https://example.com/avatar.jpg',
    location: 'Testville, USA',
    name: 'Test User',
  },
};

const CancelButton = `[data-testid="cancel-request-${TestRequestItem.friendId}"]`;
const DismissButton = `[data-testid="dismiss-request-${TestRequestItem.friendId}"]`;

describe('Outgoing friend request item', () => {
  let request: FriendRequestDTO;

  beforeEach(() => {
    request = { ...TestRequestItem };
  });

  it('will render correclty', () => {
    const wrapper = mount(OutgoingFriendRequestItem, {
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render accepted request correctly', () => {
    request.accepted = true;
    const wrapper = mount(OutgoingFriendRequestItem, {
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render declined request without reason correctly', () => {
    request.accepted = false;
    const wrapper = mount(OutgoingFriendRequestItem, {
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render declined request with reason correctly', () => {
    request.accepted = false;
    request.reason = 'Nope. Denied!';
    const wrapper = mount(OutgoingFriendRequestItem, {
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit a "cancel" event when the cancel button is clicked', async () => {
    const wrapper = mount(OutgoingFriendRequestItem, {
      props: { request },
    });
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toEqual([[request]]);
  });

  it('will emit a "dismiss" event when the dismiss button is clicked', async () => {
    request.accepted = false;
    const wrapper = mount(OutgoingFriendRequestItem, {
      props: { request },
    });
    await wrapper.get(DismissButton).trigger('click');
    expect(wrapper.emitted('dismiss')).toEqual([[request]]);
  });
});
