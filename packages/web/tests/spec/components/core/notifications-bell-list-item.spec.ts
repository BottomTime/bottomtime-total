import { NotificationCallToActionType, NotificationDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Router } from 'vue-router';

import NotificationsBellListItem from '../../../../src/components/core/notifications-bell-list-item.vue';
import { createRouter } from '../../../fixtures/create-router';

dayjs.extend(relativeTime);

const TestNotification: NotificationDTO = {
  id: '7a6e5dfd-2d4e-4b62-932c-71f897240a20',
  dismissed: false,
  icon: '👌',
  message: 'Test notification',
  title: 'Test!',
  active: new Date('2024-12-01T00:00:00Z').valueOf(),
  callsToAction: [
    {
      caption: 'Click me!',
      type: NotificationCallToActionType.Link,
      url: '/home',
    },
    {
      caption: 'Or click me!',
      type: NotificationCallToActionType.LinkToNewTab,
      url: 'https://external.site.com/',
    },
  ],
};
const DismissButton = `[data-testid="btn-dismiss-notification-${TestNotification.id}"]`;

describe('NotificationsBellListItem component', () => {
  let router: Router;

  let opts: ComponentMountingOptions<typeof NotificationsBellListItem>;

  beforeAll(() => {
    router = createRouter([
      {
        path: '/home',
        component: { template: '<div>Home</div>' },
      },
      {
        path: '/other',
        component: { template: '<div>Other</div>' },
      },
    ]);
  });

  beforeEach(() => {
    opts = {
      props: {
        notification: TestNotification,
      },
      global: {
        plugins: [router],
      },
    };
    jest.useFakeTimers({
      now: new Date('2024-12-10T12:11:19-05:00'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will render a notification', () => {
    const wrapper = mount(NotificationsBellListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with no calls to action', async () => {
    const wrapper = mount(NotificationsBellListItem, opts);
    await wrapper.setProps({
      notification: {
        ...TestNotification,
        callsToAction: [],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit a dismiss event when dismiss button is clicked', async () => {
    const wrapper = mount(NotificationsBellListItem, opts);
    await wrapper.get(DismissButton).trigger('click');
    expect(wrapper.emitted('dismiss')).toEqual([[TestNotification.id]]);
  });
});
