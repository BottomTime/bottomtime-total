import {
  ApiClient,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendRequestsResponseDTO,
  ListFriendRequestsResponseSchema,
  ListFriendsResponseDTO,
  ListFriendsResposneSchema,
  SortOrder,
} from '@bottomtime/api';
import { Friend } from '@bottomtime/api/src/client/friend';
import { FriendRequest } from '@bottomtime/api/src/client/friend-request';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import FriendRequestsListItem from '../../../src/components/friends/friend-requests-list-item.vue';
import FriendsListItem from '../../../src/components/friends/friends-list-item.vue';
import { AppInitialState, useInitialState } from '../../../src/initial-state';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import FriendsView from '../../../src/views/friends-view.vue';
import { createRouter } from '../../fixtures/create-router';
import TestFriendRequestData from '../../fixtures/friend-requests.json';
import TestFriendsData from '../../fixtures/friends.json';
import { BasicUser, UserWithFullProfile } from '../../fixtures/users';

dayjs.extend(relativeTime);
jest.mock('../../../src/initial-state');

const FriendsCount = '[data-testid="friends-count"]';
const RequestsCount = '[data-testid="request-counts"]';
const SortOrderSelect = '[data-testid="sort-order"]';

describe('Friends view', () => {
  let client: ApiClient;
  let router: Router;

  let friendsData: ListFriendsResponseDTO;
  let friendRequestsData: ListFriendRequestsResponseDTO;

  let initalState: AppInitialState;
  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof FriendsView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();

    friendsData = ListFriendsResposneSchema.parse(TestFriendsData);
    friendRequestsData = ListFriendRequestsResponseSchema.parse(
      TestFriendRequestData,
    );

    jest.mocked(useInitialState).mockImplementation(() => initalState);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    location = new MockLocation();

    friendsData = ListFriendsResposneSchema.parse(TestFriendsData);
    friendRequestsData = ListFriendRequestsResponseSchema.parse(
      TestFriendRequestData,
    );

    currentUser.user = { ...BasicUser };
    initalState = {
      currentUser: currentUser.user,
      friends: friendsData,
      friendRequests: friendRequestsData,
    };

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  it('will render login form if the current user is anonymous', () => {
    currentUser.user = null;
    const wrapper = mount(FriendsView, opts);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="friends-list"]').exists()).toBe(false);
  });

  it('will not attempt to prefetch friends and pending requests if the current user is anonymous', async () => {
    currentUser.user = null;
    const friendsSpy = jest
      .spyOn(client.friends, 'listFriends')
      .mockRejectedValue(new Error('Should not be called'));
    const friendReqeustsSpy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockRejectedValue(new Error('Should not be called'));

    await renderToString(FriendsView, { global: opts.global });

    expect(friendsSpy).not.toHaveBeenCalled();
    expect(friendReqeustsSpy).not.toHaveBeenCalled();
  });

  it('will prefetch friends and pending requests on the server side', async () => {
    const friendsSpy = jest
      .spyOn(client.friends, 'listFriends')
      .mockResolvedValue({
        friends: friendsData.friends
          .slice(0, 5)
          .map((f) => new Friend(client.axios, f)),
        totalCount: friendsData.totalCount,
      });
    const friendRequestsSpy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue({
        friendRequests: friendRequestsData.friendRequests
          .slice(0, 5)
          .map((r) => new FriendRequest(client.axios, BasicUser.username, r)),
        totalCount: friendRequestsData.totalCount,
      });

    const html = await renderToString(FriendsView, { global: opts.global });

    expect(friendsSpy).toHaveBeenCalledWith(BasicUser.username, { limit: 50 });
    expect(friendRequestsSpy).toHaveBeenCalledWith(BasicUser.username, {
      direction: FriendRequestDirection.Outgoing,
      limit: 50,
      showAcknowledged: true,
    });

    for (let i = 0; i < 5; i++) {
      expect(html).toContain(friendsData.friends[i].username);
      expect(html).toContain(
        friendRequestsData.friendRequests[i].friend.username,
      );
    }
  });

  it('will interpret query string parameters before fetching friends and pending requests', async () => {
    location.assign('/friends?sortBy=username&sortOrder=desc&limit=100');
    const friendsSpy = jest
      .spyOn(client.friends, 'listFriends')
      .mockResolvedValue({
        friends: friendsData.friends
          .slice(0, 5)
          .map((f) => new Friend(client.axios, f)),
        totalCount: friendsData.totalCount,
      });
    const friendRequestsSpy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue({
        friendRequests: friendRequestsData.friendRequests
          .slice(0, 5)
          .map((r) => new FriendRequest(client.axios, BasicUser.username, r)),
        totalCount: friendRequestsData.totalCount,
      });

    await renderToString(FriendsView, {
      global: opts.global,
    });

    expect(friendsSpy).toHaveBeenCalledWith(BasicUser.username, {
      sortBy: FriendsSortBy.Username,
      sortOrder: SortOrder.Descending,
      limit: 100,
    });
    expect(friendRequestsSpy).toHaveBeenCalledWith(BasicUser.username, {
      direction: FriendRequestDirection.Outgoing,
      limit: 50,
      showAcknowledged: true,
    });
  });

  it('will render correctly on the front-end', async () => {
    location.assign('/friends?sortBy=username&sortOrder=asc');
    const wrapper = mount(FriendsView, opts);
    const friends = wrapper.findAllComponents(FriendsListItem);
    const friendRequests = wrapper.findAllComponents(FriendRequestsListItem);

    expect(friends).toHaveLength(friendsData.friends.length);
    expect(friendRequests).toHaveLength(
      friendRequestsData.friendRequests.length,
    );

    friends.forEach((friend, i) => {
      expect(friend.text()).toContain(friendsData.friends[i].username);
    });
    friendRequests.forEach((request, i) => {
      expect(request.text()).toContain(
        friendRequestsData.friendRequests[i].friend.username,
      );
    });

    expect(wrapper.find(FriendsCount).text()).toBe('Showing 59 of 59 friends');
    expect(wrapper.find<HTMLSelectElement>(SortOrderSelect).element.value).toBe(
      'username-asc',
    );
  });

  it('will allow changing the sort order', async () => {
    const wrapper = mount(FriendsView, opts);
    await wrapper.get(SortOrderSelect).setValue('friendsSince-asc');
    await flushPromises();
    expect(location.search).toBe('?sortBy=friendsSince&sortOrder=asc&limit=50');
  });

  it('will allow a user to unfriend someone', async () => {
    const wrapper = mount(FriendsView, opts);
    const unfriendSpy = jest
      .spyOn(client.friends, 'unfriend')
      .mockResolvedValue();
    const friend = friendsData.friends[3];

    await wrapper
      .get(`[data-testid="unfriend-${friend.username}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(unfriendSpy).toHaveBeenCalledWith(
      currentUser.user!.username,
      friend.username,
    );

    expect(
      wrapper.find(`[data-testid="select-friend-${friend.username}"]`).exists(),
    ).toBe(false);
    expect(wrapper.find(FriendsCount).text()).toBe('Showing 58 of 58 friends');
  });

  it('will allow a user to change their mind about unfriending someone', async () => {
    const wrapper = mount(FriendsView, opts);
    const unfriendSpy = jest
      .spyOn(client.friends, 'unfriend')
      .mockResolvedValue();
    const friend = friendsData.friends[3];

    await wrapper
      .get(`[data-testid="unfriend-${friend.username}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(unfriendSpy).not.toHaveBeenCalled();

    expect(
      wrapper
        .find(`[data-testid="select-friend-${friend.username}"]`)
        .isVisible(),
    ).toBe(true);
    expect(wrapper.find(FriendsCount).text()).toBe('Showing 59 of 59 friends');
  });

  it('will allow a user to cancel a friend request', async () => {
    const wrapper = mount(FriendsView, opts);
    const request = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      friendRequestsData.friendRequests[3],
    );
    jest.spyOn(client.friends, 'wrapFriendRequestDTO').mockReturnValue(request);

    const cancelSpy = jest.spyOn(request, 'cancel').mockResolvedValue();

    await wrapper
      .get(`[data-testid="cancel-request-${request.friend.id}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(cancelSpy).toHaveBeenCalled();

    expect(
      wrapper
        .find(`[data-testid="select-request-${request.friend.id}"]`)
        .exists(),
    ).toBe(false);
    expect(wrapper.find(RequestsCount).text()).toBe(
      'Showing 67 of 67 requests',
    );
  });

  it('will allow a user to change their mind about cancelling a friend request', async () => {
    const wrapper = mount(FriendsView, opts);
    const request = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      friendRequestsData.friendRequests[3],
    );
    jest.spyOn(client.friends, 'wrapFriendRequestDTO').mockReturnValue(request);

    const cancelSpy = jest.spyOn(request, 'cancel').mockResolvedValue();

    await wrapper
      .get(`[data-testid="cancel-request-${request.friend.id}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(cancelSpy).not.toHaveBeenCalled();

    expect(
      wrapper
        .find(`[data-testid="select-request-${request.friend.id}"]`)
        .isVisible(),
    ).toBe(true);
    expect(wrapper.find(RequestsCount).text()).toBe(
      'Showing 68 of 68 requests',
    );
  });

  it('will show the profile of a friend when clicked', async () => {
    const profileSpy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);
    const wrapper = mount(FriendsView, opts);
    const friend = friendsData.friends[9];

    await wrapper
      .get(`[data-testid="select-friend-${friend.username}"]`)
      .trigger('click');
    await flushPromises();

    expect(profileSpy).toHaveBeenCalledWith(friend.username);
    expect(wrapper.find('[data-testid="drawer-panel"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="profile-name"').text()).toBe(
      UserWithFullProfile.profile.name,
    );
  });

  it('will show not found message if friend profile is not found', async () => {});

  it('will show the profile of a friend request when clicked', async () => {
    const profileSpy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);
    const wrapper = mount(FriendsView, opts);
    const request = friendRequestsData.friendRequests[9];

    await wrapper
      .get(`[data-testid="select-request-${request.friend.id}"]`)
      .trigger('click');
    await flushPromises();

    expect(profileSpy).toHaveBeenCalledWith(request.friend.username);
    expect(wrapper.find('[data-testid="drawer-panel"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="profile-name"').text()).toBe(
      UserWithFullProfile.profile.name,
    );
  });

  it('will show not found message if friend request profile is not found', async () => {});
});
