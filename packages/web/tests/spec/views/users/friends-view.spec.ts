import {
  ApiClient,
  Fetcher,
  Friend,
  FriendRequest,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendRequestsResponseDTO,
  ListFriendRequestsResponseSchema,
  ListFriendsResponseDTO,
  ListFriendsResposneSchema,
  SortOrder,
} from '@bottomtime/api';

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

import { ApiClientKey } from '../../../../src/api-client';
import FriendRequestsListItem from '../../../../src/components/friends/friend-requests-list-item.vue';
import FriendsListItem from '../../../../src/components/friends/friends-list-item.vue';
import { useCurrentUser } from '../../../../src/store';
import FriendsView from '../../../../src/views/users/friends-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import TestFriendRequestData from '../../../fixtures/friend-requests.json';
import TestFriendsData from '../../../fixtures/friends.json';
import { BasicUser, UserWithFullProfile } from '../../../fixtures/users';

dayjs.extend(relativeTime);

const FriendsCount = '[data-testid="friends-count"]';
const RequestsCount = '[data-testid="request-counts"]';
const SortOrderSelect = '[data-testid="sort-order"]';

describe('Friends view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let friendsData: ListFriendsResponseDTO;
  let friendRequestsData: ListFriendRequestsResponseDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof FriendsView>;
  let fetchFriendsSpy: jest.SpyInstance;
  let fetchRequestsSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();

    friendsData = ListFriendsResposneSchema.parse(TestFriendsData);
    friendRequestsData = ListFriendRequestsResponseSchema.parse(
      TestFriendRequestData,
    );
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    friendsData = ListFriendsResposneSchema.parse(TestFriendsData);
    friendRequestsData = ListFriendRequestsResponseSchema.parse(
      TestFriendRequestData,
    );

    currentUser.user = { ...BasicUser };

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    fetchFriendsSpy = jest
      .spyOn(client.friends, 'listFriends')
      .mockResolvedValue({
        friends: friendsData.friends.map(
          (f) => new Friend(fetcher, BasicUser.username, f),
        ),
        totalCount: friendsData.totalCount,
      });
    fetchRequestsSpy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue({
        friendRequests: friendRequestsData.friendRequests.map(
          (r) => new FriendRequest(fetcher, BasicUser.username, r),
        ),
        totalCount: friendRequestsData.totalCount,
      });
  });

  it('will render login form if the current user is anonymous', async () => {
    currentUser.user = null;
    const wrapper = mount(FriendsView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="friends-list"]').exists()).toBe(false);
    expect(fetchFriendsSpy).not.toHaveBeenCalled();
    expect(fetchRequestsSpy).not.toHaveBeenCalled();
  });

  it('will interpret query string parameters before fetching friends and pending requests', async () => {
    await router.push('/friends?sortBy=username&sortOrder=desc&limit=100');
    mount(FriendsView, opts);
    await flushPromises();

    expect(fetchFriendsSpy).toHaveBeenCalledWith(BasicUser.username, {
      sortBy: FriendsSortBy.Username,
      sortOrder: SortOrder.Descending,
      limit: 100,
    });
    expect(fetchRequestsSpy).toHaveBeenCalledWith(BasicUser.username, {
      direction: FriendRequestDirection.Outgoing,
      limit: 50,
      showAcknowledged: true,
    });
  });

  it('will render correctly on the front-end', async () => {
    await router.push('/friends?sortBy=username&sortOrder=asc');
    const wrapper = mount(FriendsView, opts);
    await flushPromises();

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
    await flushPromises();

    await wrapper.get(SortOrderSelect).setValue('friendsSince-asc');
    await flushPromises();
    expect(router.currentRoute.value.query).toBe(
      '?sortBy=friendsSince&sortOrder=asc&limit=50',
    );
  });

  it('will allow a user to unfriend someone', async () => {
    const wrapper = mount(FriendsView, opts);
    await flushPromises();

    const friend = new Friend(
      fetcher,
      currentUser.user!.username,
      friendsData.friends[3],
    );
    jest.spyOn(client.friends, 'wrapFriendDTO').mockReturnValue(friend);
    const unfriendSpy = jest.spyOn(friend, 'unfriend').mockResolvedValue();

    await wrapper
      .get(`[data-testid="unfriend-${friend.username}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(unfriendSpy).toHaveBeenCalled();

    expect(
      wrapper.find(`[data-testid="select-friend-${friend.username}"]`).exists(),
    ).toBe(false);
    expect(wrapper.find(FriendsCount).text()).toBe('Showing 58 of 58 friends');
  });

  it('will allow a user to change their mind about unfriending someone', async () => {
    const wrapper = mount(FriendsView, opts);
    await flushPromises();

    const friend = new Friend(
      fetcher,
      currentUser.user!.username,
      friendsData.friends[3],
    );
    jest.spyOn(client.friends, 'wrapFriendDTO').mockReturnValue(friend);
    const unfriendSpy = jest.spyOn(friend, 'unfriend').mockResolvedValue();

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
    await flushPromises();

    const request = new FriendRequest(
      fetcher,
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
    await flushPromises();

    const request = new FriendRequest(
      fetcher,
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
    await flushPromises();

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

  it('will show not found message if friend profile is not found', async () => {
    jest.spyOn(client.users, 'getProfile').mockRejectedValue(
      createHttpError({
        message: 'Could not find profile',
        method: 'GET',
        path: '/api/users/user',
        status: 404,
      }),
    );

    const wrapper = mount(FriendsView, opts);
    await flushPromises();

    const friend = friendsData.friends[9];

    await wrapper
      .get(`[data-testid="select-friend-${friend.username}"]`)
      .trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="profile-not-found"]').isVisible()).toBe(
      true,
    );
  });

  it('will show the profile of a friend request when clicked', async () => {
    const profileSpy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(UserWithFullProfile.profile);

    const wrapper = mount(FriendsView, opts);
    await flushPromises();

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

  it('will show not found message if friend request profile is not found', async () => {
    jest.spyOn(client.users, 'getProfile').mockRejectedValue(
      createHttpError({
        message: 'Could not find profile',
        method: 'GET',
        path: '/api/users/user',
        status: 404,
      }),
    );

    const wrapper = mount(FriendsView, opts);
    await flushPromises();

    const request = friendRequestsData.friendRequests[9];

    await wrapper
      .get(`[data-testid="select-request-${request.friend.id}"]`)
      .trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="profile-not-found"]').isVisible()).toBe(
      true,
    );
  });

  it('will load more friends when the load more button is clicked', async () => {
    const spy = jest.spyOn(client.friends, 'listFriends').mockResolvedValue({
      friends: friendsData.friends
        .slice(20, 40)
        .map((f) => new Friend(fetcher, currentUser.user!.username, f)),
      totalCount: friendsData.totalCount,
    });
    // friendsStore.friends.friends = friendsData.friends.slice(0, 20);

    const wrapper = mount(FriendsView, opts);
    await flushPromises();

    await wrapper.get('[data-testid="friends-load-more"]').trigger('click');
    await flushPromises();

    const friends = wrapper.findAllComponents(FriendsListItem);
    expect(friends).toHaveLength(40);

    friends.forEach((friend, i) => {
      expect(friend.text()).toContain(friendsData.friends[i].username);
    });

    expect(spy).toHaveBeenCalledWith(BasicUser.username, {
      limit: 50,
      skip: 20,
    });
  });

  it('will load more friend requests when the load more button is clicked', async () => {
    const spy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue({
        friendRequests: friendRequestsData.friendRequests
          .slice(20, 40)
          .map((r) => new FriendRequest(fetcher, BasicUser.username, r)),
        totalCount: friendRequestsData.totalCount,
      });
    // friendsStore.requests.friendRequests =
    //   friendRequestsData.friendRequests.slice(0, 20);

    const wrapper = mount(FriendsView, opts);
    await flushPromises();

    await wrapper
      .get('[data-testid="friend-requests-load-more"]')
      .trigger('click');
    await flushPromises();

    const requests = wrapper.findAllComponents(FriendRequestsListItem);
    expect(requests).toHaveLength(40);

    requests.forEach((request, i) => {
      expect(request.text()).toContain(
        friendRequestsData.friendRequests[i].friend.username,
      );
    });

    expect(spy).toHaveBeenCalledWith(BasicUser.username, {
      direction: FriendRequestDirection.Outgoing,
      limit: 50,
      skip: 20,
      showAcknowledged: true,
    });
  });

  it('will allow a user to dismiss an acknowledged friend request', async () => {
    const requestDTO = {
      ...friendRequestsData.friendRequests[0],
      accepted: true,
    };
    jest.spyOn(client.friends, 'listFriendRequests').mockResolvedValue({
      friendRequests: [
        new FriendRequest(fetcher, BasicUser.username, requestDTO),
      ],
      totalCount: friendRequestsData.totalCount,
    });

    const request = new FriendRequest(fetcher, BasicUser.username, requestDTO);
    jest.spyOn(client.friends, 'wrapFriendRequestDTO').mockReturnValue(request);
    const spy = jest.spyOn(request, 'cancel').mockResolvedValue();

    const wrapper = mount(FriendsView, opts);
    await flushPromises();
    await wrapper
      .get(`[data-testid="dismiss-request-${request.friend.id}"]`)
      .trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();

    expect(wrapper.find(RequestsCount).text()).toBe('Showing 0 of 67 requests');
    expect(wrapper.findAllComponents(FriendRequestsListItem)).toHaveLength(0);
  });
});
