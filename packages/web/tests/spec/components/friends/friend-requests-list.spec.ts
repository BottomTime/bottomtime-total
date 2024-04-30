import {
  ListFriendRequestsResponseDTO,
  ListFriendRequestsResponseSchema,
} from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import FriendRequestsListItem from '../../../../src/components/friends/friend-requests-list-item.vue';
import FriendRequestsList from '../../../../src/components/friends/friend-requests-list.vue';
import TestRequestData from '../../../fixtures/friend-requests.json';

const LoadMoreButton = '[data-testid="friend-requests-load-more"]';
const NoResultsMessage = '[data-testid="friend-requests-no-results"]';
const RequestCounts = '[data-testid="request-counts"]';
const RequestsList = '[data-testid="friend-requests-list"]';

describe('Friend requests list component', () => {
  let requestsData: ListFriendRequestsResponseDTO;

  beforeAll(() => {
    requestsData = ListFriendRequestsResponseSchema.parse(TestRequestData);
  });

  it('will render an empty list', () => {
    const wrapper = mount(FriendRequestsList, {
      props: {
        requests: {
          friendRequests: [],
          totalCount: 0,
        },
      },
    });

    expect(wrapper.get(RequestCounts).text()).toBe('Showing 0 of 0 requests');
    expect(wrapper.get(NoResultsMessage).isVisible()).toBe(true);
    expect(wrapper.find(RequestsList).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  it('will render a partial list', () => {
    const wrapper = mount(FriendRequestsList, {
      props: {
        requests: {
          friendRequests: requestsData.friendRequests.slice(0, 12),
          totalCount: requestsData.totalCount,
        },
      },
    });

    expect(wrapper.get(RequestCounts).text()).toBe('Showing 12 of 68 requests');
    expect(wrapper.find(NoResultsMessage).exists()).toBe(false);
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    const list = wrapper.findAllComponents(FriendRequestsListItem);
    expect(list.length).toBe(12);

    list.forEach((item, index) => {
      expect(item.text()).toContain(
        requestsData.friendRequests[index].friend.username,
      );
    });
  });

  it('will render a full list', () => {
    const wrapper = mount(FriendRequestsList, {
      props: {
        requests: requestsData,
      },
    });

    expect(wrapper.get(RequestCounts).text()).toBe('Showing 68 of 68 requests');
    expect(wrapper.find(NoResultsMessage).exists()).toBe(false);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);

    const list = wrapper.findAllComponents(FriendRequestsListItem);
    expect(list.length).toBe(68);

    list.forEach((item, index) => {
      expect(item.text()).toContain(
        requestsData.friendRequests[index].friend.username,
      );
    });
  });

  it('will emit "load-more" event if button is clicked', async () => {
    const wrapper = mount(FriendRequestsList, {
      props: {
        requests: {
          friendRequests: requestsData.friendRequests.slice(0, 12),
          totalCount: requestsData.totalCount,
        },
      },
    });

    await wrapper.get(LoadMoreButton).trigger('click');

    expect(wrapper.emitted('load-more')).toEqual([[]]);
  });

  it('will show loading spinner if loading more is active', () => {
    const wrapper = mount(FriendRequestsList, {
      props: {
        requests: {
          friendRequests: requestsData.friendRequests.slice(0, 12),
          totalCount: requestsData.totalCount,
        },
        isLoadingMore: true,
      },
    });

    expect(
      wrapper.find('[data-testid="friend-requests-loading-more"]').isVisible(),
    ).toBe(true);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  ['accept', 'cancel', 'dismiss', 'decline', 'select'].forEach((event) => {
    it(`will bubble up a "${event}" event when a list item raises it`, async () => {
      const wrapper = mount(FriendRequestsList, {
        props: {
          requests: requestsData,
        },
      });

      await wrapper
        .findComponent(FriendRequestsListItem)
        .vm.$emit(event, requestsData.friendRequests[0]);

      expect(wrapper.emitted(event)).toEqual([
        [requestsData.friendRequests[0]],
      ]);
    });
  });
});
