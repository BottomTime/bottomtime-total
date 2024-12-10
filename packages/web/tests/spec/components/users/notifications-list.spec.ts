import { ApiList, ListNotificationsResponseSchema } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import NotificationsListItem from '../../../../src/components/users/notifications-list-item.vue';
import NotificationsList from '../../../../src/components/users/notifications-list.vue';
import { NotificationWithSelection } from '../../../../src/components/users/types';
import TestData from '../../../fixtures/notifications.json';

dayjs.extend(relativeTime);

const Counts = '[data-testid="notification-counts"]';
const LoadMoreButton = '[data-testid="btn-load-more"]';
const NoNotificationsMessage = '[data-testid="msg-no-notifications"]';

const SelectAll = '[data-testid="btn-select-all"]';
const SelectNone = '[data-testid="btn-select-none"]';

const BulkDismiss = '[data-testid="btn-bulk-dismiss"]';
const BulkUndismiss = '[data-testid="btn-bulk-undismiss"]';
const BulkDelete = '[data-testid="btn-bulk-delete"]';

describe('NotificationsList component', () => {
  let opts: ComponentMountingOptions<typeof NotificationsList>;
  let testData: ApiList<NotificationWithSelection>;

  beforeAll(() => {
    const parsed = ListNotificationsResponseSchema.parse(TestData);
    testData = {
      data: parsed.data.map((n) => ({ ...n, selected: false })),
      totalCount: parsed.totalCount,
    };
  });

  beforeEach(() => {
    opts = {
      props: {
        notifications: testData,
      },
    };
  });

  it('will render a list of notifications', () => {
    const wrapper = mount(NotificationsList, opts);
    expect(wrapper.get(Counts).text()).toMatchSnapshot();

    const items = wrapper.findAllComponents(NotificationsListItem);
    expect(items).toHaveLength(50);
    items.forEach((item, i) => {
      expect(item.props('notification')).toEqual(testData.data[i]);
    });
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);
    expect(wrapper.find(NoNotificationsMessage).exists()).toBe(false);
  });

  it('will render a message if no notifications are available', async () => {
    const wrapper = mount(NotificationsList, opts);
    await wrapper.setProps({ notifications: { data: [], totalCount: 0 } });

    expect(wrapper.find(LoadMoreButton).exists()).toBe(false);
    expect(wrapper.find(NoNotificationsMessage).isVisible()).toBe(true);

    const items = wrapper.findAllComponents(NotificationsListItem);
    expect(items).toHaveLength(0);
  });

  it('will emit event if load more button is clicked', async () => {
    const wrapper = mount(NotificationsList, opts);
    await wrapper.get(LoadMoreButton).trigger('click');
    expect(wrapper.emitted('load-more')).toBeDefined();
  });

  it('will bubble up select event', async () => {
    const wrapper = mount(NotificationsList, opts);
    const item = wrapper.getComponent(NotificationsListItem);
    await item.vm.$emit('select', item.props('notification'), true);
    await item.vm.$emit('select', item.props('notification'), false);

    expect(wrapper.emitted('select')).toEqual([
      [item.props('notification'), true],
      [item.props('notification'), false],
    ]);
  });

  it('will bubble up delete event', async () => {
    const wrapper = mount(NotificationsList, opts);
    const item = wrapper.getComponent(NotificationsListItem);
    await item.vm.$emit('delete', item.props('notification'));
    expect(wrapper.emitted('delete')).toEqual([[item.props('notification')]]);
  });

  it('will bubble up dismiss event', async () => {
    const wrapper = mount(NotificationsList, opts);
    const item = wrapper.getComponent(NotificationsListItem);
    await item.vm.$emit('toggle-dismiss', item.props('notification'));
    expect(wrapper.emitted('dismiss')).toEqual([[item.props('notification')]]);
  });

  it('will bubble up undismiss event', async () => {
    const wrapper = mount(NotificationsList, opts);
    await wrapper.setProps({
      notifications: {
        data: [{ ...testData.data[0], dismissed: true }],
        totalCount: 1,
      },
    });
    const item = wrapper.getComponent(NotificationsListItem);
    await item.vm.$emit('toggle-dismiss', item.props('notification'));
    expect(wrapper.emitted('undismiss')).toEqual([
      [item.props('notification')],
    ]);
  });

  it('will select all notifications', async () => {
    const wrapper = mount(NotificationsList, opts);
    await wrapper.get(SelectAll).trigger('click');
    expect(wrapper.emitted('select')).toEqual([[testData.data, true]]);
  });

  it('will unselect all notifications', async () => {
    const wrapper = mount(NotificationsList, opts);
    await wrapper.get(SelectNone).trigger('click');
    expect(wrapper.emitted('select')).toEqual([[testData.data, false]]);
  });

  describe('when performing bulk operations', () => {
    let selectedNotifications: NotificationWithSelection[];
    let testDataWithSelections: ApiList<NotificationWithSelection>;

    beforeAll(() => {
      testDataWithSelections = {
        data: testData.data.map((n) => ({ ...n })),
        totalCount: testData.totalCount,
      };
      selectedNotifications = [
        testDataWithSelections.data[0],
        testDataWithSelections.data[7],
        testDataWithSelections.data[12],
        testDataWithSelections.data[23],
      ];
      testDataWithSelections.data[0].selected = true;
      testDataWithSelections.data[7].selected = true;
      testDataWithSelections.data[12].selected = true;
      testDataWithSelections.data[23].selected = true;
    });

    it('will dismiss notifications in bulk', async () => {
      const wrapper = mount(NotificationsList, opts);
      await wrapper.setProps({ notifications: testDataWithSelections });

      await wrapper.get(BulkDismiss).trigger('click');
      expect(wrapper.emitted('dismiss')).toEqual([[selectedNotifications]]);
    });

    it('will undismiss notifications in bulk', async () => {
      const wrapper = mount(NotificationsList, opts);
      await wrapper.setProps({ notifications: testDataWithSelections });

      await wrapper.get(BulkUndismiss).trigger('click');
      expect(wrapper.emitted('undismiss')).toEqual([[selectedNotifications]]);
    });

    it('will delete notifications in bulk', async () => {
      const wrapper = mount(NotificationsList, opts);
      await wrapper.setProps({ notifications: testDataWithSelections });

      await wrapper.get(BulkDelete).trigger('click');
      expect(wrapper.emitted('delete')).toEqual([[selectedNotifications]]);
    });
  });
});
