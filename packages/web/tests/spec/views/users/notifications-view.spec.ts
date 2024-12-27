import {
  ApiClient,
  ApiList,
  ListNotificationsResponseSchema,
  NotificationDTO,
} from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

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
import NotificationsListItem from '../../../../src/components/users/notifications-list-item.vue';
import { FeaturesServiceKey } from '../../../../src/featrues';
import { useCurrentUser } from '../../../../src/store';
import NotificationsSearchForm from '../../../../src/views/users/notifications-search-form.vue';
import NotificationsView from '../../../../src/views/users/notifications-view.vue';
import { ConfigCatClientMock } from '../../../config-cat-client-mock';
import { ConfirmDialog } from '../../../constants';
import { createRouter } from '../../../fixtures/create-router';
import TestData from '../../../fixtures/notifications.json';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(relativeTime);

const ListElement = 'ul[data-testid="notifications-list"]';
const LoadMoreButton = '[data-testid="btn-load-more"]';
const BulkDeleteButton = '[data-testid="btn-bulk-delete"]';
const BulkDismissButton = '[data-testid="btn-bulk-dismiss"]';
const BulkUndismissButton = '[data-testid="btn-bulk-undismiss"]';

function DeleteButton(id: string): string {
  return `button#delete-${id}`;
}

function ToggleDismissButton(id: string): string {
  return `button#toggle-dismiss-${id}`;
}

function SelectCheckbox(id: string): string {
  return `input#select-${id}`;
}

describe('Notifications view', () => {
  let client: ApiClient;
  let router: Router;
  let testData: ApiList<NotificationDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let featuresClient: ConfigCatClientMock;
  let opts: ComponentMountingOptions<typeof NotificationsView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/notifications',
        component: NotificationsView,
      },
    ]);
    featuresClient = new ConfigCatClientMock();
    testData = ListNotificationsResponseSchema.parse(TestData);
  });

  beforeEach(async () => {
    await router.push('/notifications');
    featuresClient.flags[NotificationsFeature.key] = true;
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: featuresClient,
        },
        stubs: {
          teleport: true,
        },
      },
    };
    listSpy = jest
      .spyOn(client.notifications, 'listNotifications')
      .mockResolvedValue(testData);
  });

  it('will show a NotFound page if the feature is disabled', async () => {
    featuresClient.flags[NotificationsFeature.key] = false;
    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find(ListElement).exists()).toBe(false);
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('will show a login form if the user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find(ListElement).exists()).toBe(false);
  });

  it('will render a list of items', async () => {
    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith(BasicUser.username, {});

    const items = wrapper.findAllComponents(NotificationsListItem);
    expect(items).toHaveLength(testData.data.length);

    items.forEach((notification, index) => {
      expect(notification.props('notification')).toEqual({
        ...testData.data[index],
        selected: false,
      });
    });
  });

  it('will render an empty list', async () => {
    listSpy = jest
      .spyOn(client.notifications, 'listNotifications')
      .mockResolvedValue({ data: [], totalCount: 0 });
    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith(BasicUser.username, {});

    const items = wrapper.findAllComponents(NotificationsListItem);
    expect(items).toHaveLength(0);

    expect(
      wrapper.get('[data-testid="msg-no-notifications"]').isVisible(),
    ).toBe(true);
  });

  it('will parse the query string to derive search options', async () => {
    const options = {
      showAfter: new Date('2024-12-10T08:23:34-05:00').valueOf(),
      showDismissed: true,
    };
    await router.push({
      query: JSON.parse(JSON.stringify(options)),
    });
    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith(BasicUser.username, options);

    expect(
      wrapper.getComponent(NotificationsSearchForm).props('searchOptions'),
    ).toEqual(options);
  });

  it('will use default options if query string is invalid', async () => {
    await router.push({
      query: { showDismissed: 'why not?' },
    });
    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith(BasicUser.username, {});

    expect(
      wrapper.getComponent(NotificationsSearchForm).props('searchOptions'),
    ).toEqual({});
  });

  it('will allow user to load more notifications', async () => {
    listSpy = jest
      .spyOn(client.notifications, 'listNotifications')
      .mockResolvedValueOnce({
        data: testData.data.slice(0, 5),
        totalCount: testData.totalCount,
      })
      .mockResolvedValueOnce({
        data: testData.data.slice(5, 10),
        totalCount: testData.totalCount,
      });

    const wrapper = mount(NotificationsView, opts);
    await flushPromises();

    await wrapper.get(LoadMoreButton).trigger('click');
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith(BasicUser.username, {});
    expect(listSpy).toHaveBeenCalledWith(BasicUser.username, { skip: 5 });

    const items = wrapper.findAllComponents(NotificationsListItem);
    expect(items).toHaveLength(10);

    items.forEach((notification, index) => {
      expect(notification.props('notification')).toEqual({
        ...testData.data[index],
        selected: false,
      });
    });
  });

  describe('when handling deletions', () => {
    it('will allow a user to delete a single notification', async () => {
      const deleteSpy = jest
        .spyOn(client.notifications, 'deleteNotifications')
        .mockResolvedValue(1);
      const wrapper = mount(NotificationsView, opts);
      await flushPromises();

      await wrapper.get(DeleteButton(testData.data[0].id)).trigger('click');
      await wrapper.get(ConfirmDialog.Confirm).trigger('click');

      expect(deleteSpy).toHaveBeenCalledWith(BasicUser.username, [
        testData.data[0].id,
      ]);
      expect(wrapper.find(DeleteButton(testData.data[0].id)).exists()).toBe(
        false,
      );
    });

    it('will allow a user to change their mind about deleting a notification', async () => {
      const deleteSpy = jest.spyOn(client.notifications, 'deleteNotifications');
      const wrapper = mount(NotificationsView, opts);
      await flushPromises();

      await wrapper.get(DeleteButton(testData.data[0].id)).trigger('click');
      await wrapper.get(ConfirmDialog.Cancel).trigger('click');
      await flushPromises();

      expect(wrapper.find(ConfirmDialog.Confirm).exists()).toBe(false);
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(wrapper.find(DeleteButton(testData.data[0].id)).isVisible()).toBe(
        true,
      );
    });

    it('will allow a user to delete multiple notifications', async () => {
      const ids = [
        testData.data[0].id,
        testData.data[3].id,
        testData.data[9].id,
        testData.data[12].id,
      ];
      const deleteSpy = jest
        .spyOn(client.notifications, 'deleteNotifications')
        .mockResolvedValue(4);
      const wrapper = mount(NotificationsView, opts);
      await flushPromises();

      for (const id of ids) {
        await wrapper.get(SelectCheckbox(id)).setValue(true);
      }
      await wrapper.get(BulkDeleteButton).trigger('click');
      await wrapper.get(ConfirmDialog.Confirm).trigger('click');
      await flushPromises();

      expect(deleteSpy).toHaveBeenCalledWith(BasicUser.username, ids);
      for (const id of ids) {
        expect(wrapper.find(DeleteButton(id)).exists()).toBe(false);
      }
    });
  });

  describe('when toggling dismissed state', () => {
    it('will allow a user to toggle dismissed state for a single entry', async () => {
      const dismissSpy = jest
        .spyOn(client.notifications, 'dismissNotifications')
        .mockResolvedValue(1);
      const undismissSpy = jest
        .spyOn(client.notifications, 'undismissNotifications')
        .mockResolvedValue(1);
      const wrapper = mount(NotificationsView, opts);
      await flushPromises();

      await wrapper
        .get(ToggleDismissButton(testData.data[0].id))
        .trigger('click');
      await flushPromises();

      await wrapper
        .get(ToggleDismissButton(testData.data[0].id))
        .trigger('click');
      await flushPromises();

      expect(dismissSpy).toHaveBeenCalledWith(BasicUser.username, [
        testData.data[0].id,
      ]);
      expect(undismissSpy).toHaveBeenCalledWith(BasicUser.username, [
        testData.data[0].id,
      ]);
    });

    it('will allow a user dismiss multiple notifications', async () => {
      const ids = [
        testData.data[0].id,
        testData.data[3].id,
        testData.data[9].id,
        testData.data[12].id,
      ];
      const dismissSpy = jest
        .spyOn(client.notifications, 'dismissNotifications')
        .mockResolvedValue(4);
      const wrapper = mount(NotificationsView, opts);
      await flushPromises();

      for (const id of ids) {
        await wrapper.get(SelectCheckbox(id)).setValue(true);
      }
      await wrapper.get(BulkDismissButton).trigger('click');
      await flushPromises();

      expect(dismissSpy).toHaveBeenCalledWith(BasicUser.username, ids);
    });

    it('will allow a user to undismiss multiple notifications', async () => {
      const ids = [
        testData.data[0].id,
        testData.data[3].id,
        testData.data[9].id,
        testData.data[12].id,
      ];
      const undismissSpy = jest
        .spyOn(client.notifications, 'undismissNotifications')
        .mockResolvedValue(4);
      const wrapper = mount(NotificationsView, opts);
      await flushPromises();

      for (const id of ids) {
        await wrapper.get(SelectCheckbox(id)).setValue(true);
      }
      await wrapper.get(BulkUndismissButton).trigger('click');
      await flushPromises();

      expect(undismissSpy).toHaveBeenCalledWith(BasicUser.username, ids);
    });
  });
});
