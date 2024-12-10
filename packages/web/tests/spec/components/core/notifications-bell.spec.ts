import {
  ApiClient,
  ApiList,
  ListNotificationsResponseSchema,
  NotificationDTO,
} from '@bottomtime/api';
import { ConnectionObserver } from '@bottomtime/api/src/client/notifications';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { clickOutside } from '../../../../src/click-outside';
import NotificationsBellListItem from '../../../../src/components/core/notifications-bell-list-item.vue';
import NotificationsBell from '../../../../src/components/core/notifications-bell.vue';
import { useCurrentUser } from '../../../../src/store';
import { createRouter } from '../../../fixtures/create-router';
import TestData from '../../../fixtures/notifications.json';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);

const BellButton = '[data-testid="btn-notifications-toggle"]';
const NotificationCount = '[data-testid="notifications-count"]';
const NoNewNotificationsMessage = '[data-testid="msg-no-new-notifications"]';
const LoadMoreButton = '[data-testid="btn-load-more-notifications"]';

describe('NotificationsBell component', () => {
  let client: ApiClient;
  let router: Router;
  let testData: ApiList<NotificationDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof NotificationsBell>;
  let observeSpy: jest.SpyInstance;
  let observer: ConnectionObserver;
  let disconnect: jest.Mock;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/notifications',
        component: { template: '' },
      },
      {
        path: '/:pathMatch(.*)*',
        component: { template: '' },
      },
    ]);
    testData = ListNotificationsResponseSchema.parse(TestData);
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      global: {
        directives: {
          'click-outside': clickOutside,
        },
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };

    disconnect = jest.fn();
    observeSpy = jest
      .spyOn(client.notifications, 'connect')
      .mockImplementation((injectedObserver) => {
        observer = injectedObserver;
        return { disconnect };
      });
  });

  it('will not connect to websocket if user is not logged in', async () => {
    currentUser.user = null;
    mount(NotificationsBell, opts);
    await flushPromises();
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('will disconnect from websocket if user logs out', async () => {
    mount(NotificationsBell, opts);
    await flushPromises();
    expect(observeSpy).toHaveBeenCalled();
    currentUser.user = null;
    await flushPromises();
    expect(disconnect).toHaveBeenCalled();
  });

  it('will connect to websocket if user logs in', async () => {
    currentUser.user = null;
    mount(NotificationsBell, opts);
    await flushPromises();
    expect(observeSpy).not.toHaveBeenCalled();
    currentUser.user = BasicUser;
    await flushPromises();
    expect(observeSpy).toHaveBeenCalled();
  });

  it('will render with no notifications', async () => {
    const wrapper = mount(NotificationsBell, opts);

    observer.init({
      data: [],
      totalCount: 0,
    });

    await wrapper.get(BellButton).trigger('click');
    expect(wrapper.get(NotificationCount).isVisible()).toBe(false);
    expect(wrapper.get(NoNewNotificationsMessage).isVisible()).toBe(true);
    const items = wrapper.findAllComponents(NotificationsBellListItem);
    expect(items).toHaveLength(0);
    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
  });

  it('will render with several notifications', async () => {
    const wrapper = mount(NotificationsBell, opts);
    observer.init({
      data: testData.data.slice(0, 10),
      totalCount: testData.totalCount,
    });

    await wrapper.get(BellButton).trigger('click');
    expect(wrapper.get(NotificationCount).isVisible()).toBe(true);
    expect(wrapper.get(NotificationCount).text()).toBe(
      testData.totalCount.toString(),
    );
    expect(wrapper.find(NoNewNotificationsMessage).exists()).toBe(false);
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(NotificationsBellListItem);
    expect(items).toHaveLength(10);
    items.forEach((item, index) => {
      expect(item.props('notification')).toEqual(testData.data[index]);
    });
  });

  it('will dismiss a notification', async () => {
    const dismissButton = `[data-testid="btn-dismiss-notification-${testData.data[0].id}"]`;
    const dismissSpy = jest
      .spyOn(client.notifications, 'dismissNotifications')
      .mockResolvedValue(1);
    const wrapper = mount(NotificationsBell, opts);
    observer.init({
      data: testData.data.slice(0, 10),
      totalCount: testData.totalCount,
    });

    await wrapper.get(BellButton).trigger('click');
    await wrapper.get(dismissButton).trigger('click');
    await flushPromises();

    expect(dismissSpy).toHaveBeenCalledWith(
      BasicUser.username,
      testData.data[0].id,
    );
    expect(wrapper.find(dismissButton).exists()).toBe(false);
  });

  it('will allow a user to load more notifications', async () => {
    const loadMoreSpy = jest
      .spyOn(client.notifications, 'listNotifications')
      .mockResolvedValue({
        data: testData.data.slice(10, 20),
        totalCount: testData.totalCount,
      });
    const wrapper = mount(NotificationsBell, opts);
    observer.init({
      data: testData.data.slice(0, 10),
      totalCount: testData.totalCount,
    });

    await wrapper.get(BellButton).trigger('click');
    await wrapper.get(LoadMoreButton).trigger('click');
    await flushPromises();

    expect(loadMoreSpy).toHaveBeenCalledWith(BasicUser.username, {
      limit: 10,
      skip: 10,
      showDismissed: false,
    });

    const items = wrapper.findAllComponents(NotificationsBellListItem);
    expect(items).toHaveLength(20);
    items.forEach((item, index) => {
      expect(item.props('notification')).toEqual(testData.data[index]);
    });
  });

  it('will receive push notifications', async () => {
    const wrapper = mount(NotificationsBell, opts);
    observer.init({
      data: testData.data.slice(0, 10),
      totalCount: testData.totalCount,
    });

    observer.newNotification({
      data: testData.data.slice(10, 12),
      totalCount: testData.totalCount + 2,
    });

    await wrapper.get(BellButton).trigger('click');
    expect(wrapper.get(NotificationCount).text()).toBe(
      (testData.totalCount + 2).toString(),
    );

    const items = wrapper.findAllComponents(NotificationsBellListItem);
    expect(items).toHaveLength(12);
    expect(items[0].props('notification')).toEqual(testData.data[10]);
    expect(items[1].props('notification')).toEqual(testData.data[11]);
  });
});
