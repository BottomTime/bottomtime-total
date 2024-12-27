import {
  AccountTier,
  ApiClient,
  ApiList,
  Fetcher,
  FriendRequestDTO,
  FriendRequestDirection,
  LogBookSharing,
  ProfileDTO,
  UserDTO,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import FriendRequestsListItem from '../../../../src/components/friends/friend-requests-list-item.vue';
import { useCurrentUser, useToasts } from '../../../../src/store';
import FriendRequestsView from '../../../../src/views/users/friend-requests-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);

describe('Friend requests view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let friendRequestData: ApiList<FriendRequestDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof FriendRequestsView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    friendRequestData = {
      data: new Array<FriendRequestDTO>(20),
      totalCount: 23,
    };

    for (let i = 0; i < friendRequestData.data.length; i++) {
      const friendId = faker.string.uuid();
      friendRequestData.data[i] = {
        created: faker.date.recent().valueOf(),
        expires: faker.date.soon().valueOf(),
        friend: {
          id: friendId,
          username: faker.internet.userName(),
          memberSince: faker.date.past().valueOf(),
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

    friendRequestData.data = friendRequestData.data.filter(
      (req) => req.direction === FriendRequestDirection.Incoming,
    );
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
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

    toasts = useToasts(pinia);
    currentUser.user = userDto;

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

    listSpy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue(friendRequestData);
  });

  it('will render login form if user is unauthenticated', async () => {
    currentUser.user = null;
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="friend-requests-list"]').exists()).toBe(
      false,
    );

    expect(listSpy).not.toHaveBeenCalled();
  });

  it('will render correctly', async () => {
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    const requests = wrapper.findAllComponents(FriendRequestsListItem);
    expect(requests).toHaveLength(friendRequestData.data.length);

    requests.forEach((request, index) => {
      const friendRequest = friendRequestData.data[index];
      expect(request.text()).toContain(friendRequest.friend.username);
    });

    expect(listSpy).toHaveBeenCalledWith('sam_smith', {
      direction: 'incoming',
      showAcknowledged: false,
    });
  });

  it('will allow the user to accept a friend request', async () => {
    const request = friendRequestData.data[0];
    const expected: FriendRequestDTO = {
      ...request,
      accepted: true,
      reason: undefined,
    };
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.friends, 'acceptFriendRequest')
      .mockResolvedValue(expected);

    await wrapper
      .get(`[data-testid="accept-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(spy).toHaveBeenCalledWith(currentUser.user!.username, request);
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
    await flushPromises();

    const request = friendRequestData.data[0];
    const spy = jest
      .spyOn(client.friends, 'acceptFriendRequest')
      .mockResolvedValue(request);

    await wrapper
      .get(`[data-testid="accept-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
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
    const request = friendRequestData.data[0];
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.friends, 'acceptFriendRequest')
      .mockRejectedValue(
        createHttpError({
          message: 'Friend request no longer exists',
          method: 'POST',
          status: 404,
          path: '/api/users/a/friendRequests/b/acknowledge',
        }),
      );

    await wrapper
      .get(`[data-testid="accept-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(spy).toHaveBeenCalledWith(currentUser.user!.username, request);
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
    const request = friendRequestData.data[0];
    const expected: FriendRequestDTO = {
      ...request,
      accepted: false,
    };
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.friends, 'declineFriendRequest')
      .mockResolvedValue(expected);

    await wrapper
      .get(`[data-testid="decline-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(spy).toHaveBeenCalledWith(
      currentUser.user!.username,
      request,
      undefined,
    );
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
    const request = friendRequestData.data[1];
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    const spy = jest
      .spyOn(client.friends, 'declineFriendRequest')
      .mockResolvedValue(request);

    await wrapper
      .get(`[data-testid="decline-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
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
    const request = friendRequestData.data[1];
    const wrapper = mount(FriendRequestsView, opts);
    await flushPromises();

    const declineSpy = jest
      .spyOn(client.friends, 'declineFriendRequest')
      .mockRejectedValue(
        createHttpError({
          message: 'Friend request no longer exists',
          method: 'POST',
          status: 404,
          path: '/api/users/a/friendRequests/b/acknowledge',
        }),
      );

    await wrapper
      .get(`[data-testid="decline-request-${request.friendId}"]`)
      .trigger('click');

    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    // Check that the API was called correctly and look for the confirmation toast.
    expect(declineSpy).toHaveBeenCalledWith(
      currentUser.user!.username,
      request,
      undefined,
    );
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
    await flushPromises();

    const request = friendRequestData.data[0];
    const profile: ProfileDTO = {
      accountTier: AccountTier.Basic,
      userId: request.friendId,
      memberSince: Date.now(),
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
      .spyOn(client.userProfiles, 'getProfile')
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
    await flushPromises();

    const request = friendRequestData.data[0];
    const spy = jest.spyOn(client.userProfiles, 'getProfile').mockRejectedValue(
      createHttpError({
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
    await flushPromises();

    const request = friendRequestData.data[0];
    const spy = jest
      .spyOn(client.userProfiles, 'getProfile')
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
