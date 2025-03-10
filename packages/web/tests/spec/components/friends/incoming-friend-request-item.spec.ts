import {
  AccountTier,
  ApiClient,
  FriendRequestDTO,
  FriendRequestDirection,
  LogBookSharing,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';

import IncomingFriendRequestListItem from '../../../../src/components/friends/incoming-friend-request-item.vue';

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

const AcceptButton = `[data-testid="accept-request-${TestRequestItem.friendId}"]`;
const DeclineButton = `[data-testid="decline-request-${TestRequestItem.friendId}"]`;
const DismissButton = `[data-testid="dismiss-request-${TestRequestItem.friendId}"]`;
const SelectLink = `[data-testid="select-request-${TestRequestItem.friendId}"]`;

describe('Incoming friend request list item', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof IncomingFriendRequestListItem>;
  let request: FriendRequestDTO;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    request = { ...TestRequestItem };
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

  it('will render correctly', () => {
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for an accepted request', () => {
    request.accepted = true;
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for a declined request with no reason', () => {
    request.accepted = false;
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for a declined request with a reason', () => {
    request.accepted = false;
    request.reason = 'Nope. Denied!';
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit "select" event when select link is clicked', async () => {
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    await wrapper.get(SelectLink).trigger('click');
    expect(wrapper.emitted('select')).toEqual([[request]]);
  });

  it('will emit "accept" event when accept button is clicked', async () => {
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    await wrapper.get(AcceptButton).trigger('click');
    expect(wrapper.emitted('accept')).toEqual([[request]]);
  });

  it('will emit "decline" event when decline button is clicked', async () => {
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    await wrapper.get(DeclineButton).trigger('click');
    expect(wrapper.emitted('decline')).toEqual([[request]]);
  });

  it('will emit "dismiss" event when dismiss button is clicked', async () => {
    request.accepted = false;
    request.reason = 'Nope. Denied!';
    const wrapper = mount(IncomingFriendRequestListItem, {
      ...opts,
      props: { request },
    });
    await wrapper.get(DismissButton).trigger('click');
    expect(wrapper.emitted('dismiss')).toEqual([[request]]);
  });
});
