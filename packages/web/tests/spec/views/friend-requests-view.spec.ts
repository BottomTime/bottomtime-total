import {
  ApiClient,
  FriendRequestDTO,
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
  LogBookSharing,
  ProfileDTO,
  UserDTO,
} from '@bottomtime/api';
import { FriendRequest } from '@bottomtime/api/src/client/friend-request';

import { faker } from '@faker-js/faker';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import FriendRequestsListItem from '../../../src/components/friends/friend-requests-list-item.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useFriends, useToasts } from '../../../src/store';
import FriendRequestsView from '../../../src/views/friend-requests-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import { BasicUser } from '../../fixtures/users';

dayjs.extend(relativeTime);

describe('Friend requests view', () => {
  let client: ApiClient;
  let router: Router;
  let friendRequestData: ListFriendRequestsResponseDTO;

  let pinia: Pinia;
  let friendsStore: ReturnType<typeof useFriends>;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof FriendRequestsView>;

  beforeAll(() => {
    friendRequestData = {
      friendRequests: new Array<FriendRequestDTO>(20),
      totalCount: 23,
    };

    for (let i = 0; i < friendRequestData.friendRequests.length; i++) {
      const friendId = faker.string.uuid();
      friendRequestData.friendRequests[i] = {
        created: faker.date.recent(),
        expires: faker.date.soon(),
        friend: {
          id: friendId,
          username: faker.internet.userName(),
          memberSince: faker.date.past(),
          avatar: faker.image.avatar(),
          logBookSharing: faker.helpers.arrayElement(
            Object.values(LogBookSharing),
          ),
          location: faker.location.city(),
          name: faker.person.fullName(),
        },
        friendId,
        direction: FriendRequestDirection.Incoming,
      };
    }

    friendRequestData.friendRequests = friendRequestData.friendRequests.filter(
      (req) => req.direction === FriendRequestDirection.Incoming,
    );
    client = new ApiClient();
    router = createRouter([
      {
        path: '/friendRequests',
        name: 'friend-requests',
        component: () => defineComponent({ template: '<div></div>' }),
      },
    ]);
  });

  beforeEach(() => {
    const userDto: UserDTO = { ...BasicUser };

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    friendsStore = useFriends(pinia);

    toasts = useToasts(pinia);
    currentUser.user = userDto;
    friendsStore.requests = friendRequestData;

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: new MockLocation(),
        },
      },
    };
  });

  it('will render login form if user is unauthenticated', () => {
    currentUser.user = null;
    const wrapper = mount(FriendRequestsView, opts);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="friend-requests-list"]').exists()).toBe(
      false,
    );
  });

  it('will request friends on server-side render and pre-render the list', async () => {
    const spy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue({
        friendRequests: friendRequestData.friendRequests.map(
          (request) =>
            new FriendRequest(
              client.axios,
              currentUser.user!.username,
              request,
            ),
        ),
        totalCount: friendRequestData.totalCount,
      });
    const html = await renderToString(FriendRequestsView, {
      global: opts.global,
    });

    expect(spy).toBeCalledWith(currentUser.user!.username, {
      direction: FriendRequestDirection.Incoming,
      showAcknowledged: false,
    });
    friendRequestData.friendRequests.forEach((request) => {
      expect(html).toContain(request.friend.username);
    });
  });

  it('will render correctly on the client-side', () => {
    const wrapper = mount(FriendRequestsView, opts);
    const requests = wrapper.findAllComponents(FriendRequestsListItem);
    expect(requests).toHaveLength(friendRequestData.friendRequests.length);

    requests.forEach((request, index) => {
      const friendRequest = friendRequestData.friendRequests[index];
      expect(request.text()).toContain(friendRequest.friend.username);
    });
  });

  it('will allow the user to accept a friend request', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const requestClient = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      request,
    );
    const acceptSpy = jest.spyOn(requestClient, 'accept').mockResolvedValue();
    jest
      .spyOn(client.friends, 'wrapFriendRequestDTO')
      .mockReturnValue(requestClient);

    await wrapper
      .get(`[data-testid="accept-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(acceptSpy).toBeCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('friend-request-accepted');

    // Now dismiss the row from the list.
    await wrapper
      .get(`[data-testid="dismiss-request-${request.friendId}"]`)
      .trigger('click');

    expect(
      wrapper
        .find(`[data-testid="dismiss-request-${request.friendId}"]`)
        .exists(),
    ).toBe(false);
  });

  it('will allow the user to cancel accepting a friend request', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const requestClient = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      request,
    );
    const acceptSpy = jest.spyOn(requestClient, 'accept').mockResolvedValue();
    jest
      .spyOn(client.friends, 'wrapFriendRequestDTO')
      .mockReturnValue(requestClient);

    await wrapper
      .get(`[data-testid="accept-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(acceptSpy).not.toBeCalled();
    expect(
      wrapper
        .find(`[data-testid="accept-request-${request.friendId}"]`)
        .isVisible(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="dialog-confirm-button"]').exists()).toBe(
      false,
    );
  });

  it('will show a message if the user attempts to accept a friend request that no longer exists', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const requestClient = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      request,
    );
    const acceptSpy = jest.spyOn(requestClient, 'accept').mockRejectedValue(
      createAxiosError({
        message: 'Friend request no longer exists',
        method: 'POST',
        status: 404,
        path: '/api/users/a/friendRequests/b/acknowledge',
      }),
    );
    jest
      .spyOn(client.friends, 'wrapFriendRequestDTO')
      .mockReturnValue(requestClient);

    await wrapper
      .get(`[data-testid="accept-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(acceptSpy).toBeCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('friend-request-not-found');
    expect(wrapper.find('[data-testid="dialog-confirm-button"]').exists()).toBe(
      false,
    );

    // The row should be removed from the list.
    expect(
      wrapper
        .find(`[data-testid="select-request-${request.friendId}"]`)
        .exists(),
    ).toBe(false);
  });

  it('will allow the user to reject a friend request', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const requestClient = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      request,
    );
    const declineSpy = jest.spyOn(requestClient, 'decline').mockResolvedValue();
    jest
      .spyOn(client.friends, 'wrapFriendRequestDTO')
      .mockReturnValue(requestClient);

    await wrapper
      .get(`[data-testid="decline-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(declineSpy).toBeCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('friend-request-declined');

    // Now dismiss the row from the list.
    await wrapper
      .get(`[data-testid="dismiss-request-${request.friendId}"]`)
      .trigger('click');

    expect(
      wrapper
        .find(`[data-testid="dismiss-request-${request.friendId}"]`)
        .exists(),
    ).toBe(false);
  });

  it('will allow the user to cancel rejecting a friend request', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const requestClient = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      request,
    );
    const declineSpy = jest.spyOn(requestClient, 'decline').mockResolvedValue();
    jest
      .spyOn(client.friends, 'wrapFriendRequestDTO')
      .mockReturnValue(requestClient);

    await wrapper
      .get(`[data-testid="decline-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(declineSpy).not.toBeCalled();
    expect(
      wrapper
        .find(`[data-testid="decline-request-${request.friendId}"]`)
        .isVisible(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="dialog-confirm-button"]').exists()).toBe(
      false,
    );
  });

  it('will show a message if the user attempts to reject a friend request that no longer exists', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const requestClient = new FriendRequest(
      client.axios,
      currentUser.user!.username,
      request,
    );
    const declineSpy = jest.spyOn(requestClient, 'decline').mockRejectedValue(
      createAxiosError({
        message: 'Friend request no longer exists',
        method: 'POST',
        status: 404,
        path: '/api/users/a/friendRequests/b/acknowledge',
      }),
    );
    jest
      .spyOn(client.friends, 'wrapFriendRequestDTO')
      .mockReturnValue(requestClient);

    await wrapper
      .get(`[data-testid="decline-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(declineSpy).toBeCalled();
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('friend-request-not-found');
    expect(wrapper.find('[data-testid="dialog-confirm-button"]').exists()).toBe(
      false,
    );

    // The row should be removed from the list.
    expect(
      wrapper
        .find(`[data-testid="select-request-${request.friendId}"]`)
        .exists(),
    ).toBe(false);
  });

  it('will display the profile of the user who sent the friend request when their name is clicked', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const profile: ProfileDTO = {
      userId: request.friendId,
      memberSince: new Date(),
      username: request.friend.username,
      avatar: request.friend.avatar,
      bio: faker.person.bio(),
      experienceLevel: 'Expert',
      location: request.friend.location,
      logBookSharing: LogBookSharing.Public,
      name: request.friend.name,
      startedDiving: '1989',
    };
    const spy = jest
      .spyOn(client.users, 'getProfile')
      .mockResolvedValue(profile);

    await wrapper
      .get(`[data-testid="select-request-${request.friendId}"]`)
      .trigger('click');
    await flushPromises();

    const profileName = wrapper.find('[data-testid="profile-name"]');
    expect(profileName.isVisible()).toBe(true);
    expect(profileName.text()).toBe(profile.name);

    expect(spy).toHaveBeenCalledWith(request.friend.username);
  });

  it("will show a not found message if the user's profile cannot be retrieved", async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const spy = jest.spyOn(client.users, 'getProfile').mockRejectedValue(
      createAxiosError({
        message: 'Could not find profile',
        method: 'GET',
        path: '/api/users/user',
        status: 404,
      }),
    );

    await wrapper
      .get(`[data-testid="select-request-${request.friendId}"]`)
      .trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="profile-not-found"]').isVisible()).toBe(
      true,
    );
    expect(spy).toHaveBeenCalledWith(request.friend.username);
  });

  it('will show an error toast if something goes wrong while retrieving profile', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    const request = friendRequestData.friendRequests[0];
    const spy = jest
      .spyOn(client.users, 'getProfile')
      .mockRejectedValue(new Error('nope'));

    await wrapper
      .get(`[data-testid="select-request-${request.friendId}"]`)
      .trigger('click');
    await flushPromises();

    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('get-profile-failed');
    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
    expect(spy).toHaveBeenCalledWith(request.friend.username);
  });
});
