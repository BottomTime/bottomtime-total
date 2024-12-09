import { NotificationCallToActionType } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import NotificationsListItem from '../../../../src/components/users/notifications-list-item.vue';
import { NotificationWithSelection } from '../../../../src/components/users/types';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const TestData: NotificationWithSelection = {
  id: '61203013-9339-40a2-b0e5-2e22b4f38952',
  dismissed: false,
  icon: '👌',
  message: 'This is a test notification',
  title: 'Test Notification',
  selected: false,
  active: new Date('2024-12-07T13:14:47-05:00'),
  callsToAction: [
    {
      caption: 'Do something cool',
      type: NotificationCallToActionType.Link,
      url: '/coolestPage',
    },
  ],
};
const SelectCheckbox = 'input[type="checkbox"]';

describe('NotificationsListItem component', () => {
  let opts: ComponentMountingOptions<typeof NotificationsListItem>;

  beforeEach(() => {
    opts = {
      props: {
        notification: TestData,
      },
    };
    jest.useFakeTimers({
      now: new Date('2024-12-09T13:21:47-05:00'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will render typical notification', () => {
    const wrapper = mount(NotificationsListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render a notification that has been dismissed', async () => {
    const wrapper = mount(NotificationsListItem, opts);
    await wrapper.setProps({ notification: { ...TestData, dismissed: true } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render a notification with no calls to action', async () => {
    const wrapper = mount(NotificationsListItem, opts);
    await wrapper.setProps({
      notification: { ...TestData, callsToAction: [] },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will send select events when the checkbox is clicked', async () => {
    const wrapper = mount(NotificationsListItem, opts);
    expect(wrapper.get<HTMLInputElement>(SelectCheckbox).element.checked).toBe(
      false,
    );

    await wrapper.get(SelectCheckbox).setValue(true);

    await wrapper.setProps({
      notification: { ...TestData, selected: true },
    });
    await wrapper.get(SelectCheckbox).setValue(false);

    expect(wrapper.emitted('select')).toEqual([
      [TestData, true],
      [{ ...TestData, selected: true }, false],
    ]);
  });

  it('will emit event when delete button is clicked', async () => {
    const wrapper = mount(NotificationsListItem, opts);
    await wrapper.get(`button#delete-${TestData.id}`).trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[TestData]]);
  });

  it('will emit toggle-dismissed event when dismiss button is clicked', async () => {
    const wrapper = mount(NotificationsListItem, opts);
    await wrapper.get(`button#toggle-dismiss-${TestData.id}`).trigger('click');
    expect(wrapper.emitted('toggle-dismiss')).toEqual([[TestData]]);
  });
});
