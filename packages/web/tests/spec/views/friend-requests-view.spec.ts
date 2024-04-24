import {
  ApiClient,
  ListFriendRequestsResponseDTO,
  ListFriendRequestsResponseSchema,
  UserDTO,
} from '@bottomtime/api';
import { FriendRequest } from '@bottomtime/api/src/client/friend-request';

import {
  ComponentMountingOptions,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import FriendRequestsListItem from '../../../src/components/friends/friend-requests-list-item.vue';
import { useInitialState } from '../../../src/initial-state';
import FriendRequestsView from '../../../src/views/friend-requests-view.vue';
import { createRouter } from '../../fixtures/create-router';
import TestFriendRequests from '../../fixtures/friend-requests.json';
import { BasicUser } from '../../fixtures/users';

jest.mock('../../../src/initial-state.ts');

describe('Friend requests view', () => {
  let client: ApiClient;
  let router: Router;
  let currentUser: UserDTO | null;
  let friendRequestData: ListFriendRequestsResponseDTO;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof FriendRequestsView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    currentUser = { ...BasicUser };
    friendRequestData =
      ListFriendRequestsResponseSchema.parse(TestFriendRequests);

    jest.mocked(useInitialState).mockImplementation(() => ({
      currentUser,
      friendRequests: friendRequestData,
    }));

    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render login form if user is unauthenticated', () => {
    currentUser = null;
    const wrapper = mount(FriendRequestsView, opts);
    expect(wrapper.html()).toContain('Log in');
  });

  it('will request friends on server-side render and pre-render the list', async () => {
    friendRequestData = {
      friendRequests: friendRequestData.friendRequests.slice(0, 15),
      totalCount: friendRequestData.totalCount,
    };
    const spy = jest
      .spyOn(client.friends, 'listFriendRequests')
      .mockResolvedValue({
        friendRequests: friendRequestData.friendRequests
          .slice(0, 5)
          .map(
            (request) =>
              new FriendRequest(client.axios, currentUser!.username, request),
          ),
        totalCount: friendRequestData.totalCount,
      });
    const html = await renderToString(FriendRequestsView, {
      global: opts.global,
    });

    friendRequestData.friendRequests.forEach((request) => {
      expect(html).toContain(request.friend.username);
    });
    expect(spy).toBeCalledWith();
  });

  it('will render correctly on the client-side', () => {
    const wrapper = mount(FriendRequestsView, opts);
    const requests = wrapper.findAllComponents(FriendRequestsListItem);
    expect(requests).toHaveLength(friendRequestData.friendRequests.length);
  });
});
